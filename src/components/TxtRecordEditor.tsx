import { useState } from "react";

interface Props {
  records: Record<string, string>;
  onChange: (records: Record<string, string>) => void;
}

export function TxtRecordEditor({ records, onChange }: Props) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const entries = Object.entries(records);

  const addRecord = () => {
    const key = newKey.trim();
    if (!key) return;
    onChange({ ...records, [key]: newValue });
    setNewKey("");
    setNewValue("");
  };

  const removeRecord = (key: string) => {
    const next = { ...records };
    delete next[key];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        TXT Records
      </label>
      {entries.length > 0 && (
        <div className="space-y-1">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                {key}
              </span>
              <span className="text-gray-400">=</span>
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded flex-1 truncate">
                {value}
              </span>
              <button
                type="button"
                onClick={() => removeRecord(key)}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Key"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <input
          type="text"
          placeholder="Value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <button
          type="button"
          onClick={addRecord}
          className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
        >
          Add
        </button>
      </div>
    </div>
  );
}
