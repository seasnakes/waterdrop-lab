import { solveHeightField } from './height-field.js';

self.onmessage = ({ data: { mask, size, id } }) => {
  try {
    const result = solveHeightField(mask, size);
    self.postMessage({ ...result, id }, [result.field.buffer]);
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};
