import { useEffect, useRef } from "react";
import type { LogEntry, LogLevel } from "../types";

interface Props {
  logs: LogEntry[];
  levelFilter: LogLevel | "all";
  onLevelFilterChange: (level: LogLevel | "all") => void;
  onClear: () => void;
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: "text-blue-600",
  warn: "text-yellow-600",
  error: "text-red-600",
};

const LEVEL_BADGES: Record<LogLevel, string> = {
  info: "bg-blue-100 text-blue-700",
  warn: "bg-yellow-100 text-yellow-700",
  error: "bg-red-100 text-red-700",
};

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function LogViewer({
  logs,
  levelFilter,
  onLevelFilterChange,
  onClear,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs]);

  const filters: (LogLevel | "all")[] = ["all", "info", "warn", "error"];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Event Log</h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {filters.map((level) => (
              <button
                key={level}
                onClick={() => onLevelFilterChange(level)}
                className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                  levelFilter === level
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={onClear}
            className="rounded px-2 py-0.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white font-mono text-xs"
      >
        {logs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            No log entries
          </div>
        ) : (
          <table className="w-full">
            <tbody>
              {logs.map((entry, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50"
                >
                  <td className="whitespace-nowrap px-2 py-1 text-gray-400">
                    {formatTimestamp(entry.timestamp)}
                  </td>
                  <td className="px-2 py-1">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${LEVEL_BADGES[entry.level]}`}
                    >
                      {entry.level}
                    </span>
                  </td>
                  <td
                    className={`px-2 py-1 ${LEVEL_COLORS[entry.level]}`}
                  >
                    {entry.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
