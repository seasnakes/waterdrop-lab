// Solve -Δu = 4 inside a binary mask with u = 0 outside.
// For a circular mask u = R²-r², so sqrt(u) is a hemispherical surface.
// Coarse-to-fine red/black SOR avoids distance-transform skeleton creases.
// Only mask changes run this worker. Lighting and optics are GPU-only updates.
export function solveHeightField(mask, size) {
  if (
    !(mask instanceof Uint8Array) ||
    !Number.isInteger(size) ||
    size < 32 ||
    mask.length !== size * size
  ) {
    throw new RangeError('Expected a square Uint8Array mask with size >= 32.');
  }
  const started = performance.now();
  let previous = null,
    previousSize = 0,
    current;
  for (const n of [32, 64, 128, 256, 512]) {
    const inside = new Uint8Array(n * n);
    current = new Float32Array(n * n);
    const step = size / n;
    for (let y = 1; y < n - 1; y++)
      for (let x = 1; x < n - 1; x++) {
        const i = y * n + x;
        inside[i] =
          mask[Math.floor((y + 0.5) * step) * size + Math.floor((x + 0.5) * step)] > 127 ? 1 : 0;
        if (inside[i] && previous) {
          const px = ((x + 0.5) * previousSize) / n - 0.5,
            py = ((y + 0.5) * previousSize) / n - 0.5;
          const ix = Math.floor(px),
            iy = Math.floor(py),
            tx = px - ix,
            ty = py - iy;
          current[i] =
            (previous[iy * previousSize + ix] * (1 - tx) +
              previous[iy * previousSize + ix + 1] * tx) *
              (1 - ty) +
            (previous[(iy + 1) * previousSize + ix] * (1 - tx) +
              previous[(iy + 1) * previousSize + ix + 1] * tx) *
              ty;
        }
      }
    const forcing = 4 / (n * n);
    const iterations = n <= 64 ? 180 : n <= 256 ? 100 : 80;
    const omega = n <= 64 ? 1.75 : 1.88;
    for (let iter = 0; iter < iterations; iter++) {
      let maxDelta = 0;
      for (let parity = 0; parity < 2; parity++)
        for (let y = 1; y < n - 1; y++) {
          for (let x = 1 + ((y + parity) & 1); x < n - 1; x += 2) {
            const i = y * n + x;
            if (!inside[i]) continue;
            const target =
              (current[i - 1] + current[i + 1] + current[i - n] + current[i + n] + forcing) * 0.25;
            const delta = omega * (target - current[i]);
            current[i] = Math.max(0, current[i] + delta);
            maxDelta = Math.max(maxDelta, Math.abs(delta));
          }
        }
      if (iter > 20 && maxDelta < 2e-8) break;
    }
    previous = current;
    previousSize = n;
  }
  // Flip canvas rows to match WebGL UVs; masks retain full-resolution AA separately.
  const field = new Float32Array(512 * 512 * 4);
  let maxHeight = 0;
  for (let y = 0; y < 512; y++)
    for (let x = 0; x < 512; x++) {
      const h = Math.sqrt(current[y * 512 + x]);
      const i = ((511 - y) * 512 + x) * 4;
      field[i] = h;
      field[i + 1] = h;
      field[i + 2] = h;
      field[i + 3] = 1;
      maxHeight = Math.max(maxHeight, h);
    }
  return { field, resolution: 512, ms: performance.now() - started, maxHeight };
}
