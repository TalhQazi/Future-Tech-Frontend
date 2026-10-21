import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { loadChironModel } from './chironModel.js';

/**
 * Static side-profile render of the Bugatti Chiron model (nose pointing right).
 * Plain neutral studio reflections only: no animation loop, no lights or effects.
 * Re-renders a single frame when the container is resized.
 */
export const ChironProfile = ({ height = '54px' }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.display = 'block';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new RoomEnvironment();
    const envMap = pmrem.fromScene(envScene, 0.04).texture;
    scene.environment = envMap;
    envScene.dispose();
    pmrem.dispose();

    const camera = new THREE.OrthographicCamera();
    const size = new THREE.Vector3();
    let hasModel = false;

    const render = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h || !hasModel) return;
      renderer.setSize(w, h);
      // Fit the car's length (Z) and height (Y) into the canvas with a small margin
      const aspect = w / h;
      const halfHeight = Math.max(size.y * 0.54, (size.z * 0.52) / aspect);
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };

    loadChironModel()
      .then((gltf) => {
        if (disposed) return;
        const model = gltf.scene.clone(true);
        scene.add(model);

        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        bounds.getSize(size);

        // Looking from the car's left side puts the nose (+Z) on the right
        camera.position.set(center.x - 10, center.y, center.z);
        camera.near = 0.1;
        camera.far = 30;
        camera.lookAt(center);

        hasModel = true;
        render();
      })
      .catch((err) => console.warn('Bugatti Chiron profile model failed to load.', err));

    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(mount);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      // The model's geometry and materials are cached and shared; only release this renderer
      envMap.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} aria-hidden="true" style={{ position: 'relative', width: '100%', height }} />;
};

export default ChironProfile;
