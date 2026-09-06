import test from 'node:test';
import assert from 'node:assert/strict';
import { solveHeightField } from '../src/height-field.js';

const SIZE = 1024;
function makeMask(predicate) {
  const mask = new Uint8Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (predicate((x + 0.5) / SIZE, (y + 0.5) / SIZE)) mask[y * SIZE + x] = 255;
    }
  }
  return mask;
}
function heightAt(result, x, y) {
  const n = result.resolution;
  return result.field[((n - 1 - Math.floor(y * n)) * n + Math.floor(x * n)) * 4];
}

test('a circular mask approximates the analytic hemisphere', () => {
  const radius = 0.2;
  const mask = makeMask((x, y) => Math.hypot(x - 0.5, y - 0.5) < radius);
  const result = solveHeightField(mask, SIZE);
  assert.ok(Math.abs(result.maxHeight - radius) < 0.004);
  let sum = 0,
    count = 0;
  for (let y = 0; y < result.resolution; y++) {
    for (let x = 0; x < result.resolution; x++) {
      const nx = (x + 0.5) / result.resolution,
        ny = (y + 0.5) / result.resolution;
      const r2 = (nx - 0.5) ** 2 + (ny - 0.5) ** 2;
      if (r2 > 0.18 ** 2) continue;
      const expected = Math.sqrt(radius ** 2 - r2);
      sum += (heightAt(result, nx, ny) - expected) ** 2;
      count++;
    }
  }
  assert.ok(Math.sqrt(sum / count) < 0.004, 'surface RMSE should be below 2% of radius');
});

test('an empty mask produces a finite zero-height surface', () => {
  const result = solveHeightField(new Uint8Array(SIZE * SIZE), SIZE);
  assert.equal(result.maxHeight, 0);
  for (let i = 0; i < result.field.length; i += 4) assert.equal(result.field[i], 0);
});

test('separate droplets preserve empty space and canvas orientation', () => {
  const result = solveHeightField(
    makeMask(
      (x, y) => Math.hypot(x - 0.25, y - 0.25) < 0.1 || Math.hypot(x - 0.75, y - 0.75) < 0.06,
    ),
    SIZE,
  );
  assert.ok(heightAt(result, 0.25, 0.25) > 0.09);
  assert.ok(heightAt(result, 0.75, 0.75) > 0.05);
  assert.equal(heightAt(result, 0.5, 0.5), 0);
  assert.equal(heightAt(result, 0.25, 0.75), 0, 'vertical coordinates must not be mirrored');
});

test('a hole in the mask remains empty', () => {
  const result = solveHeightField(
    makeMask((x, y) => {
      const radius = Math.hypot(x - 0.5, y - 0.5);
      return radius > 0.08 && radius < 0.22;
    }),
    SIZE,
  );
  assert.equal(heightAt(result, 0.5, 0.5), 0);
  assert.ok(heightAt(result, 0.65, 0.5) > 0);
  assert.equal(heightAt(result, 0.8, 0.5), 0);
});

test('malformed mask dimensions are rejected', () => {
  assert.throws(() => solveHeightField(new Uint8Array(9), 1024), RangeError);
  assert.throws(() => solveHeightField(new Uint8Array(16), 4), RangeError);
  assert.throws(() => solveHeightField([], 1024), RangeError);
});
