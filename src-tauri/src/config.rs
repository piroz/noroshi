use crate::error::AppError;
use crate::models::AppConfig;
use std::fs;
use std::path::PathBuf;

fn config_dir() -> Result<PathBuf, AppError> {
    let home =
        dirs::home_dir().ok_or_else(|| AppError::Config("Cannot find home directory".into()))?;
    Ok(home.join(".noroshi"))
}

fn config_path() -> Result<PathBuf, AppError> {
    Ok(config_dir()?.join("config.json"))
}

pub fn load_config() -> Result<AppConfig, AppError> {
    let path = config_path()?;
    if !path.exists() {
        let config = AppConfig {
            hostname: get_hostname(),
            ..AppConfig::default()
        };
        save_config(&config)?;
        return Ok(config);
    }
    let content = fs::read_to_string(&path)?;
    let mut config: AppConfig = serde_json::from_str(&content)?;
    config.hostname = get_hostname();
    Ok(config)
}

pub fn save_config(config: &AppConfig) -> Result<(), AppError> {
    let dir = config_dir()?;
    fs::create_dir_all(&dir)?;

    let path = config_path()?;
    let tmp_path = path.with_extension("json.tmp");
    let content = serde_json::to_string_pretty(config)?;
    fs::write(&tmp_path, &content)?;
    fs::rename(&tmp_path, &path)?;
    Ok(())
}

pub fn get_hostname() -> String {
    hostname::get()
        .ok()
        .and_then(|h| h.into_string().ok())
        .unwrap_or_else(|| "unknown".into())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::AppConfig;

    #[test]
    fn save_and_read_config_roundtrip() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("config.json");

        let config = AppConfig {
            version: 1,
            hostname: "testhost".into(),
            services: vec![],
        };

        let content = serde_json::to_string_pretty(&config).unwrap();
        std::fs::write(&path, &content).unwrap();

        let loaded: AppConfig =
            serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        assert_eq!(loaded.version, 1);
        assert_eq!(loaded.hostname, "testhost");
        assert!(loaded.services.is_empty());
    }

    #[test]
    fn atomic_write_pattern() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("config.json");
        let tmp_path = path.with_extension("json.tmp");

        let config = AppConfig::default();
        let content = serde_json::to_string_pretty(&config).unwrap();
        std::fs::write(&tmp_path, &content).unwrap();
        std::fs::rename(&tmp_path, &path).unwrap();

        assert!(!tmp_path.exists());
        assert!(path.exists());
        let loaded: AppConfig =
            serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        assert_eq!(loaded.version, 1);
    }

    #[test]
    fn get_hostname_returns_non_empty() {
        let hostname = get_hostname();
        assert!(!hostname.is_empty());
    }
}
