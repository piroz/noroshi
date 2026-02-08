use crate::models::{AppConfig, ServiceStatus};
use mdns_sd::ServiceDaemon;
use std::collections::HashMap;
use std::sync::Mutex;

pub struct AppState {
    pub config: Mutex<AppConfig>,
    pub daemon: Mutex<ServiceDaemon>,
    pub statuses: Mutex<HashMap<String, ServiceStatus>>,
}
