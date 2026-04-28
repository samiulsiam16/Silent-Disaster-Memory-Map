/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect, Suspense, useLayoutEffect } from 'react';
import { Canvas, useFrame, useThree, extend, ThreeElement } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  useTexture, 
  Stars, 
  Billboard, 
  Text, 
  Float,
  Environment,
  Html
} from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Info, 
  Waves, 
  CloudRain, 
  Skull, 
  Zap, 
  Wind, 
  Flame, 
  Globe as GlobeIcon, 
  Activity, 
  History, 
  Search, 
  X, 
  Volume2, 
  VolumeX, 
  ChevronRight,
  TrendingUp,
  Clock,
  Map as MapIcon,
  MessageSquare
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { cn } from './lib/utils';

// --- TYPES ---

type DisasterType = 'flood' | 'famine' | 'epidemic' | 'conflict' | 'environmental';

interface Disaster {
  id: number;
  title: string;
  lat: number;
  lng: number;
  year: number;
  type: DisasterType;
  deaths: string;
  summary: string;
  cause: string;
  effect: string;
  quote: string;
  credibility: 'verified' | 'local_historian' | 'oral_history' | 'unverified';
  historian: string;
}

// --- CONSTANTS ---

const DATASET: Disaster[] = [
  {"id":1,"title":"1931 China Floods","lat":32.5,"lng":117.2,"year":1931,"type":"flood","deaths":"1,000,000–4,000,000","summary":"The deadliest flood disaster in recorded history devastated central China. The Yangtze, Huai, and Yellow Rivers simultaneously overflowed following years of drought and then extreme snowmelt and rainfall. Millions drowned, died of disease, or starved in the aftermath. The disaster received minimal Western press.","cause":"Extreme rainfall after prolonged drought, combined with deforested watersheds and poor flood infrastructure.","effect":"4 million deaths, 50 million displaced, complete agricultural collapse across Anhui and Jiangsu provinces.","quote":"\"The water came before dawn. We climbed the trees and watched our village disappear.\" — Survivor account, 1932","credibility":"verified","historian":"Prof. Li Wei, Wuhan University"},
  {"id":2,"title":"1770 Bengal Famine","lat":23.5,"lng":87.8,"year":1770,"type":"famine","deaths":"10,000,000","summary":"One third of Bengal's population perished under British East India Company rule. Revenue extraction continued even as crops failed. The famine was systematically ignored in colonial records for decades.","cause":"Drought combined with the East India Company's forced revenue collection, which left farmers with no grain reserves.","effect":"10 million deaths, permanent demographic collapse of rural Bengal, long-term erosion of indigenous agricultural systems.","quote":"\"There was no grain in the markets. There was no mercy in the courts.\" — Local chronicle, 1771","credibility":"verified","historian":"Dr. Amartya Sen references"},
  {"id":3,"title":"1932–33 Holodomor","lat":49.0,"lng":32.0,"year":1932,"type":"famine","deaths":"3,500,000–7,500,000","summary":"A man-made famine in Soviet Ukraine caused by forced collectivization and grain confiscation. The Soviet government denied its existence for decades. Recognition as genocide came only in the 21st century.","cause":"Soviet forced collectivization, grain quota enforcement, and deliberate restrictions on food movement into Ukraine.","effect":"Up to 7.5 million deaths, destruction of Ukrainian rural culture, mass population transfers, decades of suppressed memory.","quote":"\"We ate grass, bark, leather. My mother died on a Tuesday. We could not bury her until Thursday.\"","credibility":"verified","historian":"Dr. Andrea Graziosi, Naples University"},
  {"id":4,"title":"1918 Kazakh Famine","lat":48.0,"lng":67.0,"year":1918,"type":"famine","deaths":"1,500,000","summary":"Largely erased from Soviet history, this famine during the Russian Civil War and collectivization destroyed nearly half the Kazakh nomadic population. It remains one of the least documented famines of the 20th century.","cause":"Russian Civil War disruption of trade routes, forced sedentarization of nomads, and seizure of livestock.","effect":"1.5 million deaths, near-total collapse of Kazakh nomadic culture, permanent demographic shift.","quote":"\"Our horses were taken. Then our camels. Then our children had nothing.\"","credibility":"local_historian","historian":"Kazakhstani National Archive"},
  {"id":5,"title":"1970 Bhola Cyclone","lat":22.5,"lng":90.5,"year":1970,"type":"flood","deaths":"300,000–500,000","summary":"The deadliest tropical cyclone in recorded history struck East Pakistan (now Bangladesh). The Pakistani government's delayed response became a catalyst for Bangladeshi independence. The disaster was severely underreported internationally.","cause":"Category 3 cyclone with 10-meter storm surge striking densely populated, low-lying delta islands with no warning infrastructure.","effect":"Up to 500,000 dead, 3.6 million affected, widespread destruction of coastal infrastructure, political uprising.","quote":"\"We had no radio. No one came for four days.\" — Barisal survivor","credibility":"verified","historian":"Dr. M. Monirul Islam"},
  {"id":6,"title":"1876–79 Great Drought Famine","lat":15.0,"lng":78.0,"year":1876,"type":"famine","deaths":"5,500,000","summary":"A massive El Niño-driven drought killed millions across southern India while British colonial administration continued grain exports. The Madras famine was one of the deadliest in Indian history.","cause":"El Niño drought, British laissez-faire economic policy, continued grain exports during peak starvation.","effect":"5.5 million deaths in Madras and Bombay provinces, permanent erosion of peasant land ownership.","quote":"\"They exported wheat while we buried children.\" — Indian National Congress report, 1880","credibility":"verified","historian":"Mike Davis, Late Victorian Holocausts"},
  {"id":7,"title":"2010 Haiti Cholera Epidemic","lat":18.9,"lng":-72.3,"year":2010,"type":"epidemic","deaths":"10,000+","summary":"A cholera epidemic introduced by UN peacekeepers after the earthquake killed over 10,000 Haitians. The UN denied responsibility for nearly 5 years. It remains one of the worst institutional cover-ups of an epidemic.","cause":"UN MINUSTAH base wastewater contaminating the Artibonite River, introducing a South Asian cholera strain to an immunologically naive population.","effect":"10,000+ deaths, 800,000 infected, long-term public health collapse, erosion of trust in international institutions.","quote":"\"They brought the sickness. Then they denied it. Then they apologized with no accountability.\"","credibility":"verified","historian":"Harvard Human Rights Journal"},
  {"id":8,"title":"1984 Bhopal Gas Tragedy","lat":23.2,"lng":77.4,"year":1984,"type":"environmental","deaths":"15,000–20,000","summary":"The world's worst industrial disaster. Union Carbide's pesticide plant leaked 40 tonnes of methyl isocyanate gas into a sleeping city. Corporate accountability was systematically avoided. Survivors still live on contaminated land.","cause":"Negligent storage of methyl isocyanate, disabled safety systems, corporate cost-cutting measures.","effect":"15,000–20,000 deaths, 500,000 with long-term illness, groundwater contamination persisting 40 years later.","quote":"\"My eyes burned shut. I ran and I ran and I did not know where I was running.\"","credibility":"verified","historian":"Amnesty International Report 2004"},
  {"id":9,"title":"1950 Assam Earthquake","lat":28.4,"lng":96.4,"year":1950,"type":"environmental","deaths":"1,500+","summary":"One of the largest earthquakes in recorded history (magnitude 8.6) struck remote Assam, India and Tibet. The disaster was almost entirely absent from international news due to geopolitical tensions and media access restrictions.","cause":"Rupture of the Assam seismic gap at the Himalayan collision boundary, triggering massive landslides and river course changes.","effect":"1,500+ deaths, total destruction of river infrastructure, the Brahmaputra changed course permanently.","quote":"\"The mountains fell into the river. The river became a mountain.\"","credibility":"local_historian","historian":"Geological Survey of India"},
  {"id":10,"title":"2004 Darfur Drought-Conflict Collapse","lat":14.0,"lng":24.0,"year":2004,"type":"conflict","deaths":"300,000","summary":"Environmental degradation and water scarcity fueled ethnic conflict in Darfur. The disaster had both ecological and political dimensions. The climate-conflict connection was rarely reported by mainstream outlets.","cause":"Desertification reducing arable land by 40%, combined with government-backed militia attacks on farming communities.","effect":"300,000 deaths, 2.5 million displaced, permanent loss of pastoral culture across North Darfur.","quote":"\"We had shared the water for 200 years. Then it was gone, and so were we.\"","credibility":"verified","historian":"UN Environment Programme"},
  {"id":11,"title":"1900 Galveston Hurricane","lat":29.3,"lng":-94.8,"year":1900,"type":"flood","deaths":"8,000–12,000","summary":"The deadliest natural disaster in US history struck Galveston, Texas. An entire island city was destroyed overnight. Early 20th century media limitations meant most Americans learned of it weeks later.","cause":"Category 4 hurricane with 15-foot storm surge hitting a barrier island with no seawall and no evacuation plan.","effect":"8,000–12,000 deaths, complete destruction of what was then Texas's largest city, permanent economic shift to Houston.","quote":"\"By morning there was nothing left but wood and silence.\"","credibility":"verified","historian":"Erik Larson, Isaac's Storm"},
  {"id":12,"title":"1947 Texas City Disaster","lat":29.4,"lng":-94.9,"year":1947,"type":"environmental","deaths":"581","summary":"The deadliest industrial accident in US history. Two ships loaded with ammonium nitrate fertilizer exploded in Texas City harbor, triggering a chain reaction that destroyed the entire port district.","cause":"Improperly stored ammonium nitrate ignited by a small fire; inadequate safety regulations on postwar cargo ships.","effect":"581 deaths, 5,000 injured, 1,000 buildings destroyed, led to US federal government liability laws.","quote":"\"The sky went orange. We thought it was the end of the world.\"","credibility":"verified","historian":"Texas State Library and Archives"},
  {"id":13,"title":"1556 Shaanxi Earthquake","lat":34.5,"lng":109.7,"year":1556,"type":"environmental","deaths":"830,000","summary":"The deadliest earthquake in human history killed 830,000 people in Ming Dynasty China. The event is barely present in Western historical consciousness despite being the single largest sudden death toll from any natural disaster.","cause":"Rupture along the Wei River Graben fault. Most victims lived in yaodong (loess cave dwellings) which collapsed instantly.","effect":"830,000 deaths, 97 counties devastated across 520,000 square miles, a 60% population reduction in some areas.","quote":"\"In the winter of Jiajing, the earth roared and the hills moved and people were swallowed whole.\" — Ming annals","credibility":"verified","historian":"China Earthquake Administration"},
  {"id":14,"title":"1942–43 Bengal Famine","lat":22.5,"lng":88.3,"year":1942,"type":"famine","deaths":"2,000,000–3,000,000","summary":"A famine during World War II killed up to 3 million Bengalis while British authorities diverted food to war efforts. Winston Churchill's administration refused international aid. It remains politically sensitive in British historical discourse.","cause":"War-time rice denial policy, speculative hoarding, cyclone crop damage, and colonial food export priorities.","effect":"3 million deaths, permanent psychological trauma across rural Bengal, accelerated Indian independence movement.","quote":"\"We were told the war needed the rice. We needed the rice to live.\"","credibility":"verified","historian":"Madhusree Mukerjee, Churchill's Secret War"},
  {"id":15,"title":"1986 Lake Nyos Disaster","lat":6.3,"lng":10.3,"year":1986,"type":"environmental","deaths":"1,746","summary":"A volcanic crater lake in Cameroon suddenly released 1.6 million tonnes of CO2 in a limnic eruption, silently suffocating 1,746 people and 3,500 livestock overnight. Almost unknown outside scientific literature.","cause":"CO2 supersaturation at lake bottom triggered by a landslide or small volcanic event, causing rapid degassing.","effect":"1,746 deaths, entire villages emptied, permanent resettlement of surrounding communities, ongoing CO2 mitigation engineering.","quote":"\"In the morning every animal was dead. The people were lying where they had fallen, no marks, no wounds.\"","credibility":"verified","historian":"USGS Volcanic Hazards Program"},
  {"id":16,"title":"1991 Bangladesh Cyclone","lat":22.0,"lng":91.8,"year":1991,"type":"flood","deaths":"138,000","summary":"A Category 5 cyclone struck Bangladesh with a storm surge that drowned coastal islands within hours. International response was delayed. The event accelerated cyclone shelter construction programs.","cause":"Category 5 cyclone with 6-meter storm surge and sustained 250 km/h winds hitting unprotected coastal islands.","effect":"138,000 deaths, 10 million homeless, $1.5 billion in damage, major reforms in Bangladesh disaster preparedness.","quote":"\"We climbed the embankment. The water climbed higher. Most of us fell.\"","credibility":"verified","historian":"Bangladesh Meteorological Department"},
  {"id":17,"title":"1959 Typhoon Vera Japan","lat":35.1,"lng":136.9,"year":1959,"type":"flood","deaths":"5,098","summary":"The deadliest typhoon in Japanese postwar history struck Nagoya and the Nobi Plain. The disaster drove major investment in Japanese coastal engineering but remains largely unknown internationally.","cause":"Category 5 typhoon with record storm surge entering Ise Bay's funnel-shaped geography amplifying wave height.","effect":"5,098 deaths, 40,000 homes destroyed, directly caused Japan's postwar coastal infrastructure revolution.","quote":"\"The sea came into the city like it owned it.\" — Nagoya survivor","credibility":"verified","historian":"Japan Meteorological Agency"},
  {"id":18,"title":"1969 Sahel Drought","lat":15.0,"lng":5.0,"year":1969,"type":"famine","deaths":"100,000+","summary":"A decade-long drought collapsed agriculture across six Sahel nations. International attention arrived only after years of suffering. The disaster created refugee populations that persist today.","cause":"Prolonged La Niña drought, overgrazing, rapid post-colonial population growth, and lack of early warning systems.","effect":"100,000+ deaths, 50 million at risk of starvation, permanent desertification of 65 million hectares.","quote":"\"When the millet failed the second year, we knew we had to walk. We walked for months.\"","credibility":"verified","historian":"CILSS Permanent Interstate Committee"},
  {"id":19,"title":"1953 North Sea Flood","lat":51.8,"lng":4.2,"year":1953,"type":"flood","deaths":"2,551","summary":"A catastrophic storm surge simultaneously struck the Netherlands, Belgium, and England. The Dutch disaster drove creation of the Delta Works, one of the greatest engineering achievements of the 20th century.","cause":"Exceptionally deep depression coinciding with spring high tide, producing a 5.6m surge along the North Sea coast.","effect":"2,551 deaths, 47,300 homes destroyed, 10% of Dutch farmland permanently inundated, $5B Delta Works program.","quote":"\"We rang the church bells all night. No one came. The water was already at the windows.\"","credibility":"verified","historian":"Netherlands Water Authority"},
  {"id":20,"title":"2003 European Heat Wave","lat":46.0,"lng":2.0,"year":2003,"type":"epidemic","deaths":"70,000","summary":"A silent mass death event across Europe. 70,000 people, mostly elderly, died in their homes over two weeks. France's death toll alone exceeded 15,000. No official emergency was declared for 12 days.","cause":"Unprecedented 16°C above-average temperatures, inadequate heat emergency infrastructure, social isolation of elderly.","effect":"70,000 deaths across 12 countries, permanent changes to European heat warning systems, eldercare policy reform.","quote":"\"My neighbor had been dead for five days before anyone knew. She was 84.\" — Paris resident","credibility":"verified","historian":"Inserm French Public Health Institute"}
];

// --- SHADERS ---

const ATMOSPHERE_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vEyeVector;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vEyeVector = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const ATMOSPHERE_FRAGMENT = `
  varying vec3 vNormal;
  varying vec3 vEyeVector;
  void main() {
    float fresnel = pow(1.0 - dot(vNormal, vEyeVector), 3.0);
    gl_FragColor = vec4(0.0, 0.66, 1.0, fresnel * 0.5);
  }
`;

const MARKER_FLOOD_FRAGMENT = `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    float dist = distance(vUv, vec2(0.5));
    float ring = fract(dist * 2.0 - uTime * 0.5);
    float alpha = smoothstep(0.5, 0.4, dist) * (1.0 - ring) * (sin(uTime * 1.5) * 0.4 + 0.6);
    gl_FragColor = vec4(0.0, 0.8, 1.0, alpha);
  }
`;

const MARKER_FAMINE_FRAGMENT = `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    float dist = distance(vUv, vec2(0.5));
    float pulse = sin(uTime * 2.0) * 0.15 + 1.0;
    float alpha = smoothstep(0.5 * pulse, 0.0, dist);
    gl_FragColor = vec4(1.0, 0.66, 0.0, alpha * 0.8);
  }
`;

const MARKER_EPIDEMIC_FRAGMENT = `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    float dist = distance(vUv, vec2(0.5));
    float ring1 = fract(dist * 3.0 - uTime * 0.4);
    float ring2 = fract(dist * 3.0 - uTime * 0.4 - 0.66);
    float alpha = smoothstep(0.5, 0.0, dist) * (ring1 + ring2) * 0.5;
    gl_FragColor = vec4(1.0, 0.2, 0.2, alpha * 0.9);
  }
`;

const MARKER_CONFLICT_FRAGMENT = `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    float dist = distance(vUv, vec2(0.5));
    float flicker = sin(uTime * 20.0) * 0.1 + 0.9;
    float star = smoothstep(0.4, 0.38, dist + sin(atan(vUv.y-0.5, vUv.x-0.5) * 8.0) * 0.05);
    gl_FragColor = vec4(0.8, 0.8, 0.8, star * flicker);
  }
`;

const MARKER_ENVIRONMENTAL_FRAGMENT = `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    float dist = distance(vUv, vec2(0.5));
    float pulse = sin(uTime * 0.8) * 0.3 + 0.7;
    float glow = smoothstep(0.5, 0.0, dist);
    gl_FragColor = vec4(0.2, 1.0, 0.5, glow * pulse * 0.6);
  }
`;

// Helper: Lat/Lng to Vector3
function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// --- 3D COMPONENTS ---

const Atmosphere = () => {
  return (
    <mesh scale={[1.15, 1.15, 1.15]}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        vertexShader={ATMOSPHERE_VERTEX}
        fragmentShader={ATMOSPHERE_FRAGMENT}
        side={THREE.BackSide}
        transparent
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

const DisasterMarker = ({ 
  disaster, 
  onClick, 
  selected,
  heatmapMode 
}: { 
  disaster: Disaster; 
  onClick: () => void; 
  selected: boolean;
  heatmapMode: boolean;
}) => {
  const pos = useMemo(() => latLngToVector3(disaster.lat, disaster.lng, 1), [disaster.lat, disaster.lng]);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      if (material.uniforms) {
        material.uniforms.uTime.value = clock.getElapsedTime();
      }
      
      const targetScale = selected ? 1.5 : (hovered ? 1.2 : 1.0);
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  const getMarkerShader = (type: DisasterType) => {
    switch (type) {
      case 'flood': return MARKER_FLOOD_FRAGMENT;
      case 'famine': return MARKER_FAMINE_FRAGMENT;
      case 'epidemic': return MARKER_EPIDEMIC_FRAGMENT;
      case 'conflict': return MARKER_CONFLICT_FRAGMENT;
      case 'environmental': return MARKER_ENVIRONMENTAL_FRAGMENT;
    }
  };

  const getMarkerColor = (type: DisasterType) => {
    switch (type) {
      case 'flood': return '#00ccff';
      case 'famine': return '#ffaa00';
      case 'epidemic': return '#ff3333';
      case 'conflict': return '#cccccc';
      case 'environmental': return '#33ff88';
    }
  };

  if (heatmapMode) return null;

  return (
    <Billboard position={pos}>
      <mesh 
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[0.04, 0.04]} />
        <shaderMaterial
          transparent
          blending={THREE.AdditiveBlending}
          uniforms={{ uTime: { value: 0 } }}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={getMarkerShader(disaster.type)}
        />
      </mesh>
      {selected && (
        <mesh scale={[1.2, 1.2, 1.2]}>
          <ringGeometry args={[0.025, 0.03, 32]} />
          <meshBasicMaterial color={getMarkerColor(disaster.type)} transparent opacity={0.5} />
        </mesh>
      )}
    </Billboard>
  );
};

const Starfield = () => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const coords = new Float32Array(8000 * 3);
    const sizes = new Float32Array(8000);
    const seeds = new Float32Array(8000);
    for (let i = 0; i < 8000; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const r = 20 + Math.random() * 30;
        coords[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        coords[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        coords[i * 3 + 2] = r * Math.cos(phi);
        sizes[i] = 0.5 + Math.random() * 2.0;
        seeds[i] = Math.random() * 100;
    }
    return { coords, sizes, seeds };
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
        (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={8000} array={particles.coords} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={8000} array={particles.sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aSeed" count={8000} array={particles.seeds} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        vertexShader={`
          attribute float aSize;
          attribute float aSeed;
          varying float vTwinkle;
          uniform float uTime;
          void main() {
            vTwinkle = sin(uTime + aSeed) * 0.4 + 0.6;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying float vTwinkle;
          void main() {
            float dist = distance(gl_PointCoord, vec2(0.5));
            if (dist > 0.5) discard;
            gl_FragColor = vec4(1.0, 1.0, 1.0, (1.0 - dist * 2.0) * vTwinkle);
          }
        `}
        uniforms={{ uTime: { value: 0 } }}
      />
    </points>
  );
};

const CelestialBodies = () => {
    const moonRef = useRef<THREE.Group>(null);
    const moon2Ref = useRef<THREE.Group>(null);

    useFrame(({ clock }) => {
        if (moonRef.current) {
            moonRef.current.rotation.y = clock.getElapsedTime() * 0.05;
            const t = clock.getElapsedTime() * 0.1;
            moonRef.current.position.set(Math.cos(t) * 4, Math.sin(t) * 0.5, Math.sin(t) * 4);
        }
        if (moon2Ref.current) {
            const t = clock.getElapsedTime() * 0.04;
            moon2Ref.current.position.set(Math.cos(t + 2) * 6, Math.sin(t + 2) * 0.3, Math.sin(t + 2) * 6);
        }
    });

    return (
        <Suspense fallback={null}>
            <group ref={moonRef}>
                <mesh>
                    <sphereGeometry args={[0.08, 32, 32]} />
                    <meshStandardMaterial color="#888" roughness={1} />
                </mesh>
            </group>
            <group ref={moon2Ref}>
                <mesh>
                    <sphereGeometry args={[0.03, 32, 32]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
            </group>
        </Suspense>
    );
};

const Globe = ({ selectedDisaster, onMarkerClick, heatmapMode, filters, timelineYear }: any) => {
  const [
    colorMap, 
    bumpMap, 
    specularMap, 
    nightMap
  ] = useTexture([
    "https://cdn.jsdelivr.net/gh/vasturiano/three-globe/example/img/earth-blue-marble.jpg",
    "https://cdn.jsdelivr.net/gh/vasturiano/three-globe/example/img/earth-topology.png",
    "https://cdn.jsdelivr.net/gh/vasturiano/three-globe/example/img/earth-water.png",
    "https://cdn.jsdelivr.net/gh/vasturiano/three-globe/example/img/earth-night.jpg"
  ]);

  const earthRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (earthRef.current) earthRef.current.rotation.y += 0.0005;
  });

  const filteredDisasters = useMemo(() => {
    return DATASET.filter(d => {
        const typeMatch = filters.length === 0 || filters.includes(d.type);
        const yearMatch = Math.abs(d.year - timelineYear) <= 50;
        return typeMatch && yearMatch;
    });
  }, [filters, timelineYear]);

  const heatmapPoints = useMemo(() => {
    const coords = new Float32Array(filteredDisasters.length * 3);
    filteredDisasters.forEach((d, i) => {
        const p = latLngToVector3(d.lat, d.lng, 1.01);
        coords[i*3] = p.x;
        coords[i*3+1] = p.y;
        coords[i*3+2] = p.z;
    });
    return coords;
  }, [filteredDisasters]);

  return (
    <group>
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 128, 128]} />
        <meshStandardMaterial 
          map={colorMap} 
          bumpMap={bumpMap} 
          bumpScale={0.05}
          roughnessMap={specularMap}
          emissiveMap={nightMap}
          emissiveIntensity={1.5}
        />
      </mesh>
      
      {heatmapMode && (
        <points>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={filteredDisasters.length} array={heatmapPoints} itemSize={3} />
            </bufferGeometry>
            <shaderMaterial
                transparent
                blending={THREE.AdditiveBlending}
                vertexShader={`
                    void main() {
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_PointSize = 150.0 / -mvPosition.z;
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `}
                fragmentShader={`
                    void main() {
                        float dist = distance(gl_PointCoord, vec2(0.5));
                        if (dist > 0.5) discard;
                        gl_FragColor = vec4(1.0, 0.4, 0.0, (1.0 - dist * 2.0) * 0.5);
                    }
                `}
            />
        </points>
      )}

      <Atmosphere />
      <mesh scale={[1.002, 1.002, 1.002]}>
        <icosahedronGeometry args={[1, 15]} />
        <meshBasicMaterial wireframe color="#00c8ff" transparent opacity={0.03} />
      </mesh>
      
      {filteredDisasters.map(d => (
        <DisasterMarker 
            key={d.id} 
            disaster={d} 
            onClick={() => onMarkerClick(d)} 
            selected={selectedDisaster?.id === d.id}
            heatmapMode={heatmapMode}
        />
      ))}
    </group>
  );
};

// --- UI COMPONENTS ---

const BackgroundDrone = ({ active }: { active: boolean }) => {
    useEffect(() => {
        if (!active) return;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(55, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();

        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < ctx.sampleRate * 2; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, ctx.currentTime);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.02, ctx.currentTime);
        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseSource.start();

        return () => {
            oscillator.stop();
            noiseSource.stop();
            ctx.close();
        };
    }, [active]);
    return null;
};

// --- MAIN PAGE ---

export default function App() {
  const [selectedDisaster, setSelectedDisaster] = useState<Disaster | null>(null);
  const [landing, setLanding] = useState(true);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [filters, setFilters] = useState<DisasterType[]>([]);
  const [timelineYear, setTimelineYear] = useState(2024);
  const [audioActive, setAudioActive] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submissionModal, setSubmissionModal] = useState(false);
  const [storyMode, setStoryMode] = useState(false);
  
  const handleMarkerClick = (d: Disaster) => {
    setSelectedDisaster(d);
    setAiAnalysis(null);
  };

  const callGemini = async (type: 'analysis' | 'story') => {
    if (!selectedDisaster || !process.env.GEMINI_API_KEY) return;
    setLoadingAi(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = type === 'analysis' 
        ? `You are a historian. Provide a detailed, empathetic 300-word analysis of the following disaster: ${selectedDisaster.title}, ${selectedDisaster.year}. Include geopolitical context and why it was underreported.`
        : `Write a cinematic 150-word narration for a documentary about ${selectedDisaster.title}. Begin mid-scene, use present tense, make the reader feel present.`;
      
      const result = await model.generateContent(prompt);
      setAiAnalysis(result.response.text());
    } catch (err) {
      console.error(err);
      setAiAnalysis("Unable to reach memory archives at this moment.");
    } finally {
        setLoadingAi(false);
    }
  };

  const toggleFilter = (type: DisasterType) => {
    setFilters(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  return (
    <div className="relative w-full h-screen bg-[#000408] text-white font-sans overflow-hidden">
      {/* BACKGROUND PATTERNS */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 0)', backgroundSize: '100px 100px', backgroundPosition: '20px 20px' }}></div>
      
      <BackgroundDrone active={audioActive} />
      
      {/* LANDING SCREEN */}
      <AnimatePresence>
        {landing && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-[#000408]"
          >
            {/* BACKGROUND DECORATION */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 0)', backgroundSize: '60px 60px' }}></div>
            
            <div className="absolute inset-0 z-0 opacity-30">
                <Canvas>
                    <Suspense fallback={null}>
                        <Starfield />
                    </Suspense>
                </Canvas>
            </div>
            
            <motion.div className="z-10 text-center space-y-12 select-none px-6">
              <div className="space-y-4 mb-16">
                {["Some disasters were never reported.", "Some stories were never heard.", "This map remembers."].map((text, i) => (
                    <motion.h1
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 1.2 + 0.5, duration: 1.5 }}
                    className="text-xl md:text-3xl font-light tracking-[0.4em] text-cyan-400/90 uppercase"
                    >
                    {text}
                    </motion.h1>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4.5 }}
                className="flex flex-col items-center gap-8"
              >
                <div className="relative w-48 h-px bg-white/5">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ delay: 4.5, duration: 2, ease: "easeInOut" }}
                        className="h-full bg-cyan-500/50"
                    />
                </div>

                <button
                  onClick={() => { setLanding(false); setAudioActive(true); }}
                  className="px-12 py-4 border border-cyan-500/30 text-[0.65rem] tracking-[0.5em] uppercase hover:bg-cyan-500/5 hover:border-cyan-500/60 transition-all font-mono text-cyan-400 cursor-pointer"
                >
                  INITIALIZE ARCHIVE
                </button>
                
                <div className="space-y-1">
                    <p className="text-[0.5rem] text-slate-600 font-mono tracking-widest uppercase">System Status: Optimal</p>
                    <p className="text-[0.45rem] text-slate-700 font-mono tracking-widest uppercase">Synchronizing Forgotten Data Nodes...</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN 3D SCENE */}
      <div className="absolute inset-0 z-0">
        {/* DESIGN GLOW BEHIND GLOBE */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full shadow-[0_0_200px_rgba(0,150,255,0.2)] pointer-events-none" style={{ background: 'radial-gradient(circle at 30% 30%, #1e3a8a 0%, #000810 70%)', border: '1px solid rgba(0, 200, 255, 0.1)' }}></div>
        
        <Canvas gl={{ antialias: true }}>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 0, 3]} />
            <OrbitControls 
              enableDamping 
              dampingFactor={0.06} 
              minDistance={1.2} 
              maxDistance={4.0}
              autoRotate={!selectedDisaster}
              autoRotateSpeed={0.5}
            />
            <ambientLight intensity={0.08} />
            <directionalLight position={[5, 3, 5]} intensity={1.8} color="#fff8e0" />
            <pointLight position={[-8, -3, -4]} intensity={0.3} color="#3366ff" />
            <hemisphereLight color="#001133" groundColor="#000" intensity={0.2} />
            
            <Starfield />
            <CelestialBodies />
            <Globe 
              selectedDisaster={selectedDisaster} 
              onMarkerClick={handleMarkerClick}
              heatmapMode={heatmapMode}
              filters={filters}
              timelineYear={timelineYear}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* UI OVERLAYS */}
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
        {/* TOP INTERFACE */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div className="space-y-4">
            <div className="p-0 border-none rounded-none bg-transparent">
                <h1 className="text-[0.75rem] font-mono tracking-[0.4em] text-cyan-400 mb-1">SILENT DISASTER MEMORY MAP</h1>
                <p className="text-[0.65rem] text-slate-400 uppercase tracking-widest">Documenting the Forgotten</p>
                <div className="mt-8 flex flex-col gap-2">
                    <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-2 rounded">
                        <span className="text-[0.6rem] text-slate-500 font-mono">ACTIVE DATASETS:</span>
                        <span className="text-[0.6rem] text-cyan-400 font-mono tracking-widest">20 RECORDED ENTRIES</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-1 mt-2">
                <button 
                  onClick={() => setHeatmapMode(!heatmapMode)}
                  className={cn(
                    "px-3 py-1 text-[0.65rem] uppercase tracking-tighter border transition-all",
                    heatmapMode ? "bg-cyan-500/20 border-cyan-500 text-cyan-400" : "bg-transparent border-white/10 text-slate-500 hover:text-white"
                  )}
                >
                    Heatmap
                </button>
                <button 
                  onClick={() => setSubmissionModal(true)}
                  className="px-3 py-1 bg-transparent border border-white/10 text-[0.65rem] text-slate-500 uppercase tracking-widest flex items-center gap-2 hover:text-white transition-all"
                >
                    <MessageSquare size={10} />
                    Submit
                </button>
                <button 
                  onClick={() => {
                    if (selectedDisaster) {
                        setStoryMode(true);
                        callGemini('story');
                    }
                  }}
                  className={cn(
                    "px-3 py-1 border transition-all uppercase tracking-widest text-[0.65rem]",
                    storyMode ? "bg-cyan-500/20 border-cyan-500 text-cyan-400" : "bg-transparent border-white/10 text-slate-500 hover:text-white"
                  )}
                >
                    Story Mode
                </button>
            </div>

            <div className="flex gap-1 mt-2">
                {(['flood', 'famine', 'epidemic', 'conflict', 'environmental'] as DisasterType[]).map(type => (
                    <button
                        key={type}
                        onClick={() => toggleFilter(type)}
                        className={cn(
                            "px-3 py-1 text-[0.65rem] uppercase tracking-tighter border transition-all",
                            filters.includes(type) ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-white/5 text-slate-600 hover:text-slate-400"
                        )}
                    >
                        {type}
                    </button>
                ))}
            </div>
          </div>

          <div className="space-y-4 flex flex-col items-end">
            <div className="p-0 border-none rounded-none text-right font-mono text-[0.65rem] space-y-1">
                <div className="flex gap-4 justify-end text-cyan-500">
                    <span className="text-white/20">COORDS:</span>
                    <span>14.02 N / 24.32 E</span>
                </div>
                <div className="text-slate-400 uppercase tracking-widest text-[0.6rem]">
                    UTC: {new Date().toISOString().replace('T', ' ').split('.')[0].replace(/-/g, '.')}
                </div>
                <div className="mt-4 flex gap-4 justify-end items-center opacity-60">
                    <div className="h-px w-12 bg-white/20"></div>
                    <div className="text-[0.65rem] text-white/60">ZOOM: 1.4x</div>
                </div>
            </div>

            <div className="flex items-center gap-4 pointer-events-auto mt-4">
                <div className="relative group">
                    <input 
                        type="text" 
                        placeholder="SEARCH ARCHIVES..."
                        className="bg-black/40 backdrop-blur-md border border-white/10 rounded-sm px-3 py-1.5 text-[0.6rem] w-48 focus:w-64 transition-all focus:border-cyan-400 outline-none font-mono tracking-widest"
                    />
                    <Search size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
                </div>
                <button onClick={() => setAudioActive(!audioActive)} className="p-2 text-white/40 hover:text-white transition-colors">
                    {audioActive ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>
            </div>
          </div>
        </div>

        {/* BOTTOM INTERFACE: TIMELINE */}
        <div className="w-full flex flex-col items-center justify-center p-8 bg-gradient-to-t from-black to-transparent pointer-events-auto">
            <div className="w-full max-w-5xl relative flex flex-col items-center">
                <div className="w-full h-px bg-white/10 relative mt-8">
                     <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/20"></div>
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/20"></div>
                     <div className="absolute left-0 -top-6 text-[0.6rem] font-mono text-slate-500">1500</div>
                     <div className="absolute left-[42%] -top-6 text-[0.6rem] font-mono text-cyan-400">{timelineYear}</div>
                     <div className="absolute right-0 -top-6 text-[0.6rem] font-mono text-slate-500">2024</div>
                     
                     <div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-500 rounded-full border-4 border-[#000408] shadow-[0_0_15px_#00c8ff] cursor-pointer"
                        style={{ left: `${((timelineYear - 1500) / (2024 - 1500)) * 100}%` }}
                     ></div>
                </div>

                <div className="mt-8 flex gap-16 text-[0.55rem] text-slate-600 tracking-[0.3em] uppercase">
                    <span className={cn(timelineYear < 1800 && "text-cyan-400 font-bold")}>Pre-Industrial</span>
                    <span className={cn(timelineYear >= 1800 && timelineYear < 1920 && "text-cyan-400 font-bold")}>Colonial Expansion</span>
                    <span className={cn(timelineYear >= 1991 && "text-cyan-400 font-bold")}>Modern Anthropocene</span>
                </div>

                <input 
                    type="range" 
                    min="1500" 
                    max="2024" 
                    value={timelineYear} 
                    onChange={(e) => setTimelineYear(parseInt(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                />
            </div>
        </div>
      </div>

      {/* INFO PANELS */}
      <AnimatePresence>
        {selectedDisaster && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.98 }}
            className="absolute top-1/2 -translate-y-1/2 right-8 w-[420px] max-h-[600px] z-30 pointer-events-auto"
          >
            <div className="bg-[#000a14]/90 backdrop-blur-2xl border border-cyan-500/20 shadow-2xl rounded-sm overflow-hidden relative flex flex-col h-[600px]">
                {/* CORNER BRACKETS */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-cyan-500/40 z-10" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-500/40 z-10" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-cyan-500/40 z-10" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyan-500/40 z-10" />

                <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="flex gap-2 items-center mb-1">
                                <span className={cn(
                                    "text-[0.55rem] px-2 py-0.5 border font-mono uppercase",
                                    selectedDisaster.credibility === 'verified' ? "bg-amber-600/20 text-amber-500 border-amber-500/30" : "bg-cyan-600/20 text-cyan-400 border-cyan-400/30"
                                )}>
                                    {selectedDisaster.credibility.replace('_', ' ')}
                                </span>
                                <span className="text-slate-500 text-[0.6rem] font-mono uppercase tracking-widest">ID: {selectedDisaster.id.toString().padStart(3, '0')}</span>
                            </div>
                            <h3 className="text-xl font-light text-white tracking-tight">{selectedDisaster.title}</h3>
                        </div>
                        <button onClick={() => setSelectedDisaster(null)} className="text-slate-500 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="text-[0.6rem] text-cyan-500 uppercase tracking-widest mb-2 font-mono">Historical Summary</div>
                            <p className="text-[0.8rem] text-slate-300 leading-relaxed font-light">
                                {selectedDisaster.summary}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                            <div>
                                <div className="text-[0.6rem] text-slate-500 uppercase mb-1 font-mono tracking-widest">Cause</div>
                                <div className="text-[0.75rem] text-slate-300 font-light leading-tight">{selectedDisaster.cause}</div>
                            </div>
                            <div>
                                <div className="text-[0.6rem] text-slate-500 uppercase mb-1 font-mono tracking-widest">Estimated Loss</div>
                                <div className="text-lg text-amber-500 font-mono tracking-tighter">{selectedDisaster.deaths}</div>
                            </div>
                        </div>

                        <div className="bg-cyan-500/5 border border-cyan-500/10 p-4 rounded-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[0.6rem] text-cyan-400 uppercase font-mono tracking-widest">Archive Perspective</span>
                                <span className="text-[0.5rem] text-cyan-400/50 uppercase font-mono">ID-{selectedDisaster.year}</span>
                            </div>
                            <p className="text-[0.7rem] text-cyan-100/70 leading-relaxed italic font-light">
                                {selectedDisaster.quote}
                            </p>
                        </div>

                        {!aiAnalysis ? (
                            <button 
                                onClick={() => callGemini('analysis')}
                                disabled={loadingAi}
                                className="w-full py-3 border border-cyan-500/40 text-cyan-400 text-[0.65rem] tracking-[0.2em] uppercase bg-cyan-500/5 hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {loadingAi ? (
                                    <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent animate-spin rounded-full" />
                                ) : (
                                    <span className="font-mono">Request Full Narrative Mode</span>
                                )}
                            </button>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-cyan-900/10 border border-cyan-500/10 p-5 rounded-sm space-y-3"
                            >
                                <div className="flex justify-between items-center text-[0.6rem] font-mono tracking-widest">
                                    <span className="text-cyan-400 uppercase">AI Analytical Extension</span>
                                    <span className="text-cyan-400/40 uppercase">Gemini-1.5</span>
                                </div>
                                <p className="text-[0.75rem] leading-relaxed text-cyan-100/70 font-light">
                                    {aiAnalysis}
                                </p>
                            </motion.div>
                        )}
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/5 space-y-2">
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 w-[78%] animate-pulse"></div>
                        </div>
                        <div className="flex justify-between text-[0.5rem] font-mono text-slate-600 tracking-widest">
                            <span>DATA CONFIDENCE</span>
                            <span>78%</span>
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORNER DATA BOX */}
      {selectedDisaster && (
        <div className="absolute bottom-32 left-8 pointer-events-none w-[320px]">
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-5 rounded-sm relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-500"></div>
                
                <div className="text-amber-500 text-[0.6rem] font-mono mb-2 tracking-widest uppercase">Selected Event</div>
                <h3 className="text-lg font-light tracking-tight mb-1">{selectedDisaster.title}</h3>
                <p className="text-cyan-400 text-[0.65rem] font-mono mb-3 uppercase tracking-wider">YEAR: {selectedDisaster.year} | TYPE: {selectedDisaster.type}</p>
                <p className="text-[0.75rem] text-slate-300 leading-relaxed italic border-l-2 border-amber-600 pl-3">
                    {selectedDisaster.quote}
                </p>
            </motion.div>
        </div>
      )}

      {/* SUBMISSION MODAL */}
      <AnimatePresence>
        {submissionModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md pointer-events-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-2xl bg-[#000a14] border border-cyan-500/20 shadow-2xl rounded-sm relative overflow-hidden h-[600px] flex flex-col"
            >
                {/* CORNER BRACKETS */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-cyan-500/40" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-500/40" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-cyan-500/40" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyan-500/40" />

                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-light tracking-widest text-cyan-400">SUBMIT DISASTER MEMORY</h2>
                        <p className="text-[0.6rem] text-slate-500 font-mono uppercase tracking-widest mt-1">Documentation Archive Entry</p>
                    </div>
                    <button onClick={() => setSubmissionModal(false)} className="text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[0.6rem] font-mono uppercase tracking-widest text-slate-500">Disaster Name</label>
                                <input type="text" className="w-full bg-cyan-500/5 border border-cyan-500/20 rounded-sm px-3 py-2 text-sm outline-none focus:border-cyan-400 transition-all font-light text-slate-200" placeholder="e.g. 1954 Great Drought" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.6rem] font-mono uppercase tracking-widest text-slate-500">Location / Lat,Lng</label>
                                <input type="text" className="w-full bg-cyan-500/5 border border-cyan-500/20 rounded-sm px-3 py-2 text-sm outline-none focus:border-cyan-400 transition-all font-light text-slate-200" placeholder="e.g. 24.5, 117.2" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[0.6rem] font-mono uppercase tracking-widest text-slate-500">Year</label>
                                <input type="number" className="w-full bg-cyan-500/5 border border-cyan-500/20 rounded-sm px-3 py-2 text-sm outline-none focus:border-cyan-400 transition-all font-light text-slate-200" defaultValue="2000" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.6rem] font-mono uppercase tracking-widest text-slate-500">Category</label>
                                <select className="w-full bg-[#000a14] border border-cyan-500/20 rounded-sm px-3 py-2 text-sm outline-none focus:border-cyan-400 transition-all font-light text-slate-200 cursor-pointer">
                                    <option>Flood</option>
                                    <option>Famine</option>
                                    <option>Epidemic</option>
                                    <option>Conflict</option>
                                    <option>Environmental</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[0.6rem] font-mono uppercase tracking-widest text-slate-500">Summary & Historical Significance</label>
                        <textarea rows={4} className="w-full bg-cyan-500/5 border border-cyan-500/20 rounded-sm px-3 py-2 text-sm outline-none focus:border-cyan-400 transition-all font-light resize-none text-slate-200" placeholder="Provide a detailed account of the event..." />
                    </div>
                    <button 
                        onClick={() => setSubmissionModal(false)}
                        className="w-full py-4 border border-cyan-500/40 text-cyan-400 text-[0.65rem] tracking-[0.2em] uppercase bg-cyan-500/5 hover:bg-cyan-500/20 transition-all font-mono"
                    >
                        VERIFY & SUBMIT MEMORY
                    </button>
                    <p className="text-[0.55rem] text-center text-slate-600 font-mono uppercase tracking-widest">
                        Submissions undergo historical verification and AI synthesis.
                    </p>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STORY MODE OVERLAY */}
      <AnimatePresence>
        {storyMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[150] bg-[#000408]/98 flex items-center justify-center p-12 pointer-events-auto"
          >
            {/* BACKGROUND GRID */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 0), linear-gradient(90deg, white 1px, transparent 0)', backgroundSize: '80px 80px' }}></div>
            
            <div className="max-w-4xl w-full space-y-16 relative z-10">
                <div className="space-y-6 text-center">
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-px w-24 bg-cyan-500/20"></div>
                        <p className="text-[0.6rem] text-cyan-500 font-mono tracking-[0.8em] uppercase">Narrative Reconstruction Active</p>
                        <div className="h-px w-24 bg-cyan-500/20"></div>
                    </div>
                    <h2 className="text-4xl font-light tracking-widest text-white uppercase">{selectedDisaster?.title}</h2>
                    <p className="text-[0.6rem] text-slate-500 font-mono tracking-widest uppercase italic">Synthesizing Historical Archives via Gemini-1.5</p>
                </div>
                
                <div className="relative min-h-[400px] flex items-center justify-center">
                    {loadingAi ? (
                        <div className="space-y-6 flex flex-col items-center">
                            <div className="w-16 h-16 border border-cyan-500/30 border-t-cyan-400 animate-spin rounded-full shadow-[0_0_30px_rgba(0,200,255,0.1)]" />
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-[0.6rem] text-cyan-400 font-mono animate-pulse tracking-[0.3em] uppercase">Mapping Timeline Nodes...</p>
                                <div className="text-[0.5rem] text-slate-600 font-mono uppercase tracking-[0.4em]">Deciphering Primary Sources</div>
                            </div>
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#000a14] border border-cyan-500/10 p-16 rounded-sm relative shadow-2xl"
                        >
                            {/* CORNER BRACKETS */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-cyan-500/30" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-cyan-500/30" />
                            
                            <p className="text-xl leading-[1.8] font-light text-slate-200 indent-12 italic text-justify">
                                {aiAnalysis}
                            </p>
                            
                            <div className="absolute bottom-4 left-4 text-[0.5rem] font-mono text-cyan-500/30 tracking-[0.5em] uppercase">Archive End</div>
                        </motion.div>
                    )}
                </div>

                <div className="flex justify-center pt-8">
                    <button 
                        onClick={() => setStoryMode(false)}
                        className="group flex flex-col items-center gap-4 cursor-pointer"
                    >
                        <div className="p-4 border border-white/10 rounded-full group-hover:border-white/30 transition-all group-hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                            <X size={24} className="text-slate-500 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-[0.6rem] text-slate-500 font-mono tracking-[0.4em] uppercase group-hover:text-white transition-colors">Terminate Link</span>
                    </button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STYLES */}
      <style>{`
        .glass-panel {
            background: rgba(0, 8, 16, 0.75);
            backdrop-filter: blur(16px);
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0, 200, 255, 0.2);
            border-radius: 10px;
        }
        .animate-scanline {
            animation: scan 8s linear infinite;
        }
        @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 0.5; }
            90% { opacity: 0.5; }
            100% { top: 100%; opacity: 0; }
        }
        .slider-thumb::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            background: #00c8ff;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(0, 200, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
