import { invoke } from "@tauri-apps/api/core";
import type { LogEntry, NetworkInterface, ServiceView } from "../types";

export async function getServices(): Promise<ServiceView[]> {
  return invoke("get_services");
}

export async function addService(
  name: string,
  serviceType: string,
  port: number,
  txt: Record<string, string>,
  enabled: boolean,
): Promise<ServiceView[]> {
  return invoke("add_service", {
    name,
    serviceType,
    port,
    txt,
    enabled,
  });
}

export async function updateService(
  id: string,
  name: string,
  serviceType: string,
  port: number,
  txt: Record<string, string>,
  enabled: boolean,
): Promise<ServiceView[]> {
  return invoke("update_service", {
    id,
    name,
    serviceType,
    port,
    txt,
    enabled,
  });
}

export async function deleteService(id: string): Promise<ServiceView[]> {
  return invoke("delete_service", { id });
}

export async function toggleService(id: string): Promise<ServiceView[]> {
  return invoke("toggle_service", { id });
}

export async function startAll(): Promise<ServiceView[]> {
  return invoke("start_all");
}

export async function stopAll(): Promise<ServiceView[]> {
  return invoke("stop_all");
}

export async function getHostName(): Promise<string> {
  return invoke("get_host_name");
}

export async function getEventLogs(): Promise<LogEntry[]> {
  return invoke("get_event_logs");
}

export async function clearEventLogs(): Promise<void> {
  return invoke("clear_event_logs");
}

export async function getNetworkInterfaces(): Promise<NetworkInterface[]> {
  return invoke("get_network_interfaces");
}

export async function exportConfig(): Promise<string> {
  return invoke("export_config");
}

export async function importConfig(json: string): Promise<ServiceView[]> {
  return invoke("import_config", { json });
}
