import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * High-Performance Interactive 3D WebGL Supercar Canvas
 * Perfectly centered, beautifully sculpted sports car geometry
 * Features:
 * - Sculpted aerodynamic car body with beveled contours and metallic showroom paint
 * - Tinted panoramic glass canopy, front air-intake grilles, and carbon splitters
 * - 4 high-detail alloy wheels with rubber tires, cross-drilled rotors & Brembo calipers
 * - Jewel LED matrix headlights casting 3D volumetric light onto the showroom floor
 * - Full-width rear OLED laser taillight bar
 * - 360° mouse / touch turntable orbit controls (perfectly centered on vehicle)
 * - 3D X-Ray internal powertrain & battery diagnostics
 * - 3D wind-tunnel aerodynamic particle streamlines
 */
export const Car3DCanvas = ({
  carType = 'apex-gt', // 'apex-gt' | 'cyber-pulse' | 'titan-recon' | 'formula-spec'
  mode = 'xray', // 'xray' | 'aero' | 'track'
  isThrottling = false,
  speed = 65,
  autoRotate = true,
  cameraPreset = 'three-quarters' // 'three-quarters' | 'side' | 'top' | 'rear'
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
  const targetRotationRef = useRef({ x: 0.18, y: -0.65 });
  const currentRotationRef = useRef({ x: 0.18, y: -0.65 });

  // Update camera preset if prop changes
  useEffect(() => {
    if (cameraPreset === 'side') {
      targetRotationRef.current = { x: 0.05, y: -Math.PI / 2 };
    } else if (cameraPreset === 'top') {
      targetRotationRef.current = { x: 0.75, y: -0.3 };
    } else if (cameraPreset === 'rear') {
      targetRotationRef.current = { x: 0.15, y: -2.7 };
    } else {
      // three-quarters default
      targetRotationRef.current = { x: 0.18, y: -0.65 };
    }
  }, [cameraPreset]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // 1. SCENE SETUP
    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060914, 0.028);
    sceneRef.current = scene;

    // 2. CAMERA - PERFECTLY CENTERED EYE-LEVEL 3D ANGLE
    // Center of car is at (0, 0.48, 0)
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 5.4);
    camera.lookAt(0, 0.48, 0);
    cameraRef.current = camera;

    // 3. RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. STUDIO SHOWROOM LIGHTING
    const ambientLight = new THREE.AmbientLight(0x1a2644, 2.2);
    scene.add(ambientLight);

    // Key Light (Cyan / White Highlight)
    const keyLight = new THREE.DirectionalLight(0xe0f7ff, 3.5);
    keyLight.position.set(4, 6, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Rim / Fill Light (Deep Violet / Blue Accent)
    const rimLight = new THREE.DirectionalLight(0x7957ff, 2.8);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // Top Overhead Soft Light
    const topLight = new THREE.DirectionalLight(0x00d2ff, 1.8);
    topLight.position.set(0, 7, 0);
    scene.add(topLight);

    // Ground Neon Underglow PointLight
    const underglow = new THREE.PointLight(0x00d2ff, 3.8, 5.5);
    underglow.position.set(0, 0.08, 0);
    scene.add(underglow);

    // 5. CYBER SHOWROOM TURNTABLE PLATFORM
    const turntableGroup = new THREE.Group();

    // Concentric Neon Turntable Rings
    [1.6, 2.4, 3.3].forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r, r + 0.02, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 1 ? 0x00d2ff : 0x7957ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.01;
      turntableGroup.add(ring);
    });

    // Holographic Circular Platform Disc
    const discGeo = new THREE.CircleGeometry(3.6, 64);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x070c18,
      metalness: 0.85,
      roughness: 0.35,
      transparent: true,
      opacity: 0.95
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = -0.015;
    disc.receiveShadow = true;
    turntableGroup.add(disc);

    // Soft Ambient Contact Shadow Under Tires
    const shadowGeo = new THREE.PlaneGeometry(2.4, 4.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x010308,
      transparent: true,
      opacity: 0.8
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.01;
    turntableGroup.add(shadowMesh);

    scene.add(turntableGroup);

    // 6. X-RAY SCANNER LASER PLANE
    const laserGeo = new THREE.PlaneGeometry(3.6, 1.6);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const laserMesh = new THREE.Mesh(laserGeo, laserMat);
    laserMesh.rotation.y = Math.PI / 2;
    laserMesh.position.y = 0.55;
    laserRef.current = laserMesh;
    scene.add(laserMesh);

    // 7. BUILD SCULPTED 3D SUPERCAR
    const carGroup = new THREE.Group();
    // Position car right at the turntable origin
    carGroup.position.set(0, 0, 0);
    carGroupRef.current = carGroup;
    wheelsRef.current = [];
    buildSculptedSupercar(carGroup, carType, mode, wheelsRef.current);
    scene.add(carGroup);

    // 8. 3D AERO STREAMLINES
    const aeroGroup = new THREE.Group();
    build3DAeroStreamlines(aeroGroup, aeroLinesRef);
    scene.add(aeroGroup);

    // 9. INTERACTIVE MOUSE / TOUCH ORBIT CONTROLS
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

      targetRotationRef.current.y += deltaX * 0.0075;
      targetRotationRef.current.x = Math.max(-0.15, Math.min(0.65, targetRotationRef.current.x + deltaY * 0.005));

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

    // 10. ANIMATION LOOP
    let animationFrameId;
    const clock = new THREE.Clock();
    let laserDir = 1;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth camera orbit rotation lerp
      if (autoRotate && !isDraggingRef.current) {
        targetRotationRef.current.y += 0.004;
      }
      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.08;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.08;

      if (carGroupRef.current) {
        carGroupRef.current.rotation.y = currentRotationRef.current.y;
        carGroupRef.current.rotation.x = currentRotationRef.current.x;

        // Subtle realistic engine idle vibration / launch shudder
        if (isThrottling) {
          carGroupRef.current.position.y = Math.sin(elapsed * 32) * 0.01;
        } else {
          carGroupRef.current.position.y = Math.sin(elapsed * 2.5) * 0.003;
        }
      }

      // Rotate 4 wheels in 3D
      const spinSpeed = isThrottling ? 26 : (speed * 0.09);
      wheelsRef.current.forEach(wheel => {
        if (wheel) wheel.rotation.x += delta * spinSpeed;
      });

      // Animate laser scanner sweep in X-Ray mode
      if (laserRef.current) {
        laserRef.current.visible = (mode === 'xray');
        if (mode === 'xray') {
          laserRef.current.position.z += laserDir * delta * 2.2;
          if (laserRef.current.position.z > 1.9) laserDir = -1;
          if (laserRef.current.position.z < -1.9) laserDir = 1;
        }
      }

      // Animate 3D aero streamlines in Aero mode
      aeroGroup.visible = (mode === 'aero');
      if (mode === 'aero' && aeroLinesRef.current) {
        aeroLinesRef.current.forEach((item) => {
          if (item) {
            item.position.z += delta * (isThrottling ? 8.5 : 4.2);
            if (item.position.z > 2.8) item.position.z = -2.8;
          }
        });
      }

      // Keep camera aimed precisely at center of car
      camera.lookAt(0, 0.48, 0);
      renderer.render(scene, camera);
    };

    animate();

    // 11. RESIZE HANDLER
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
        height: '520px', 
        position: 'relative', 
        cursor: 'grab',
        touchAction: 'none'
      }} 
    />
  );
};

// =========================================================================
// HELPER: BUILD SCULPTED 3D SUPERCAR GEOMETRY
// =========================================================================
function buildSculptedSupercar(group, carType, mode, wheelsList) {
  while (group.children.length > 0) {
    const obj = group.children[0];
    group.remove(obj);
  }

  const isXRay = (mode === 'xray');

  // Premium Automotive Paint Shaders
  let bodyColorHex = 0x0a1e3f; // Deep Sapphire Metallic
  if (carType === 'cyber-pulse') bodyColorHex = 0x111c30; // Cyber Slate
  if (carType === 'titan-recon') bodyColorHex = 0x18202c; // Tactical Carbon
  if (carType === 'formula-spec') bodyColorHex = 0x081120; // Obsidian Formula

  const paintMaterial = new THREE.MeshStandardMaterial({
    color: bodyColorHex,
    metalness: 0.92,
    roughness: 0.16,
    transparent: isXRay,
    opacity: isXRay ? 0.38 : 1.0,
    wireframe: isXRay
  });

  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x080a12,
    metalness: 0.8,
    roughness: 0.4
  });

  const neonCyanMat = new THREE.MeshBasicMaterial({
    color: 0x00d2ff,
    wireframe: isXRay
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x00e1ff,
    transparent: true,
    opacity: isXRay ? 0.25 : 0.65,
    metalness: 0.2,
    roughness: 0.05,
    transmission: 0.85,
    ior: 1.52
  });

  // 1. SCULPTED AERODYNAMIC CAR BODY USING EXTRUDED PROFILE SHAPE
  // Length: Z from -1.95 to +2.05 (4.0m)
  // Height: Y from 0.15 to 0.95 (0.8m)
  const profileShape = new THREE.Shape();
  profileShape.moveTo(-2.0, 0.18); // rear diffuser bottom
  profileShape.lineTo(-1.95, 0.62); // rear bumper slope
  profileShape.lineTo(-1.85, 0.70); // rear ducktail spoiler lip
  profileShape.quadraticCurveTo(-1.3, 0.74, -0.7, 0.92); // fastback rear window slope to roof
  profileShape.quadraticCurveTo(-0.15, 0.96, 0.35, 0.88); // aerodynamic roof apex
  profileShape.quadraticCurveTo(0.85, 0.72, 1.35, 0.48); // raked windshield down to hood
  profileShape.quadraticCurveTo(1.75, 0.42, 2.05, 0.28); // sculpted low nose cone
  profileShape.lineTo(2.08, 0.16); // front splitter lip
  profileShape.lineTo(-2.0, 0.16); // flat underbody aerodynamic undertray

  const extrudeSettings = {
    steps: 1,
    depth: 1.5, // Car width 1.5m
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.12,
    bevelOffset: 0,
    bevelSegments: 4
  };

  const bodyGeo = new THREE.ExtrudeGeometry(profileShape, extrudeSettings);
  // Center extrusion along X-axis
  bodyGeo.translate(0, 0, -0.75);
  // Rotate so profile is aligned along Z-axis (length of car)
  bodyGeo.rotateY(Math.PI / 2);

  const bodyMesh = new THREE.Mesh(bodyGeo, paintMaterial);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. SCULPTED GLASS CANOPY (WINDSHIELD & CABIN ROOF)
  const canopyShape = new THREE.Shape();
  canopyShape.moveTo(-0.6, 0.70);
  canopyShape.quadraticCurveTo(-0.1, 0.94, 0.35, 0.88);
  canopyShape.quadraticCurveTo(0.8, 0.72, 1.25, 0.48);
  canopyShape.lineTo(1.15, 0.46);
  canopyShape.lineTo(-0.55, 0.66);

  const canopyGeo = new THREE.ExtrudeGeometry(canopyShape, {
    steps: 1,
    depth: 1.15,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 3
  });
  canopyGeo.translate(0, 0, -0.575);
  canopyGeo.rotateY(Math.PI / 2);
  const canopyMesh = new THREE.Mesh(canopyGeo, glassMaterial);
  group.add(canopyMesh);

  // 3. FRONT CARBON SPLITTER & LOWER BUMPER INTAKES
  const splitterGeo = new THREE.BoxGeometry(1.76, 0.06, 0.7);
  const splitter = new THREE.Mesh(splitterGeo, carbonMaterial);
  splitter.position.set(0, 0.18, 1.85);
  group.add(splitter);

  // Front Winglets
  const wingletL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.3), neonCyanMat);
  wingletL.position.set(-0.88, 0.24, 1.9);
  const wingletR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.3), neonCyanMat);
  wingletR.position.set(0.88, 0.24, 1.9);
  group.add(wingletL);
  group.add(wingletR);

  // 4. FRONT LED MATRIX HEADLIGHTS
  const headGeo = new THREE.BoxGeometry(0.32, 0.07, 0.15);
  const headMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  const headL = new THREE.Mesh(headGeo, headMat);
  headL.position.set(-0.62, 0.44, 1.92);
  headL.rotation.y = 0.2;
  const headR = new THREE.Mesh(headGeo, headMat);
  headR.position.set(0.62, 0.44, 1.92);
  headR.rotation.y = -0.2;
  group.add(headL);
  group.add(headR);

  // Volumetric Headlight 3D Beams casting forward onto ground
  const spotL = new THREE.SpotLight(0x00e5ff, 4.2, 10, Math.PI / 7, 0.4);
  spotL.position.set(-0.62, 0.44, 1.92);
  const targetL = new THREE.Object3D();
  targetL.position.set(-0.62, 0.1, 7.0);
  group.add(targetL);
  spotL.target = targetL;
  group.add(spotL);

  const spotR = new THREE.SpotLight(0x00e5ff, 4.2, 10, Math.PI / 7, 0.4);
  spotR.position.set(0.62, 0.44, 1.92);
  const targetR = new THREE.Object3D();
  targetR.position.set(0.62, 0.1, 7.0);
  group.add(targetR);
  spotR.target = targetR;
  group.add(spotR);

  // 5. REAR FULL-WIDTH OLED LASER TAILLIGHT BAR
  const tailGeo = new THREE.BoxGeometry(1.62, 0.05, 0.08);
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2d55 });
  const tail = new THREE.Mesh(tailGeo, tailMat);
  tail.position.set(0, 0.62, -1.98);
  group.add(tail);

  // Rear Diffuser with vertical fins
  const diffuserGeo = new THREE.BoxGeometry(1.68, 0.12, 0.5);
  const diffuser = new THREE.Mesh(diffuserGeo, carbonMaterial);
  diffuser.position.set(0, 0.22, -1.9);
  group.add(diffuser);

  // Dual Quad Exhaust Tips with Blue Heat Burn
  const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x223355, metalness: 0.95, roughness: 0.1 });
  [-0.45, -0.35, 0.35, 0.45].forEach(xPos => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 16), exhaustMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(xPos, 0.24, -2.02);
    group.add(pipe);

    // Inner glowing combustion core
    const flameCore = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), new THREE.MeshBasicMaterial({ color: 0x00d2ff }));
    flameCore.rotation.x = Math.PI / 2;
    flameCore.position.set(xPos, 0.24, -2.04);
    group.add(flameCore);
  });

  // 6. REAR ACTIVE GT WING (Apex GT & Formula Spec)
  if (carType === 'apex-gt' || carType === 'formula-spec') {
    const wingGeo = new THREE.BoxGeometry(1.85, 0.04, 0.38);
    const wing = new THREE.Mesh(wingGeo, carbonMaterial);
    wing.position.set(0, 0.98, -1.82);

    const stanchionL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), carbonMaterial);
    stanchionL.position.set(-0.48, 0.82, -1.82);
    const stanchionR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), carbonMaterial);
    stanchionR.position.set(0.48, 0.82, -1.82);

    // Endplates
    const endL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.42), neonCyanMat);
    endL.position.set(-0.93, 0.98, -1.82);
    const endR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.42), neonCyanMat);
    endR.position.set(0.93, 0.98, -1.82);

    group.add(wing);
    group.add(stanchionL);
    group.add(stanchionR);
    group.add(endL);
    group.add(endR);

    // Shark fin stabilizer for formula spec
    if (carType === 'formula-spec') {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.52, 1.4), neonCyanMat);
      fin.position.set(0, 0.88, -0.9);
      group.add(fin);
    }
  }

  // 7. ROOFTOP RACK PODS (Titan Recon)
  if (carType === 'titan-recon') {
    const rackGeo = new THREE.BoxGeometry(1.3, 0.06, 0.8);
    const rack = new THREE.Mesh(rackGeo, carbonMaterial);
    rack.position.set(0, 1.05, 0.1);
    group.add(rack);

    const podLight = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: 0xffe600 }));
    podLight.position.set(0, 1.1, 0.45);
    group.add(podLight);
  }

  // 8. X-RAY INTERNAL POWERTRAIN & 800V BATTERY SCHEMATICS
  if (isXRay) {
    // Twin-Turbo V8 Engine / Inverter Core
    const engineCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.38, 0.72),
      new THREE.MeshStandardMaterial({
        color: 0xff3b5c,
        emissive: 0xff2d55,
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.2
      })
    );
    engineCore.position.set(0, 0.42, -0.6);
    group.add(engineCore);

    // Glowing Twin Turbocharger Impellers
    [-0.32, 0.32].forEach(tx => {
      const turbo = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.04, 12, 24),
        new THREE.MeshBasicMaterial({ color: 0x00d2ff })
      );
      turbo.rotation.y = Math.PI / 2;
      turbo.position.set(tx, 0.46, -0.32);
      group.add(turbo);
    });

    // 800V Floorpan Battery Cell Matrix
    const batteryFloor = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.1, 1.9),
      new THREE.MeshStandardMaterial({
        color: 0x00ffaa,
        emissive: 0x00ffaa,
        emissiveIntensity: 0.45,
        wireframe: true
      })
    );
    batteryFloor.position.set(0, 0.22, 0.35);
    group.add(batteryFloor);

    // High Voltage Conduits
    [-0.4, 0.4].forEach(wx => {
      const conduit = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 2.6, 8),
        new THREE.MeshBasicMaterial({ color: 0x00d2ff })
      );
      conduit.rotation.x = Math.PI / 2;
      conduit.position.set(wx, 0.28, 0.35);
      group.add(conduit);
    });
  }

  // 9. 4 HIGH-DETAIL PERFORMANCE ALLOY WHEELS & ROTORS
  const wheelRadius = carType === 'titan-recon' ? 0.38 : 0.34;
  const wheelWidth = 0.24;

  const wheelPositions = [
    { x: -0.84, y: 0.34, z: 1.25, isFront: true },   // Front Left
    { x: 0.84, y: 0.34, z: 1.25, isFront: true },    // Front Right
    { x: -0.84, y: 0.36, z: -1.25, isFront: false }, // Rear Left
    { x: 0.84, y: 0.36, z: -1.25, isFront: false }   // Rear Right
  ];

  wheelPositions.forEach((pos) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(pos.x, pos.y, pos.z);

    // Performance Low-Profile Rubber Tire
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x0d121c,
      roughness: 0.9,
      metalness: 0.1
    });
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    wheelGroup.add(tire);

    // 10-Spoke Alloy Rim
    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, wheelWidth + 0.015, 16);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x24324d,
      metalness: 0.96,
      roughness: 0.12
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);

    // Individual Turbine Spokes
    const spokeMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff });
    for (let s = 0; s < 5; s++) {
      const angle = (s / 5) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(wheelRadius * 1.35, 0.02, 0.02), spokeMat);
      spoke.rotation.x = angle;
      wheelGroup.add(spoke);
    }

    // Perforated Carbon-Ceramic Brake Rotor
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0x556677, metalness: 0.92, roughness: 0.25 });
    const rotor = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius * 0.62, wheelRadius * 0.62, 0.04, 20), rotorMat);
    rotor.rotation.z = Math.PI / 2;
    wheelGroup.add(rotor);

    // 6-Piston Brembo Caliper (Stays upright, does not spin with wheel)
    const caliperMat = new THREE.MeshBasicMaterial({ color: pos.isFront ? 0xff2d55 : 0x00d2ff });
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.09), caliperMat);
    caliper.position.set(pos.x > 0 ? pos.x - 0.06 : pos.x + 0.06, pos.y + wheelRadius * 0.28, pos.z);
    group.add(caliper);

    group.add(wheelGroup);
    wheelsList.push(wheelGroup);
  });
}

// =========================================================================
// HELPER: BUILD 3D AERO STREAMLINES IN THREE.JS
// =========================================================================
function build3DAeroStreamlines(group, linesRef) {
  const lineCount = 20;
  linesRef.current = [];

  for (let i = 0; i < lineCount; i++) {
    const xOffset = (Math.random() - 0.5) * 1.8;
    const yOffset = 0.35 + Math.random() * 0.75;
    const zStart = -2.8 + Math.random() * 5.6;

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
    linesRef.current.push(streamMesh);
  }
}
