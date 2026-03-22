import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, OrbitControls, useTexture, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { Disaster, DisasterCategory } from './types';

const CATEGORY_COLORS: Record<DisasterCategory, string> = {
  flood: '#60a5fa', // blue
  famine: '#fbbf24', // amber
  epidemic: '#f87171', // red
  conflict: '#f3f4f6', // white
  environmental: '#34d399', // green
};

// IDEA 4 — Disaster Markers
function DisasterMarker({ disaster, onClick, isHovered, onHover }: { 
  disaster: Disaster; 
  onClick: (d: Disaster) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const spriteRef = useRef<THREE.Sprite>(null);

  const position = useMemo(() => {
    const radius = 2.0;
    const phi = (90 - disaster.lat) * (Math.PI / 180);
    const theta = (disaster.lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }, [disaster.lat, disaster.lng]);

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime;
      // Sine wave animation for the marker
      const scale = 1 + Math.sin(time * 3 + disaster.lat) * 0.1;
      groupRef.current.scale.set(scale, scale, scale);
    }
    if (spriteRef.current) {
      const time = state.clock.elapsedTime;
      spriteRef.current.position.y = 0.3 + Math.sin(time * 2 + disaster.lng) * 0.05;
    }
  });

  return (
    <group 
      position={position} 
      quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), position.clone().normalize())}
      ref={groupRef}
    >
      {/* Cone Geometry pointing upward */}
      <mesh 
        onClick={(e) => {
          e.stopPropagation();
          onClick(disaster);
        }}
        onPointerOver={() => onHover(disaster.id)}
        onPointerOut={() => onHover(null)}
        position={[0, 0.15, 0]}
      >
        <coneGeometry args={[0.03, 0.3, 8]} />
        <meshPhongMaterial 
          color={CATEGORY_COLORS[disaster.category]} 
          emissive={CATEGORY_COLORS[disaster.category]}
          emissiveIntensity={2}
          transparent 
          opacity={isHovered ? 0.8 : 0.4}
        />
      </mesh>

      {/* Sprite for "particles" (GPU friendly) */}
      <sprite ref={spriteRef} scale={[0.15, 0.15, 0.15]} position={[0, 0.3, 0]}>
        <spriteMaterial 
          color={CATEGORY_COLORS[disaster.category]}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  );
}

// IDEA 2 — Universe Environment
function Universe() {
  const starsRef = useRef<THREE.Points>(null);
  const nebulaRef1 = useRef<THREE.Mesh>(null);
  const nebulaRef2 = useRef<THREE.Mesh>(null);
  const { mouse } = useThree();

  const [starGeometry, nebulaTexture] = useMemo(() => {
    // 12,000 stars
    const count = 12000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 50 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = 0.3 + Math.random() * 2.2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Nebula texture using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(100, 50, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(canvas);

    return [geo, tex];
  }, []);

  useFrame(() => {
    if (starsRef.current) {
      // Mouse parallax
      starsRef.current.position.x = THREE.MathUtils.lerp(starsRef.current.position.x, mouse.x * 0.5, 0.05);
      starsRef.current.position.y = THREE.MathUtils.lerp(starsRef.current.position.y, mouse.y * 0.5, 0.05);
      starsRef.current.rotation.y += 0.0001;
    }
  });

  return (
    <group>
      <points ref={starsRef} geometry={starGeometry}>
        <pointsMaterial size={1.5} sizeAttenuation={false} color="#ffffff" transparent opacity={0.8} />
      </points>
      <mesh ref={nebulaRef1} position={[20, 10, -50]} rotation={[0, 0, 0.5]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial map={nebulaTexture} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={nebulaRef2} position={[-30, -20, -60]} rotation={[0, 0, -0.5]}>
        <planeGeometry args={[120, 120]} />
        <meshBasicMaterial map={nebulaTexture} color="#4400ff" transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function Globe({ disasters, onSelect, hoveredId, setHoveredId, selectedDisaster }: {
  disasters: Disaster[];
  onSelect: (d: Disaster) => void;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  selectedDisaster: Disaster | null;
}) {
  const globeRef = useRef<THREE.Group>(null);
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const controlsRef = useRef<any>(null);
  const { camera, gl } = useThree();

  // IDEA 1 — Hyper-Realistic Earth Textures
  const [map, cloudsMap] = useTexture([
    'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    'https://unpkg.com/three-globe/example/img/earth-clouds.png',
  ]);

  // IDEA 3 — Camera Interaction with TWEEN
  useEffect(() => {
    const handleDoubleClick = () => {
      if (selectedDisaster) {
        const radius = 2.0;
        const phi = (90 - selectedDisaster.lat) * (Math.PI / 180);
        const theta = (selectedDisaster.lng + 180) * (Math.PI / 180);
        const targetPos = new THREE.Vector3(
          -radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta)
        ).multiplyScalar(2.2);

        // CSS Blur Simulation
        const canvas = gl.domElement;
        canvas.style.transition = 'filter 0.5s ease';
        canvas.style.filter = 'blur(8px)';
        setTimeout(() => {
          canvas.style.filter = 'blur(0px)';
        }, 1000);

        new TWEEN.Tween(camera.position)
          .to({ x: targetPos.x, y: targetPos.y, z: targetPos.z }, 1500)
          .easing(TWEEN.Easing.Cubic.Out)
          .start();
        
        new TWEEN.Tween(controlsRef.current.target)
          .to({ x: 0, y: 0, z: 0 }, 1500)
          .easing(TWEEN.Easing.Cubic.Out)
          .start();
      }
    };

    window.addEventListener('dblclick', handleDoubleClick);
    return () => window.removeEventListener('dblclick', handleDoubleClick);
  }, [selectedDisaster, camera, gl]);

  useFrame((state) => {
    TWEEN.update();
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0005;
    }
    if (earthRef.current) {
      // Globe heartbeat pulse (Idea 9)
      const time = state.clock.elapsedTime;
      if (time < 3) {
        const pulse = 1 + Math.sin(time * 10) * 0.01;
        earthRef.current.scale.set(pulse, pulse, pulse);
      } else {
        earthRef.current.scale.set(1, 1, 1);
      }
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={45} />
      
      {/* IDEA 1 — Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={2} color="#ffffff" />
      
      <Universe />
      
      <group ref={globeRef}>
        {/* IDEA 1 — Hyper-Realistic Earth */}
        <mesh ref={earthRef}>
          <sphereGeometry args={[2, 64, 64]} />
          <meshPhongMaterial 
            map={map}
            shininess={5}
          />
        </mesh>

        {/* Clouds */}
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[2.03, 64, 64]} />
          <meshPhongMaterial 
            map={cloudsMap}
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        </mesh>

        {/* Atmosphere */}
        <mesh>
          <sphereGeometry args={[2.1, 64, 64]} />
          <meshBasicMaterial 
            color="#4299e1"
            transparent
            opacity={0.1}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Disaster Markers */}
        {disasters.map((d) => (
          <DisasterMarker 
            key={d.id} 
            disaster={d} 
            onClick={onSelect}
            isHovered={hoveredId === d.id}
            onHover={setHoveredId}
          />
        ))}
      </group>

      <OrbitControls 
        ref={controlsRef}
        enablePan={false}
        minDistance={2.5}
        maxDistance={12}
        enableDamping={true}
        dampingFactor={0.08}
        autoRotate={!selectedDisaster && !hoveredId}
        autoRotateSpeed={0.5}
      />
    </>
  );
}

