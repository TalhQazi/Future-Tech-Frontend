import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * High-Performance Interactive 3D WebGL Vehicle Canvas
 * Features:
 * - 4 distinct procedural 3D vehicle architectures
 * - 360° mouse / touch turntable orbit controls
 * - Real-time 3D lighting, volumetric headlights, neon underglow
 * - X-Ray internal powertrain & 800V battery floor diagnostics
 * - Aerodynamic wind-tunnel 3D particle streamline simulation
 * - Active 3D spinning wheels, brake calipers & suspension
 */
export const Car3DCanvas = ({
  carType = 'apex-gt', // 'apex-gt' | 'cyber-pulse' | 'titan-recon' | 'formula-spec'
  mode = 'xray', // 'xray' | 'aero' | 'track'
  isThrottling = false,
  speed = 65,
  onHotspotClick = null,
  autoRotate = true
}) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const carGroupRef = useRef(null);
  const wheelsRef = useRef([]);
  const aeroLinesRef = useRef([]);
  const laserRef = useRef(null);
  const cameraRef = useRef(null);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0.25, y: -0.6 });
  const currentRotationRef = useRef({ x: 0.25, y: -0.6 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // 1. SCENE & CAMERA
    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060914, 0.035);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 2.8, 7.5);
    cameraRef.current = camera;

    // 2. RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. LIGHTING
    const ambientLight = new THREE.AmbientLight(0x16203a, 1.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00d2ff, 3.2);
    dirLight1.position.set(5, 8, 4);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x7957ff, 2.5);
    dirLight2.position.set(-6, 4, -4);
    scene.add(dirLight2);

    // Neon underglow ground light
    const underglow = new THREE.PointLight(0x00d2ff, 4.5, 6);
    underglow.position.set(0, 0.1, 0);
    scene.add(underglow);

    // 4. HOLOGRAPHIC GROUND & TURNTABLE
    const groundGroup = new THREE.Group();

    // Concentric turntable rings
    for (let r = 1.2; r <= 3.6; r += 0.8) {
      const ringGeo = new THREE.RingGeometry(r, r + 0.02, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: r > 2.5 ? 0x7957ff : 0x00d2ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.01;
      groundGroup.add(ring);
    }

    // Grid Floor
    const grid = new THREE.GridHelper(18, 36, 0x00d2ff, 0x1b2847);
    grid.position.y = -0.02;
    grid.material.opacity = 0.28;
    grid.material.transparent = true;
    groundGroup.add(grid);

    // Shadow catcher circle
    const shadowGeo = new THREE.CircleGeometry(3.2, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020409,
      transparent: true,
      opacity: 0.85
    });
    const shadowCircle = new THREE.Mesh(shadowGeo, shadowMat);
    shadowCircle.rotation.x = -Math.PI / 2;
    shadowCircle.position.y = -0.015;
    groundGroup.add(shadowCircle);

    scene.add(groundGroup);

    // 5. LASER SCANNER PLANE (X-Ray mode)
    const laserGeo = new THREE.PlaneGeometry(3.6, 1.8);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const laserMesh = new THREE.Mesh(laserGeo, laserMat);
    laserMesh.rotation.y = Math.PI / 2;
    laserMesh.position.y = 0.7;
    laserRef.current = laserMesh;
    scene.add(laserMesh);

    // 6. BUILD PROCEDURAL 3D VEHICLE
    const carGroup = new THREE.Group();
    carGroupRef.current = carGroup;
    wheelsRef.current = [];
    build3DVehicle(carGroup, carType, mode, wheelsRef.current);
    scene.add(carGroup);

    // 7. BUILD AERO STREAMLINES
    const aeroGroup = new THREE.Group();
    build3DAeroStreamlines(aeroGroup, aeroLinesRef);
    scene.add(aeroGroup);

    // 8. INTERACTIVE MOUSE / TOUCH ORBIT CONTROLS
    const handlePointerDown = (e) => {
      isDraggingRef.current = true;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      previousMousePositionRef.current = { x: clientX, y: clientY };
    };

    const handlePointerMove = (e) => {
      if (!isDraggingRef.current) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      const deltaX = clientX - previousMousePositionRef.current.x;
      const deltaY = clientY - previousMousePositionRef.current.y;

      targetRotationRef.current.y += deltaX * 0.008;
      targetRotationRef.current.x = Math.max(-0.2, Math.min(0.8, targetRotationRef.current.x + deltaY * 0.006));

      previousMousePositionRef.current = { x: clientX, y: clientY };
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    dom.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // 9. ANIMATION LOOP
    let animationFrameId;
    let clock = new THREE.Clock();
    let laserDir = 1;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth camera orbit rotation lerp
      if (autoRotate && !isDraggingRef.current) {
        targetRotationRef.current.y += 0.0035;
      }
      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.08;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.08;

      if (carGroupRef.current) {
        carGroupRef.current.rotation.y = currentRotationRef.current.y;
        carGroupRef.current.rotation.x = currentRotationRef.current.x;

        // Slight suspension bounce while throttling
        if (isThrottling) {
          carGroupRef.current.position.y = Math.sin(elapsed * 28) * 0.012;
        } else {
          carGroupRef.current.position.y = Math.sin(elapsed * 2) * 0.005;
        }
      }

      // Rotate wheels in 3D
      const wheelSpinSpeed = isThrottling ? 24 : (speed * 0.08);
      wheelsRef.current.forEach(wheel => {
        if (wheel) wheel.rotation.x += delta * wheelSpinSpeed;
      });

      // Animate laser scanner sweep in X-Ray mode
      if (laserRef.current) {
        laserRef.current.visible = (mode === 'xray');
        if (mode === 'xray') {
          laserRef.current.position.z += laserDir * delta * 2.2;
          if (laserRef.current.position.z > 2.0) laserDir = -1;
          if (laserRef.current.position.z < -2.0) laserDir = 1;
        }
      }

      // Animate 3D aero streamlines in Aero mode
      aeroGroup.visible = (mode === 'aero');
      if (mode === 'aero' && aeroLinesRef.current) {
        aeroLinesRef.current.forEach((item, idx) => {
          if (item) {
            item.position.z += delta * (isThrottling ? 8.5 : 4.0);
            if (item.position.z > 3.0) item.position.z = -3.0;
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. RESIZE HANDLER
    const handleResize = () => {
      if (!mount || !renderer || !camera) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      dom.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      if (mount && renderer.domElement) {
        mount.innerHTML = '';
      }
      renderer.dispose();
    };
  }, [carType, mode]);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '460px', 
        position: 'relative', 
        cursor: 'grab',
        touchAction: 'none'
      }} 
    />
  );
};

// =========================================================================
// HELPER: BUILD 3D VEHICLE GEOMETRIES BASED ON TYPE & VIEW MODE
// =========================================================================
function build3DVehicle(group, carType, mode, wheelsList) {
  // Clear any existing children
  while (group.children.length > 0) {
    const obj = group.children[0];
    group.remove(obj);
  }

  const isXRay = (mode === 'xray');

  // Materials
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: carType === 'cyber-pulse' ? 0x0a1630 : carType === 'formula-spec' ? 0x0f172a : 0x0d1838,
    metalness: 0.88,
    roughness: 0.18,
    transparent: isXRay,
    opacity: isXRay ? 0.32 : 1.0,
    wireframe: isXRay
  });

  const neonAccentMat = new THREE.MeshBasicMaterial({
    color: 0x00d2ff,
    wireframe: isXRay
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x00d2ff,
    transparent: true,
    opacity: 0.45,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.9,
    ior: 1.5
  });

  // 1. MAIN CHASSIS / LOWER BODY
  const chassisGeo = new THREE.BoxGeometry(1.6, 0.32, 3.8);
  const chassis = new THREE.Mesh(chassisGeo, bodyMaterial);
  chassis.position.y = 0.38;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);

  // 2. CABIN GREENHOUSE
  let cabinGeo;
  if (carType === 'titan-recon') {
    cabinGeo = new THREE.BoxGeometry(1.42, 0.65, 2.2);
  } else if (carType === 'formula-spec') {
    cabinGeo = new THREE.CylinderGeometry(0.3, 0.45, 1.4, 16);
  } else {
    cabinGeo = new THREE.BoxGeometry(1.3, 0.42, 2.1);
  }
  const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
  cabin.position.set(0, carType === 'titan-recon' ? 0.82 : 0.65, -0.15);
  group.add(cabin);

  // 3. FRONT HOOD & NOSE CONE
  const noseGeo = new THREE.ConeGeometry(0.8, 1.1, 16);
  const nose = new THREE.Mesh(noseGeo, bodyMaterial);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0.38, 2.3);
  nose.scale.set(1.0, 1.0, 0.32);
  group.add(nose);

  // 4. FRONT SPLITTER & REAR DIFFUSER
  const splitterGeo = new THREE.BoxGeometry(1.7, 0.06, 0.6);
  const splitter = new THREE.Mesh(splitterGeo, neonAccentMat);
  splitter.position.set(0, 0.18, 2.1);
  group.add(splitter);

  const diffuserGeo = new THREE.BoxGeometry(1.65, 0.12, 0.5);
  const diffuser = new THREE.Mesh(diffuserGeo, neonAccentMat);
  diffuser.position.set(0, 0.22, -2.0);
  group.add(diffuser);

  // 5. REAR ACTIVE WING (Apex GT & Formula Spec)
  if (carType === 'apex-gt' || carType === 'formula-spec') {
    const wingBladeGeo = new THREE.BoxGeometry(1.8, 0.04, 0.4);
    const wing = new THREE.Mesh(wingBladeGeo, neonAccentMat);
    wing.position.set(0, 0.95, -1.9);

    const stanchionGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8);
    const stanchionL = new THREE.Mesh(stanchionGeo, neonAccentMat);
    stanchionL.position.set(-0.45, 0.72, -1.9);
    const stanchionR = new THREE.Mesh(stanchionGeo, neonAccentMat);
    stanchionR.position.set(0.45, 0.72, -1.9);

    group.add(wing);
    group.add(stanchionL);
    group.add(stanchionR);

    // Formula shark-fin dorsal stabilizer
    if (carType === 'formula-spec') {
      const finGeo = new THREE.BoxGeometry(0.04, 0.5, 1.2);
      const fin = new THREE.Mesh(finGeo, neonAccentMat);
      fin.position.set(0, 0.85, -0.9);
      group.add(fin);
    }
  }

  // 6. HEADLIGHTS & TAILLIGHTS
  // Dual LED Matrix Headlights
  const lightGeo = new THREE.BoxGeometry(0.35, 0.08, 0.1);
  const headLightMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  const headL = new THREE.Mesh(lightGeo, headLightMat);
  headL.position.set(-0.6, 0.42, 2.0);
  const headR = new THREE.Mesh(lightGeo, headLightMat);
  headR.position.set(0.6, 0.42, 2.0);
  group.add(headL);
  group.add(headR);

  // Headlight Volumetric Spotlights pointing forward in 3D
  const spotL = new THREE.SpotLight(0x00ffff, 4.0, 12, Math.PI / 6, 0.4);
  spotL.position.set(-0.6, 0.42, 2.0);
  const targetL = new THREE.Object3D();
  targetL.position.set(-0.6, 0.1, 7.0);
  group.add(targetL);
  spotL.target = targetL;
  group.add(spotL);

  const spotR = new THREE.SpotLight(0x00ffff, 4.0, 12, Math.PI / 6, 0.4);
  spotR.position.set(0.6, 0.42, 2.0);
  const targetR = new THREE.Object3D();
  targetR.position.set(0.6, 0.1, 7.0);
  group.add(targetR);
  spotR.target = targetR;
  group.add(spotR);

  // Taillight continuous laser lightbar
  const tailGeo = new THREE.BoxGeometry(1.5, 0.06, 0.08);
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2d55 });
  const tail = new THREE.Mesh(tailGeo, tailMat);
  tail.position.set(0, 0.48, -2.0);
  group.add(tail);

  // 7. X-RAY INTERNAL POWERTRAIN & BATTERY MESHES
  if (isXRay) {
    // Engine / Dual Motor Core
    const engineGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.6, 16);
    const engineMat = new THREE.MeshStandardMaterial({
      color: 0xff5d7d,
      emissive: 0xff2d55,
      emissiveIntensity: 0.65,
      metalness: 0.9,
      roughness: 0.2
    });
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.set(0, 0.38, -0.6);
    engine.rotation.z = Math.PI / 2;
    group.add(engine);

    // 800V Floorpan Battery Cell Matrix
    const batPackGeo = new THREE.BoxGeometry(1.2, 0.12, 1.8);
    const batPackMat = new THREE.MeshStandardMaterial({
      color: 0x00ffaa,
      emissive: 0x00d2ff,
      emissiveIntensity: 0.5,
      wireframe: true
    });
    const batteryPack = new THREE.Mesh(batPackGeo, batPackMat);
    batteryPack.position.set(0, 0.22, 0.3);
    group.add(batteryPack);

    // High-voltage wiring conduits
    const wireGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.4, 8);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa });
    const wireL = new THREE.Mesh(wireGeo, wireMat);
    wireL.rotation.x = Math.PI / 2;
    wireL.position.set(-0.35, 0.26, 0.3);
    const wireR = new THREE.Mesh(wireGeo, wireMat);
    wireR.rotation.x = Math.PI / 2;
    wireR.position.set(0.35, 0.26, 0.3);
    group.add(wireL);
    group.add(wireR);
  }

  // 8. 4 INDIVIDUAL 3D WHEELS & ROTORS
  const wheelPositions = [
    { x: -0.88, y: 0.32, z: 1.35, isFront: true },   // Front Left
    { x: 0.88, y: 0.32, z: 1.35, isFront: true },    // Front Right
    { x: -0.88, y: 0.35, z: -1.35, isFront: false }, // Rear Left
    { x: 0.88, y: 0.35, z: -1.35, isFront: false }   // Rear Right
  ];

  wheelPositions.forEach((pos) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(pos.x, pos.y, pos.z);

    const radius = carType === 'titan-recon' ? 0.38 : 0.32;
    const width = 0.22;

    // Rubber Tire
    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1d,
      roughness: 0.85,
      metalness: 0.1
    });
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    wheelGroup.add(tire);

    // Multi-spoke Alloy Rim
    const rimGeo = new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, width + 0.01, 16);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.95,
      roughness: 0.15
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    // Spoke cross lines
    const spokeMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff });
    for (let s = 0; s < 5; s++) {
      const angle = (s / 5) * Math.PI * 2;
      const spokeGeo = new THREE.BoxGeometry(radius * 1.35, 0.02, 0.02);
      const spoke = new THREE.Mesh(spokeGeo, spokeMat);
      spoke.rotation.x = angle;
      wheelGroup.add(spoke);
    }

    // Carbon-Ceramic Brake Rotor & Caliper
    const rotorGeo = new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, 0.04, 16);
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.3 });
    const rotor = new THREE.Mesh(rotorGeo, rotorMat);
    rotor.rotation.z = Math.PI / 2;
    wheelGroup.add(rotor);

    const caliperGeo = new THREE.BoxGeometry(0.12, 0.12, 0.08);
    const caliperMat = new THREE.MeshBasicMaterial({ color: pos.isFront ? 0x00d2ff : 0xff2d55 });
    const caliper = new THREE.Mesh(caliperGeo, caliperMat);
    caliper.position.set(pos.x > 0 ? -0.06 : 0.06, radius * 0.25, 0);
    group.add(caliper); // caliper stays upright, doesn't spin

    group.add(wheelGroup);
    wheelsList.push(wheelGroup);
  });
}

// =========================================================================
// HELPER: BUILD 3D AERO STREAMLINES IN THREE.JS
// =========================================================================
function build3DAeroStreamlines(group, linesRef) {
  const lineCount = 18;
  linesRef.current = [];

  for (let i = 0; i < lineCount; i++) {
    const xOffset = (Math.random() - 0.5) * 1.8;
    const yOffset = 0.3 + Math.random() * 0.8;
    const zStart = -2.8 + Math.random() * 5.5;

    const streamGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6);
    const streamMat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0x00d2ff : 0x7957ff,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const streamMesh = new THREE.Mesh(streamGeo, streamMat);
    streamMesh.rotation.x = Math.PI / 2;
    streamMesh.position.set(xOffset, yOffset, zStart);

    group.add(streamMesh);
    linesRef.current.push(streamMesh);
  }
}
