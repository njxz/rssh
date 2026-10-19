<script lang="ts">
  import { onMount } from "svelte";
  import { wavePlaybackRate, DEFAULT_WAVE_TUNING, type WaveTuning } from "../terminal/environment-wave.ts";

  let { color, tuning = {}, previewSteady = false }: {
    color: string;
    tuning?: Partial<WaveTuning>;
    previewSteady?: boolean;
  } = $props();
  const settings = $derived({ ...DEFAULT_WAVE_TUNING, ...tuning });
  const uid = $props.id();
  let surface: HTMLDivElement;
  const wavePath = "M100 0 " + Array.from({ length: 2 }, (_, index) => {
    const y = index * 400;
    return `C20 ${y + 66} 20 ${y + 134} 100 ${y + 200} C180 ${y + 266} 180 ${y + 334} 100 ${y + 400}`;
  }).join(" ");

  // Spacing is a vertical phase offset: 100% puts adjacent crests in each other's troughs.
  const phase = (index: number) => (index * settings.spacing / 200) % 1;

  onMount(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animations: Animation[] = [];
    let surge: Animation | undefined;
    let frame = 0;
    function stop() {
      cancelAnimationFrame(frame);
      animations.forEach(animation => animation.cancel());
      animations = [];
      surge?.cancel();
    }
    function start() {
      stop();
      if (preference.matches) return;
      animations = Array.from(surface.querySelectorAll("svg")).map((layer, index) =>
        layer.animate([
          { transform: "translateY(0)" },
          { transform: "translateY(-50%)" },
        ], { duration: 10_000 / settings.speed, delay: -phase(index) * 10_000 / settings.speed, iterations: Infinity, easing: "linear" }));
      const startupMs = settings.startupDuration * 1000;
      const amplitude = (amount: number) => `scaleX(${1 + (settings.startupAmplitude - 1) * amount})`;
      if (!previewSteady) surge = surface.animate([
        { transform: "scaleX(1)", offset: 0 },
        { transform: amplitude(0.86), offset: 0.18 },
        { transform: amplitude(0.18), offset: 0.36 },
        { transform: amplitude(1), offset: 0.54 },
        { transform: amplitude(0.23), offset: 0.72 },
        { transform: amplitude(0.59), offset: 0.86 },
        { transform: "scaleX(1)", offset: 1 },
      ], { duration: startupMs, easing: "ease-in-out" });
      const started = performance.now();
      function settle(now: number) {
        const elapsed = now - started;
        animations.forEach(animation => animation.updatePlaybackRate(previewSteady ? 1 : wavePlaybackRate(elapsed, startupMs, settings.startupSpeed)));
        if (!previewSteady && elapsed < startupMs) frame = requestAnimationFrame(settle);
      }
      settle(started);
    }
    start();
    preference.addEventListener("change", start);
    return () => { stop(); preference.removeEventListener("change", start); };
  });
</script>

<div bind:this={surface} class="environment-wave" style:--group-wave-color={color} style:width={`min(${settings.width}%, ${settings.width * 10}px)`} style:filter={`brightness(${settings.brightness})`} aria-hidden="true">
  {#each Array.from({ length: Math.max(1, Math.min(12, Math.round(settings.layers))) }, (_, index) => index) as layer}
    <svg viewBox="0 0 200 800" preserveAspectRatio="none" focusable="false" style:width={`${100 - layer * 2}%`} style:transform={`translateY(${-phase(layer) * 50}%)`} style:--layer-color={`color-mix(in srgb, var(--group-wave-color), white ${layer * 4}%)`} style:height={`${settings.wavelength * 200}%`} style:filter={`blur(${settings.blur}px)`}>
      <defs>
        <linearGradient id={`${uid}-${layer}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="var(--layer-color)" stop-opacity={0.08 + layer * 0.012} />
          <stop offset="60%" stop-color="var(--layer-color)" stop-opacity={0.16 + layer * 0.015} />
          <stop offset="100%" stop-color="var(--layer-color)" stop-opacity={0.22 + layer * 0.012} />
        </linearGradient>
      </defs>
      <g fill={`url(#${uid}-${layer})`}>
        <path d={`${wavePath} H200 V0 Z`} />
      </g>
      <path class="crest" d={wavePath} fill="none" stroke="var(--layer-color)" stroke-width="0.7" stroke-opacity={Math.min(1, 0.12 * settings.crest)} />
    </svg>
  {/each}
</div>

<style>
  .environment-wave {
    position: absolute;
    inset: 0 0 0 auto;
    width: min(30%, 300px);
    transform-origin: right center;
    overflow: hidden;
    pointer-events: none;
    user-select: none;
    z-index: 0;
    opacity: 1;
  }
  svg { position: absolute; top: 0; right: 0; width: 100%; height: 200%; filter: blur(1.5px); }
  @media (max-width: 600px) { .environment-wave { width: 28%; } }
</style>
