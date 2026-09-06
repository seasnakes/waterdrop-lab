import './style.css';
import { controls, presets } from './config.js';
import { WaterdropRenderer } from './engine.js';
import {
  SIZE,
  makeCanvas,
  drawBackground,
  drawMask,
  drawImageCover,
  imageToMask,
} from './artwork.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const backgroundCanvas = makeCanvas(),
  maskCanvas = makeCanvas();
const maskContext = maskCanvas.getContext('2d', { willReadFrequently: true });
const overlay = $('#drawing');
overlay.width = overlay.height = SIZE;
const overlayContext = overlay.getContext('2d');

for (const config of controls) {
  $(`#${config.section}-controls`).insertAdjacentHTML(
    'beforeend',
    `<div class="control"><label for="${config.id}">${config.label}<output id="${config.id}-value" for="${config.id}"></output></label><input type="range" id="${config.id}" min="${config.min}" max="${config.max}" step="${config.step || 1}" value="${config.value}" /></div>`,
  );
}
let engine;
try {
  engine = new WaterdropRenderer($('#render'));
} catch (error) {
  $('#fallback').hidden = false;
  $('#fallback').textContent =
    '当前浏览器无法启动 WebGL 2。请在开启硬件加速的 Chrome、Edge 或 Safari 中打开。';
  $('#busy').hidden = true;
  $('#render-state').textContent = 'WebGL 不可用';
  $('#export').disabled = true;
  console.error(error);
  throw error;
}
const state = {
  shape: 'drops',
  bg: 'poster',
  seed: 4,
  density: 28,
  tool: 'light',
  compare: false,
  split: 0.5,
  dragging: false,
  exporting: false,
  lastPoint: null,
  maskImage: null,
  busy: false,
};
const undoStack = [];
let toastTimer, textTimer, densityTimer;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($('#toast').hidden = true), 3500);
}
function fillRange(input) {
  input.style.setProperty(
    '--fill',
    `${((input.value - input.min) / (input.max - input.min)) * 100}%`,
  );
}
function updateControl(config, value, manual = false) {
  const input = $(`#${config.id}`);
  input.value = value;
  fillRange(input);
  $(`#${config.id}-value`).textContent =
    Number(value).toFixed(config.digits || 0) + (config.unit || '');
  engine.set(config.uniform, Number(value) * (config.factor || 1));
  if (manual) $$('.preset-chips button').forEach((b) => b.classList.remove('chosen'));
}
for (const config of controls) {
  updateControl(config, config.value);
  $(`#${config.id}`).addEventListener('input', (event) =>
    updateControl(config, event.target.value, true),
  );
}
$$('input[type=range]').forEach(fillRange);

engine.onReady = ({ ms }) => {
  state.busy = false;
  $('#busy').hidden = true;
  $('#export').disabled = false;
  $('#render-state').textContent = `1400 × 1400 · 曲面 ${Math.round(ms)} ms`;
};
engine.onError = (message) => {
  state.busy = false;
  $('#busy').hidden = true;
  $('#render-state').textContent = '渲染中断';
  $('#export').disabled = true;
  toast(message);
};
function rebuild() {
  state.busy = true;
  $('#busy').hidden = false;
  $('#export').disabled = true;
  engine.setMask(maskCanvas);
}
function pushUndo() {
  clearTimeout(textTimer);
  clearTimeout(densityTimer);
  undoStack.push(maskContext.getImageData(0, 0, SIZE, SIZE));
  if (undoStack.length > 12) undoStack.shift();
  $('#undo').disabled = false;
}
function syncShapeUI() {
  $$('#shapes button').forEach((b) =>
    b.classList.toggle('selected', b.dataset.shape === state.shape),
  );
  $('#text-settings').hidden = state.shape !== 'text';
  $('#drop-settings').hidden = state.shape !== 'drops';
  $('#custom-settings').hidden = state.shape !== 'custom';
}
function setShape(kind) {
  pushUndo();
  state.shape = kind;
  syncShapeUI();
  if (kind !== 'custom') {
    drawMask(kind, maskCanvas, {
      seed: state.seed,
      density: state.density,
      text: $('#water-text').value,
    });
    rebuild();
  } else toast('可直接绘制，或导入透明 PNG / 黑白蒙版。');
}
function setBackground(kind) {
  state.bg = kind;
  drawBackground(kind, backgroundCanvas);
  engine.setBackground(backgroundCanvas);
  $$('.bg-thumb').forEach((b) => b.classList.toggle('selected', b.dataset.bg === kind));
}
function applyPreset(name) {
  const preset = presets[name];
  controls.forEach((c) => updateControl(c, preset[c.id]));
  $$('.preset-chips button').forEach((b) =>
    b.classList.toggle('chosen', b.dataset.preset === name),
  );
}
function setTool(tool) {
  state.tool = tool;
  $$('.tool[data-tool]').forEach((b) => b.classList.toggle('active', b.dataset.tool === tool));
  $('.brush-settings').hidden = tool === 'light';
  $('#light-marker').hidden = tool !== 'light' || state.compare;
  $('#hint').textContent = state.compare
    ? '↔ 在画布上拖动，比较原图与效果'
    : tool === 'light'
      ? '☼ 在画布上拖动，改变光源方向'
      : tool === 'draw'
        ? '✎ 在画布上绘制；松开后生成水滴曲面'
        : '▱ 拖动擦除水滴；⌘ Z 撤销';
}
function moveLight(x, y) {
  engine.setLight((x - 0.5) * 3, (0.5 - y) * 3);
  $('#light-marker').style.left = `${x * 100}%`;
  $('#light-marker').style.top = `${y * 100}%`;
}
function updateCompare() {
  engine.set('uCompare', state.compare ? state.split : -1);
  $('#compare').setAttribute('aria-pressed', state.compare);
  $('#compare-line').hidden = $('#compare-label').hidden = !state.compare;
  $('#compare-line').style.left = `${state.split * 100}%`;
  setTool(state.tool);
}
function point(event) {
  const r = $('#stage').getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(1, (event.clientX - r.left) / r.width)),
    y: Math.max(0, Math.min(1, (event.clientY - r.top) / r.height)),
  };
}
function stroke(from, to) {
  const radius = Number($('#brush').value),
    erase = state.tool === 'erase';
  for (const [context, color] of [
    [maskContext, erase ? '#000' : '#fff'],
    [overlayContext, erase ? '#ff6b7240' : '#ffffff70'],
  ]) {
    context.strokeStyle = context.fillStyle = color;
    context.lineWidth = radius;
    context.lineCap = context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(from.x * SIZE, from.y * SIZE);
    context.lineTo(to.x * SIZE, to.y * SIZE);
    context.stroke();
    context.beginPath();
    context.arc(to.x * SIZE, to.y * SIZE, radius / 2, 0, Math.PI * 2);
    context.fill();
  }
}
$('#stage').addEventListener('pointerdown', (event) => {
  if (state.exporting || !engine.ready) return;
  if (event.button !== 0) return;
  const p = point(event);
  state.dragging = true;
  state.lastPoint = p;
  $('#stage').setPointerCapture(event.pointerId);
  if (state.compare) {
    state.split = p.x;
    updateCompare();
  } else if (state.tool === 'light') moveLight(p.x, p.y);
  else {
    pushUndo();
    state.shape = 'custom';
    syncShapeUI();
    stroke(p, p);
  }
});
$('#stage').addEventListener('pointermove', (event) => {
  if (!state.dragging) return;
  const p = point(event);
  if (state.compare) {
    state.split = p.x;
    updateCompare();
  } else if (state.tool === 'light') moveLight(p.x, p.y);
  else stroke(state.lastPoint, p);
  state.lastPoint = p;
});
function endPointer() {
  if (!state.dragging) return;
  state.dragging = false;
  if (state.tool !== 'light' && !state.compare) {
    overlayContext.clearRect(0, 0, SIZE, SIZE);
    rebuild();
  }
}
$('#stage').addEventListener('pointerup', endPointer);
$('#stage').addEventListener('pointercancel', endPointer);
$('#stage').addEventListener('lostpointercapture', endPointer);
$$('.tool[data-tool]').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));
$$('#shapes button').forEach((b) => b.addEventListener('click', () => setShape(b.dataset.shape)));
$$('.bg-thumb').forEach((b) => b.addEventListener('click', () => setBackground(b.dataset.bg)));
$$('.preset-chips button').forEach((b) =>
  b.addEventListener('click', () => applyPreset(b.dataset.preset)),
);
$('#compare').addEventListener('click', () => {
  state.compare = !state.compare;
  updateCompare();
});
$('#view').addEventListener('change', (event) => {
  engine.set('uView', Number(event.target.value));
  if (event.target.value !== '0' && state.compare) {
    state.compare = false;
    updateCompare();
  }
});
$('#wrap').addEventListener('change', (event) =>
  engine.set('uWrap', ['repeat', 'mirror', 'clamp'].indexOf(event.target.value)),
);
$('#water-text').addEventListener('input', () => {
  clearTimeout(textTimer);
  textTimer = setTimeout(() => {
    drawMask('text', maskCanvas, { text: $('#water-text').value });
    rebuild();
  }, 240);
});
$('#density').addEventListener('input', (event) => {
  state.density = Number(event.target.value);
  fillRange(event.target);
  clearTimeout(densityTimer);
  densityTimer = setTimeout(() => {
    drawMask('drops', maskCanvas, state);
    rebuild();
  }, 120);
});
$('#brush').addEventListener('input', (event) => fillRange(event.target));
$('#shuffle').addEventListener('click', () => {
  state.seed++;
  pushUndo();
  drawMask('drops', maskCanvas, state);
  rebuild();
});
$('#clear').addEventListener('click', () => {
  pushUndo();
  maskContext.fillStyle = '#000';
  maskContext.fillRect(0, 0, SIZE, SIZE);
  state.shape = 'custom';
  syncShapeUI();
  rebuild();
  setTool('draw');
});
function undo() {
  if (!undoStack.length) return;
  clearTimeout(textTimer);
  clearTimeout(densityTimer);
  maskContext.putImageData(undoStack.pop(), 0, 0);
  $('#undo').disabled = !undoStack.length;
  state.shape = 'custom';
  syncShapeUI();
  rebuild();
}
$('#undo').addEventListener('click', undo);
document.addEventListener('keydown', (event) => {
  if (
    (event.metaKey || event.ctrlKey) &&
    event.key.toLowerCase() === 'z' &&
    !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
  ) {
    event.preventDefault();
    undo();
  }
});

async function loadImage(url) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}
async function readFile(file) {
  if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    throw new Error('请选择 PNG、JPG 或 WEBP 图片。');
  if (file.size > 30 * 1024 * 1024) throw new Error('请选择小于 30 MB 的图片。');
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    if (image.width * image.height > 50e6)
      throw new Error('图片尺寸过大，请先缩小到 5000 万像素以内。');
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}
function useMask(image) {
  pushUndo();
  state.maskImage = image;
  state.shape = 'custom';
  syncShapeUI();
  const mode = imageToMask(image, maskCanvas, $('#mask-mode').value);
  rebuild();
  toast(
    `蒙版已载入 · ${{ alpha: '按透明度读取', white: '白色区域为水滴', black: '黑色区域为水滴' }[mode]}`,
  );
}
$('#upload-bg').addEventListener('click', () => $('#file-bg').click());
$('#upload-mask').addEventListener('click', () => $('#file-mask').click());
$('#file-bg').addEventListener('change', async (event) => {
  try {
    const image = await readFile(event.target.files[0]);
    drawImageCover(image, backgroundCanvas);
    engine.setBackground(backgroundCanvas);
    state.bg = 'custom';
    $$('.bg-thumb').forEach((b) => b.classList.remove('selected'));
    toast('背景已载入，居中裁切为正方形。');
  } catch (error) {
    toast(error.message);
  } finally {
    event.target.value = '';
  }
});
$('#file-mask').addEventListener('change', async (event) => {
  try {
    useMask(await readFile(event.target.files[0]));
  } catch (error) {
    toast(error.message);
  } finally {
    event.target.value = '';
  }
});
$('#mask-mode').addEventListener('change', () => {
  if (state.maskImage) useMask(state.maskImage);
});
$('#reference-preset').addEventListener('click', async () => {
  const button = $('#reference-preset');
  button.disabled = true;
  try {
    const [bg, mask] = await Promise.all([
      loadImage(`${import.meta.env.BASE_URL}reference/avatortest.png`),
      loadImage(`${import.meta.env.BASE_URL}reference/mask.png`),
    ]);
    drawImageCover(bg, backgroundCanvas);
    engine.setBackground(backgroundCanvas);
    state.bg = 'reference';
    $$('.bg-thumb').forEach((b) => b.classList.remove('selected'));
    $('#mask-mode').value = 'alpha';
    useMask(mask);
    applyPreset('inverted');
    updateControl(
      controls.find((c) => c.id === 'distance'),
      210,
      true,
    );
    toast('已载入原帖测试图与蒙版，可调节高度和距离对比。');
  } catch {
    toast('原帖素材尚未准备好。你也可以从原帖下载图片，分别导入背景和蒙版。');
  } finally {
    button.disabled = false;
  }
});
$('#reset').addEventListener('click', () => {
  clearTimeout(textTimer);
  clearTimeout(densityTimer);
  pushUndo();
  Object.assign(state, {
    shape: 'drops',
    bg: 'poster',
    seed: 4,
    density: 28,
    compare: false,
    split: 0.5,
    maskImage: null,
  });
  $('#density').value = 28;
  fillRange($('#density'));
  $('#water-text').value = 'FLOW';
  $('#view').value = '0';
  $('#wrap').value = 'repeat';
  $('#mask-mode').value = 'auto';
  engine.set('uView', 0);
  engine.set('uWrap', 0);
  applyPreset('soft');
  setBackground('poster');
  syncShapeUI();
  updateCompare();
  setTool('light');
  moveLight(0.23, 0.22);
  drawMask('drops', maskCanvas, state);
  rebuild();
  toast('已恢复默认效果。');
});
$('#export').addEventListener('click', async () => {
  if (state.busy || state.exporting) return;
  state.exporting = true;
  $('#export').disabled = true;
  try {
    const blob = await engine.exportPNG();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `waterdrop-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    toast('已导出 2048 × 2048 PNG。');
  } catch (error) {
    toast(`导出失败：${error.message}`);
  } finally {
    state.exporting = false;
    $('#export').disabled = state.busy;
  }
});
setBackground('poster');
drawMask('drops', maskCanvas, state);
moveLight(0.23, 0.22);
rebuild();
window.addEventListener('beforeunload', () => engine.dispose());
// Read-only diagnostics for reproducible browser acceptance checks.
window.waterdropDiagnostics = () => ({
  ready: engine.ready,
  busy: state.busy,
  shape: state.shape,
  bg: state.bg,
  renderer: `Three.js r${engine.threeRevision} / WebGL 2`,
  renderCount: engine.renderCount,
  solve: engine.lastSolve,
  revision: engine.revision,
  uniforms: Object.fromEntries(controls.map((c) => [c.id, engine.uniforms[c.uniform].value])),
  size: { width: engine.renderer.domElement.width, height: engine.renderer.domElement.height },
  glError: engine.renderer.getContext().getError(),
  compare: state.compare,
});
