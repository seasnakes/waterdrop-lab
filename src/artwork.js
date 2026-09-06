export const SIZE = 1024;
export function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  c.getContext('2d', { willReadFrequently: true });
  return c;
}

export function drawBackground(kind, canvas) {
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, SIZE, SIZE);
  if (kind === 'poster') {
    c.fillStyle = '#c5d8c5';
    c.fillRect(0, 0, SIZE, SIZE);
    const g = c.createLinearGradient(0, 0, SIZE, SIZE);
    g.addColorStop(0, '#d8e8c9');
    g.addColorStop(0.55, '#c4d6c4');
    g.addColorStop(1, '#b2c8c4');
    c.fillStyle = g;
    c.fillRect(0, 0, SIZE, SIZE);
    c.strokeStyle = '#385b4a38';
    c.lineWidth = 1;
    c.strokeRect(44, 44, 936, 936);
    c.fillStyle = '#365c50';
    c.font = '500 15px sans-serif';
    c.fillText('THE ART OF CHANGING SHAPE', 73, 85);
    c.fillText('VOL. 01 — 2026', 810, 85);
    c.fillStyle = '#244e42';
    c.font = 'italic 196px Georgia, serif';
    c.fillText('Stay', 74, 307);
    c.fillText('fluid.', 75, 473);
    c.save();
    c.translate(812, 389);
    c.rotate(-0.25);
    c.strokeStyle = '#4a716247';
    c.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      c.beginPath();
      c.ellipse(0, 0, 82 + i * 15, 115 + i * 15, 0, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
    c.fillStyle = '#244e4299';
    c.font = '18px sans-serif';
    c.fillText('Soft edges. Open possibilities.', 81, 530);
    // A graphic citrus still life supplies local detail for lens magnification.
    c.save();
    c.translate(290, 820);
    c.rotate(-0.24);
    c.fillStyle = '#799365';
    c.beginPath();
    c.ellipse(90, -70, 92, 193, 0.4, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#e6e5b578';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(36, 87);
    c.quadraticCurveTo(60, -91, 154, -233);
    c.stroke();
    c.restore();
    c.save();
    c.translate(471, 812);
    c.rotate(-0.24);
    const citrus = c.createRadialGradient(-45, -45, 0, 0, 0, 171);
    citrus.addColorStop(0, '#d9e69c');
    citrus.addColorStop(0.8, '#b8cf82');
    citrus.addColorStop(1, '#99b47e');
    c.fillStyle = citrus;
    c.beginPath();
    c.arc(0, 0, 173, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#e8edba';
    c.lineWidth = 13;
    c.beginPath();
    c.arc(0, 0, 154, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = '#e9edb98a';
    c.lineWidth = 5;
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5;
      c.beginPath();
      c.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
      c.lineTo(Math.cos(a) * 146, Math.sin(a) * 146);
      c.stroke();
    }
    c.fillStyle = '#e6eab8';
    c.beginPath();
    c.arc(0, 0, 15, 0, Math.PI * 2);
    c.fill();
    c.restore();
    c.fillStyle = '#385a4be6';
    c.font = '14px sans-serif';
    c.fillText('NOTHING STAYS THE SAME.', 729, 897);
    c.fillText('THAT’S THE BEAUTY OF IT.', 729, 920);
    c.font = '12px sans-serif';
    c.fillText('WATER / LIGHT / A LITTLE CURIOSITY', 74, 954);
    // Deterministic subtle print grain, generated at runtime and self-contained.
    const data = c.getImageData(0, 0, SIZE, SIZE);
    let seed = 491;
    for (let i = 0; i < data.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      const grain = (seed >>> 26) / 16 - 2;
      data.data[i] += grain;
      data.data[i + 1] += grain;
      data.data[i + 2] += grain;
    }
    c.putImageData(data, 0, 0);
  } else if (kind === 'spectrum') {
    c.fillStyle = '#a1b7d4';
    c.fillRect(0, 0, SIZE, SIZE);
    for (const [x, y, r, color] of [
      [100, 680, 730, '#f58376'],
      [850, 50, 700, '#acc9f0'],
      [830, 1050, 850, '#c0e0d3'],
      [300, 40, 630, '#e8d9af'],
    ]) {
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, color + '00');
      c.fillStyle = g;
      c.fillRect(0, 0, SIZE, SIZE);
    }
    c.strokeStyle = '#fff5';
    c.lineWidth = 1;
    for (let x = 70; x < SIZE; x += 55) {
      c.beginPath();
      c.moveTo(x, 0);
      c.bezierCurveTo(x + 160, 330, x - 150, 660, x, SIZE);
      c.stroke();
    }
    c.fillStyle = '#fff9';
    c.font = 'italic 180px Georgia, serif';
    c.fillText('In a', 87, 430);
    c.fillText('different', 87, 606);
    c.fillText('light.', 87, 779);
    c.font = '16px sans-serif';
    c.fillText('COLOUR STUDY / 002', 89, 99);
  } else {
    c.fillStyle = '#f4efe3';
    c.fillRect(0, 0, SIZE, SIZE);
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        c.fillStyle = (x + y) % 2 ? '#e7d9c3' : '#faf6ea';
        c.fillRect(x * 64, y * 64, 64, 64);
      }
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 4; x++) {
        c.fillStyle = ['#a35b43', '#263f56', '#466e51', '#7d5e92'][y];
        c.font = 'bold 105px Georgia, serif';
        c.fillText(String.fromCharCode(65 + y * 4 + x), x * 256 + 128, y * 256 + 115);
        c.font = '15px sans-serif';
        c.fillText(`↑ ${x + 1}:${y + 1}`, x * 256 + 128, y * 256 + 188);
      }
    c.textAlign = 'start';
    c.textBaseline = 'alphabetic';
  }
}

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function heart(c, x, y, s) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.beginPath();
  c.moveTo(0, 0.8);
  c.bezierCurveTo(-1.8, -0.2, -0.85, -1.3, 0, -0.5);
  c.bezierCurveTo(0.85, -1.3, 1.8, -0.2, 0, 0.8);
  c.fill();
  c.restore();
}
function star(c, x, y, radius) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? radius * 0.46 : radius,
      a = (i * Math.PI) / 5 - Math.PI / 2;
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  c.closePath();
  c.fill();
}
export function drawMask(kind, canvas, { seed = 4, density = 28, text = 'FLOW' } = {}) {
  const c = canvas.getContext('2d');
  c.fillStyle = '#000';
  c.fillRect(0, 0, SIZE, SIZE);
  c.fillStyle = '#fff';
  const ellipse = (x, y, rx, ry = rx, rot = 0) => {
    c.beginPath();
    c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    c.fill();
  };
  if (kind === 'drops') {
    const random = rng(seed);
    const anchors = [
      [251, 276, 90, 96],
      [708, 229, 91, 104],
      [610, 497, 105, 95],
      [265, 697, 70, 91],
      [807, 713, 83, 94],
      [501, 842, 48, 54],
    ];
    for (const p of anchors) ellipse(...p);
    const circles = anchors.map(([x, y, rx, ry]) => [x, y, Math.max(rx, ry)]);
    for (let i = 0; i < density - 6; i++) {
      let placed = false;
      for (let j = 0; j < 65 && !placed; j++) {
        const r = 6 + random() ** 2 * 33,
          x = 40 + random() * 944,
          y = 110 + random() * 800;
        if (circles.some(([cx, cy, cr]) => Math.hypot(cx - x, cy - y) < r + cr + 15)) continue;
        ellipse(x, y, r, r * (0.92 + random() * 0.35), random() * 0.5);
        circles.push([x, y, r]);
        placed = true;
      }
    }
  } else if (kind === 'shapes') {
    ellipse(260, 239, 122);
    heart(c, 718, 238, 133);
    star(c, 760, 724, 170);
    c.beginPath();
    c.roundRect(92, 481, 273, 260, 24);
    c.fill();
    c.beginPath();
    c.roundRect(278, 647, 158, 170, 15);
    c.fill();
    ellipse(522, 505, 70, 82);
    ellipse(522, 609, 88, 94);
    c.beginPath();
    c.roundRect(713, 382, 72, 216, 13);
    c.roundRect(641, 454, 216, 72, 13);
    c.fill();
    ellipse(253, 899, 40, 40);
    ellipse(437, 243, 20, 20);
  } else if (kind === 'text') {
    const value = text.trim() || 'FLOW';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    let size = 235;
    c.font = `900 ${size}px Arial, "PingFang SC", sans-serif`;
    if (c.measureText(value).width > 900) size *= 900 / c.measureText(value).width;
    c.font = `900 ${size}px Arial, "PingFang SC", sans-serif`;
    c.fillText(value, 512, 510);
    ellipse(240, 212, 74, 78);
    ellipse(784, 770, 98, 84);
    ellipse(440, 781, 30);
    ellipse(823, 238, 20);
    c.textAlign = 'start';
    c.textBaseline = 'alphabetic';
  }
}

export function drawImageCover(image, canvas) {
  const c = canvas.getContext('2d');
  c.fillStyle = '#fff';
  c.fillRect(0, 0, SIZE, SIZE);
  const scale = Math.max(SIZE / image.width, SIZE / image.height);
  c.drawImage(
    image,
    (SIZE - image.width * scale) / 2,
    (SIZE - image.height * scale) / 2,
    image.width * scale,
    image.height * scale,
  );
}

export function imageToMask(image, canvas, mode = 'auto') {
  const tmp = makeCanvas(),
    tc = tmp.getContext('2d', { willReadFrequently: true });
  const scale = Math.min(SIZE / image.width, SIZE / image.height);
  const w = image.width * scale,
    h = image.height * scale,
    ox = (SIZE - w) / 2,
    oy = (SIZE - h) / 2;
  tc.drawImage(image, ox, oy, w, h);
  const pixels = tc.getImageData(0, 0, SIZE, SIZE);
  let hasTransparency = false;
  for (let y = Math.ceil(oy); y < oy + h; y += 3)
    for (let x = Math.ceil(ox); x < ox + w; x += 3) {
      if (pixels.data[(y * SIZE + x) * 4 + 3] < 250) hasTransparency = true;
    }
  let resolved = mode;
  if (mode === 'auto') {
    if (hasTransparency) resolved = 'alpha';
    else {
      const px = tc.getImageData(Math.ceil(ox + 2), Math.ceil(oy + 2), 1, 1).data;
      resolved = (px[0] + px[1] + px[2]) / 3 > 127 ? 'black' : 'white';
    }
  }
  for (let i = 0; i < pixels.data.length; i += 4) {
    const alpha = pixels.data[i + 3];
    let value =
      resolved === 'alpha'
        ? alpha
        : pixels.data[i] * 0.2126 + pixels.data[i + 1] * 0.7152 + pixels.data[i + 2] * 0.0722;
    if (resolved === 'black') value = 255 - value;
    if (resolved !== 'alpha') value *= alpha / 255;
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
    pixels.data[i + 3] = 255;
  }
  canvas.getContext('2d').putImageData(pixels, 0, 0);
  return resolved;
}
