import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { useServices } from "../useServices";
import type { ServiceView } from "../../types";

const mockInvoke = vi.mocked(invoke);

const mockService: ServiceView = {
  id: "uuid-1",
  name: "Test Service",
  type: "_http._tcp",
  port: 8080,
  txt: {},
  enabled: true,
  status: "running",
};

beforeEach(() => {
  mockInvoke.mockReset();
});

describe("useServices", () => {
  it("fetches services on mount", async () => {
    mockInvoke.mockResolvedValue([mockService]);

    const { result } = renderHook(() => useServices());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.services).toEqual([mockService]);
    expect(result.current.error).toBeNull();
    expect(mockInvoke).toHaveBeenCalledWith("get_services");
  });

  it("sets error when fetch fails", async () => {
    mockInvoke.mockRejectedValue("connection failed");

    const { result } = renderHook(() => useServices());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("connection failed");
    expect(result.current.services).toEqual([]);
  });

  it("addService updates state with returned services", async () => {
    mockInvoke.mockResolvedValue([]);

    const { result } = renderHook(() => useServices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const updated = [mockService];
    mockInvoke.mockResolvedValue(updated);

    await act(async () => {
      await result.current.addService("Test", "_http._tcp", 8080, {}, true);
    });

    expect(result.current.services).toEqual(updated);
    expect(result.current.error).toBeNull();
  });

  it("deleteService updates state", async () => {
    mockInvoke.mockResolvedValue([mockService]);

    const { result } = renderHook(() => useServices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockInvoke.mockResolvedValue([]);

    await act(async () => {
      await result.current.deleteService("uuid-1");
    });

    expect(result.current.services).toEqual([]);
  });

  it("toggleService updates state", async () => {
    mockInvoke.mockResolvedValue([mockService]);

    const { result } = renderHook(() => useServices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const toggled = {
      ...mockService,
      status: "stopped" as const,
      enabled: false,
    };
    mockInvoke.mockResolvedValue([toggled]);

    await act(async () => {
      await result.current.toggleService("uuid-1");
    });

    expect(result.current.services).toEqual([toggled]);
  });

  it("startAll updates state", async () => {
    const stopped = { ...mockService, status: "stopped" as const };
    mockInvoke.mockResolvedValue([stopped]);

    const { result } = renderHook(() => useServices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockInvoke.mockResolvedValue([mockService]);

    await act(async () => {
      await result.current.startAll();
    });

    expect(result.current.services).toEqual([mockService]);
  });

  it("stopAll updates state", async () => {
    mockInvoke.mockResolvedValue([mockService]);

    const { result } = renderHook(() => useServices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const stopped = { ...mockService, status: "stopped" as const };
    mockInvoke.mockResolvedValue([stopped]);

    await act(async () => {
      await result.current.stopAll();
    });

    expect(result.current.services).toEqual([stopped]);
  });

  it("importConfig updates state", async () => {
    mockInvoke.mockResolvedValue([]);

    const { result } = renderHook(() => useServices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockInvoke.mockResolvedValue([mockService]);

    await act(async () => {
      await result.current.importConfig("{}");
    });

    expect(result.current.services).toEqual([mockService]);
  });

  it("importConfig sets error and rethrows on failure", async () => {
    mockInvoke.mockResolvedValue([]);

    const { result } = renderHook(() => useServices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockInvoke.mockRejectedValue("invalid json");

    await act(async () => {
      await expect(result.current.importConfig("bad")).rejects.toBe(
        "invalid json",
      );
    });

    expect(result.current.error).toBe("invalid json");
  });
});
