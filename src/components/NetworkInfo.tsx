import type { NetworkInterface } from "../types";

interface Props {
  interfaces: NetworkInterface[];
  onRefresh: () => void;
}

export function NetworkInfo({ interfaces, onRefresh }: Props) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Network Interfaces
        </h3>
        <button
          onClick={onRefresh}
          className="rounded px-2 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          Refresh
        </button>
      </div>
      {interfaces.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-400">
          No network interfaces found
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {interfaces.map((iface) => (
            <div
              key={iface.name}
              className="rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="mb-1 text-sm font-semibold text-gray-800">
                {iface.name}
              </div>
              <div className="space-y-0.5">
                {iface.addresses.map((addr) => (
                  <div key={addr} className="font-mono text-xs text-gray-500">
                    {addr}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
