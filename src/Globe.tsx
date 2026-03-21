import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sphere, Html, OrbitControls, Stars, useTexture, Float } from '@react-three/drei';
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
  const meshRef = useRef<THREE.Mesh>(null);

  const position = useMemo(() => {
    const radius = 2.02;
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
      const s = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
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
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshBasicMaterial 
          color={CATEGORY_COLORS[disaster.category]} 
          transparent 
          opacity={0.9}
        />
      </mesh>
      
      {/* Glow effect */}
      <mesh scale={[2, 2, 2]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshBasicMaterial 
          color={CATEGORY_COLORS[disaster.category]} 
          transparent 
          opacity={0.3}
        />
      </mesh>

      {isHovered && (
        <Html distanceFactor={10}>
          <div className="bg-black/90 backdrop-blur-xl border border-white/20 p-3 rounded-xl text-[10px] uppercase tracking-widest text-white whitespace-nowrap pointer-events-none shadow-2xl">
            {disaster.title}
          </div>
        </Html>
      )}
    </group>
  );
}

function Moon() {
  const moonRef = useRef<THREE.Group>(null);
  const moonTexture = useTexture('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg');

  useFrame((state) => {
    if (moonRef.current) {
      const t = state.clock.elapsedTime * 0.1;
      moonRef.current.position.set(Math.cos(t) * 8, 0, Math.sin(t) * 8);
      moonRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={moonRef}>
      <Sphere args={[0.5, 32, 32]}>
        <meshStandardMaterial map={moonTexture} roughness={1} />
      </Sphere>
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
  const cloudsRef = useRef<THREE.Mesh>(null);

  const [map, normalMap, roughnessMap, cloudsMap] = useTexture([
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
  ]);

  useFrame((state) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 5, 5]} intensity={2} castShadow />
      <pointLight position={[-10, -5, -5]} intensity={0.5} color="#1e3a8a" />
      
      <Stars 
        radius={300} 
        depth={100} 
        count={15000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={0.5} 
      />
      
      <group ref={globeRef}>
        {/* Earth Sphere */}
        <Sphere args={[2, 128, 128]}>
          <meshStandardMaterial 
            map={map}
            normalMap={normalMap}
            roughnessMap={roughnessMap}
            roughness={0.8}
            metalness={0.1}
          />
        </Sphere>

        {/* Clouds */}
        <Sphere ref={cloudsRef} args={[2.01, 128, 128]}>
          <meshStandardMaterial 
            map={cloudsMap}
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        </Sphere>

        {/* Atmosphere/Glow */}
        <Sphere args={[2.05, 128, 128]}>
          <meshPhongMaterial
            color="#4299e1"
            transparent
            opacity={0.1}
            side={THREE.BackSide}
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

      <Moon />

      <OrbitControls 
        enablePan={false}
        minDistance={2.2}
        maxDistance={20}
        rotateSpeed={0.8}
        zoomSpeed={1.2}
        autoRotate={!hoveredId && !selectedDisaster}
        autoRotateSpeed={0.3}
      />
    </>
  );
}

