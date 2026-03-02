import { openUrl } from "@tauri-apps/plugin-opener";
import type { ServiceView } from "../types";

interface Props {
  service: ServiceView;
  hostname: string;
  onToggle: (id: string) => void;
  onEdit: (service: ServiceView) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<ServiceView["status"], string> = {
  running: "bg-green-100 text-green-800",
  stopped: "bg-gray-100 text-gray-600",
  error: "bg-red-100 text-red-800",
};

const serviceTypeToScheme: Record<string, string> = {
  "_http._tcp": "http",
  "_https._tcp": "https",
  "_ftp._tcp": "ftp",
  "_ssh._tcp": "ssh",
  "_sftp-ssh._tcp": "sftp",
  "_smb._tcp": "smb",
  "_vnc._tcp": "vnc",
  "_rdp._tcp": "rdp",
  "_ipp._tcp": "ipp",
  "_telnet._tcp": "telnet",
};

function getServiceUrl(
  service: ServiceView,
  hostname: string,
): string | null {
  const scheme = serviceTypeToScheme[service.type];
  if (!scheme || !hostname) return null;
  return `${scheme}://${hostname}.local:${service.port}`;
}

export function ServiceRow({
  service,
  hostname,
  onToggle,
  onEdit,
  onDelete,
}: Props) {
  const txtEntries = Object.entries(service.txt);
  const url = getServiceUrl(service, hostname);

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-4 py-3 text-sm font-medium">
        {url && service.status === "running" ? (
          <button
            onClick={() => openUrl(url).catch(console.error)}
            className="text-blue-600 hover:text-blue-800 hover:underline"
            title={url}
          >
            {service.name}
          </button>
        ) : (
          service.name
        )}
      </td>
      <td className="px-4 py-3 text-sm font-mono text-gray-600">
        {service.type}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{service.port}</td>
      <td className="px-4 py-3 text-sm">
        {txtEntries.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {txtEntries.map(([k, v]) => (
              <span
                key={k}
                className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono"
              >
                {k}={v}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[service.status]}`}
        >
          {service.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(service.id)}
            className={`rounded px-3 py-1 text-xs font-medium ${
              service.status === "running"
                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                : "bg-green-100 text-green-800 hover:bg-green-200"
            }`}
          >
            {service.status === "running" ? "Stop" : "Start"}
          </button>
          <button
            onClick={() => onEdit(service)}
            className="rounded bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(service.id)}
            className="rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
