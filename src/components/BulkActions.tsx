interface Props {
  hasServices: boolean;
  onStartAll: () => void;
  onStopAll: () => void;
  onAdd: () => void;
}

export function BulkActions({
  hasServices,
  onStartAll,
  onStopAll,
  onAdd,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onAdd}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Add Service
      </button>
      {hasServices && (
        <>
          <button
            onClick={onStartAll}
            className="rounded border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
          >
            Start All
          </button>
          <button
            onClick={onStopAll}
            className="rounded border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100"
          >
            Stop All
          </button>
        </>
      )}
    </div>
  );
}
