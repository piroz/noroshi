mod commands;
mod config;
mod error;
mod logging;
mod mdns;
mod models;
mod network;
mod state;

use commands::*;
use models::{LogLevel, ServiceStatus};
use state::AppState;
use std::collections::{HashMap, VecDeque};
use std::sync::Mutex;
use tauri::image::Image;
use tauri::menu::{MenuBuilder, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager};

fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();

        #[cfg(target_os = "linux")]
        {
            use gtk::prelude::GtkWindowExt;
            if let Ok(gtk_window) = window.gtk_window() {
                gtk_window.present();
                return;
            }
        }

        let _ = window.set_focus();
    }
}

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
        logs: Mutex::new(VecDeque::new()),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(app_state)
        .setup(|app| {
            let state = app.state::<AppState>();
            let enabled_count = {
                let statuses = state.statuses.lock().unwrap();
                statuses
                    .values()
                    .filter(|s| **s == ServiceStatus::Running)
                    .count()
            };
            logging::append_log(
                app.handle(),
                &state,
                LogLevel::Info,
                format!(
                    "Application started ({} service{} auto-started)",
                    enabled_count,
                    if enabled_count == 1 { "" } else { "s" }
                ),
                None,
            );

            // Build system tray menu
            let show_item = MenuItem::with_id(app, "show", "ウィンドウを表示", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "終了", true, None::<&str>)?;
            let menu = MenuBuilder::new(app)
                .item(&show_item)
                .separator()
                .item(&quit_item)
                .build()?;

            // Build tray icon
            let _tray = TrayIconBuilder::new()
                .icon(Image::from_bytes(include_bytes!("../icons/32x32.png"))?)
                .tooltip("noroshi")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_main_window(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main_window(tray.app_handle());
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.minimize();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_services,
            add_service,
            update_service,
            delete_service,
            toggle_service,
            start_all,
            stop_all,
            get_host_name,
            get_event_logs,
            clear_event_logs,
            get_network_interfaces,
            export_config,
            import_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
