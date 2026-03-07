import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useMonitoring } from "../useMonitoring";
import type { LogEntry, NetworkInterface } from "../../types";

const mockInvoke = vi.mocked(invoke);
const mockListen = vi.mocked(listen);

const mockLog: LogEntry = {
  timestamp: "2026-01-01T00:00:00Z",
  level: "info",
  message: "Service started",
};

const mockInterface: NetworkInterface = {
  name: "eth0",
  addresses: ["192.168.1.100"],
};

beforeEach(() => {
  mockInvoke.mockReset();
  mockListen.mockReset();
  mockListen.mockImplementation(() => Promise.resolve(vi.fn()));
});

describe("useMonitoring", () => {
  it("fetches logs and interfaces on mount", async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "get_event_logs") return Promise.resolve([mockLog]);
      if (cmd === "get_network_interfaces")
        return Promise.resolve([mockInterface]);
      return Promise.resolve(undefined);
    });

    const { result } = renderHook(() => useMonitoring());

    await waitFor(() => {
      expect(result.current.logs).toEqual([mockLog]);
    });

    expect(result.current.interfaces).toEqual([mockInterface]);
  });

  it("filters logs by level", async () => {
    const warnLog: LogEntry = {
      timestamp: "2026-01-01T00:00:01Z",
      level: "warn",
      message: "Warning",
    };

    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "get_event_logs") return Promise.resolve([mockLog, warnLog]);
      if (cmd === "get_network_interfaces") return Promise.resolve([]);
      return Promise.resolve(undefined);
    });

    const { result } = renderHook(() => useMonitoring());

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(2);
    });

    act(() => {
      result.current.setLevelFilter("warn");
    });

    expect(result.current.logs).toEqual([warnLog]);
    expect(result.current.allLogs).toHaveLength(2);
  });

  it("clearLogs clears all logs", async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "get_event_logs") return Promise.resolve([mockLog]);
      if (cmd === "get_network_interfaces") return Promise.resolve([]);
      if (cmd === "clear_event_logs") return Promise.resolve(undefined);
      return Promise.resolve(undefined);
    });

    const { result } = renderHook(() => useMonitoring());

    await waitFor(() => {
      expect(result.current.logs).toHaveLength(1);
    });

    await act(async () => {
      await result.current.clearLogs();
    });

    expect(result.current.logs).toEqual([]);
    expect(mockInvoke).toHaveBeenCalledWith("clear_event_logs");
  });

  it("refreshInterfaces updates interfaces", async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "get_event_logs") return Promise.resolve([]);
      if (cmd === "get_network_interfaces") return Promise.resolve([]);
      return Promise.resolve(undefined);
    });

    const { result } = renderHook(() => useMonitoring());

    await waitFor(() => {
      expect(result.current.interfaces).toEqual([]);
    });

    const newInterface: NetworkInterface = {
      name: "wlan0",
      addresses: ["10.0.0.1"],
    };
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "get_network_interfaces")
        return Promise.resolve([newInterface]);
      return Promise.resolve(undefined);
    });

    await act(async () => {
      await result.current.refreshInterfaces();
    });

    expect(result.current.interfaces).toEqual([newInterface]);
  });

  it("listens for log-entry events", async () => {
    let logEntryCallback: ((event: { payload: LogEntry }) => void) | null =
      null;

    mockListen.mockImplementation((event: string, callback) => {
      if (event === "log-entry") {
        logEntryCallback = callback as (event: { payload: LogEntry }) => void;
      }
      return Promise.resolve(vi.fn());
    });

    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "get_event_logs") return Promise.resolve([]);
      if (cmd === "get_network_interfaces") return Promise.resolve([]);
      return Promise.resolve(undefined);
    });

    const { result } = renderHook(() => useMonitoring());

    await waitFor(() => {
      expect(logEntryCallback).not.toBeNull();
    });

    const newLog: LogEntry = {
      timestamp: "2026-01-01T00:00:02Z",
      level: "error",
      message: "Something failed",
    };

    act(() => {
      logEntryCallback!({ payload: newLog });
    });

    expect(result.current.allLogs).toContainEqual(newLog);
  });
});
