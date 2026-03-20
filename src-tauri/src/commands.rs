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

/// Register a service via mDNS, update its status, and log the result.
pub(crate) fn try_register_service(
    app: &AppHandle,
    state: &AppState,
    svc: &ServiceConfig,
    hostname: &str,
) {
    let daemon = state.daemon.lock().unwrap();
    let mut statuses = state.statuses.lock().unwrap();
    match mdns::register_service(&daemon, svc, hostname) {
        Ok(()) => {
            statuses.insert(svc.id.clone(), ServiceStatus::Running);
            drop(statuses);
            drop(daemon);
            logging::append_log(
                app,
                state,
                LogLevel::Info,
                format!("Service '{}' started", svc.name),
                Some(svc.id.clone()),
            );
        }
        Err(e) => {
            statuses.insert(svc.id.clone(), ServiceStatus::Error);
            drop(statuses);
            drop(daemon);
            logging::append_log(
                app,
                state,
                LogLevel::Error,
                format!("Failed to start service '{}': {}", svc.name, e),
                Some(svc.id.clone()),
            );
        }
    }
}

/// Unregister a service via mDNS and set its status to Stopped.
fn try_unregister_service(state: &AppState, svc: &ServiceConfig, hostname: &str) {
    let daemon = state.daemon.lock().unwrap();
    let _ = mdns::unregister_service(&daemon, svc, hostname);
    drop(daemon);
    let mut statuses = state.statuses.lock().unwrap();
    statuses.insert(svc.id.clone(), ServiceStatus::Stopped);
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

    let hostname = {
        let mut config = state.config.lock().unwrap();
        config.services.push(svc.clone());
        save_config(&config)?;
        config.hostname.clone()
    };

    logging::append_log(
        &app,
        &state,
        LogLevel::Info,
        format!("Service '{}' added", name),
        Some(id),
    );

    if enabled {
        try_register_service(&app, &state, &svc, &hostname);
    }

    let views = build_views(&state)?;
    let _ = app.emit("services-changed", &views);
    Ok(views)
}

#[allow(clippy::too_many_arguments)]
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
    let hostname;

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
        hostname = config.hostname.clone();
    }

    // Unregister old if running
    if was_running {
        try_unregister_service(&state, &old_config, &hostname);
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
            svc.clone_from(&new_svc);
        }
        save_config(&config)?;
    }

    logging::append_log(
        &app,
        &state,
        LogLevel::Info,
        format!("Service '{}' updated", name),
        Some(id),
    );

    // Re-register if should be enabled
    if enabled {
        try_register_service(&app, &state, &new_svc, &hostname);
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
    let is_running;
    let hostname;
    {
        let config = state.config.lock().unwrap();
        let statuses = state.statuses.lock().unwrap();
        svc_config = config
            .services
            .iter()
            .find(|s| s.id == id)
            .ok_or_else(|| AppError::NotFound(id.clone()))?
            .clone();
        is_running = statuses.get(&id).copied() == Some(ServiceStatus::Running);
        hostname = config.hostname.clone();
    }

    // Unregister if running
    if is_running {
        try_unregister_service(&state, &svc_config, &hostname);
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
    let hostname;

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
        hostname = config.hostname.clone();
    }

    if currently_running {
        // Stop
        try_unregister_service(&state, &svc_config, &hostname);
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
        try_register_service(&app, &state, &svc_config, &hostname);
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

    for svc in &services {
        let is_running = {
            let statuses = state.statuses.lock().unwrap();
            statuses.get(&svc.id).copied() == Some(ServiceStatus::Running)
        };
        if !is_running {
            try_register_service(&app, &state, svc, &hostname);
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

    for svc in &services {
        let is_running = {
            let statuses = state.statuses.lock().unwrap();
            statuses.get(&svc.id).copied() == Some(ServiceStatus::Running)
        };
        if is_running {
            try_unregister_service(&state, svc, &hostname);
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
    imported.hostname.clone_from(&hostname);

    // Replace config and save
    {
        let mut config = state.config.lock().unwrap();
        config.clone_from(&imported);
        save_config(&config)?;
    }

    // Start enabled services
    for svc in &imported.services {
        if svc.enabled {
            try_register_service(&app, &state, svc, &hostname);
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
