import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import './car-animations.css';

/**
 * Real-Time 3D WebGL Bugatti Chiron Showroom
 * Features:
 * - Detailed Bugatti Chiron glTF model (Draco-compressed) with dual-tone paint
 * - Live livery repaint of the paint_primary / paint_secondary materials
 * - Iridescent pearl clearcoat that shifts hue along the body curves
 * - Neon studio: colored softbox reflections, orbiting RGB rim lights, underglow & bloom
 * - Spectrum livery that cycles the paint through the rainbow
 * - X-Ray (wireframe shell with solid W16 core), Aero streamlines, spinning wheels
 * - Orbit camera turntable with presets, drag to rotate and auto-rotate
 * - Falls back to the procedural Chiron if the model can't be loaded
 */

const ASSET_BASE = import.meta.env.BASE_URL;
const CHIRON_MODEL_URL = `${ASSET_BASE}models/chiron.glb`;
const DRACO_DECODER_PATH = `${ASSET_BASE}draco/`; // three's glTF Draco decoder, served from public/

// Neon palette cycled by the floor rings and orbiting rim lights
const NEON_PALETTE = ['#00e5ff', '#ff2bd6', '#7c4dff', '#ff9100'].map(c => new THREE.Color(c));

// Materials that stay solid in X-Ray mode so the mechanical core shows through the shell
const XRAY_CORE_MATERIAL = /engine|caliper|brake|strut|cable|emit|hub/;

const CAMERA_TARGET = new THREE.Vector3(0, 0.5, 0);
const BASE_ELEVATION = 0.17;
const BASE_DISTANCE = 6.6;
const CAR_FRAMING_HALF_WIDTH = 2.5; // half car length plus margin, used to fit narrow viewports

// Decoded once and shared by every mount (geometry is reused, materials are cloned per mount)
let chironModelPromise = null;
function loadChironModel() {
  if (!chironModelPromise) {
    const dracoLoader = new DRACOLoader().setDecoderPath(DRACO_DECODER_PATH);
    const loader = new GLTFLoader().setDRACOLoader(dracoLoader);
    chironModelPromise = loader.loadAsync(CHIRON_MODEL_URL).finally(() => dracoLoader.dispose());
    chironModelPromise.catch(() => { chironModelPromise = null; });
  }
  return chironModelPromise;
}

export const Car3DCanvas = ({
  carType = 'chiron',
  primaryColor = '#00a8ff', // French Racing Blue
  secondaryColor = '#081736', // Atlantic Deep Carbon
  spectrum = false, // cycle the primary paint through the rainbow
  mode = 'showroom', // 'showroom' | 'xray' | 'aero' | 'track'
  isThrottling = false,
  speed = 65,
  autoRotate = true,
  cameraPreset = 'three-quarters' // 'three-quarters' | 'side' | 'top' | 'rear'
}) => {
  const mountRef = useRef(null);
  const liveRef = useRef({});
  const carGroupRef = useRef(null);
  const primaryMatsRef = useRef([]);
  const secondaryMatsRef = useRef([]);
  const paintMatsRef = useRef(new Set());
  const targetRotationRef = useRef({ x: 0.16, y: -0.72 });
  const currentRotationRef = useRef({ x: 0.16, y: -0.72 });
  const [modelStatus, setModelStatus] = useState('loading'); // 'loading' | 'ready' | 'fallback'

  // Latest props for the render loop, which is created once per mount
  useEffect(() => {
    liveRef.current = { primaryColor, secondaryColor, spectrum, mode, isThrottling, speed, autoRotate };
  });

  // Camera presets
  useEffect(() => {
    if (cameraPreset === 'side') {
      targetRotationRef.current = { x: 0.04, y: -Math.PI / 2 };
    } else if (cameraPreset === 'top') {
      targetRotationRef.current = { x: 0.78, y: -0.35 };
    } else if (cameraPreset === 'rear') {
      targetRotationRef.current = { x: 0.15, y: -2.65 };
    } else {
      // three-quarters default
      targetRotationRef.current = { x: 0.16, y: -0.72 };
    }
  }, [cameraPreset]);

  // Real-time paint livery color updates
  useEffect(() => {
    primaryMatsRef.current.forEach(mat => mat.color.set(primaryColor));
    secondaryMatsRef.current.forEach(mat => mat.color.set(secondaryColor));
  }, [primaryColor, secondaryColor, spectrum, modelStatus]);

  // X-Ray shell toggle
  useEffect(() => {
    applyXRay(carGroupRef.current, mode === 'xray', paintMatsRef.current);
  }, [mode, modelStatus]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;

    // 1. SCENE WITH NEON BACKDROP
    const width = mount.clientWidth || 840;
    const height = mount.clientHeight || 520;

    const scene = new THREE.Scene();
    const backdropTexture = createBackdropTexture();
    scene.background = backdropTexture;

    // 2. ORBIT CAMERA - PRESETS DRIVE AZIMUTH / ELEVATION AROUND THE CHIRON
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    let cameraDistance = BASE_DISTANCE;
    const fitCamera = (w, h) => {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      cameraDistance = Math.max(BASE_DISTANCE, CAR_FRAMING_HALF_WIDTH / (tanHalfFov * camera.aspect));
    };
    fitCamera(width, height);

    // 3. RENDERER - NEUTRAL TONE MAPPING KEEPS LIVERY COLORS SATURATED
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.display = 'block';
    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    // 4. COLORFUL STUDIO REFLECTIONS (neon softboxes baked into the environment map)
    const envMap = createNeonEnvironment(renderer);
    scene.environment = envMap;

    // 5. BLOOM POST-PROCESSING (multisampled so edges stay anti-aliased)
    const pixelRatio = renderer.getPixelRatio();
    const composer = new EffectComposer(
      renderer,
      new THREE.WebGLRenderTarget(width * pixelRatio, height * pixelRatio, { type: THREE.HalfFloatType, samples: 4 })
    );
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.5, 0.45, 0.9);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
    composer.setSize(width, height);

    // 6. LIGHTING - SOFT KEY + ORBITING NEON RIM LIGHTS
    scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x0b1020, 0.6));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(4, 7, 5);
    scene.add(keyLight);

    const neonLights = [0, 1, 2].map(() => {
      const light = new THREE.PointLight(0xffffff, 28, 0, 2);
      scene.add(light);
      return light;
    });

    const underglowLight = new THREE.PointLight(0x00a8ff, 6, 4, 2);
    underglowLight.position.set(0, 0.15, 0);
    scene.add(underglowLight);

    // 7. NEON TURNTABLE PLATFORM
    const floorFadeTexture = createRadialTexture([[0, '#ffffff'], [0.62, '#ffffff'], [1, '#000000']]);
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(4.6, 96),
      new THREE.MeshPhysicalMaterial({
        color: 0x060a14,
        metalness: 0.55,
        roughness: 0.3,
        clearcoat: 1.0,
        clearcoatRoughness: 0.15,
        alphaMap: floorFadeTexture,
        transparent: true
      })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = -0.002;
    scene.add(disc);

    // Livery-tinted underglow pool
    const glowTexture = createRadialTexture([[0, 'rgba(255,255,255,0.9)'], [0.4, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]);
    const underglow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 6.6),
      new THREE.MeshBasicMaterial({ map: glowTexture, color: 0x00a8ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    underglow.rotation.x = -Math.PI / 2;
    underglow.position.y = 0.002;
    underglow.renderOrder = 1;
    scene.add(underglow);

    // Soft contact shadow under the body
    const shadowTexture = createRadialTexture([[0, 'rgba(0,0,0,1)'], [0.55, 'rgba(0,0,0,0.75)'], [1, 'rgba(0,0,0,0)']]);
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.7, 5.4),
      new THREE.MeshBasicMaterial({ map: shadowTexture, color: 0x000000, transparent: true, depthWrite: false })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.004;
    contactShadow.renderOrder = 2;
    scene.add(contactShadow);

    // Color-cycling neon rings
    const rings = [2.7, 3.1, 3.5].map(radius => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius, radius + 0.03, 128),
        new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide, depthWrite: false })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.006;
      ring.renderOrder = 3;
      scene.add(ring);
      return ring;
    });

    // 8. X-RAY SCANNER LASER PLANE (sweeps nose to tail)
    const laser = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 1.5),
      new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    laser.position.y = 0.72;
    laser.visible = false;
    scene.add(laser);

    // 9. 3D AERO STREAMLINES
    const aeroGroup = new THREE.Group();
    const aeroLines = build3DAeroStreamlines(aeroGroup);
    aeroGroup.visible = false;
    scene.add(aeroGroup);

    // 10. BUGATTI CHIRON MODEL
    const carGroup = new THREE.Group();
    carGroupRef.current = carGroup;
    scene.add(carGroup);
    let model = null;
    let wheels = [];

    loadChironModel()
      .then((gltf) => {
        if (disposed) return;
        model = gltf.scene.clone(true);

        // Own copies of the materials so livery / X-Ray edits stay local to this mount
        const materialClones = new Map();
        model.traverse(obj => {
          if (!obj.isMesh) return;
          if (!materialClones.has(obj.material)) materialClones.set(obj.material, obj.material.clone());
          obj.material = materialClones.get(obj.material);
        });

        const primaryMats = [];
        const secondaryMats = [];
        const paintMats = new Set();
        materialClones.forEach(mat => {
          const isPaint = mat.name === 'paint_primary' || mat.name === 'paint_secondary';
          if (isPaint && mat.isMeshPhysicalMaterial) {
            // Pearlescent thin-film layer: the paint picks up shifting color at glancing angles
            mat.iridescence = 0.45;
            mat.iridescenceIOR = 1.45;
            mat.iridescenceThicknessRange = [180, 480];
          }
          if (isPaint) paintMats.add(mat);
          if (mat.name === 'paint_primary' || mat.name === 'rim_accent' || mat.name === 'caliper') primaryMats.push(mat);
          if (mat.name === 'paint_secondary') secondaryMats.push(mat);
        });
        primaryMatsRef.current = primaryMats;
        secondaryMatsRef.current = secondaryMats;
        paintMatsRef.current = paintMats;

        wheels = ['wheel_FL', 'wheel_FR', 'wheel_RL', 'wheel_RR']
          .map(name => model.getObjectByName(name))
          .filter(Boolean);

        carGroup.add(model);
        setModelStatus('ready');
      })
      .catch((err) => {
        if (disposed) return;
        console.warn('Bugatti Chiron model failed to load, using the procedural fallback.', err);
        const { primaryColor: primary, secondaryColor: secondary } = liveRef.current;
        primaryMatsRef.current = [];
        secondaryMatsRef.current = [];
        wheels = [];
        buildBugattiChiron(carGroup, primary, secondary, 'showroom', wheels, primaryMatsRef.current, secondaryMatsRef.current);
        paintMatsRef.current = new Set([...primaryMatsRef.current, ...secondaryMatsRef.current]);
        setModelStatus('fallback');
      });

    // 11. INTERACTIVE POINTER ORBIT CONTROLS (mouse, touch & pen)
    const dom = renderer.domElement;
    let isDragging = false;
    let lastPointer = { x: 0, y: 0 };

    const handlePointerDown = (e) => {
      isDragging = true;
      lastPointer = { x: e.clientX, y: e.clientY };
      dom.setPointerCapture(e.pointerId);
      dom.style.cursor = 'grabbing';
    };

    const handlePointerMove = (e) => {
      if (!isDragging) return;
      const target = targetRotationRef.current;
      target.y += (e.clientX - lastPointer.x) * 0.0075;
      target.x = Math.max(-0.15, Math.min(0.65, target.x + (e.clientY - lastPointer.y) * 0.005));
      lastPointer = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDragging = false;
      dom.style.cursor = 'grab';
    };

    dom.style.cursor = 'grab';
    dom.addEventListener('pointerdown', handlePointerDown);
    dom.addEventListener('pointermove', handlePointerMove);
    dom.addEventListener('pointerup', handlePointerUp);
    dom.addEventListener('pointercancel', handlePointerUp);

    // Skip rendering while the showroom is scrolled out of view
    let isVisible = true;
    const visibilityObserver = new IntersectionObserver(([entry]) => { isVisible = entry.isIntersecting; });
    visibilityObserver.observe(mount);

    // 12. ANIMATION LOOP
    const timer = new THREE.Timer();
    timer.connect(document);
    let laserDir = 1;
    const spectrumColor = new THREE.Color();

    renderer.setAnimationLoop((timestamp) => {
      timer.update(timestamp);
      if (!isVisible) return;
      const delta = Math.min(timer.getDelta(), 0.1);
      const elapsed = timer.getElapsed();
      const live = liveRef.current;

      // Smooth turntable orbit
      if (live.autoRotate && !isDragging) {
        targetRotationRef.current.y += delta * 0.24;
      }
      const target = targetRotationRef.current;
      const current = currentRotationRef.current;
      const ease = 1 - Math.exp(-5 * delta);
      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;

      const elevation = BASE_ELEVATION + current.x;
      const azimuth = -current.y;
      camera.position.set(
        CAMERA_TARGET.x + cameraDistance * Math.cos(elevation) * Math.sin(azimuth),
        CAMERA_TARGET.y + cameraDistance * Math.sin(elevation),
        CAMERA_TARGET.z + cameraDistance * Math.cos(elevation) * Math.cos(azimuth)
      );
      camera.lookAt(CAMERA_TARGET);

      // Subtle W16 idle vibration / launch shudder
      carGroup.position.y = live.isThrottling ? Math.sin(elapsed * 32) * 0.008 : Math.sin(elapsed * 2.5) * 0.002;

      // Rotate 4 wheels
      const spinSpeed = live.isThrottling ? 26 : (live.speed * 0.09);
      wheels.forEach(wheel => { wheel.rotation.x += delta * spinSpeed; });

      // Spectrum livery: sweep the primary paint through the rainbow
      if (live.spectrum) {
        spectrumColor.setHSL((elapsed * 0.06) % 1, 0.85, 0.5, THREE.SRGBColorSpace);
        primaryMatsRef.current.forEach(mat => mat.color.copy(spectrumColor));
      }

      // Underglow follows the livery color
      const liveryColor = primaryMatsRef.current[0]?.color;
      if (liveryColor) {
        underglow.material.color.lerp(liveryColor, 0.08);
        underglowLight.color.copy(underglow.material.color);
      }

      // Neon rings & orbiting rim lights cycle the palette
      const cycle = elapsed * 0.12;
      rings.forEach((ring, i) => {
        samplePalette(cycle + i / rings.length, ring.material.color).multiplyScalar(2.2);
        ring.material.opacity = 0.55 + 0.35 * Math.sin(elapsed * 2 + i * 1.3);
      });
      neonLights.forEach((light, i) => {
        const angle = elapsed * 0.35 + (i / neonLights.length) * Math.PI * 2;
        light.position.set(Math.cos(angle) * 3.4, 1.8, Math.sin(angle) * 3.4);
        samplePalette(cycle + i / neonLights.length + 0.15, light.color);
      });

      // X-Ray laser sweep
      laser.visible = (live.mode === 'xray');
      if (laser.visible) {
        laser.position.z += laserDir * delta * 2.2;
        if (laser.position.z > 2.3) laserDir = -1;
        if (laser.position.z < -2.3) laserDir = 1;
      }

      // Aero streamlines flow nose to tail
      aeroGroup.visible = (live.mode === 'aero');
      if (aeroGroup.visible) {
        aeroLines.forEach(line => {
          line.position.z -= delta * (live.isThrottling ? 8.5 : 4.2);
          if (line.position.z < -3.2) line.position.z = 3.2;
        });
      }

      composer.render();
    });

    // 13. RESIZE HANDLER
    const resizeObserver = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      fitCamera(w, h);
      renderer.setSize(w, h);
      composer.setSize(w, h);
    });
    resizeObserver.observe(mount);

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      timer.dispose();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      dom.removeEventListener('pointerdown', handlePointerDown);
      dom.removeEventListener('pointermove', handlePointerMove);
      dom.removeEventListener('pointerup', handlePointerUp);
      dom.removeEventListener('pointercancel', handlePointerUp);

      // Model geometry stays cached for the next mount; everything else is released
      const cachedMeshes = new Set();
      if (model) model.traverse(obj => { if (obj.isMesh) cachedMeshes.add(obj); });
      scene.traverse(obj => {
        if (!obj.isMesh) return;
        if (!cachedMeshes.has(obj)) obj.geometry.dispose();
        (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(mat => mat.dispose());
      });
      [backdropTexture, envMap, floorFadeTexture, glowTexture, shadowTexture].forEach(texture => texture.dispose());
      bloomPass.dispose();
      composer.dispose();
      renderer.dispose();
      mount.innerHTML = '';
      carGroupRef.current = null;
    };
  }, [carType]);

  return (
    <div style={{ width: '100%', height: '520px', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', touchAction: 'none' }} />

      {modelStatus === 'loading' && (
        <div className="car3d-loader" role="status">
          <span className="car3d-loader-ring" />
          <span>Loading Bugatti Chiron…</span>
        </div>
      )}

      {modelStatus === 'ready' && (
        <a
          className="car3d-credit"
          href="https://blendswap.com/blend/32484"
          target="_blank"
          rel="noopener noreferrer"
        >
          Chiron 3D model: Bob Kimani (Kimz Auto) · CC BY-NC
        </a>
      )}
    </div>
  );
};

// =========================================================================
// HELPER: X-RAY SHELL - WIREFRAME PAINT, GHOSTED PANELS, SOLID MECHANICAL CORE
// =========================================================================
function applyXRay(root, enabled, paintMats) {
  if (!root) return;
  root.traverse(obj => {
    if (!obj.isMesh) return;
    (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(mat => {
      if (!mat.userData.xrayBase) {
        mat.userData.xrayBase = {
          transparent: mat.transparent,
          opacity: mat.opacity,
          wireframe: mat.wireframe,
          depthWrite: mat.depthWrite
        };
      }
      const base = mat.userData.xrayBase;
      Object.assign(mat, base);
      if (enabled && paintMats.has(mat)) {
        Object.assign(mat, { wireframe: true, transparent: true, opacity: 0.4, depthWrite: false });
      } else if (enabled && !XRAY_CORE_MATERIAL.test(mat.name)) {
        Object.assign(mat, { transparent: true, opacity: Math.min(base.opacity, 0.12), depthWrite: false });
      }
      mat.needsUpdate = true;
    });
  });
}

// =========================================================================
// HELPERS: NEON STUDIO TEXTURES, ENVIRONMENT & PALETTE
// =========================================================================
function samplePalette(t, target) {
  const scaled = (((t % 1) + 1) % 1) * NEON_PALETTE.length;
  const index = Math.floor(scaled);
  return target.lerpColors(NEON_PALETTE[index], NEON_PALETTE[(index + 1) % NEON_PALETTE.length], scaled - index);
}

function createRadialTexture(stops) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createBackdropTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const base = ctx.createRadialGradient(512, 280, 20, 512, 256, 620);
  base.addColorStop(0, '#141f44');
  base.addColorStop(0.5, '#090f22');
  base.addColorStop(1, '#03050c');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 512);

  // Soft neon haze glowing behind the turntable
  [
    ['rgba(255, 43, 214, 0.22)', 170, 120],
    ['rgba(0, 229, 255, 0.2)', 860, 110],
    ['rgba(124, 77, 255, 0.16)', 512, 40]
  ].forEach(([color, x, y]) => {
    const haze = ctx.createRadialGradient(x, y, 0, x, y, 340);
    haze.addColorStop(0, color);
    haze.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, 1024, 512);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createNeonEnvironment(renderer) {
  const envScene = new RoomEnvironment();
  const panelGeo = new THREE.PlaneGeometry(1, 1);
  const panelMaterials = [
    { color: '#00e5ff', intensity: 5, size: [2.5, 9], position: [-9, 4, 2] },
    { color: '#ff2bd6', intensity: 5, size: [2.5, 9], position: [9, 4, -2] },
    { color: '#7c4dff', intensity: 4, size: [10, 2], position: [0, 7, -9] },
    { color: '#ff9100', intensity: 3, size: [6, 1.2], position: [0, 1.2, 9] }
  ].map(({ color, intensity, size, position }) => {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide });
    const panel = new THREE.Mesh(panelGeo, material);
    panel.scale.set(size[0], size[1], 1);
    panel.position.set(...position);
    panel.lookAt(0, 1, 0);
    envScene.add(panel);
    return material;
  });

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();
  panelGeo.dispose();
  panelMaterials.forEach(material => material.dispose());
  envScene.dispose();
  return envMap;
}

// =========================================================================
// HELPER: BUILD AUTHENTIC 3D BUGATTI CHIRON WITH ICONIC DUAL-TONE & C-LINE
// =========================================================================
function buildBugattiChiron(group, primaryColor, secondaryColor, mode, wheelsList, primaryMats, secondaryMats) {
  while (group.children.length > 0) {
    const obj = group.children[0];
    group.remove(obj);
  }

  const isXRay = (mode === 'xray');

  // 1. DUAL-TONE BUGATTI CLEARCOAT PAINT MATERIALS
  const primaryPaint = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(primaryColor),
    metalness: 0.35,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    transparent: isXRay,
    opacity: isXRay ? 0.35 : 1.0,
    wireframe: isXRay
  });
  primaryMats.push(primaryPaint);

  const secondaryPaint = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(secondaryColor),
    metalness: 0.5,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    transparent: isXRay,
    opacity: isXRay ? 0.35 : 1.0,
    wireframe: isXRay
  });
  secondaryMats.push(secondaryPaint);

  // Polished Aluminum / Chrome for Bugatti Horseshoe Grille & C-Line Trim
  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.98,
    roughness: 0.05
  });

  // Carbon Fiber Aero Elements (Splitter, Diffuser, Active Wing)
  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x111622,
    metalness: 0.85,
    roughness: 0.25
  });

  // Tinted Panoramic Glass with Specular Reflections
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x050d1a,
    transparent: true,
    opacity: isXRay ? 0.25 : 0.78,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.7,
    ior: 1.55
  });

  // =========================================================================
  // 2. MAIN SCULPTED CHIRON BODY (Front Section in Primary Paint)
  // Length: 4.1m (Z from -2.0 to +2.05), Height: 0.82m (Y from 0.18 to 0.96)
  // =========================================================================
  const frontShape = new THREE.Shape();
  frontShape.moveTo(0.1, 0.18); // center midpoint
  frontShape.lineTo(0.1, 0.86); // center roof line
  frontShape.quadraticCurveTo(0.7, 0.72, 1.35, 0.48); // raked windshield to hood
  frontShape.quadraticCurveTo(1.78, 0.42, 2.06, 0.28); // sculpted low nose cone
  frontShape.lineTo(2.08, 0.18); // front splitter
  frontShape.lineTo(0.1, 0.18);

  const frontGeo = new THREE.ExtrudeGeometry(frontShape, {
    steps: 1,
    depth: 1.54,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.12,
    bevelSegments: 5
  });
  frontGeo.translate(0, 0, -0.77);
  frontGeo.rotateY(Math.PI / 2);

  const frontBody = new THREE.Mesh(frontGeo, primaryPaint);
  frontBody.castShadow = true;
  frontBody.receiveShadow = true;
  group.add(frontBody);

  // REAR BODY SECTION (In Secondary Contrasting Paint)
  const rearShape = new THREE.Shape();
  rearShape.moveTo(-2.0, 0.18); // rear diffuser
  rearShape.lineTo(-1.96, 0.60); // rear bumper
  rearShape.lineTo(-1.85, 0.70); // rear ducktail
  rearShape.quadraticCurveTo(-1.3, 0.74, -0.68, 0.92); // fastback roof
  rearShape.lineTo(0.15, 0.86); // center roof line
  rearShape.lineTo(0.15, 0.18); // center bottom
  rearShape.lineTo(-2.0, 0.18);

  const rearGeo = new THREE.ExtrudeGeometry(rearShape, {
    steps: 1,
    depth: 1.54,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.12,
    bevelSegments: 5
  });
  rearGeo.translate(0, 0, -0.77);
  rearGeo.rotateY(Math.PI / 2);

  const rearBody = new THREE.Mesh(rearGeo, secondaryPaint);
  rearBody.castShadow = true;
  rearBody.receiveShadow = true;
  group.add(rearBody);

  // =========================================================================
  // 3. THE SIGNATURE BUGATTI "C-LINE" (CHROME ELLIPTICAL CURVE ON BOTH SIDES)
  // =========================================================================
  [-0.80, 0.80].forEach(cx => {
    // Elegant sweeping 3D Bugatti C-curve
    const curvePoints = [];
    for (let a = 0; a <= Math.PI * 1.55; a += 0.12) {
      const z = Math.cos(a) * 0.95 - 0.2;
      const y = Math.sin(a) * 0.42 + 0.58;
      curvePoints.push(new THREE.Vector3(cx > 0 ? cx + 0.02 : cx - 0.02, y, z));
    }
    const cCurve = new THREE.CatmullRomCurve3(curvePoints);
    const cTubeGeo = new THREE.TubeGeometry(cCurve, 32, 0.035, 12, false);
    const cTubeMesh = new THREE.Mesh(cTubeGeo, chromeMaterial);
    group.add(cTubeMesh);
  });

  // =========================================================================
  // 4. ICONIC BUGATTI HORSESHOE GRILLE & CENTER NOSE
  // =========================================================================
  // Chrome Horseshoe Frame
  const horseshoeGeo = new THREE.TorusGeometry(0.24, 0.04, 16, 24, Math.PI);
  const horseshoeFrame = new THREE.Mesh(horseshoeGeo, chromeMaterial);
  horseshoeFrame.position.set(0, 0.36, 2.06);
  horseshoeFrame.rotation.z = Math.PI;
  group.add(horseshoeFrame);

  // Lower straight sides of the horseshoe
  [-0.24, 0.24].forEach(hx => {
    const sideBar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.24, 12), chromeMaterial);
    sideBar.position.set(hx, 0.24, 2.06);
    group.add(sideBar);
  });

  // Black Honeycomb Mesh Backing
  const meshBack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.36, 0.04), carbonMaterial);
  meshBack.position.set(0, 0.28, 2.04);
  group.add(meshBack);

  // Red Bugatti Enamel Macaron Badge in Center of Grille
  const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.015, 16), new THREE.MeshBasicMaterial({ color: 0xe61c24 }));
  badge.rotation.x = Math.PI / 2;
  badge.position.set(0, 0.38, 2.08);
  group.add(badge);

  // =========================================================================
  // 5. QUAD "ICE-CUBE" LED MATRIX HEADLIGHTS (4 ON EACH SIDE)
  // =========================================================================
  [-0.64, 0.64].forEach((hx, idx) => {
    const headHousing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.09, 0.15), carbonMaterial);
    headHousing.position.set(hx, 0.44, 1.94);
    headHousing.rotation.y = idx === 0 ? 0.22 : -0.22;
    group.add(headHousing);

    // 4 Distinct Square LED Projector Cubes
    [-0.12, -0.04, 0.04, 0.12].forEach(cubeX => {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.05, 0.02),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      cube.position.set(hx + cubeX, 0.44, 2.02);
      cube.rotation.y = idx === 0 ? 0.22 : -0.22;
      group.add(cube);
    });

    // Volumetric 3D Headlight Spotlights
    const spot = new THREE.SpotLight(0x00f0ff, 4.5, 12, Math.PI / 6, 0.45);
    spot.position.set(hx, 0.44, 1.94);
    const target = new THREE.Object3D();
    target.position.set(hx, 0.05, 6.5);
    group.add(target);
    spot.target = target;
    group.add(spot);
  });

  // =========================================================================
  // 6. AERODYNAMIC ATLANTIC DORSAL CENTER SPINE
  // =========================================================================
  const spineGeo = new THREE.BoxGeometry(0.025, 0.04, 3.2);
  const spine = new THREE.Mesh(spineGeo, chromeMaterial);
  spine.position.set(0, 0.94, -0.2);
  group.add(spine);

  // =========================================================================
  // 7. EXPOSED 8.0L QUAD-TURBO W16 ENGINE BAY (Visible on Rear Deck)
  // =========================================================================
  const engineBayGlass = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 1.1), glassMaterial);
  engineBayGlass.position.set(0, 0.75, -0.7);
  group.add(engineBayGlass);

  // Twin Aluminum Air Intake Plenum Boxes
  [-0.2, 0.2].forEach(ex => {
    const plenum = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.7), chromeMaterial);
    plenum.position.set(ex, 0.72, -0.7);
    group.add(plenum);
  });

  // W16 Carbon Engine Center Cover with Bugatti 1500 HP Inscription Plate
  const w16Cover = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.65), carbonMaterial);
  w16Cover.position.set(0, 0.71, -0.7);
  group.add(w16Cover);

  // =========================================================================
  // 8. 1.6-METER CONTINUOUS OLED REAR TAILLIGHT BLADE & TITANIUM EXHAUST
  // =========================================================================
  // Unbroken Red LED Tail Blade
  const tailBlade = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.04, 0.06), new THREE.MeshBasicMaterial({ color: 0xff1744 }));
  tailBlade.position.set(0, 0.62, -1.98);
  group.add(tailBlade);

  // Carbon Fiber Rear Venturi Diffuser
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.14, 0.5), carbonMaterial);
  diffuser.position.set(0, 0.22, -1.92);
  group.add(diffuser);

  // Vertical Diffuser Fins
  [-0.65, -0.25, 0.25, 0.65].forEach(fx => {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.44), carbonMaterial);
    fin.position.set(fx, 0.22, -1.94);
    group.add(fin);
  });

  // Massive Center-Mounted Quad Titanium Exhaust Outlet
  const exhaustSurround = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.12), carbonMaterial);
  exhaustSurround.position.set(0, 0.26, -2.01);
  group.add(exhaustSurround);

  [-0.14, -0.05, 0.05, 0.14].forEach(px => {
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.14, 16), chromeMaterial);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(px, 0.26, -2.04);
    group.add(tip);

    const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), new THREE.MeshBasicMaterial({ color: 0x00d2ff }));
    glow.rotation.x = Math.PI / 2;
    glow.position.set(px, 0.26, -2.06);
    group.add(glow);
  });

  // Active Aerodynamic Rear Wing
  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.045, 0.38), carbonMaterial);
  wing.position.set(0, 0.98, -1.82);

  const stanchionL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), carbonMaterial);
  stanchionL.position.set(-0.48, 0.82, -1.82);
  const stanchionR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), carbonMaterial);
  stanchionR.position.set(0.48, 0.82, -1.82);

  group.add(wing);
  group.add(stanchionL);
  group.add(stanchionR);

  // =========================================================================
  // 9. DIAMOND-CUT BUGATTI ALLOY WHEELS, CARBON ROTORS & BUGATTI CALIPERS
  // =========================================================================
  const wheelRadius = 0.34;
  const wheelWidth = 0.24;

  const wheelPositions = [
    { x: -0.82, y: 0.34, z: 1.25, isFront: true },   // Front Left
    { x: 0.82, y: 0.34, z: 1.25, isFront: true },    // Front Right
    { x: -0.84, y: 0.36, z: -1.25, isFront: false }, // Rear Left (wider stance)
    { x: 0.84, y: 0.36, z: -1.25, isFront: false }   // Rear Right
  ];

  wheelPositions.forEach((pos) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(pos.x, pos.y, pos.z);

    // Deep Charcoal Performance Michelin Pilot Sport Cup 2 Tire
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 28);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x0f131a,
      roughness: 0.88,
      metalness: 0.1
    });
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    wheelGroup.add(tire);

    // Diamond-Cut Two-Tone Bugatti Turbine Rim
    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.74, wheelRadius * 0.74, wheelWidth + 0.015, 20);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.96,
      roughness: 0.08
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    // 10 Directional Turbine Spokes
    for (let s = 0; s < 5; s++) {
      const angle = (s / 5) * Math.PI * 2;
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(wheelRadius * 1.36, 0.025, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x00a8ff, metalness: 0.9, roughness: 0.1 })
      );
      spoke.rotation.x = angle;
      wheelGroup.add(spoke);
    }

    // Center Bugatti EB Hub Cap
    const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, wheelWidth + 0.02, 16), chromeMaterial);
    hubCap.rotation.z = Math.PI / 2;
    wheelGroup.add(hubCap);

    // Carbon-Ceramic Brake Rotor
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.95, roughness: 0.2 });
    const rotor = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius * 0.64, wheelRadius * 0.64, 0.04, 20), rotorMat);
    rotor.rotation.z = Math.PI / 2;
    wheelGroup.add(rotor);

    // French Racing Blue / Red Bugatti Monobloc Caliper (Upright)
    const caliperMat = new THREE.MeshStandardMaterial({
      color: pos.isFront ? 0x0088ff : 0xff1744,
      metalness: 0.65,
      roughness: 0.2
    });
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.09), caliperMat);
    caliper.position.set(pos.x > 0 ? pos.x - 0.06 : pos.x + 0.06, pos.y + wheelRadius * 0.28, pos.z);
    group.add(caliper);

    group.add(wheelGroup);
    wheelsList.push(wheelGroup);
  });
}

// =========================================================================
// HELPER: BUILD 3D AERO STREAMLINES IN THREE.JS
// =========================================================================
function build3DAeroStreamlines(group) {
  const lineCount = 26;
  const lines = [];

  for (let i = 0; i < lineCount; i++) {
    const xOffset = (Math.random() - 0.5) * 2.6;
    const yOffset = 0.25 + Math.random() * 1.1;
    const zStart = -3.2 + Math.random() * 6.4;

    const streamGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.95, 6);
    const streamMat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0x00d2ff : 0x7957ff,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const streamMesh = new THREE.Mesh(streamGeo, streamMat);
    streamMesh.rotation.x = Math.PI / 2;
    streamMesh.position.set(xOffset, yOffset, zStart);

    group.add(streamMesh);
    lines.push(streamMesh);
  }
  return lines;
}
