import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Authentic 3D WebGL Bugatti Chiron Hypercar Canvas
 * Features:
 * - Signature Bugatti Horseshoe Grille & front air splitters
 * - Iconic Bugatti "C-Line" side profile curve sweeping behind the doors
 * - Dual-Tone Bugatti Clearcoat Paint with real-time livery customization
 * - Quad "Ice-Cube" LED Matrix Projector Headlights (4 on each side)
 * - Center Aerodynamic Dorsal Spine along the roof and engine decklid
 * - Exposed 8.0L Quad-Turbo W16 Powertrain with aluminum plenum intakes
 * - Full-Width 1.6m Continuous Ruby-Red OLED Tail Light Blade
 * - Center-mounted titanium exhaust and rear carbon venturi diffuser
 * - Directional diamond-cut Bugatti alloy wheels with blue/red calipers
 * - Eye-level camera, perfectly centered, studio-lit with 360° orbit turntable
 */
export const Car3DCanvas = ({
  carType = 'chiron',
  primaryColor = '#00a8ff', // French Racing Blue
  secondaryColor = '#081736', // Atlantic Deep Carbon
  mode = 'showroom', // 'showroom' | 'xray' | 'aero' | 'track'
  isThrottling = false,
  speed = 65,
  autoRotate = true,
  cameraPreset = 'three-quarters' // 'three-quarters' | 'side' | 'top' | 'rear'
}) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const carGroupRef = useRef(null);
  const primaryMatsRef = useRef([]);
  const secondaryMatsRef = useRef([]);
  const wheelsRef = useRef([]);
  const aeroLinesRef = useRef([]);
  const laserRef = useRef(null);
  const cameraRef = useRef(null);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0.16, y: -0.72 });
  const currentRotationRef = useRef({ x: 0.16, y: -0.72 });

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
    const pColor = new THREE.Color(primaryColor);
    const sColor = new THREE.Color(secondaryColor);
    primaryMatsRef.current.forEach(mat => { if (mat) mat.color = pColor; });
    secondaryMatsRef.current.forEach(mat => { if (mat) mat.color = sColor; });
  }, [primaryColor, secondaryColor]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // 1. SCENE SETUP
    const width = mount.clientWidth || 840;
    const height = mount.clientHeight || 520;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060914, 0.02);
    sceneRef.current = scene;

    // 2. CAMERA - EYE-LEVEL PERSPECTIVE CENTERED ON BUGATTI CHIRON (Y = 0.46)
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 1.35, 5.2);
    camera.lookAt(0, 0.46, 0);
    cameraRef.current = camera;

    // 3. RENDERER WITH ACES FILMIC TONE MAPPING
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. STUDIO SHOWROOM LIGHTING - GUARANTEES CRISP REFLECTIONS & VIBRANCY
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x18243e, 2.6);
    scene.add(hemiLight);

    // Front-Left Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 4.0);
    keyLight.position.set(6, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Side Flank Light (Highlights Bugatti C-Line curve & doors)
    const sideLight = new THREE.DirectionalLight(0x00d2ff, 2.8);
    sideLight.position.set(-6, 4, 3);
    scene.add(sideLight);

    // Rear Rim Light (Highlights active spoiler, quad exhaust & taillight)
    const rimLight = new THREE.DirectionalLight(0xffffff, 3.0);
    rimLight.position.set(-4, 5, -5);
    scene.add(rimLight);

    // Overhead High-Intensity Spot for Bonnet & Roof Spine
    const topLight = new THREE.DirectionalLight(0xffffff, 2.2);
    topLight.position.set(0, 8, 0);
    scene.add(topLight);

    // Front Horseshoe Grille Illuminator
    const frontFill = new THREE.DirectionalLight(0xffffff, 2.0);
    frontFill.position.set(0, 2, 7);
    scene.add(frontFill);

    // Ground Neon Underglow
    const underglow = new THREE.PointLight(0x00a8ff, 4.5, 6);
    underglow.position.set(0, 0.08, 0);
    scene.add(underglow);

    // 5. CYBER SHOWROOM TURNTABLE PLATFORM
    const turntableGroup = new THREE.Group();

    // Concentric Turntable Rings
    [1.6, 2.5, 3.4].forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r, r + 0.025, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 1 ? 0x00d2ff : 0x7957ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.01;
      turntableGroup.add(ring);
    });

    // Mirror-Finish Turntable Disc
    const discGeo = new THREE.CircleGeometry(3.6, 64);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x070c18,
      metalness: 0.75,
      roughness: 0.25,
      transparent: true,
      opacity: 0.96
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
      opacity: 0.85
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

    // 7. BUILD AUTHENTIC BUGATTI CHIRON
    const carGroup = new THREE.Group();
    carGroup.position.set(0, 0, 0);
    carGroupRef.current = carGroup;
    wheelsRef.current = [];
    primaryMatsRef.current = [];
    secondaryMatsRef.current = [];

    buildBugattiChiron(
      carGroup, 
      primaryColor, 
      secondaryColor, 
      mode, 
      wheelsRef.current, 
      primaryMatsRef.current, 
      secondaryMatsRef.current
    );
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

      // Keep camera aimed precisely at center of Bugatti Chiron
      camera.lookAt(0, 0.46, 0);
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
function build3DAeroStreamlines(group, linesRef) {
  const lineCount = 22;
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
