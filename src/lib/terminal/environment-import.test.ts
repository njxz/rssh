import { beforeEach, expect, it, vi } from "vitest";
const { invoke, emit } = vi.hoisted(() => ({ invoke: vi.fn(), emit: vi.fn() }));
vi.mock("@tauri-apps/api/core", () => ({ invoke }));
vi.mock("@tauri-apps/api/event", () => ({ emit }));
import { withEnvironmentUpdates } from "./environment-import";

beforeEach(() => { invoke.mockReset(); emit.mockReset().mockResolvedValue(undefined); });

it("notifies old and new group and connection IDs across successful and partial imports", async () => {
  for (const partial of [false, true]) {
    emit.mockClear();
    let merged = false;
    invoke.mockImplementation(async (command: string) => {
      if (command === "list_groups") return [{ id: merged ? "new-group" : "deleted-group" }];
      return [{ id: command }];
    });
    const result = withEnvironmentUpdates(async () => {
      merged = true;
      if (partial) throw new Error("partial import");
      return "imported";
    });
    if (partial) await expect(result).rejects.toThrow("partial import");
    else await expect(result).resolves.toBe("imported");
    expect(new Set(emit.mock.calls.map(([event]) => event))).toEqual(new Set([
      "group:changed:deleted-group", "group:changed:new-group",
      "connection:changed:list_profiles", "connection:changed:list_telnet_profiles",
      "connection:changed:list_serial_profiles",
    ]));
    expect(emit).toHaveBeenCalledTimes(5);
  }
});

it("preserves the import result when an event cannot be delivered", async () => {
  invoke.mockResolvedValue([{ id: "p1" }]);
  emit.mockRejectedValue(new Error("unavailable"));
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  await expect(withEnvironmentUpdates(async () => 42)).resolves.toBe(42);
  expect(warn).toHaveBeenCalled();
  warn.mockRestore();
});
