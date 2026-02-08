import { useCallback, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import type { LogEntry, LogLevel, NetworkInterface } from "../types";
import * as commands from "../lib/commands";

export function useMonitoring() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");

  useEffect(() => {
    commands.getEventLogs().then(setLogs).catch(console.error);
    commands.getNetworkInterfaces().then(setInterfaces).catch(console.error);
  }, []);

  useEffect(() => {
    const unlisten = listen<LogEntry>("log-entry", (event) => {
      setLogs((prev) => [...prev, event.payload]);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const clearLogs = useCallback(async () => {
    await commands.clearEventLogs();
    setLogs([]);
  }, []);

  const refreshInterfaces = useCallback(async () => {
    const result = await commands.getNetworkInterfaces();
    setInterfaces(result);
  }, []);

  const filteredLogs =
    levelFilter === "all" ? logs : logs.filter((l) => l.level === levelFilter);

  return {
    logs: filteredLogs,
    allLogs: logs,
    interfaces,
    levelFilter,
    setLevelFilter,
    clearLogs,
    refreshInterfaces,
  };
}
