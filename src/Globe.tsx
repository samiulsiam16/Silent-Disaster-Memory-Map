import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree, extend, ThreeElements } from '@react-three/fiber';
import { Sphere, Html, OrbitControls, Stars, useTexture, Float, PerspectiveCamera, Points, PointMaterial } from '@react-three/drei';
import { EffectComposer, DepthOfField, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Disaster, DisasterCategory } from './types';
import { shaderMaterial } from '@react-three/drei';

// Declare custom elements for JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      atmosphereMaterial: any;
    }
  }
}

const CATEGORY_COLORS: Record<DisasterCategory, string> = {
  flood: '#60a5fa', // blue
  famine: '#fbbf24', // amber
  epidemic: '#f87171', // red
  conflict: '#f3f4f6', // white
  environmental: '#34d399', // green
};

// Rayleigh scattering shader for limb glow
const AtmosphereMaterial = shaderMaterial(
  {
    glowColor: new THREE.Color('#4299e1'),
    viewVector: new THREE.Vector3(),
  },
  `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  `
    uniform vec3 glowColor;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      float intensity = pow(0.6 - dot(vNormal, normalize(vViewPosition)), 4.0);
      gl_FragColor = vec4(glowColor, intensity);
    }
  `
);

extend({ AtmosphereMaterial });

function VolumetricMarker({ disaster, onClick, isHovered, onHover }: { 
  disaster: Disaster; 
  onClick: (d: Disaster) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

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

  // Category specific particles
  const particles = useMemo(() => {
    const count = 40;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 1] = Math.random() * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      const time = state.clock.elapsedTime;
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < 40; i++) {
        positions[i * 3 + 1] += 0.002 * (Math.sin(time + i) + 1.5);
        if (positions[i * 3 + 1] > 0.5) positions[i * 3 + 1] = 0;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group position={position} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), position.clone().normalize())}>
      {/* Volumetric Beam */}
      <mesh 
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(disaster);
        }}
        onPointerOver={() => onHover(disaster.id)}
        onPointerOut={() => onHover(null)}
        position={[0, 0.25, 0]}
      >
        <cylinderGeometry args={[0.005, 0.04, 0.5, 32, 1, true]} />
        <meshBasicMaterial 
          color={CATEGORY_COLORS[disaster.category]} 
          transparent 
          opacity={isHovered ? 0.6 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Category Particles */}
      <Points ref={particlesRef} positions={particles}>
        <PointMaterial 
          transparent 
          color={CATEGORY_COLORS[disaster.category]} 
          size={0.015} 
          sizeAttenuation={true} 
          depthWrite={false} 
          blending={THREE.AdditiveBlending}
        />
      </Points>
      
      {/* Base Glow */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[0.05, 32]} />
        <meshBasicMaterial 
          color={CATEGORY_COLORS[disaster.category]} 
          transparent 
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function MilkyWay() {
  const count = 15000;
  const [positions, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 100 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const brightness = 0.5 + Math.random() * 0.5;
      col[i * 3] = brightness;
      col[i * 3 + 1] = brightness;
      col[i * 3 + 2] = brightness;
      
      siz[i] = Math.random() * 2;
    }
    return [pos, col, siz];
  }, []);

  const starsRef = useRef<THREE.Points>(null);
  const { mouse } = useThree();

  useFrame(() => {
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.0001;
      // Parallax
      starsRef.current.position.x = THREE.MathUtils.lerp(starsRef.current.position.x, mouse.x * 2, 0.05);
      starsRef.current.position.y = THREE.MathUtils.lerp(starsRef.current.position.y, mouse.y * 2, 0.05);
    }
  });

  return (
    <Points ref={starsRef} positions={positions} colors={colors} sizes={sizes}>
      <PointMaterial 
        transparent 
        vertexColors 
        sizeAttenuation={false} 
        size={1.5} 
        depthWrite={false} 
        blending={THREE.AdditiveBlending} 
      />
    </Points>
  );
}

function Moon() {
  const moonRef = useRef<THREE.Group>(null);
  const moonTexture = useTexture('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg');

  useFrame((state) => {
    if (moonRef.current) {
      const t = state.clock.elapsedTime * 0.05;
      moonRef.current.position.set(Math.cos(t) * 12, 4, Math.sin(t) * 12);
      moonRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={moonRef}>
      <Sphere args={[0.4, 64, 64]}>
        <meshStandardMaterial map={moonTexture} roughness={1} metalness={0} />
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
  const atmosphereRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const { mouse, camera } = useThree();

  const [map, normalMap, specularMap, cloudsMap, nightMap] = useTexture([
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_lights_2048.png',
  ]);

  // Camera Zoom Logic
  useEffect(() => {
    if (selectedDisaster && controlsRef.current) {
      const radius = 2.0;
      const phi = (90 - selectedDisaster.lat) * (Math.PI / 180);
      const theta = (selectedDisaster.lng + 180) * (Math.PI / 180);
      const targetPos = new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      ).multiplyScalar(1.5); // Zoom distance

      // Smoothly move camera
      const startPos = camera.position.clone();
      const duration = 1.5;
      let elapsed = 0;

      const animate = () => {
        elapsed += 0.016;
        const t = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3); // Cubic ease out
        camera.position.lerpVectors(startPos, targetPos, ease);
        controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), ease);
        if (t < 1) requestAnimationFrame(animate);
      };
      animate();
    }
  }, [selectedDisaster, camera]);

  useFrame((state) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0004;
    }
    if (globeRef.current) {
      // Scene tilt
      globeRef.current.rotation.z = THREE.MathUtils.lerp(globeRef.current.rotation.z, mouse.x * 0.05, 0.05);
      globeRef.current.rotation.x = THREE.MathUtils.lerp(globeRef.current.rotation.x, -mouse.y * 0.05, 0.05);
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={45} />
      <ambientLight intensity={0.1} />
      <directionalLight position={[5, 3, 5]} intensity={2.5} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.5} color="#1e3a8a" />
      
      <MilkyWay />
      <Moon />
      
      <group ref={globeRef}>
        <Sphere args={[2, 128, 128]}>
          <meshStandardMaterial 
            map={map}
            normalMap={normalMap}
            roughnessMap={specularMap}
            roughness={0.6}
            metalness={0.2}
            emissiveMap={nightMap}
            emissive={new THREE.Color('#ffffff')}
            emissiveIntensity={0.5}
          />
        </Sphere>

        {/* Clouds */}
        <Sphere ref={cloudsRef} args={[2.02, 128, 128]}>
          <meshStandardMaterial 
            map={cloudsMap}
            transparent
            opacity={0.3}
            depthWrite={false}
          />
        </Sphere>

        {/* Atmosphere Limb Glow */}
        <Sphere args={[2.1, 128, 128]}>
          {/* @ts-ignore */}
          <atmosphereMaterial 
            ref={atmosphereRef}
            transparent
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </Sphere>

        {/* Grid Overlay */}
        <Sphere args={[2.005, 64, 64]}>
          <meshBasicMaterial 
            wireframe 
            color="#ffffff" 
            transparent 
            opacity={0.08} 
          />
        </Sphere>

        {/* Volumetric Markers */}
        {disasters.map((d) => (
          <VolumetricMarker 
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
        maxDistance={15}
        rotateSpeed={0.8}
        zoomSpeed={1.2}
        enableDamping={true}
        dampingFactor={0.05}
        autoRotate={!hoveredId && !selectedDisaster}
        autoRotateSpeed={0.2}
      />

      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.4} 
        />
        <DepthOfField 
          focusDistance={0} 
          focalLength={0.02} 
          bokehScale={2} 
          height={480} 
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
        <ChromaticAberration offset={new THREE.Vector2(0.001, 0.001)} />
      </EffectComposer>
    </>
  );
}

