import { useEffect, useState } from "react";
import { getHostName } from "../lib/commands";

export type Tab = "services" | "monitor" | "settings";

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
            <span className="group relative text-sm text-gray-500">
              Host: <span className="font-mono">{hostname}</span>
              <div className="pointer-events-none absolute top-full right-0 z-10 mt-1 hidden w-72 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600 shadow-lg group-hover:block">
                <p className="mb-2 font-semibold text-gray-800">
                  How to change hostname:
                </p>
                <ul className="space-y-1">
                  <li>
                    <span className="font-medium">macOS:</span>{" "}
                    <code className="rounded bg-gray-100 px-1">
                      sudo scutil --set HostName &lt;name&gt;
                    </code>
                  </li>
                  <li>
                    <span className="font-medium">Linux:</span>{" "}
                    <code className="rounded bg-gray-100 px-1">
                      sudo hostnamectl set-hostname &lt;name&gt;
                    </code>
                  </li>
                  <li>
                    <span className="font-medium">Windows:</span> Settings
                    &rarr; System &rarr; About &rarr; Rename this PC
                  </li>
                </ul>
                <p className="mt-2 text-gray-400">
                  Restart this app after changing hostname.
                </p>
              </div>
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
          <button
            onClick={() => onTabChange("settings")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "settings"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            Settings
          </button>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
