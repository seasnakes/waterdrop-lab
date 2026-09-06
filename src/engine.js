import * as THREE from 'three';
import { vertexShader, fragmentShader } from './shaders.js';

export class WaterdropRenderer {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: false,
    });
    this.threeRevision = THREE.REVISION;
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(1400, 1400, false);
    // Shader works consistently in display-encoded RGB for direct photo compositing.
    // No automatic texture decode/tone mapping is applied by this custom shader.
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.camera = new THREE.Camera();
    this.scene = new THREE.Scene();
    this.uniforms = {
      uBackground: { value: null },
      uHeightMap: { value: null },
      uMask: { value: null },
      uHeight: { value: 0.8 },
      uDistance: { value: 0.08 },
      uIor: { value: 1.333 },
      uRoundness: { value: 0.85 },
      uSpecular: { value: 0.65 },
      uShadow: { value: 0.45 },
      uDispersion: { value: 0.2 },
      uLight: { value: new THREE.Vector2(-0.8, 0.85) },
      uCompare: { value: -1 },
      uView: { value: 0 },
      uWrap: { value: 0 },
    };
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      depthTest: false,
      depthWrite: false,
    });
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material));
    this.worker = new Worker(new URL('./height-worker.js', import.meta.url), { type: 'module' });
    this.revision = 0;
    this.pending = null;
    this.working = false;
    this.ready = false;
    this.worker.onmessage = ({ data }) => {
      this.working = false;
      if (data.id === this.revision && data.error) {
        this.onError?.(data.error);
      } else if (data.id === this.revision) {
        const floatLinear = this.renderer.extensions.has('OES_texture_float_linear');
        const pixels = floatLinear
          ? data.field
          : Uint16Array.from(data.field, THREE.DataUtils.toHalfFloat);
        const texture = new THREE.DataTexture(
          pixels,
          512,
          512,
          THREE.RGBAFormat,
          floatLinear ? THREE.FloatType : THREE.HalfFloatType,
        );
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        this.uniforms.uHeightMap.value?.dispose();
        this.uniforms.uHeightMap.value = texture;
        this.uniforms.uMask.value?.dispose();
        this.uniforms.uMask.value = this.currentMaskTexture;
        this.ready = true;
        this.lastSolve = { ms: data.ms, maxHeight: data.maxHeight };
        this.requestRender();
        this.onReady?.(this.lastSolve);
      }
      if (this.pending) {
        const next = this.pending;
        this.pending = null;
        this.dispatch(next);
      }
    };
    this.worker.onerror = (event) => this.onError?.(event.message || '无法生成高度场');
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.onError?.('图形上下文已中断，请刷新页面恢复。');
    });
  }
  setBackground(canvas) {
    this.uniforms.uBackground.value?.dispose();
    this.uniforms.uBackground.value = new THREE.CanvasTexture(canvas);
    this.uniforms.uBackground.value.generateMipmaps = true;
    this.uniforms.uBackground.value.minFilter = THREE.LinearMipmapLinearFilter;
    this.setWrap(this.uniforms.uWrap.value);
    this.requestRender();
  }
  setMask(canvas) {
    this.revision++;
    const clone = document.createElement('canvas');
    clone.width = canvas.width;
    clone.height = canvas.height;
    clone.getContext('2d', { willReadFrequently: true }).drawImage(canvas, 0, 0);
    if (this.currentMaskTexture !== this.uniforms.uMask.value) this.currentMaskTexture?.dispose();
    this.currentMaskTexture = new THREE.CanvasTexture(clone);
    this.currentMaskTexture.generateMipmaps = false;
    this.currentMaskTexture.minFilter = THREE.LinearFilter;
    const bytes = clone.getContext('2d').getImageData(0, 0, clone.width, clone.height).data;
    const mask = new Uint8Array(clone.width * clone.height);
    for (let i = 0; i < mask.length; i++) mask[i] = bytes[i * 4];
    const job = { mask, size: clone.width, id: this.revision };
    if (this.working) this.pending = job;
    else this.dispatch(job);
  }
  dispatch(job) {
    this.working = true;
    this.worker.postMessage(job, [job.mask.buffer]);
  }
  set(name, value) {
    this.uniforms[name].value = value;
    if (name === 'uWrap') this.setWrap(value);
    this.requestRender();
  }
  setWrap(value) {
    const texture = this.uniforms.uBackground.value;
    if (!texture) return;
    texture.wrapS = texture.wrapT = [
      THREE.RepeatWrapping,
      THREE.MirroredRepeatWrapping,
      THREE.ClampToEdgeWrapping,
    ][value];
    texture.needsUpdate = true;
  }
  setLight(x, y) {
    this.uniforms.uLight.value.set(x, y);
    this.requestRender();
  }
  requestRender() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.render();
    });
  }
  render() {
    if (!this.ready || !this.uniforms.uBackground.value) return;
    const start = performance.now();
    this.renderer.render(this.scene, this.camera);
    this.lastRenderMs = performance.now() - start;
    this.renderCount = (this.renderCount || 0) + 1;
  }
  async exportPNG() {
    const compare = this.uniforms.uCompare.value,
      view = this.uniforms.uView.value;
    this.uniforms.uCompare.value = -1;
    this.uniforms.uView.value = 0;
    this.renderer.setSize(2048, 2048, false);
    this.render();
    try {
      return await new Promise((resolve, reject) =>
        this.renderer.domElement.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('导出失败'))),
          'image/png',
        ),
      );
    } finally {
      this.renderer.setSize(1400, 1400, false);
      this.uniforms.uCompare.value = compare;
      this.uniforms.uView.value = view;
      this.render();
    }
  }
  dispose() {
    cancelAnimationFrame(this.frame);
    this.worker.terminate();
    for (const key of ['uBackground', 'uHeightMap', 'uMask']) this.uniforms[key].value?.dispose();
    this.scene.children[0].geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}
