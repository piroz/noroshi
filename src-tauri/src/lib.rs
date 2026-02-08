mod commands;
mod config;
mod error;
mod mdns;
mod models;
mod state;

use commands::*;
use models::ServiceStatus;
use state::AppState;
use std::collections::HashMap;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let cfg = config::load_config().expect("Failed to load config");
    let daemon = mdns::create_daemon().expect("Failed to create mDNS daemon");

    let mut statuses = HashMap::new();

    // Auto-start enabled services
    for svc in &cfg.services {
        if svc.enabled {
            match mdns::register_service(&daemon, svc, &cfg.hostname) {
                Ok(()) => {
                    statuses.insert(svc.id.clone(), ServiceStatus::Running);
                }
                Err(e) => {
                    statuses.insert(svc.id.clone(), ServiceStatus::Error);
                    eprintln!("Failed to auto-start service {}: {}", svc.name, e);
                }
            }
        }
    }

    let app_state = AppState {
        config: Mutex::new(cfg),
        daemon: Mutex::new(daemon),
        statuses: Mutex::new(statuses),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            get_services,
            add_service,
            update_service,
            delete_service,
            toggle_service,
            start_all,
            stop_all,
            get_host_name,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
