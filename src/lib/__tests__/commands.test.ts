import { describe, it, expect, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import {
  getServices,
  addService,
  updateService,
  deleteService,
  toggleService,
  startAll,
  stopAll,
  getHostName,
  getEventLogs,
  clearEventLogs,
  getNetworkInterfaces,
  exportConfig,
  importConfig,
} from "../commands";

const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  mockInvoke.mockReset();
});

describe("commands", () => {
  it("getServices calls invoke with correct command", async () => {
    mockInvoke.mockResolvedValue([]);
    const result = await getServices();
    expect(mockInvoke).toHaveBeenCalledWith("get_services");
    expect(result).toEqual([]);
  });

  it("addService calls invoke with correct args", async () => {
    mockInvoke.mockResolvedValue([]);
    await addService("test", "_http._tcp", 8080, { key: "val" }, true);
    expect(mockInvoke).toHaveBeenCalledWith("add_service", {
      name: "test",
      serviceType: "_http._tcp",
      port: 8080,
      txt: { key: "val" },
      enabled: true,
    });
  });

  it("updateService calls invoke with correct args", async () => {
    mockInvoke.mockResolvedValue([]);
    await updateService("id-1", "test", "_http._tcp", 8080, {}, false);
    expect(mockInvoke).toHaveBeenCalledWith("update_service", {
      id: "id-1",
      name: "test",
      serviceType: "_http._tcp",
      port: 8080,
      txt: {},
      enabled: false,
    });
  });

  it("deleteService calls invoke with correct args", async () => {
    mockInvoke.mockResolvedValue([]);
    await deleteService("id-1");
    expect(mockInvoke).toHaveBeenCalledWith("delete_service", { id: "id-1" });
  });

  it("toggleService calls invoke with correct args", async () => {
    mockInvoke.mockResolvedValue([]);
    await toggleService("id-1");
    expect(mockInvoke).toHaveBeenCalledWith("toggle_service", { id: "id-1" });
  });

  it("startAll calls invoke with correct command", async () => {
    mockInvoke.mockResolvedValue([]);
    await startAll();
    expect(mockInvoke).toHaveBeenCalledWith("start_all");
  });

  it("stopAll calls invoke with correct command", async () => {
    mockInvoke.mockResolvedValue([]);
    await stopAll();
    expect(mockInvoke).toHaveBeenCalledWith("stop_all");
  });

  it("getHostName calls invoke with correct command", async () => {
    mockInvoke.mockResolvedValue("my-host");
    const result = await getHostName();
    expect(mockInvoke).toHaveBeenCalledWith("get_host_name");
    expect(result).toBe("my-host");
  });

  it("getEventLogs calls invoke with correct command", async () => {
    mockInvoke.mockResolvedValue([]);
    await getEventLogs();
    expect(mockInvoke).toHaveBeenCalledWith("get_event_logs");
  });

  it("clearEventLogs calls invoke with correct command", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await clearEventLogs();
    expect(mockInvoke).toHaveBeenCalledWith("clear_event_logs");
  });

  it("getNetworkInterfaces calls invoke with correct command", async () => {
    mockInvoke.mockResolvedValue([]);
    await getNetworkInterfaces();
    expect(mockInvoke).toHaveBeenCalledWith("get_network_interfaces");
  });

  it("exportConfig calls invoke with correct command", async () => {
    mockInvoke.mockResolvedValue("{}");
    const result = await exportConfig();
    expect(mockInvoke).toHaveBeenCalledWith("export_config");
    expect(result).toBe("{}");
  });

  it("importConfig calls invoke with correct args", async () => {
    mockInvoke.mockResolvedValue([]);
    await importConfig('{"services":[]}');
    expect(mockInvoke).toHaveBeenCalledWith("import_config", {
      json: '{"services":[]}',
    });
  });
});
