import type { Group } from "../stores/app.svelte.ts";

/** The persisted background field enables the accent; its hue follows the group. */
export function groupWaveColor(group?: Group | null): string | null {
  if (!group?.terminal_background || !/^#[0-9a-f]{6}$/i.test(group.color)) return null;
  return group.color;
}

export const WAVE_STARTUP_MS = 2_000;

/** A short energetic surge settles continuously into the ambient drift. */
export function wavePlaybackRate(elapsedMs: number, duration = WAVE_STARTUP_MS, initialRate = 12): number {
  // Hold the initial rush long enough to see it, then ease out in the second half.
  const remaining = 1 - Math.min(1, Math.max(0, (elapsedMs - duration / 2) / (duration / 2)));
  return 1 + (initialRate - 1) * remaining ** 2;
}

export const DEFAULT_WAVE_TUNING = {
  brightness: 1, width: 23, wavelength: 1.45, speed: 0.9,
  startupSpeed: 12, startupAmplitude: 1.15, startupDuration: 2.2,
  blur: 3, crest: 1, layers: 3, spacing: 39,
};
export type WaveTuning = typeof DEFAULT_WAVE_TUNING;
