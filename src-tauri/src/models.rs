use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub version: u32,
    #[serde(default)]
    pub hostname: String,
    #[serde(default)]
    pub services: Vec<ServiceConfig>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            version: 1,
            hostname: String::new(),
            services: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceConfig {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub service_type: String,
    pub port: u16,
    #[serde(default)]
    pub txt: HashMap<String, String>,
    pub enabled: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ServiceStatus {
    Running,
    Stopped,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceView {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub service_type: String,
    pub port: u16,
    pub txt: HashMap<String, String>,
    pub enabled: bool,
    pub status: ServiceStatus,
}

impl ServiceView {
    pub fn from_config(config: &ServiceConfig, status: ServiceStatus) -> Self {
        Self {
            id: config.id.clone(),
            name: config.name.clone(),
            service_type: config.service_type.clone(),
            port: config.port.clone(),
            txt: config.txt.clone(),
            enabled: config.enabled,
            status,
        }
    }
}
