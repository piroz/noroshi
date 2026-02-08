import { useEffect, useState } from "react";
import { getHostName } from "../lib/commands";

interface Props {
  children: React.ReactNode;
}

export function Layout({ children }: Props) {
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
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
