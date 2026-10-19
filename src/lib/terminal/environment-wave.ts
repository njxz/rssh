import type { Group } from "../stores/app.svelte.ts";

/** The persisted background field enables the accent; its hue follows the group. */
export function groupWaveColor(group?: Group | null): string | null {
  if (!group?.terminal_background || !/^#[0-9a-f]{6}$/i.test(group.color)) return null;
  return group.color;
}

export const WAVE_STARTUP_MS = 1_800;

/** A short energetic surge settles continuously into the ambient drift. */
export function wavePlaybackRate(elapsedMs: number): number {
  const remaining = 1 - Math.min(1, Math.max(0, elapsedMs / WAVE_STARTUP_MS));
  return 1 + 39 * remaining ** 2;
}
