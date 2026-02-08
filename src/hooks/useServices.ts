import { useCallback, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import type { ServiceView } from "../types";
import * as commands from "../lib/commands";

export function useServices() {
  const [services, setServices] = useState<ServiceView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      const result = await commands.getServices();
      setServices(result);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    const unlisten = listen<ServiceView[]>("services-changed", (event) => {
      setServices(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const addService = useCallback(
    async (
      name: string,
      serviceType: string,
      port: number,
      txt: Record<string, string>,
      enabled: boolean,
    ) => {
      try {
        const result = await commands.addService(
          name,
          serviceType,
          port,
          txt,
          enabled,
        );
        setServices(result);
        setError(null);
      } catch (e) {
        setError(String(e));
      }
    },
    [],
  );

  const updateService = useCallback(
    async (
      id: string,
      name: string,
      serviceType: string,
      port: number,
      txt: Record<string, string>,
      enabled: boolean,
    ) => {
      try {
        const result = await commands.updateService(
          id,
          name,
          serviceType,
          port,
          txt,
          enabled,
        );
        setServices(result);
        setError(null);
      } catch (e) {
        setError(String(e));
      }
    },
    [],
  );

  const deleteService = useCallback(async (id: string) => {
    try {
      const result = await commands.deleteService(id);
      setServices(result);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const toggleService = useCallback(async (id: string) => {
    try {
      const result = await commands.toggleService(id);
      setServices(result);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const startAll = useCallback(async () => {
    try {
      const result = await commands.startAll();
      setServices(result);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const stopAll = useCallback(async () => {
    try {
      const result = await commands.stopAll();
      setServices(result);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const importConfig = useCallback(async (json: string) => {
    try {
      const result = await commands.importConfig(json);
      setServices(result);
      setError(null);
    } catch (e) {
      setError(String(e));
      throw e;
    }
  }, []);

  return {
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
  };
}
