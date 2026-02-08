export interface ServiceView {
  id: string;
  name: string;
  type: string;
  port: number;
  txt: Record<string, string>;
  enabled: boolean;
  status: "running" | "stopped" | "error";
}

export interface AddServiceParams {
  name: string;
  serviceType: string;
  port: number;
  txt: Record<string, string>;
  enabled: boolean;
}

export interface UpdateServiceParams extends AddServiceParams {
  id: string;
}

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service_id?: string;
}

export interface NetworkInterface {
  name: string;
  addresses: string[];
}
