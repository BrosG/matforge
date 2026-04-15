/**
 * Recover gracefully from WebGL context loss (browser tab backgrounded,
 * GPU memory pressure, multiple renderers competing for the GPU).
 *
 * Wire up via @react-three/fiber's `onCreated`:
 *
 *   <Canvas onCreated={attachContextLossHandlers} ... />
 *
 * Without this, three.js logs "WebGLRenderer: Context Lost." and the
 * canvas freezes silently. With it, the renderer requests a forced
 * restore and re-uploads its scene state.
 */

type R3FState = {
  gl: {
    domElement: HTMLCanvasElement;
    forceContextRestore?: () => void;
    setSize?: (w: number, h: number, updateStyle?: boolean) => void;
  };
  invalidate?: () => void;
};

export function attachContextLossHandlers(state: R3FState): void {
  const canvas = state.gl?.domElement;
  if (!canvas) return;

  const onLost = (e: Event) => {
    // Canceling default lets the browser restore the context shortly after.
    e.preventDefault();
    // eslint-disable-next-line no-console
    console.warn(
      "[webgl] context lost — preventing default so the browser can restore it",
    );
  };

  const onRestored = () => {
    // eslint-disable-next-line no-console
    console.info("[webgl] context restored — forcing scene re-upload");
    try {
      state.gl.forceContextRestore?.();
    } catch {
      /* older three.js */
    }
    // Trigger a fresh render so the user sees the recovered scene immediately.
    state.invalidate?.();
  };

  canvas.addEventListener("webglcontextlost", onLost, false);
  canvas.addEventListener("webglcontextrestored", onRestored, false);
}
