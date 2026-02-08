import type { ServiceView } from "../types";

interface Props {
  service: ServiceView;
  onToggle: (id: string) => void;
  onEdit: (service: ServiceView) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<ServiceView["status"], string> = {
  running: "bg-green-100 text-green-800",
  stopped: "bg-gray-100 text-gray-600",
  error: "bg-red-100 text-red-800",
};

export function ServiceRow({ service, onToggle, onEdit, onDelete }: Props) {
  const txtEntries = Object.entries(service.txt);

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-4 py-3 text-sm font-medium">{service.name}</td>
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
