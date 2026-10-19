import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";

const resources = [
  ["group", "list_groups"],
  ["connection", "list_profiles"],
  ["connection", "list_telnet_profiles"],
  ["connection", "list_serial_profiles"],
] as const;

async function resourceEvents(): Promise<Set<string>> {
  const events = new Set<string>();
  await Promise.all(resources.map(async ([kind, command]) => {
    try {
      const rows = await invoke<{ id: string }[]>(command);
      for (const row of rows) events.add(`${kind}:changed:${row.id}`);
    } catch (error) {
      console.warn(`[terminal] cannot read ${command} for import notifications:`, error);
    }
  }));
  return events;
}

/** Imports can partially commit before throwing. Notify old and new resources in either case. */
export async function withEnvironmentUpdates<T>(operation: () => Promise<T>): Promise<T> {
  const before = await resourceEvents();
  try {
    return await operation();
  } finally {
    const after = await resourceEvents();
    await Promise.all([...new Set([...before, ...after])].map(async event => {
      try { await emit(event); }
      catch (error) { console.warn("[terminal] import notification failed:", error); }
    }));
  }
}
