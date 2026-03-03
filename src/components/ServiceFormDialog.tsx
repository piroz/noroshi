import { useState } from "react";
import type { ServiceView } from "../types";
import { TxtRecordEditor } from "./TxtRecordEditor";

const PRESET_SERVICE_TYPES = [
  { value: "_http._tcp", label: "HTTP" },
  { value: "_https._tcp", label: "HTTPS" },
  { value: "_ftp._tcp", label: "FTP" },
  { value: "_ssh._tcp", label: "SSH" },
  { value: "_sftp-ssh._tcp", label: "SFTP" },
  { value: "_smb._tcp", label: "SMB" },
  { value: "_vnc._tcp", label: "VNC" },
  { value: "_rdp._tcp", label: "RDP" },
  { value: "_ipp._tcp", label: "IPP (Printer)" },
  { value: "_telnet._tcp", label: "Telnet" },
] as const;

const CUSTOM_OPTION = "__custom__";

interface Props {
  service: ServiceView | null;
  onSave: (
    name: string,
    serviceType: string,
    port: number,
    txt: Record<string, string>,
    enabled: boolean,
  ) => void;
  onCancel: () => void;
}

export function ServiceFormDialog({ service, onSave, onCancel }: Props) {
  const [name, setName] = useState(service?.name ?? "");
  const initialType = service?.type ?? "_http._tcp";
  const isPreset = PRESET_SERVICE_TYPES.some((p) => p.value === initialType);
  const [selectedPreset, setSelectedPreset] = useState(
    isPreset ? initialType : CUSTOM_OPTION,
  );
  const [customType, setCustomType] = useState(isPreset ? "" : initialType);
  const serviceType =
    selectedPreset === CUSTOM_OPTION ? customType : selectedPreset;
  const [port, setPort] = useState(service?.port ?? 8080);
  const [txt, setTxt] = useState<Record<string, string>>(
    service ? { ...service.txt } : {},
  );
  const [enabled, setEnabled] = useState(service?.enabled ?? true);

  const isEdit = service !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name.trim(), serviceType.trim(), port, txt, enabled);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4"
      >
        <h2 className="text-lg font-semibold">
          {isEdit ? "Edit Service" : "Add Service"}
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="My Web Server"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Service Type
          </label>
          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            {PRESET_SERVICE_TYPES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label} ({p.value})
              </option>
            ))}
            <option value={CUSTOM_OPTION}>Custom...</option>
          </select>
          {selectedPreset === CUSTOM_OPTION && (
            <input
              type="text"
              required
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="_myservice._tcp"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Port
          </label>
          <input
            type="number"
            required
            min={1}
            max={65535}
            value={port}
            onChange={(e) => setPort(Number(e.target.value))}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <TxtRecordEditor records={txt} onChange={setTxt} />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="enabled" className="text-sm text-gray-700">
            Start immediately
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            {isEdit ? "Update" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
