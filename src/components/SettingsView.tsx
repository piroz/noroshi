import { useEffect, useRef, useState } from "react";
import { exportConfig } from "../lib/commands";
import { getHostName } from "../lib/commands";

interface Props {
  onImport: (json: string) => Promise<void>;
}

export function SettingsView({ onImport }: Props) {
  const [hostname, setHostname] = useState("");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getHostName().then(setHostname).catch(console.error);
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const json = await exportConfig();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mdns-manager-config.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: "success", text: "Configuration exported." });
    } catch (e) {
      setMessage({ type: "error", text: `Export failed: ${e}` });
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected
    e.target.value = "";

    setMessage(null);

    const text = await file.text();

    const confirmed = window.confirm(
      "Import will replace all existing services. Running services will be stopped. Continue?",
    );
    if (!confirmed) return;

    setImporting(true);
    try {
      await onImport(text);
      setMessage({ type: "success", text: "Configuration imported." });
    } catch (err) {
      setMessage({ type: "error", text: `Import failed: ${err}` });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Settings</h2>

      {message && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Hostname Section */}
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Hostname</h3>
        <p className="mb-3 font-mono text-sm text-gray-900">
          {hostname || "Loading..."}
        </p>
        <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
          <p className="mb-2 font-semibold text-gray-700">
            To change hostname, use your OS settings:
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
              <span className="font-medium">Windows:</span> Settings &rarr;
              System &rarr; About &rarr; Rename this PC
            </li>
          </ul>
          <p className="mt-2 text-gray-400">
            Restart this app after changing hostname.
          </p>
        </div>
      </section>

      {/* Export Section */}
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          Export Configuration
        </h3>
        <p className="mb-3 text-xs text-gray-500">
          Download current configuration as a JSON file.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
        >
          {exporting ? "Exporting..." : "Export JSON"}
        </button>
      </section>

      {/* Import Section */}
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          Import Configuration
        </h3>
        <p className="mb-3 text-xs text-gray-500">
          Replace all services with configuration from a JSON file. Running
          services will be stopped.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={handleImportClick}
          disabled={importing}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          {importing ? "Importing..." : "Import JSON"}
        </button>
      </section>
    </div>
  );
}
