import type { ServiceView } from "../types";

interface Props {
  services: ServiceView[];
}

export function StatusDashboard({ services }: Props) {
  const running = services.filter((s) => s.status === "running").length;
  const stopped = services.filter((s) => s.status === "stopped").length;
  const error = services.filter((s) => s.status === "error").length;

  const cards = [
    {
      label: "Running",
      count: running,
      color: "bg-green-50 border-green-200 text-green-700",
    },
    {
      label: "Stopped",
      count: stopped,
      color: "bg-gray-50 border-gray-200 text-gray-700",
    },
    {
      label: "Error",
      count: error,
      color: "bg-red-50 border-red-200 text-red-700",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-lg border p-4 ${card.color}`}
        >
          <div className="text-2xl font-bold">{card.count}</div>
          <div className="text-sm font-medium">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
