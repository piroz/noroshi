use crate::models::NetworkInterface;
use std::collections::BTreeMap;

pub fn get_interfaces() -> Vec<NetworkInterface> {
    let addrs = match if_addrs::get_if_addrs() {
        Ok(addrs) => addrs,
        Err(_) => return Vec::new(),
    };

    let mut grouped: BTreeMap<String, Vec<String>> = BTreeMap::new();
    for iface in addrs {
        if iface.is_loopback() {
            continue;
        }
        grouped
            .entry(iface.name.clone())
            .or_default()
            .push(iface.addr.ip().to_string());
    }

    grouped
        .into_iter()
        .map(|(name, addresses)| NetworkInterface { name, addresses })
        .collect()
}
