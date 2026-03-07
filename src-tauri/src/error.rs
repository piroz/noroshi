use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Config error: {0}")]
    Config(String),

    #[error("mDNS error: {0}")]
    Mdns(String),

    #[error("Service not found: {0}")]
    NotFound(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn config_error_display() {
        let err = AppError::Config("bad config".into());
        assert_eq!(err.to_string(), "Config error: bad config");
    }

    #[test]
    fn mdns_error_display() {
        let err = AppError::Mdns("bind failed".into());
        assert_eq!(err.to_string(), "mDNS error: bind failed");
    }

    #[test]
    fn not_found_error_display() {
        let err = AppError::NotFound("abc-123".into());
        assert_eq!(err.to_string(), "Service not found: abc-123");
    }

    #[test]
    fn io_error_conversion() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file missing");
        let err: AppError = io_err.into();
        assert!(err.to_string().contains("file missing"));
    }

    #[test]
    fn json_error_conversion() {
        let json_err = serde_json::from_str::<serde_json::Value>("invalid").unwrap_err();
        let err: AppError = json_err.into();
        assert!(err.to_string().starts_with("JSON error:"));
    }

    #[test]
    fn serialize_as_string() {
        let err = AppError::Config("test".into());
        let json = serde_json::to_string(&err).unwrap();
        assert_eq!(json, "\"Config error: test\"");
    }
}
