use crate::error::AppError;
use crate::models::ServiceConfig;
use mdns_sd::{ServiceDaemon, ServiceInfo};

pub fn create_daemon() -> Result<ServiceDaemon, AppError> {
    ServiceDaemon::new().map_err(|e| AppError::Mdns(e.to_string()))
}

fn to_mdns_type(service_type: &str) -> String {
    let t = service_type.trim_end_matches('.');
    if t.ends_with(".local") {
        format!("{}.", t)
    } else {
        format!("{}.local.", t)
    }
}

pub fn register_service(
    daemon: &ServiceDaemon,
    config: &ServiceConfig,
    hostname: &str,
) -> Result<(), AppError> {
    let mdns_type = to_mdns_type(&config.service_type);
    let instance_name = &config.name;

    let host = if hostname.ends_with(".local.") {
        hostname.to_string()
    } else if hostname.ends_with(".local") {
        format!("{}.", hostname)
    } else {
        format!("{}.local.", hostname)
    };

    let properties: Vec<(&str, &str)> = config
        .txt
        .iter()
        .map(|(k, v)| (k.as_str(), v.as_str()))
        .collect();

    let service = ServiceInfo::new(
        &mdns_type,
        instance_name,
        &host,
        "",
        config.port,
        &properties[..],
    )
    .map_err(|e| AppError::Mdns(e.to_string()))?
    .enable_addr_auto();

    daemon
        .register(service)
        .map_err(|e| AppError::Mdns(e.to_string()))?;

    Ok(())
}

pub fn unregister_service(
    daemon: &ServiceDaemon,
    config: &ServiceConfig,
    hostname: &str,
) -> Result<(), AppError> {
    let mdns_type = to_mdns_type(&config.service_type);

    let host = if hostname.ends_with(".local.") {
        hostname.to_string()
    } else if hostname.ends_with(".local") {
        format!("{}.", hostname)
    } else {
        format!("{}.local.", hostname)
    };

    let fullname = format!("{}.{}", config.name, mdns_type);

    let properties: Vec<(&str, &str)> = config
        .txt
        .iter()
        .map(|(k, v)| (k.as_str(), v.as_str()))
        .collect();

    let service = ServiceInfo::new(
        &mdns_type,
        &config.name,
        &host,
        "",
        config.port,
        &properties[..],
    )
    .map_err(|e| AppError::Mdns(e.to_string()))?;

    daemon
        .unregister(&fullname)
        .map_err(|e| AppError::Mdns(e.to_string()))?;

    // Drop the receiver to avoid blocking
    drop(service);

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn to_mdns_type_appends_local() {
        assert_eq!(to_mdns_type("_http._tcp"), "_http._tcp.local.");
    }

    #[test]
    fn to_mdns_type_already_has_local() {
        assert_eq!(to_mdns_type("_http._tcp.local"), "_http._tcp.local.");
    }

    #[test]
    fn to_mdns_type_already_has_local_dot() {
        assert_eq!(to_mdns_type("_http._tcp.local."), "_http._tcp.local.");
    }

    #[test]
    fn to_mdns_type_with_trailing_dot() {
        assert_eq!(to_mdns_type("_ssh._tcp."), "_ssh._tcp.local.");
    }
}
