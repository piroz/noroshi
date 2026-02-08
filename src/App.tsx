import { useState } from "react";
import { Layout, type Tab } from "./components/Layout";
import { ServiceTable } from "./components/ServiceTable";
import { ServiceFormDialog } from "./components/ServiceFormDialog";
import { BulkActions } from "./components/BulkActions";
import { MonitoringView } from "./components/MonitoringView";
import { SettingsView } from "./components/SettingsView";
import { useServices } from "./hooks/useServices";
import type { ServiceView } from "./types";

function App() {
  const {
    services,
    loading,
    error,
    addService,
    updateService,
    deleteService,
    toggleService,
    startAll,
    stopAll,
    importConfig,
  } = useServices();

  const [activeTab, setActiveTab] = useState<Tab>("services");
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceView | null>(
    null,
  );

  const handleAdd = () => {
    setEditingService(null);
    setShowForm(true);
  };

  const handleEdit = (service: ServiceView) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleSave = async (
    name: string,
    serviceType: string,
    port: number,
    txt: Record<string, string>,
    enabled: boolean,
  ) => {
    if (editingService) {
      await updateService(
        editingService.id,
        name,
        serviceType,
        port,
        txt,
        enabled,
      );
    } else {
      await addService(name, serviceType, port, txt, enabled);
    }
    setShowForm(false);
    setEditingService(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingService(null);
  };

  const handleDelete = async (id: string) => {
    await deleteService(id);
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "services" && (
        <>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Services</h2>
            <BulkActions
              hasServices={services.length > 0}
              onStartAll={startAll}
              onStopAll={stopAll}
              onAdd={handleAdd}
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading...</div>
          ) : (
            <ServiceTable
              services={services}
              onToggle={toggleService}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

          {showForm && (
            <ServiceFormDialog
              service={editingService}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}
        </>
      )}

      {activeTab === "monitor" && <MonitoringView services={services} />}

      {activeTab === "settings" && <SettingsView onImport={importConfig} />}
    </Layout>
  );
}

export default App;
