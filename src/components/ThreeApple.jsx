import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeApple({ onHarvest }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth || 300;
    const height = mountRef.current.clientHeight || 288;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // লাইটিং
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffeedd, 2.5);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // 3D Apple বডি
    const appleGroup = new THREE.Group();
    const bodyGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    bodyGeometry.scale(1, 0.95, 0.9);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xE53935,
      roughness: 0.2,
      metalness: 0.1,
    });
    const appleBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    appleGroup.add(appleBody);

    // আপেলের ডাল (Stem)
    const stemGeometry = new THREE.CylinderGeometry(0.04, 0.06, 0.6, 12);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x4E342E });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.set(0, 1.2, 0);
    stem.rotation.z = -0.15;
    appleGroup.add(stem);

    // সবুজ পাতা (Leaf)
    const leafGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    leafGeometry.scale(0.3, 1, 1.5);
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    leaf.position.set(0.2, 1.25, 0);
    leaf.rotation.set(0.5, 0.5, -0.8);
    appleGroup.add(leaf);

    scene.add(appleGroup);

    // অ্যানিমেশন লুপ
    let animationFrameId;
    const animate = () => {
      appleGroup.rotation.y += 0.008;
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // রেস্পন্সিভ হ্যান্ডলার
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth || 300;
      const h = mountRef.current.clientHeight || 288;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      onClick={onHarvest}
      className="w-full h-72 cursor-pointer active:scale-95 transition-transform duration-100 flex items-center justify-center touch-manipulation"
    />
  );
}
