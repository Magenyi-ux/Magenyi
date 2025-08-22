import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const IdleScreen: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // --- Basic Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 5, 5).normalize();
    scene.add(directionalLight);

    // --- Donut Model ---
    const geometry = new THREE.TorusGeometry(1.5, 0.6, 32, 100);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff69b4, // Pink frosting
      roughness: 0.5,
      metalness: 0.2,
    });
    const donut = new THREE.Mesh(geometry, material);
    scene.add(donut);

    // --- Animation ---
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      donut.rotation.x += 0.005;
      donut.rotation.y += 0.005;

      renderer.render(scene, camera);
    };

    // --- Event Listeners & Cleanup ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      // Dispose Three.js objects
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 z-[9998] flex items-center justify-center animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Idle screen"
    >
      <div ref={mountRef} />
    </div>
  );
};

export default IdleScreen;
