use crate::config::save_config;
use crate::error::AppError;
use crate::logging;
use crate::mdns;
use crate::models::{
    AppConfig, LogEntry, LogLevel, NetworkInterface, ServiceConfig, ServiceStatus, ServiceView,
};
use crate::network;
use crate::state::AppState;
use std::collections::HashMap;
use tauri::{AppHandle, Emitter, State};
use uuid::Uuid;

fn build_views(state: &AppState) -> Result<Vec<ServiceView>, AppError> {
    let config = state.config.lock().unwrap();
    let statuses = state.statuses.lock().unwrap();
    Ok(config
        .services
        .iter()
        .map(|svc| {
            let status = statuses
                .get(&svc.id)
                .copied()
                .unwrap_or(ServiceStatus::Stopped);
            ServiceView::from_config(svc, status)
        })
        .collect())
}

#[tauri::command]
pub fn get_services(state: State<'_, AppState>) -> Result<Vec<ServiceView>, AppError> {
    build_views(&state)
}

#[tauri::command]
pub fn add_service(
    app: AppHandle,
    state: State<'_, AppState>,
    name: String,
    service_type: String,
    port: u16,
    txt: HashMap<String, String>,
    enabled: bool,
) -> Result<Vec<ServiceView>, AppError> {
    let id = Uuid::new_v4().to_string();
    let svc = ServiceConfig {
        id: id.clone(),
        name: name.clone(),
        service_type,
        port,
        txt,
        enabled,
    };

    {
        let mut config = state.config.lock().unwrap();
        config.services.push(svc.clone());
        save_config(&config)?;
    }

    logging::append_log(
        &app,
        &state,
        LogLevel::Info,
        format!("Service '{}' added", name),
        Some(id.clone()),
    );

    if enabled {
        let config = state.config.lock().unwrap();
        let daemon = state.daemon.lock().unwrap();
        let mut statuses = state.statuses.lock().unwrap();
        match mdns::register_service(&daemon, &svc, &config.hostname) {
            Ok(()) => {
                statuses.insert(id.clone(), ServiceStatus::Running);
                drop(statuses);
                drop(daemon);
                drop(config);
                logging::append_log(
                    &app,
                    &state,
                    LogLevel::Info,
                    format!("Service '{}' started", name),
                    Some(id),
                );
            }
            Err(e) => {
                statuses.insert(id.clone(), ServiceStatus::Error);
                drop(statuses);
                drop(daemon);
                drop(config);
                logging::append_log(
                    &app,
                    &state,
                    LogLevel::Error,
                    format!("Failed to start service '{}': {}", name, e),
                    Some(id),
                );
            }
        }
    }

    let views = build_views(&state)?;
    let _ = app.emit("services-changed", &views);
    Ok(views)
}

#[tauri::command]
pub fn update_service(
    app: AppHandle,
    state: State<'_, AppState>,
    id: String,
    name: String,
    service_type: String,
    port: u16,
    txt: HashMap<String, String>,
    enabled: bool,
) -> Result<Vec<ServiceView>, AppError> {
    let was_running;
    let old_config;

    {
        let config = state.config.lock().unwrap();
        let statuses = state.statuses.lock().unwrap();
        let svc = config
            .services
            .iter()
            .find(|s| s.id == id)
            .ok_or_else(|| AppError::NotFound(id.clone()))?;
        was_running = statuses.get(&id).copied() == Some(ServiceStatus::Running);
        old_config = svc.clone();
    }

    // Unregister old if running
    if was_running {
        let config = state.config.lock().unwrap();
        let daemon = state.daemon.lock().unwrap();
        let _ = mdns::unregister_service(&daemon, &old_config, &config.hostname);
        let mut statuses = state.statuses.lock().unwrap();
        statuses.insert(id.clone(), ServiceStatus::Stopped);
    }

    let new_svc = ServiceConfig {
        id: id.clone(),
        name: name.clone(),
        service_type,
        port,
        txt,
        enabled,
    };

    {
        let mut config = state.config.lock().unwrap();
        if let Some(svc) = config.services.iter_mut().find(|s| s.id == id) {
            *svc = new_svc.clone();
        }
        save_config(&config)?;
    }

    logging::append_log(
        &app,
        &state,
        LogLevel::Info,
        format!("Service '{}' updated", name),
        Some(id.clone()),
    );

    // Re-register if should be enabled
    if enabled {
        let config = state.config.lock().unwrap();
        let daemon = state.daemon.lock().unwrap();
        let mut statuses = state.statuses.lock().unwrap();
        match mdns::register_service(&daemon, &new_svc, &config.hostname) {
            Ok(()) => {
                statuses.insert(id.clone(), ServiceStatus::Running);
                drop(statuses);
                drop(daemon);
                drop(config);
                logging::append_log(
                    &app,
                    &state,
                    LogLevel::Info,
                    format!("Service '{}' started", name),
                    Some(id),
                );
            }
            Err(e) => {
                statuses.insert(id.clone(), ServiceStatus::Error);
                drop(statuses);
                drop(daemon);
                drop(config);
                logging::append_log(
                    &app,
                    &state,
                    LogLevel::Error,
                    format!("Failed to start service '{}': {}", name, e),
                    Some(id),
                );
            }
        }
    }

    let views = build_views(&state)?;
    let _ = app.emit("services-changed", &views);
    Ok(views)
}

#[tauri::command]
pub fn delete_service(
    app: AppHandle,
    state: State<'_, AppState>,
    id: String,
) -> Result<Vec<ServiceView>, AppError> {
    let svc_config;
    {
        let config = state.config.lock().unwrap();
        svc_config = config
            .services
            .iter()
            .find(|s| s.id == id)
            .ok_or_else(|| AppError::NotFound(id.clone()))?
            .clone();
    }

    // Unregister if running
    {
        let statuses = state.statuses.lock().unwrap();
        if statuses.get(&id).copied() == Some(ServiceStatus::Running) {
            drop(statuses);
            let config = state.config.lock().unwrap();
            let daemon = state.daemon.lock().unwrap();
            let _ = mdns::unregister_service(&daemon, &svc_config, &config.hostname);
        }
    }

    {
        let mut config = state.config.lock().unwrap();
        config.services.retain(|s| s.id != id);
        save_config(&config)?;
    }

    {
        let mut statuses = state.statuses.lock().unwrap();
        statuses.remove(&id);
    }

    logging::append_log(
        &app,
        &state,
        LogLevel::Info,
        format!("Service '{}' deleted", svc_config.name),
        Some(id),
    );

    let views = build_views(&state)?;
    let _ = app.emit("services-changed", &views);
    Ok(views)
}

#[tauri::command]
pub fn toggle_service(
    app: AppHandle,
    state: State<'_, AppState>,
    id: String,
) -> Result<Vec<ServiceView>, AppError> {
    let svc_config;
    let currently_running;

    {
        let config = state.config.lock().unwrap();
        let statuses = state.statuses.lock().unwrap();
        svc_config = config
            .services
            .iter()
            .find(|s| s.id == id)
            .ok_or_else(|| AppError::NotFound(id.clone()))?
            .clone();
        currently_running = statuses.get(&id).copied() == Some(ServiceStatus::Running);
    }

    if currently_running {
        // Stop
        {
            let config = state.config.lock().unwrap();
            let daemon = state.daemon.lock().unwrap();
            let _ = mdns::unregister_service(&daemon, &svc_config, &config.hostname);
        }
        {
            let mut statuses = state.statuses.lock().unwrap();
            statuses.insert(id.clone(), ServiceStatus::Stopped);
        }
        {
            let mut config = state.config.lock().unwrap();
            if let Some(svc) = config.services.iter_mut().find(|s| s.id == id) {
                svc.enabled = false;
            }
            save_config(&config)?;
        }
        logging::append_log(
            &app,
            &state,
            LogLevel::Info,
            format!("Service '{}' stopped", svc_config.name),
            Some(id),
        );
    } else {
        // Start
        {
            let config = state.config.lock().unwrap();
            let daemon = state.daemon.lock().unwrap();
            let mut statuses = state.statuses.lock().unwrap();
            match mdns::register_service(&daemon, &svc_config, &config.hostname) {
                Ok(()) => {
                    statuses.insert(id.clone(), ServiceStatus::Running);
                    drop(statuses);
                    drop(daemon);
                    drop(config);
                    logging::append_log(
                        &app,
                        &state,
                        LogLevel::Info,
                        format!("Service '{}' started", svc_config.name),
                        Some(id.clone()),
                    );
                }
                Err(e) => {
                    statuses.insert(id.clone(), ServiceStatus::Error);
                    drop(statuses);
                    drop(daemon);
                    drop(config);
                    logging::append_log(
                        &app,
                        &state,
                        LogLevel::Error,
                        format!("Failed to start service '{}': {}", svc_config.name, e),
                        Some(id.clone()),
                    );
                }
            }
        }
        {
            let mut config = state.config.lock().unwrap();
            if let Some(svc) = config.services.iter_mut().find(|s| s.id == id) {
                svc.enabled = true;
            }
            save_config(&config)?;
        }
    }

    let views = build_views(&state)?;
    let _ = app.emit("services-changed", &views);
    Ok(views)
}

#[tauri::command]
pub fn start_all(app: AppHandle, state: State<'_, AppState>) -> Result<Vec<ServiceView>, AppError> {
    let services: Vec<ServiceConfig>;
    let hostname: String;

    {
        let config = state.config.lock().unwrap();
        services = config.services.clone();
        hostname = config.hostname.clone();
    }

    {
        let daemon = state.daemon.lock().unwrap();
        let mut statuses = state.statuses.lock().unwrap();
        for svc in &services {
            if statuses.get(&svc.id).copied() != Some(ServiceStatus::Running) {
                match mdns::register_service(&daemon, svc, &hostname) {
                    Ok(()) => {
                        statuses.insert(svc.id.clone(), ServiceStatus::Running);
                    }
                    Err(e) => {
                        statuses.insert(svc.id.clone(), ServiceStatus::Error);
                        eprintln!("Failed to register service {}: {}", svc.name, e);
                    }
                }
            }
        }
    }

    {
        let mut config = state.config.lock().unwrap();
        for svc in config.services.iter_mut() {
            svc.enabled = true;
        }
        save_config(&config)?;
    }

    logging::append_log(
        &app,
        &state,
        LogLevel::Info,
        "All services started".to_string(),
        None,
    );

    let views = build_views(&state)?;
    let _ = app.emit("services-changed", &views);
    Ok(views)
}

#[tauri::command]
pub fn stop_all(app: AppHandle, state: State<'_, AppState>) -> Result<Vec<ServiceView>, AppError> {
    let services: Vec<ServiceConfig>;
    let hostname: String;

    {
        let config = state.config.lock().unwrap();
        services = config.services.clone();
        hostname = config.hostname.clone();
    }

    {
        let daemon = state.daemon.lock().unwrap();
        let mut statuses = state.statuses.lock().unwrap();
        for svc in &services {
            if statuses.get(&svc.id).copied() == Some(ServiceStatus::Running) {
                let _ = mdns::unregister_service(&daemon, svc, &hostname);
                statuses.insert(svc.id.clone(), ServiceStatus::Stopped);
            }
        }
    }

    {
        let mut config = state.config.lock().unwrap();
        for svc in config.services.iter_mut() {
            svc.enabled = false;
        }
        save_config(&config)?;
    }

    logging::append_log(
        &app,
        &state,
        LogLevel::Info,
        "All services stopped".to_string(),
        None,
    );

    let views = build_views(&state)?;
    let _ = app.emit("services-changed", &views);
    Ok(views)
}

#[tauri::command]
pub fn get_host_name(state: State<'_, AppState>) -> String {
    let config = state.config.lock().unwrap();
    config.hostname.clone()
}

#[tauri::command]
pub fn get_event_logs(state: State<'_, AppState>) -> Vec<LogEntry> {
    let logs = state.logs.lock().unwrap();
    logs.iter().cloned().collect()
}

#[tauri::command]
pub fn clear_event_logs(state: State<'_, AppState>) {
    let mut logs = state.logs.lock().unwrap();
    logs.clear();
}

#[tauri::command]
pub fn get_network_interfaces() -> Vec<NetworkInterface> {
    network::get_interfaces()
}

#[tauri::command]
pub fn export_config(state: State<'_, AppState>) -> Result<String, AppError> {
    let config = state.config.lock().unwrap();
    serde_json::to_string_pretty(&*config).map_err(|e| AppError::Config(e.to_string()))
}

#[tauri::command]
pub fn import_config(
    app: AppHandle,
    state: State<'_, AppState>,
    json: String,
) -> Result<Vec<ServiceView>, AppError> {
    let mut imported: AppConfig = serde_json::from_str(&json)
        .map_err(|e| AppError::Config(format!("Invalid JSON: {}", e)))?;

    // Assign new UUIDs to avoid collisions
    for svc in imported.services.iter_mut() {
        svc.id = Uuid::new_v4().to_string();
    }

    // Stop all existing running services
    {
        let config = state.config.lock().unwrap();
        let daemon = state.daemon.lock().unwrap();
        let mut statuses = state.statuses.lock().unwrap();
        for svc in &config.services {
            if statuses.get(&svc.id).copied() == Some(ServiceStatus::Running) {
                let _ = mdns::unregister_service(&daemon, svc, &config.hostname);
            }
        }
        statuses.clear();
    }

    // Preserve current hostname (not from imported config)
    let hostname = {
        let config = state.config.lock().unwrap();
        config.hostname.clone()
    };
    imported.hostname = hostname.clone();

    // Replace config and save
    {
        let mut config = state.config.lock().unwrap();
        *config = imported.clone();
        save_config(&config)?;
    }

    // Start enabled services
    {
        let daemon = state.daemon.lock().unwrap();
        let mut statuses = state.statuses.lock().unwrap();
        for svc in &imported.services {
            if svc.enabled {
                match mdns::register_service(&daemon, svc, &hostname) {
                    Ok(()) => {
                        statuses.insert(svc.id.clone(), ServiceStatus::Running);
                    }
                    Err(e) => {
                        statuses.insert(svc.id.clone(), ServiceStatus::Error);
                        logging::append_log(
                            &app,
                            &state,
                            LogLevel::Error,
                            format!("Failed to start imported service '{}': {}", svc.name, e),
                            Some(svc.id.clone()),
                        );
                    }
                }
            }
        }
    }

    logging::append_log(
        &app,
        &state,
        LogLevel::Info,
        format!(
            "Configuration imported ({} service{})",
            imported.services.len(),
            if imported.services.len() == 1 {
                ""
            } else {
                "s"
            }
        ),
        None,
    );

    let views = build_views(&state)?;
    let _ = app.emit("services-changed", &views);
    Ok(views)
}
