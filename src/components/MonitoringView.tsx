import { StatusDashboard } from "./StatusDashboard";
import { LogViewer } from "./LogViewer";
import { NetworkInfo } from "./NetworkInfo";
import { useMonitoring } from "../hooks/useMonitoring";
import type { ServiceView } from "../types";

interface Props {
  services: ServiceView[];
}

export function MonitoringView({ services }: Props) {
  const {
    logs,
    interfaces,
    levelFilter,
    setLevelFilter,
    clearLogs,
    refreshInterfaces,
  } = useMonitoring();

  return (
    <div className="space-y-6">
      <StatusDashboard services={services} />
      <LogViewer
        logs={logs}
        levelFilter={levelFilter}
        onLevelFilterChange={setLevelFilter}
        onClear={clearLogs}
      />
      <NetworkInfo interfaces={interfaces} onRefresh={refreshInterfaces} />
    </div>
  );
}
