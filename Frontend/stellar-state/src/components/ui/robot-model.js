'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export function RobotModel({ className = '' }) {
  const mountRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let animationFrameId;

    // 1. Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    
    // Transparent background
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(
      45,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    // Back the camera up and center it directly on the object's origin for padding
    camera.position.set(0, 0, 35);

    // 2. Lighting for a clean, studio tech look
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);
    
    const backLight = new THREE.DirectionalLight(0xffffff, 0.6);
    backLight.position.set(-10, 10, -10);
    scene.add(backLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(0, -10, 10);
    scene.add(fillLight);

    // 3. Controls (mouse rotation)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0; // Clean, steady fixed rotation speed
    controls.enableZoom = false; // Disable scroll hijack 
    controls.enablePan = false; // Keep it fixed in place
    // Lock the camera strictly to a flat horizontal orbit (90 degrees standing)
    controls.minPolarAngle = Math.PI / 2; 
    controls.maxPolarAngle = Math.PI / 2;

    // 4. Load OBJ
    const loader = new OBJLoader();
    loader.load(
      '/OBJ_Robot.obj',
      (object) => {
        setIsLoading(false);
        
        // Ensure accurate scaling first
        const initialBox = new THREE.Box3().setFromObject(object);
        const initialSize = initialBox.getSize(new THREE.Vector3());
        
        // Target a max bounding dimension of 18 units to fill the space well
        const maxDim = Math.max(initialSize.x, initialSize.y, initialSize.z);
        const scale = 18 / maxDim;
        object.scale.set(scale, scale, scale);

        // Center the scaled object exactly at origin (0,0,0) so rotation is perfect
        const scaledBox = new THREE.Box3().setFromObject(object);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        
        object.position.x = -scaledCenter.x;
        object.position.y = -scaledCenter.y;
        object.position.z = -scaledCenter.z;
        
        // Apply a clean, techy metallic material to all meshes
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x99aab5, 
            metalness: 0.7, 
            roughness: 0.3,
            side: THREE.DoubleSide
        });
        
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        scene.add(object);
      },
      (xhr) => {
        // We log progress but the visual UI just shows standard loading spinner
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('An error happened loading the OBJ', error);
        setIsLoading(false);
      }
    );

    // 5. Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update(); // required if damping enabled
      renderer.render(scene, camera);
    };
    animate();

    // 6. Handle Resize cleanly
    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup phase
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      if (mountRef.current && renderer.domElement === mountRef.current.firstChild) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div className={`relative w-full h-[500px] lg:h-[700px] flex items-center justify-center ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-[#00171f]/60 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <div className="w-10 h-10 rounded-full border-4 border-t-black border-r-black border-b-transparent border-l-transparent animate-spin mb-4" />
          <span className="text-sm font-bold tracking-widest uppercase animate-pulse drop-shadow-sm">Initializing Physics...</span>
          <span className="text-xs font-mono opacity-50 mt-2 text-center max-w-[200px]">Parsing 77MB Mesh Data Matrix</span>
        </div>
      )}
      <div ref={mountRef} className="w-full h-full z-20 cursor-grab active:cursor-grabbing" />
    </div>
  );
}
