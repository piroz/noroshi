use crate::models::{LogEntry, LogLevel};
use crate::state::AppState;
use chrono::Utc;
use tauri::{AppHandle, Emitter};

const MAX_LOG_ENTRIES: usize = 500;

pub fn append_log(
    app: &AppHandle,
    state: &AppState,
    level: LogLevel,
    message: String,
    service_id: Option<String>,
) {
    let entry = LogEntry {
        timestamp: Utc::now(),
        level,
        message,
        service_id,
    };

    {
        let mut logs = state.logs.lock().unwrap();
        if logs.len() >= MAX_LOG_ENTRIES {
            logs.pop_front();
        }
        logs.push_back(entry.clone());
    }

    let _ = app.emit("log-entry", &entry);
}
