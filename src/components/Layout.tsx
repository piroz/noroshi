import { useEffect, useState } from "react";
import { getHostName } from "../lib/commands";

export type Tab = "services" | "monitor";

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  children: React.ReactNode;
}

export function Layout({ activeTab, onTabChange, children }: Props) {
  const [hostname, setHostname] = useState("");

  useEffect(() => {
    getHostName().then(setHostname).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">mdns-manager</h1>
          {hostname && (
            <span className="text-sm text-gray-500">
              Host: <span className="font-mono">{hostname}</span>
            </span>
          )}
        </div>
        <nav className="mt-3 flex gap-1">
          <button
            onClick={() => onTabChange("services")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "services"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            Services
          </button>
          <button
            onClick={() => onTabChange("monitor")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "monitor"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            Monitor
          </button>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
