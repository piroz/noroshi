import type { ServiceView } from "../types";
import { ServiceRow } from "./ServiceRow";

interface Props {
  services: ServiceView[];
  onToggle: (id: string) => void;
  onEdit: (service: ServiceView) => void;
  onDelete: (id: string) => void;
}

export function ServiceTable({ services, onToggle, onEdit, onDelete }: Props) {
  if (services.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <p className="text-gray-500">
          No services configured. Click "Add Service" to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Port</th>
            <th className="px-4 py-3">TXT Records</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map((svc) => (
            <ServiceRow
              key={svc.id}
              service={svc}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
