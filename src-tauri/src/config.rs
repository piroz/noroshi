use crate::error::AppError;
use crate::models::AppConfig;
use std::fs;
use std::path::PathBuf;

fn config_dir() -> Result<PathBuf, AppError> {
    let home =
        dirs::home_dir().ok_or_else(|| AppError::Config("Cannot find home directory".into()))?;
    Ok(home.join(".mdns-manager"))
}

fn config_path() -> Result<PathBuf, AppError> {
    Ok(config_dir()?.join("config.json"))
}

pub fn load_config() -> Result<AppConfig, AppError> {
    let path = config_path()?;
    if !path.exists() {
        let mut config = AppConfig::default();
        config.hostname = get_hostname();
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
