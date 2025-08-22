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

    // --- Atom Model ---
    interface Disposable {
      dispose(): void;
    }
    const disposables: Disposable[] = []; // To track objects for cleanup

    const atom = new THREE.Group();

    // Nucleus
    const nucleusGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    disposables.push(nucleusGeometry);
    const nucleusMaterial = new THREE.MeshStandardMaterial({
      color: 0x4f46e5, // indigo-600
      roughness: 0.4,
      metalness: 0.1,
    });
    disposables.push(nucleusMaterial);
    const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    atom.add(nucleus);

    // Electrons and Orbits
    const electrons: THREE.Mesh[] = [];
    const orbitData = [
      { color: 0x06b6d4, radius: 2, speed: 1.2 }, // cyan-500
      { color: 0xd946ef, radius: 2.5, speed: -0.9 }, // fuchsia-500
      { color: 0xeab308, radius: 3, speed: 0.7 }, // yellow-500
    ];

    orbitData.forEach(data => {
      const orbitGroup = new THREE.Group();

      // Orbit path
      const orbitGeometry = new THREE.TorusGeometry(data.radius, 0.02, 16, 100);
      disposables.push(orbitGeometry);
      const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
      });
      disposables.push(orbitMaterial);
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbitGroup.add(orbit);
      
      // Electron
      const electronGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      disposables.push(electronGeometry);
      const electronMaterial = new THREE.MeshStandardMaterial({
        color: data.color,
        roughness: 0.2,
        metalness: 0.3,
      });
      disposables.push(electronMaterial);
      const electron = new THREE.Mesh(electronGeometry, electronMaterial);
      orbitGroup.add(electron);
      electrons.push(electron);

      // Tilt the orbit
      orbitGroup.rotation.x = Math.random() * Math.PI;
      orbitGroup.rotation.y = Math.random() * Math.PI;
      
      atom.add(orbitGroup);
    });

    scene.add(atom);

    // --- Animation ---
    const clock = new THREE.Clock();
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Animate electrons
      electrons.forEach((electron, index) => {
        const data = orbitData[index];
        electron.position.x = data.radius * Math.cos(elapsedTime * data.speed);
        electron.position.y = data.radius * Math.sin(elapsedTime * data.speed);
      });

      // Rotate the whole atom
      atom.rotation.y += 0.002;
      atom.rotation.x += 0.001;

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
      disposables.forEach(item => item.dispose());
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
