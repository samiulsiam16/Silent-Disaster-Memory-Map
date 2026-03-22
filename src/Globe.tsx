import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useTexture, PerspectiveCamera } from '@react-three/drei';
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

// UPGRADE 4 — Disaster Markers with Cones and Particles
function DisasterMarker({ disaster, onClick, isHovered, onHover }: { 
  disaster: Disaster; 
  onClick: (d: Disaster) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Group>(null);

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

  const particles = useMemo(() => {
    const count = 80; // Cap at 80
    const pts = [];
    for (let i = 0; i < count; i++) {
      pts.push({
        offset: new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          Math.random() * 0.4,
          (Math.random() - 0.5) * 0.1
        ),
        speed: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2
      });
    }
    return pts;
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (groupRef.current) {
      const scale = 1 + Math.sin(time * 3 + disaster.lat) * 0.05;
      groupRef.current.scale.set(scale, scale, scale);
    }
    if (particlesRef.current) {
      particlesRef.current.children.forEach((child, i) => {
        const p = particles[i];
        child.position.y = p.offset.y + Math.sin(time * p.speed + p.phase) * 0.05;
      });
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
        <coneGeometry args={[0.02, 0.3, 8]} />
        <meshPhongMaterial 
          color={CATEGORY_COLORS[disaster.category]} 
          emissive={CATEGORY_COLORS[disaster.category]}
          emissiveIntensity={isHovered ? 4 : 1.5}
          transparent 
          opacity={0.6}
        />
      </mesh>

      {/* Particles using Sprites */}
      <group ref={particlesRef}>
        {particles.map((p, i) => (
          <sprite key={i} position={p.offset} scale={[0.015, 0.015, 0.015]}>
            <spriteMaterial 
              color={CATEGORY_COLORS[disaster.category]}
              transparent
              opacity={0.4}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
        ))}
      </group>
    </group>
  );
}

// UPGRADE 2 — Universe with 12,000 Stars and Nebula
function Universe() {
  const starsRef = useRef<THREE.Points>(null);
  const { mouse } = useThree();

  const [starGeometry, nebulaTexture1, nebulaTexture2] = useMemo(() => {
    // 12,000 stars
    const count = 12000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 40 + Math.random() * 80;
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

    // Nebula textures using canvas
    const createNebulaTex = (color: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
      return new THREE.CanvasTexture(canvas);
    };

    return [geo, createNebulaTex('rgba(100, 50, 255, 0.15)'), createNebulaTex('rgba(50, 150, 255, 0.15)')];
  }, []);

  useFrame(() => {
    if (starsRef.current) {
      // Mouse parallax shift by 0.002
      starsRef.current.position.x = THREE.MathUtils.lerp(starsRef.current.position.x, mouse.x * 0.2, 0.05);
      starsRef.current.position.y = THREE.MathUtils.lerp(starsRef.current.position.y, mouse.y * 0.2, 0.05);
      starsRef.current.rotation.y += 0.00005;
    }
  });

  return (
    <group>
      <points ref={starsRef} geometry={starGeometry}>
        <pointsMaterial size={1.2} sizeAttenuation={false} color="#ffffff" transparent opacity={0.6} />
      </points>
      <mesh position={[20, 10, -50]} rotation={[0, 0, 0.5]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial map={nebulaTexture1} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[-30, -20, -60]} rotation={[0, 0, -0.5]}>
        <planeGeometry args={[120, 120]} />
        <meshBasicMaterial map={nebulaTexture2} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
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
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const controlsRef = useRef<any>(null);
  const { camera, gl } = useThree();

  // UPGRADE 1 — NASA Textures
  const [map, cloudsMap] = useTexture([
    'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    'https://unpkg.com/three-globe/example/img/earth-clouds.png',
  ]);

  // UPGRADE 3 — Double Click Camera Animation
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
        ).multiplyScalar(2.5);

        // CSS Blur Simulation
        const canvas = gl.domElement;
        canvas.style.transition = 'filter 0.5s ease';
        canvas.style.filter = 'blur(10px)';
        setTimeout(() => {
          canvas.style.filter = 'blur(0px)';
        }, 800);

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
      cloudsRef.current.rotation.y += 0.0004;
    }
    if (earthRef.current) {
      // Globe heartbeat pulse (UPGRADE 9)
      const time = state.clock.elapsedTime;
      if (time < 3) {
        const pulse = 1 + Math.sin(time * 12) * 0.015;
        earthRef.current.scale.set(pulse, pulse, pulse);
      } else {
        earthRef.current.scale.set(1, 1, 1);
      }
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={45} />
      
      {/* BLANK PAGE FIX: Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 3, 5]} intensity={1.5} color="#ffffff" />
      
      <Universe />
      
      <group>
        {/* UPGRADE 1 — NASA Earth */}
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
            opacity={0.15}
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
        minDistance={2.2}
        maxDistance={10}
        enableDamping={true}
        dampingFactor={0.08}
        autoRotate={!selectedDisaster && !hoveredId}
        autoRotateSpeed={0.4}
      />
    </>
  );
}
