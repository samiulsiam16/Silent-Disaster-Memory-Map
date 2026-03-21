import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Html, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Disaster, DisasterCategory } from './types';

const CATEGORY_COLORS: Record<DisasterCategory, string> = {
  flood: '#60a5fa', // blue
  famine: '#fbbf24', // amber
  epidemic: '#f87171', // red
  conflict: '#f3f4f6', // white
  environmental: '#34d399', // green
};

function Marker({ disaster, onClick, isHovered, onHover }: { 
  disaster: Disaster; 
  onClick: (d: Disaster) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const { camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);

  // Convert lat/lng to 3D coordinates
  const position = useMemo(() => {
    const radius = 2.05;
    const phi = (90 - disaster.lat) * (Math.PI / 180);
    const theta = (disaster.lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }, [disaster.lat, disaster.lng]);

  useFrame((state) => {
    if (meshRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={position}>
      <mesh 
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(disaster);
        }}
        onPointerOver={() => onHover(disaster.id)}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial 
          color={CATEGORY_COLORS[disaster.category]} 
          transparent 
          opacity={0.8}
        />
      </mesh>
      
      {/* Glow effect */}
      <mesh scale={[1.5, 1.5, 1.5]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial 
          color={CATEGORY_COLORS[disaster.category]} 
          transparent 
          opacity={0.2}
        />
      </mesh>

      {isHovered && (
        <Html distanceFactor={10}>
          <div className="bg-black/80 backdrop-blur-md border border-white/20 p-2 rounded text-xs text-white whitespace-nowrap pointer-events-none">
            {disaster.title}
          </div>
        </Html>
      )}
    </group>
  );
}

export function Globe({ disasters, onSelect, hoveredId, setHoveredId }: {
  disasters: Disaster[];
  onSelect: (d: Disaster) => void;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
}) {
  const globeRef = useRef<THREE.Group>(null);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Stars radius={300} depth={60} count={20000} factor={7} saturation={0} fade speed={1} />
      
      <group ref={globeRef}>
        {/* Earth Sphere */}
        <Sphere args={[2, 64, 64]}>
          <meshStandardMaterial 
            color="#0a0a0a"
            roughness={0.7}
            metalness={0.2}
          />
        </Sphere>

        {/* Atmosphere/Glow */}
        <Sphere args={[2.02, 64, 64]}>
          <meshPhongMaterial
            color="#1e3a8a"
            transparent
            opacity={0.1}
            side={THREE.BackSide}
          />
        </Sphere>

        {/* Grid Overlay */}
        <Sphere args={[2.01, 64, 64]}>
          <meshBasicMaterial 
            wireframe 
            color="#ffffff" 
            transparent 
            opacity={0.03} 
          />
        </Sphere>

        {/* Markers */}
        {disasters.map((d) => (
          <Marker 
            key={d.id} 
            disaster={d} 
            onClick={onSelect}
            isHovered={hoveredId === d.id}
            onHover={setHoveredId}
          />
        ))}
      </group>

      <OrbitControls 
        enablePan={false}
        minDistance={2.5}
        maxDistance={10}
        rotateSpeed={0.5}
        autoRotate={!hoveredId}
        autoRotateSpeed={0.5}
      />
    </>
  );
}
