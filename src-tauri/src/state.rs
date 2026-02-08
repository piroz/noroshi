use crate::models::{AppConfig, LogEntry, ServiceStatus};
use mdns_sd::ServiceDaemon;
use std::collections::{HashMap, VecDeque};
use std::sync::Mutex;

pub struct AppState {
    pub config: Mutex<AppConfig>,
    pub daemon: Mutex<ServiceDaemon>,
    pub statuses: Mutex<HashMap<String, ServiceStatus>>,
    pub logs: Mutex<VecDeque<LogEntry>>,
}
