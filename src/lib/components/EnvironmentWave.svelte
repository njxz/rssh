<script lang="ts">
  import { onMount } from "svelte";
  import { wavePlaybackRate, WAVE_STARTUP_MS } from "../terminal/environment-wave.ts";

  let { color }: { color: string } = $props();
  const uid = $props.id();
  let surface: HTMLDivElement;

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
        ], { duration: index ? 60_000 : 48_000, iterations: Infinity, easing: "linear" }));
      surge = surface.animate([
        { transform: "scaleX(1.65)", opacity: 1 },
        { transform: "scaleX(1)", opacity: 0.75 },
      ], { duration: WAVE_STARTUP_MS, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" });
      const started = performance.now();
      function settle(now: number) {
        const elapsed = now - started;
        animations.forEach(animation => animation.updatePlaybackRate(wavePlaybackRate(elapsed)));
        if (elapsed < WAVE_STARTUP_MS) frame = requestAnimationFrame(settle);
      }
      settle(started);
    }
    start();
    preference.addEventListener("change", start);
    return () => { stop(); preference.removeEventListener("change", start); };
  });
</script>

<div bind:this={surface} class="environment-wave" style:--group-wave-color={color} aria-hidden="true">
  {#each [0, 1] as layer}
    <svg viewBox="0 0 200 800" preserveAspectRatio="none" focusable="false" class:back={layer === 1}>
      <defs>
        <linearGradient id={`${uid}-${layer}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="var(--group-wave-color)" stop-opacity="0" />
          <stop offset="60%" stop-color="var(--group-wave-color)" stop-opacity={layer ? "0.06" : "0.12"} />
          <stop offset="100%" stop-color="var(--group-wave-color)" stop-opacity={layer ? "0.12" : "0.26"} />
        </linearGradient>
      </defs>
      <g fill={`url(#${uid}-${layer})`}>
        <path d="M100 0 C20 66 20 134 100 200 C180 266 180 334 100 400 C20 466 20 534 100 600 C180 666 180 734 100 800 H200 V0 Z" />
      </g>
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
    opacity: 0.75;
  }
  svg { position: absolute; top: 0; right: 0; width: 100%; height: 200%; filter: blur(7px); }
  svg.back { width: 78%; opacity: 0.65; }
  @media (max-width: 600px) { .environment-wave { width: 28%; } }
</style>
