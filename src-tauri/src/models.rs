use chrono::{DateTime, Utc};
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
            port: config.port,
            txt: config.txt.clone(),
            enabled: config.enabled,
            status,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LogLevel {
    Info,
    Warn,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub timestamp: DateTime<Utc>,
    pub level: LogLevel,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub service_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInterface {
    pub name: String,
    pub addresses: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_service_config() -> ServiceConfig {
        ServiceConfig {
            id: "test-id".into(),
            name: "My Service".into(),
            service_type: "_http._tcp".into(),
            port: 8080,
            txt: HashMap::from([("path".into(), "/".into())]),
            enabled: true,
        }
    }

    #[test]
    fn service_config_serializes_type_as_type() {
        let config = sample_service_config();
        let json = serde_json::to_value(&config).unwrap();
        assert_eq!(json["type"], "_http._tcp");
        assert!(json.get("service_type").is_none());
    }

    #[test]
    fn service_config_deserializes_type_field() {
        let json = r#"{
            "id": "1",
            "name": "Test",
            "type": "_http._tcp",
            "port": 80,
            "enabled": false
        }"#;
        let config: ServiceConfig = serde_json::from_str(json).unwrap();
        assert_eq!(config.service_type, "_http._tcp");
        assert!(config.txt.is_empty());
    }

    #[test]
    fn service_status_serializes_lowercase() {
        assert_eq!(
            serde_json::to_string(&ServiceStatus::Running).unwrap(),
            "\"running\""
        );
        assert_eq!(
            serde_json::to_string(&ServiceStatus::Stopped).unwrap(),
            "\"stopped\""
        );
        assert_eq!(
            serde_json::to_string(&ServiceStatus::Error).unwrap(),
            "\"error\""
        );
    }

    #[test]
    fn log_level_serializes_lowercase() {
        assert_eq!(serde_json::to_string(&LogLevel::Info).unwrap(), "\"info\"");
        assert_eq!(serde_json::to_string(&LogLevel::Warn).unwrap(), "\"warn\"");
        assert_eq!(
            serde_json::to_string(&LogLevel::Error).unwrap(),
            "\"error\""
        );
    }

    #[test]
    fn service_view_from_config() {
        let config = sample_service_config();
        let view = ServiceView::from_config(&config, ServiceStatus::Running);
        assert_eq!(view.id, "test-id");
        assert_eq!(view.name, "My Service");
        assert_eq!(view.service_type, "_http._tcp");
        assert_eq!(view.port, 8080);
        assert_eq!(view.status, ServiceStatus::Running);
        assert!(view.enabled);
    }

    #[test]
    fn service_view_serializes_type_as_type() {
        let config = sample_service_config();
        let view = ServiceView::from_config(&config, ServiceStatus::Stopped);
        let json = serde_json::to_value(&view).unwrap();
        assert_eq!(json["type"], "_http._tcp");
        assert_eq!(json["status"], "stopped");
        assert!(json.get("service_type").is_none());
    }

    #[test]
    fn log_entry_skips_none_service_id() {
        let entry = LogEntry {
            timestamp: Utc::now(),
            level: LogLevel::Info,
            message: "test".into(),
            service_id: None,
        };
        let json = serde_json::to_value(&entry).unwrap();
        assert!(json.get("service_id").is_none());
    }

    #[test]
    fn log_entry_includes_some_service_id() {
        let entry = LogEntry {
            timestamp: Utc::now(),
            level: LogLevel::Warn,
            message: "test".into(),
            service_id: Some("svc-1".into()),
        };
        let json = serde_json::to_value(&entry).unwrap();
        assert_eq!(json["service_id"], "svc-1");
    }

    #[test]
    fn app_config_default() {
        let config = AppConfig::default();
        assert_eq!(config.version, 1);
        assert!(config.hostname.is_empty());
        assert!(config.services.is_empty());
    }
}
