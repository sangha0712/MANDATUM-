import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, Lightformer, OrbitControls, Sparkles, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer as ThreeEffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, X } from 'lucide-react';
import { islands } from '../data/world';
import { characters } from '../data/characters';
import { startWorldServerAmbience, stopWorldServerAmbience } from '../utils/audio';
import type { Character, Island } from '../types';
import { BackButton } from '../components/BackButton';
import { CharacterImageViewer } from '../components/CharacterImageViewer';
import { ImagePlaceholder } from '../components/ImagePlaceholder';
import {
  getCharacterImageStyle,
  getCharacterImageUrl,
} from '../utils/characterImages';

interface IslandVisual {
  radius: number;
  surface: string;
  surfaceAccent: string;
  rock: string;
  vegetation: string;
  building: string;
  buildingCount: number;
  treeCount: number;
  sector: string;
}

type PacificDayPhase = 'night' | 'dawn' | 'day' | 'sunset';

interface PacificClock {
  hour: number;
  minute: number;
  label: string;
  zone: string;
  phase: PacificDayPhase;
}

interface WorldAtmosphereConfig {
  background: string;
  skyZenith: string;
  skyHorizon: string;
  skyLower: string;
  fog: string;
  ambientIntensity: number;
  sunIntensity: number;
  sunColor: string;
  hemisphereSky: string;
  hemisphereGround: string;
  hemisphereIntensity: number;
  exposure: number;
  cloudColor: string;
  cloudOpacity: number;
}

const PACIFIC_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZoneName: 'short',
});

const WORLD_ATMOSPHERES: Record<PacificDayPhase, WorldAtmosphereConfig> = {
  night: {
    background: '#01030A',
    skyZenith: '#000106',
    skyHorizon: '#041426',
    skyLower: '#061B30',
    fog: '#03101E',
    ambientIntensity: 0.14,
    sunIntensity: 0.18,
    sunColor: '#7897C8',
    hemisphereSky: '#123858',
    hemisphereGround: '#010203',
    hemisphereIntensity: 0.34,
    exposure: 0.64,
    cloudColor: '#0B3857',
    cloudOpacity: 0.12,
  },
  dawn: {
    background: '#080A23',
    skyZenith: '#02051A',
    skyHorizon: '#38235A',
    skyLower: '#142A4D',
    fog: '#111C38',
    ambientIntensity: 0.18,
    sunIntensity: 1.75,
    sunColor: '#FFBE83',
    hemisphereSky: '#345A8A',
    hemisphereGround: '#02040B',
    hemisphereIntensity: 0.35,
    exposure: 0.7,
    cloudColor: '#1C4B70',
    cloudOpacity: 0.14,
  },
  day: {
    background: '#020A18',
    skyZenith: '#010511',
    skyHorizon: '#072847',
    skyLower: '#0A355A',
    fog: '#06182A',
    ambientIntensity: 0.2,
    sunIntensity: 2.2,
    sunColor: '#FFF3D8',
    hemisphereSky: '#1A638C',
    hemisphereGround: '#01050B',
    hemisphereIntensity: 0.38,
    exposure: 0.72,
    cloudColor: '#174B6A',
    cloudOpacity: 0.14,
  },
  sunset: {
    background: '#11061D',
    skyZenith: '#04051A',
    skyHorizon: '#55224B',
    skyLower: '#18264A',
    fog: '#1B1230',
    ambientIntensity: 0.16,
    sunIntensity: 2,
    sunColor: '#FF8A52',
    hemisphereSky: '#493E79',
    hemisphereGround: '#03030B',
    hemisphereIntensity: 0.32,
    exposure: 0.68,
    cloudColor: '#263E70',
    cloudOpacity: 0.13,
  },
};

function getPacificClock(): PacificClock {
  const parts = PACIFIC_TIME_FORMATTER.formatToParts(new Date());
  const getPart = (type: Intl.DateTimeFormatPartTypes) => (
    parts.find((part) => part.type === type)?.value ?? ''
  );
  const hour = Number(getPart('hour'));
  const minute = Number(getPart('minute'));
  const zone = getPart('timeZoneName');
  const phase: PacificDayPhase = hour < 5 || hour >= 20
    ? 'night'
    : hour < 8
      ? 'dawn'
      : hour < 17
        ? 'day'
        : 'sunset';

  return {
    hour,
    minute,
    zone,
    phase,
    label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
  };
}

function getSunPosition(clock: PacificClock): [number, number, number] {
  if (clock.phase === 'night') return [-52, 16, -46];

  const hour = clock.hour + clock.minute / 60;
  const daylightProgress = THREE.MathUtils.clamp((hour - 5) / 15, 0, 1);
  const angle = daylightProgress * Math.PI;

  return [
    Math.cos(angle) * 82,
    5 + Math.sin(angle) * 64,
    -46 + Math.sin(angle * 0.8) * 18,
  ];
}

const SKY_VERTEX_SHADER = `
  varying vec3 vSkyDirection;

  void main() {
    vSkyDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT_SHADER = `
  uniform vec3 zenithColor;
  uniform vec3 horizonColor;
  uniform vec3 lowerColor;
  uniform vec3 sunColor;
  uniform vec3 sunDirection;
  uniform float sunStrength;
  varying vec3 vSkyDirection;

  void main() {
    vec3 direction = normalize(vSkyDirection);
    float height = direction.y;
    float lowerBlend = smoothstep(-0.72, -0.04, height);
    float upperBlend = smoothstep(-0.06, 0.82, height);
    vec3 sky = mix(lowerColor, horizonColor, lowerBlend);
    sky = mix(sky, zenithColor, upperBlend);

    float horizonGlow = exp(-pow((height + 0.015) * 5.0, 2.0));
    sky += horizonColor * horizonGlow * 0.08;

    float sunAlignment = max(dot(direction, normalize(sunDirection)), 0.0);
    float sunHalo = pow(sunAlignment, 20.0) * 0.16;
    float sunCore = smoothstep(0.9994, 0.99982, sunAlignment);
    sky += sunColor * (sunHalo + sunCore * 0.7) * sunStrength;

    float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    sky += (dither - 0.5) / 255.0;
    gl_FragColor = vec4(sky, 1.0);
  }
`;

const COLOR_GRADE_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    saturation: { value: 1.12 },
    contrast: { value: 1.08 },
    brightness: { value: -0.01 },
    vignette: { value: 0.15 },
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float saturation;
    uniform float contrast;
    uniform float brightness;
    uniform float vignette;
    varying vec2 vUv;

    void main() {
      vec4 source = texture2D(tDiffuse, vUv);
      float luminance = dot(source.rgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 color = mix(vec3(luminance), source.rgb, saturation);
      color = (color - 0.5) * contrast + 0.5 + brightness;

      vec2 centeredUv = vUv - 0.5;
      float edge = smoothstep(0.28, 0.74, length(centeredUv));
      color *= 1.0 - edge * vignette;
      gl_FragColor = vec4(max(color, 0.0), source.a);
    }
  `,
};

function SkyDome({
  phase,
  sunPosition,
}: {
  phase: PacificDayPhase;
  sunPosition: [number, number, number];
}) {
  const domeRef = useRef<THREE.Mesh>(null);
  const atmosphere = WORLD_ATMOSPHERES[phase];
  const uniforms = useMemo(() => ({
    zenithColor: { value: new THREE.Color(atmosphere.skyZenith) },
    horizonColor: { value: new THREE.Color(atmosphere.skyHorizon) },
    lowerColor: { value: new THREE.Color(atmosphere.skyLower) },
    sunColor: { value: new THREE.Color(atmosphere.sunColor) },
    sunDirection: { value: new THREE.Vector3(...sunPosition).normalize() },
    sunStrength: { value: phase === 'night' ? 0 : 1 },
  }), [
    atmosphere.skyHorizon,
    atmosphere.skyLower,
    atmosphere.skyZenith,
    atmosphere.sunColor,
    phase,
    sunPosition,
  ]);

  useFrame(({ camera }) => {
    domeRef.current?.position.copy(camera.position);
  });

  return (
    <mesh ref={domeRef} frustumCulled={false} renderOrder={-1000}>
      <sphereGeometry args={[180, 48, 24]} />
      <shaderMaterial
        key={phase}
        uniforms={uniforms}
        vertexShader={SKY_VERTEX_SHADER}
        fragmentShader={SKY_FRAGMENT_SHADER}
        side={THREE.BackSide}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
        fog={false}
      />
    </mesh>
  );
}

function SceneAtmosphere({ clock, lowPower }: { clock: PacificClock; lowPower: boolean }) {
  const { gl } = useThree();
  const atmosphere = WORLD_ATMOSPHERES[clock.phase];
  const sunPosition = getSunPosition(clock);

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = atmosphere.exposure;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.shadowMap.enabled = !lowPower;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.shadowMap.needsUpdate = true;
  }, [atmosphere.exposure, gl, lowPower]);

  return (
    <>
      <color attach="background" args={[atmosphere.background]} />
      <SkyDome phase={clock.phase} sunPosition={sunPosition} />

      <Environment
        key={clock.phase}
        resolution={lowPower ? 64 : 128}
        frames={1}
        background={false}
        environmentIntensity={clock.phase === 'day' ? 0.54 : 0.42}
      >
        <Lightformer
          form="rect"
          color={atmosphere.sunColor}
          intensity={clock.phase === 'day' ? 2.8 : 2}
          position={[0, 38, -32]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[42, 28, 1]}
        />
        <Lightformer
          form="ring"
          color={clock.phase === 'sunset' ? '#7387C5' : '#80B7FF'}
          intensity={clock.phase === 'night' ? 1.7 : 0.8}
          position={[-28, 8, 26]}
          rotation={[0, Math.PI / 4, 0]}
          scale={18}
        />
        <Lightformer
          form="rect"
          color={atmosphere.hemisphereSky}
          intensity={1.2}
          position={[34, 10, 20]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={[18, 12, 1]}
        />
      </Environment>

      {clock.phase !== 'day' && (
        <Stars
          radius={128}
          depth={44}
          count={lowPower ? (clock.phase === 'night' ? 420 : 120) : (clock.phase === 'night' ? 1250 : 260)}
          factor={clock.phase === 'night' ? 2.6 : 1.25}
          saturation={0.08}
          fade
          speed={0.06}
        />
      )}

      {clock.phase !== 'night' && (
        <group position={sunPosition}>
          <mesh>
            <sphereGeometry args={[2.35, 24, 24]} />
            <meshBasicMaterial color={atmosphere.sunColor} toneMapped={false} />
          </mesh>
          <mesh scale={2.6}>
            <sphereGeometry args={[2.35, 18, 18]} />
            <meshBasicMaterial
              color={atmosphere.sunColor}
              transparent
              opacity={0.075}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      )}

      <ambientLight intensity={atmosphere.ambientIntensity} />
      <directionalLight
        castShadow={!lowPower}
        position={sunPosition}
        intensity={atmosphere.sunIntensity}
        color={atmosphere.sunColor}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-62}
        shadow-camera-right={62}
        shadow-camera-top={62}
        shadow-camera-bottom={-62}
        shadow-camera-near={1}
        shadow-camera-far={150}
        shadow-radius={clock.phase === 'day' ? 3 : 5}
        shadow-bias={-0.00012}
      />
      <directionalLight
        position={[-34, 18, 28]}
        intensity={clock.phase === 'night' ? 0.32 : 0.16}
        color={clock.phase === 'sunset' ? '#748CC8' : '#6E9CE5'}
      />
      <hemisphereLight
        args={[
          atmosphere.hemisphereSky,
          atmosphere.hemisphereGround,
          atmosphere.hemisphereIntensity,
        ]}
      />
      <fog
        attach="fog"
        args={[atmosphere.fog, clock.phase === 'night' ? 130 : 155, 250]}
      />
    </>
  );
}

function CinematicPostProcessing({ phase }: { phase: PacificDayPhase }) {
  const { gl, scene, camera, size } = useThree();
  const composerState = useMemo(() => {
    const composer = new ThreeEffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      phase === 'night' ? 0.25 : phase === 'day' ? 0.16 : 0.2,
      0.42,
      0.9,
    );
    const colorGradePass = new ShaderPass(COLOR_GRADE_SHADER);
    const fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = gl.getPixelRatio();
    fxaaPass.material.uniforms.resolution.value.set(
      1 / (size.width * pixelRatio),
      1 / (size.height * pixelRatio),
    );
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());
    composer.addPass(colorGradePass);
    composer.addPass(fxaaPass);
    return { composer, bloomPass, colorGradePass, fxaaPass };
  }, [camera, gl, scene]);

  useEffect(() => {
    composerState.bloomPass.strength = phase === 'night'
      ? 0.25
      : phase === 'day'
        ? 0.16
        : 0.2;
  }, [composerState.bloomPass, phase]);

  useEffect(() => {
    const uniforms = composerState.colorGradePass.material.uniforms;
    uniforms.saturation.value = phase === 'day'
      ? 1.25
      : phase === 'night'
        ? 1.12
        : 1.28;
    uniforms.contrast.value = phase === 'night' ? 1.2 : 1.18;
    uniforms.brightness.value = -0.03;
    uniforms.vignette.value = phase === 'night' ? 0.25 : 0.2;
  }, [composerState.colorGradePass, phase]);

  useEffect(() => {
    composerState.composer.setSize(size.width, size.height);
    const pixelRatio = gl.getPixelRatio();
    composerState.fxaaPass.material.uniforms.resolution.value.set(
      1 / (size.width * pixelRatio),
      1 / (size.height * pixelRatio),
    );
  }, [composerState.composer, composerState.fxaaPass, gl, size.height, size.width]);

  useEffect(() => () => {
    composerState.composer.dispose();
  }, [composerState.composer]);

  useFrame((_, delta) => {
    composerState.composer.render(delta);
  }, 1);

  return null;
}

const ISLAND_VISUALS: Record<string, IslandVisual> = {
  center: {
    radius: 4.5,
    surface: '#465256',
    surfaceAccent: '#71838A',
    rock: '#12191E',
    vegetation: '#42594B',
    building: '#A6B3BA',
    buildingCount: 32,
    treeCount: 8,
    sector: 'C-00',
  },
  north: {
    radius: 3.35,
    surface: '#75858C',
    surfaceAccent: '#B9C8CF',
    rock: '#18232A',
    vegetation: '#536D69',
    building: '#B4C1C7',
    buildingCount: 12,
    treeCount: 16,
    sector: 'N-01',
  },
  south: {
    radius: 3.55,
    surface: '#526950',
    surfaceAccent: '#718660',
    rock: '#181D18',
    vegetation: '#315343',
    building: '#B6B2A4',
    buildingCount: 13,
    treeCount: 20,
    sector: 'S-02',
  },
  east: {
    radius: 3.45,
    surface: '#646E5C',
    surfaceAccent: '#8B825F',
    rock: '#1D211C',
    vegetation: '#425B44',
    building: '#B8B3A7',
    buildingCount: 13,
    treeCount: 17,
    sector: 'E-03',
  },
  west: {
    radius: 3.25,
    surface: '#6D654E',
    surfaceAccent: '#8A7854',
    rock: '#211D17',
    vegetation: '#596143',
    building: '#B9AE96',
    buildingCount: 12,
    treeCount: 14,
    sector: 'W-04',
  },
};

function createSeededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(value: string) {
  return value.split('').reduce((seed, character) => (
    Math.imul(seed ^ character.charCodeAt(0), 16777619)
  ), 2166136261);
}

function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function createProceduralTexture(
  baseColor: string,
  accentColor: string,
  seed: number,
  mode: 'terrain' | 'rock',
) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d')!;
  const random = createSeededRandom(seed);
  const accent = hexToRgb(accentColor);

  context.fillStyle = baseColor;
  context.fillRect(0, 0, size, size);

  if (mode === 'terrain') {
    for (let index = 0; index < 2600; index += 1) {
      const opacity = 0.035 + random() * 0.14;
      const radius = 0.35 + random() * 1.8;
      context.fillStyle = `rgba(${accent.r},${accent.g},${accent.b},${opacity})`;
      context.beginPath();
      context.arc(random() * size, random() * size, radius, 0, Math.PI * 2);
      context.fill();
    }

    context.lineWidth = 0.55;
    for (let line = 0; line < 42; line += 1) {
      const y = random() * size;
      context.strokeStyle = `rgba(225,236,238,${0.025 + random() * 0.055})`;
      context.beginPath();
      context.moveTo(-8, y);
      for (let x = 0; x <= size + 8; x += 8) {
        context.lineTo(x, y + Math.sin(x * 0.11 + line) * (1.5 + random() * 2.5));
      }
      context.stroke();
    }
  } else {
    for (let band = 0; band < 56; band += 1) {
      const y = (band / 56) * size + random() * 3;
      context.strokeStyle = `rgba(${accent.r},${accent.g},${accent.b},${0.06 + random() * 0.16})`;
      context.lineWidth = 0.65 + random() * 1.5;
      context.beginPath();
      context.moveTo(-5, y);
      for (let x = 0; x <= size + 5; x += 6) {
        context.lineTo(x, y + (random() - 0.5) * 4);
      }
      context.stroke();
    }

    for (let crack = 0; crack < 84; crack += 1) {
      const x = random() * size;
      const y = random() * size;
      context.strokeStyle = `rgba(2,5,7,${0.16 + random() * 0.2})`;
      context.lineWidth = 0.45 + random() * 0.8;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + (random() - 0.5) * 10, y + 5 + random() * 15);
      context.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(mode === 'terrain' ? 3 : 2, mode === 'terrain' ? 3 : 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function WorldCamera({ selectedIsland }: { selectedIsland: Island | null }) {
  const controlsRef = useRef<any>(null);
  const transitionRef = useRef(1);

  const destination = useMemo(() => {
    if (!selectedIsland) {
      return {
        camera: new THREE.Vector3(44, 40, 70),
        target: new THREE.Vector3(0, 0, 0),
      };
    }

    const islandPosition = new THREE.Vector3(...selectedIsland.position);
    return {
      camera: islandPosition.clone().add(new THREE.Vector3(10, 10, 16)),
      target: islandPosition.clone().add(new THREE.Vector3(2.2, -0.2, 0)),
    };
  }, [selectedIsland]);

  useEffect(() => {
    transitionRef.current = 1;
  }, [selectedIsland?.id]);

  useFrame(({ camera }, delta) => {
    const controls = controlsRef.current;
    if (!controls || transitionRef.current < 0.001) return;

    const smoothing = 1 - Math.exp(-delta * 3.4);
    camera.position.lerp(destination.camera, smoothing);
    controls.target.lerp(destination.target, smoothing);
    controls.update();
    transitionRef.current *= Math.exp(-delta * 3.4);
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping
      dampingFactor={0.07}
      minDistance={9}
      maxDistance={115}
      minPolarAngle={0.45}
      maxPolarAngle={Math.PI * 0.72}
    />
  );
}

function MapGuides() {
  return (
    <group position={[0, -8.5, 0]}>
      <gridHelper
        args={[110, 44, '#138BD0', '#07203A']}
        material-transparent
        material-opacity={0.18}
      />
      {[12, 24, 36].map((radius) => (
        <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[radius - 0.07, radius + 0.07, 96]} />
          <meshBasicMaterial
            color="#1AA8E8"
            transparent
            opacity={0.26}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

function BridgeCable({
  points,
  radius = 0.035,
  color = '#2A7DA8',
  emissive = '#0875B5',
}: {
  points: THREE.Vector3[];
  radius?: number;
  color?: string;
  emissive?: string;
}) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);

  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 64, radius, 6, false]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={0.55}
        metalness={0.82}
        roughness={0.24}
      />
    </mesh>
  );
}

function AetherBridge({
  outerIsland,
  selectedIslandId,
}: {
  outerIsland: Island;
  selectedIslandId?: string;
}) {
  const geometry = useMemo(() => {
    const centerIsland = islands.find((island) => island.id === 'center')!;
    const center = new THREE.Vector3(...centerIsland.position);
    const outer = new THREE.Vector3(...outerIsland.position);
    const direction = outer.clone().sub(center);
    direction.y = 0;
    direction.normalize();

    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
    const start = center.clone().add(direction.clone().multiplyScalar(ISLAND_VISUALS.center.radius + 0.38));
    const end = outer.clone().sub(direction.clone().multiplyScalar(ISLAND_VISUALS[outerIsland.id].radius + 0.38));
    start.y = 1.02;
    end.y = 1.02;

    const span = start.distanceTo(end);
    const segmentCount = Math.max(14, Math.round(span / 1.7));
    const segmentLength = span / segmentCount;
    const yaw = -Math.atan2(direction.z, direction.x);

    const deckPoints = Array.from({ length: segmentCount + 1 }, (_, index) => {
      const progress = index / segmentCount;
      const point = start.clone().lerp(end, progress);
      point.y -= Math.sin(progress * Math.PI) * 0.62;
      return point;
    });

    const cablePoints = (side: number) => deckPoints.map((point, index) => {
      const progress = index / segmentCount;
      const cableHeight = 0.82 + Math.pow(Math.abs(progress - 0.5) * 2, 2) * 1.9;
      return point.clone()
        .add(perpendicular.clone().multiplyScalar(side * 0.58))
        .add(new THREE.Vector3(0, cableHeight, 0));
    });

    return {
      start,
      end,
      direction,
      perpendicular,
      segmentCount,
      segmentLength,
      yaw,
      deckPoints,
      leftCable: cablePoints(-1),
      rightCable: cablePoints(1),
    };
  }, [outerIsland]);

  const highlighted = selectedIslandId === 'center' || selectedIslandId === outerIsland.id;

  return (
    <group>
      {geometry.deckPoints.slice(0, -1).map((point, index) => {
        const nextPoint = geometry.deckPoints[index + 1];
        const center = point.clone().lerp(nextPoint, 0.5);
        const pitch = Math.atan2(nextPoint.y - point.y, geometry.segmentLength);
        const cableIndex = Math.min(index, geometry.leftCable.length - 1);
        const showHanger = index % 2 === 0 && index > 0 && index < geometry.segmentCount - 1;

        return (
          <group key={index} position={center} rotation={[0, geometry.yaw, pitch]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[geometry.segmentLength * 0.91, 0.15, 0.88]} />
              <meshStandardMaterial
                color="#071725"
                emissive="#0874B0"
                emissiveIntensity={highlighted ? 0.28 : 0.12}
                metalness={0.66}
                roughness={0.38}
              />
            </mesh>
            <mesh position={[0, 0.095, -0.35]}>
              <boxGeometry args={[geometry.segmentLength * 0.82, 0.035, 0.055]} />
              <meshStandardMaterial color="#76D7FF" emissive="#20B8FF" emissiveIntensity={highlighted ? 1.08 : 0.62} />
            </mesh>
            <mesh position={[0, 0.095, 0.35]}>
              <boxGeometry args={[geometry.segmentLength * 0.82, 0.035, 0.055]} />
              <meshStandardMaterial color="#76D7FF" emissive="#20B8FF" emissiveIntensity={highlighted ? 1.08 : 0.62} />
            </mesh>
            <mesh position={[0, -0.2, -0.4]} rotation={[0, 0, index % 2 === 0 ? 0.34 : -0.34]} castShadow>
              <boxGeometry args={[geometry.segmentLength * 0.78, 0.055, 0.07]} />
              <meshStandardMaterial color="#123D58" emissive="#0A5F91" emissiveIntensity={0.25} metalness={0.84} roughness={0.24} />
            </mesh>
            <mesh position={[0, -0.2, 0.4]} rotation={[0, 0, index % 2 === 0 ? -0.34 : 0.34]} castShadow>
              <boxGeometry args={[geometry.segmentLength * 0.78, 0.055, 0.07]} />
              <meshStandardMaterial color="#123D58" emissive="#0A5F91" emissiveIntensity={0.25} metalness={0.84} roughness={0.24} />
            </mesh>

            {showHanger && (
              <>
                {[-1, 1].map((side) => {
                  const cablePoint = side < 0 ? geometry.leftCable[cableIndex] : geometry.rightCable[cableIndex];
                  const deckPoint = geometry.deckPoints[cableIndex];
                  const height = Math.max(0.4, cablePoint.y - deckPoint.y);
                  return (
                    <mesh key={side} position={[0, height / 2, side * 0.58]}>
                      <cylinderGeometry args={[0.018, 0.018, height, 6]} />
                      <meshStandardMaterial color="#2B83AA" emissive="#0875B5" emissiveIntensity={0.35} metalness={0.82} roughness={0.24} />
                    </mesh>
                  );
                })}
              </>
            )}
          </group>
        );
      })}

      <BridgeCable points={geometry.leftCable} />
      <BridgeCable points={geometry.rightCable} />
      <BridgeCable
        points={geometry.deckPoints.map((point) => point.clone().add(new THREE.Vector3(0, -0.13, 0)))}
        radius={0.025}
        color="#4D8DFF"
        emissive="#4D8DFF"
      />

      {[geometry.start, geometry.end].map((anchor, anchorIndex) => (
        <group key={anchorIndex} position={anchor} rotation={[0, geometry.yaw, 0]}>
          {[-1, 1].map((side) => (
            <group key={side} position={[0, 0, side * 0.64]}>
              <mesh position={[0, 1.25, 0]} castShadow>
                <boxGeometry args={[0.24, 2.5, 0.24]} />
                <meshStandardMaterial color="#0B2B40" emissive="#0C689B" emissiveIntensity={0.25} metalness={0.82} roughness={0.24} />
              </mesh>
              <mesh position={[0, 2.5, 0]}>
                <boxGeometry args={[0.32, 0.12, 0.32]} />
                <meshStandardMaterial color="#8AB8FF" emissive="#4D8DFF" emissiveIntensity={0.8} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 2.15, 0]} castShadow>
            <boxGeometry args={[0.22, 0.18, 1.55]} />
            <meshStandardMaterial color="#123A52" emissive="#0B6193" emissiveIntensity={0.24} metalness={0.86} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function BridgeNetwork({ selectedIslandId }: { selectedIslandId?: string }) {
  return (
    <group>
      {islands
        .filter((island) => island.id !== 'center')
        .map((island) => (
          <AetherBridge
            key={island.id}
            outerIsland={island}
            selectedIslandId={selectedIslandId}
          />
        ))}
    </group>
  );
}

const CLOUD_VERTEX_SHADER = `
  varying vec2 vCloudUv;

  void main() {
    vCloudUv = uv;
    vec4 instancePosition = instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * instancePosition;
  }
`;

const CLOUD_FRAGMENT_SHADER = `
  uniform vec3 cloudColor;
  uniform float cloudOpacity;
  varying vec2 vCloudUv;

  float cloudNoise(vec2 point) {
    return sin(point.x * 8.7 + sin(point.y * 5.3)) * 0.055
      + sin(point.y * 11.1 - point.x * 2.4) * 0.035;
  }

  void main() {
    vec2 point = (vCloudUv - 0.5) * 2.0;
    float distanceFromCenter = length(point);
    float edge = 0.9 + cloudNoise(point);
    float body = 1.0 - smoothstep(0.35, edge, distanceFromCenter);
    float innerGlow = 1.0 - smoothstep(0.0, 1.0, distanceFromCenter);
    float alpha = body * cloudOpacity;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(cloudColor * (0.82 + innerGlow * 0.18), alpha);
  }
`;

function CloudDeck({ phase, lowPower }: { phase: PacificDayPhase; lowPower: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const cloudPuffs = useMemo(() => {
    const random = createSeededRandom(4198);
    const clusters = lowPower ? 10 : 16;
    const puffsPerCluster = lowPower ? 4 : 6;

    return Array.from({ length: clusters }, () => {
      const centerX = (random() - 0.5) * 126;
      const centerZ = (random() - 0.5) * 126;
      const clusterWidth = 8 + random() * 11;
      return Array.from({ length: puffsPerCluster }, (_, puffIndex) => ({
        position: [
          centerX + (random() - 0.5) * clusterWidth,
          -16.8 + random() * 2.4 + puffIndex * 0.012,
          centerZ + (random() - 0.5) * clusterWidth * 0.72,
        ] as [number, number, number],
        scale: [
          7 + random() * 11,
          4.2 + random() * 7.5,
        ] as [number, number],
        rotation: random() * Math.PI,
      }));
    }).flat();
  }, [lowPower]);

  const atmosphere = WORLD_ATMOSPHERES[phase];
  const uniforms = useMemo(() => ({
    cloudColor: { value: new THREE.Color(atmosphere.cloudColor) },
    cloudOpacity: { value: atmosphere.cloudOpacity * (lowPower ? 0.62 : 0.72) },
  }), [atmosphere.cloudColor, atmosphere.cloudOpacity, lowPower]);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const transform = new THREE.Object3D();
    cloudPuffs.forEach((cloud, index) => {
      transform.position.set(...cloud.position);
      transform.rotation.set(-Math.PI / 2, 0, cloud.rotation);
      transform.scale.set(cloud.scale[0], cloud.scale[1], 1);
      transform.updateMatrix();
      meshRef.current?.setMatrixAt(index, transform.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [cloudPuffs]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, cloudPuffs.length]}
      frustumCulled={false}
      renderOrder={-20}
    >
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        key={`${phase}-${lowPower ? 'mobile' : 'desktop'}`}
        uniforms={uniforms}
        vertexShader={CLOUD_VERTEX_SHADER}
        fragmentShader={CLOUD_FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

function CitySurface({
  island,
  visual,
  phase,
}: {
  island: Island;
  visual: IslandVisual;
  phase: PacificDayPhase;
}) {
  const layout = useMemo(() => {
    const random = createSeededRandom(seedFromString(island.id));
    const buildings = Array.from({ length: visual.buildingCount }, (_, index) => {
      const angle = random() * Math.PI * 2;
      const distance = 1.05 + Math.sqrt(random()) * (visual.radius - 1.5);
      const height = (island.id === 'center' ? 0.7 : 0.46) + random() * (island.id === 'center' ? 1.55 : 0.86);
      return {
        x: Math.cos(angle) * distance,
        z: Math.sin(angle) * distance,
        width: 0.28 + random() * 0.36,
        depth: 0.26 + random() * 0.34,
        height,
        rotation: random() * Math.PI,
        tone: index % 4 === 0 ? visual.surfaceAccent : visual.building,
        roofScale: 0.62 + random() * 0.2,
        hasAntenna: index % (island.id === 'center' ? 5 : 7) === 0,
        windowGlow: index % 3 === 0 ? '#8AB8FF' : '#6B8395',
      };
    });

    const trees = Array.from({ length: visual.treeCount }, () => {
      const angle = random() * Math.PI * 2;
      const distance = 1.25 + Math.sqrt(random()) * (visual.radius - 1.55);
      return {
        x: Math.cos(angle) * distance,
        z: Math.sin(angle) * distance,
        scale: 0.72 + random() * 0.5,
      };
    });

    const traffic = Array.from({ length: island.id === 'center' ? 10 : 4 }, (_, index) => {
      const alongX = index % 2 === 0;
      const offset = -visual.radius * 0.62 + random() * visual.radius * 1.24;
      return {
        x: alongX ? offset : (index % 4 < 2 ? -0.045 : 0.045),
        z: alongX ? (index % 4 < 2 ? -0.045 : 0.045) : offset,
        rotation: alongX ? 0 : Math.PI / 2,
        color: index % 5 === 0 ? '#8B3E45' : index % 3 === 0 ? '#516B7B' : '#CBD4D8',
      };
    });

    return { buildings, trees, traffic };
  }, [island.id, visual]);

  const headquartersHeight = island.id === 'center' ? 1.85 : 1.25;
  const windowIntensity = phase === 'night'
    ? 1
    : phase === 'dawn' || phase === 'sunset'
      ? 0.58
      : 0.16;

  return (
    <group>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[visual.radius * 1.55, 0.04, 0.13]} />
        <meshStandardMaterial color="#1B252C" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.905, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[visual.radius * 1.55, 0.04, 0.13]} />
        <meshStandardMaterial color="#1B252C" roughness={0.85} />
      </mesh>
      {[-0.1, 0.1].map((offset) => (
        <group key={`road-curb-${offset}`}>
          <mesh position={[0, 0.94, offset]} castShadow receiveShadow>
            <boxGeometry args={[visual.radius * 1.58, 0.045, 0.025]} />
            <meshStandardMaterial color="#68747A" metalness={0.18} roughness={0.7} />
          </mesh>
          <mesh position={[offset, 0.942, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[visual.radius * 1.58, 0.045, 0.025]} />
            <meshStandardMaterial color="#68747A" metalness={0.18} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {Array.from({ length: 10 }, (_, index) => {
        const offset = -visual.radius * 0.68 + index * (visual.radius * 1.36 / 9);
        return (
          <group key={`lane-marker-${index}`}>
            <mesh position={[offset, 0.935, 0]} receiveShadow>
              <boxGeometry args={[0.18, 0.012, 0.018]} />
              <meshStandardMaterial color="#82919A" emissive="#4D8DFF" emissiveIntensity={0.04} roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.937, offset]} receiveShadow>
              <boxGeometry args={[0.018, 0.012, 0.18]} />
              <meshStandardMaterial color="#82919A" emissive="#4D8DFF" emissiveIntensity={0.04} roughness={0.7} />
            </mesh>
          </group>
        );
      })}

      {[0, 1, 2, 3].map((index) => {
        const angle = index * Math.PI / 2;
        const distance = visual.radius * 0.58;
        return (
          <group
            key={`service-node-${index}`}
            position={[Math.cos(angle) * distance, 0.96, Math.sin(angle) * distance]}
            rotation={[0, -angle, 0]}
          >
            <mesh castShadow>
              <cylinderGeometry args={[0.12, 0.15, 0.1, 8]} />
              <meshStandardMaterial color="#263640" metalness={0.62} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.075, 0]}>
              <cylinderGeometry args={[0.055, 0.055, 0.03, 8]} />
              <meshStandardMaterial color="#8AB8FF" emissive="#4D8DFF" emissiveIntensity={0.7} />
            </mesh>
          </group>
        );
      })}

      <mesh position={[0, 0.918, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <torusGeometry args={[visual.radius * 0.49, island.id === 'center' ? 0.075 : 0.06, 8, 64]} />
        <meshStandardMaterial color="#24333D" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.956, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[visual.radius * 0.49, 0.012, 5, 64]} />
        <meshStandardMaterial color="#8194A0" emissive="#4D8DFF" emissiveIntensity={windowIntensity * 0.18} />
      </mesh>

      {[-0.64, -0.43, -0.22, 0.22, 0.43, 0.64].map((fraction) => {
        const offset = fraction * visual.radius;
        const lampGlow = 0.18 + windowIntensity * 0.78;
        return (
          <group key={`street-light-${fraction}`}>
            <group position={[offset, 0.95, 0.19]}>
              <mesh position={[0, 0.16, 0]} castShadow>
                <cylinderGeometry args={[0.012, 0.018, 0.32, 6]} />
                <meshStandardMaterial color="#40525E" metalness={0.76} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.33, 0]}>
                <boxGeometry args={[0.07, 0.035, 0.07]} />
                <meshStandardMaterial color="#AFCFFF" emissive="#4D8DFF" emissiveIntensity={lampGlow} toneMapped={false} />
              </mesh>
            </group>
            <group position={[0.19, 0.95, offset]}>
              <mesh position={[0, 0.16, 0]} castShadow>
                <cylinderGeometry args={[0.012, 0.018, 0.32, 6]} />
                <meshStandardMaterial color="#40525E" metalness={0.76} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.33, 0]}>
                <boxGeometry args={[0.07, 0.035, 0.07]} />
                <meshStandardMaterial color="#AFCFFF" emissive="#4D8DFF" emissiveIntensity={lampGlow} toneMapped={false} />
              </mesh>
            </group>
          </group>
        );
      })}

      {layout.traffic.map((vehicle, index) => (
        <group
          key={`traffic-${index}`}
          position={[vehicle.x, 0.98, vehicle.z]}
          rotation={[0, vehicle.rotation, 0]}
        >
          <mesh castShadow>
            <boxGeometry args={[0.14, 0.065, 0.075]} />
            <meshStandardMaterial color={vehicle.color} metalness={0.46} roughness={0.34} />
          </mesh>
          <mesh position={[0.073, 0, -0.021]}>
            <boxGeometry args={[0.008, 0.022, 0.018]} />
            <meshStandardMaterial color="#D8ECFF" emissive="#8AB8FF" emissiveIntensity={0.25 + windowIntensity * 0.9} toneMapped={false} />
          </mesh>
          <mesh position={[-0.073, 0, 0.021]}>
            <boxGeometry args={[0.008, 0.022, 0.018]} />
            <meshStandardMaterial color="#E05A63" emissive="#E05A63" emissiveIntensity={0.18 + windowIntensity * 0.58} toneMapped={false} />
          </mesh>
        </group>
      ))}

      <group
        position={[
          Math.cos(-0.72) * visual.radius * 0.66,
          0.965,
          Math.sin(-0.72) * visual.radius * 0.66,
        ]}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[island.id === 'center' ? 0.38 : 0.3, 32]} />
          <meshStandardMaterial color="#1A252D" metalness={0.36} roughness={0.58} />
        </mesh>
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[
            island.id === 'center' ? 0.3 : 0.23,
            island.id === 'center' ? 0.34 : 0.27,
            32,
          ]} />
          <meshStandardMaterial color="#87B7E8" emissive="#4D8DFF" emissiveIntensity={0.16 + windowIntensity * 0.52} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.28, 0.025, 0.045]} />
          <meshStandardMaterial color="#A7B7C1" emissive="#4D8DFF" emissiveIntensity={windowIntensity * 0.12} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.045, 0.025, 0.28]} />
          <meshStandardMaterial color="#A7B7C1" emissive="#4D8DFF" emissiveIntensity={windowIntensity * 0.12} />
        </mesh>
      </group>

      {layout.buildings.map((building, index) => (
        <group
          key={`building-${index}`}
          position={[building.x, 0.91, building.z]}
          rotation={[0, building.rotation, 0]}
        >
          <mesh position={[0, building.height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[building.width, building.height, building.depth]} />
            <meshStandardMaterial
              color={building.tone}
              emissive="#8AB8FF"
              emissiveIntensity={index % 7 === 0 ? 0.1 : 0.015}
              metalness={0.16}
              roughness={0.72}
            />
          </mesh>

          <mesh position={[0, building.height + 0.035, 0]} castShadow>
            <boxGeometry args={[
              building.width * building.roofScale,
              0.07,
              building.depth * building.roofScale,
            ]} />
            <meshStandardMaterial color="#33444F" metalness={0.54} roughness={0.4} />
          </mesh>

          {Array.from({
            length: Math.max(1, Math.min(4, Math.floor(building.height / 0.3))),
          }, (_, rowIndex) => {
            const rowCount = Math.max(1, Math.min(4, Math.floor(building.height / 0.3)));
            const y = building.height * ((rowIndex + 1) / (rowCount + 1));
            const glow = windowIntensity * (index % 3 === 0 ? 0.78 : 0.42);
            return (
              <group key={`window-row-${rowIndex}`}>
                <mesh position={[0, y, building.depth / 2 + 0.006]}>
                  <boxGeometry args={[building.width * 0.68, 0.034, 0.012]} />
                  <meshStandardMaterial color={building.windowGlow} emissive="#4D8DFF" emissiveIntensity={glow} />
                </mesh>
                <mesh position={[0, y, -building.depth / 2 - 0.006]}>
                  <boxGeometry args={[building.width * 0.68, 0.034, 0.012]} />
                  <meshStandardMaterial color={building.windowGlow} emissive="#4D8DFF" emissiveIntensity={glow * 0.74} />
                </mesh>
                <mesh position={[building.width / 2 + 0.006, y, 0]}>
                  <boxGeometry args={[0.012, 0.034, building.depth * 0.62]} />
                  <meshStandardMaterial color={building.windowGlow} emissive="#4D8DFF" emissiveIntensity={glow * 0.84} />
                </mesh>
              </group>
            );
          })}

          {building.hasAntenna && (
            <mesh position={[0, building.height + 0.16, 0]} castShadow>
              <cylinderGeometry args={[0.012, 0.018, 0.25, 6]} />
              <meshStandardMaterial color="#8196A4" emissive="#4D8DFF" emissiveIntensity={0.14} metalness={0.72} />
            </mesh>
          )}
          {!building.hasAntenna && (
            <group position={[0, building.height + 0.105, 0]}>
              <mesh castShadow>
                <boxGeometry args={[building.width * 0.34, 0.08, building.depth * 0.3]} />
                <meshStandardMaterial color="#42545F" metalness={0.58} roughness={0.36} />
              </mesh>
              <mesh position={[0, 0.052, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 0.02, 10]} />
                <meshStandardMaterial color="#18242C" metalness={0.7} roughness={0.28} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {layout.trees.map((tree, index) => (
        <group key={`tree-${index}`} position={[tree.x, 0.91, tree.z]} scale={tree.scale}>
          <mesh position={[0, 0.13, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.045, 0.26, 6]} />
            <meshStandardMaterial color="#2A241D" roughness={1} />
          </mesh>
          <mesh position={[0, 0.33, 0]} rotation={[0, index * 0.7, 0]} castShadow>
            <coneGeometry args={[0.2, 0.4, 8]} />
            <meshStandardMaterial
              color={island.id === 'north' ? '#A6B8BC' : visual.vegetation}
              roughness={1}
            />
          </mesh>
          <mesh position={[0, 0.52, 0]} rotation={[0, index * 0.43, 0]} castShadow>
            <coneGeometry args={[0.14, 0.34, 8]} />
            <meshStandardMaterial
              color={island.id === 'north' ? '#C4D0D3' : index % 3 === 0 ? visual.surfaceAccent : visual.vegetation}
              roughness={0.96}
            />
          </mesh>
        </group>
      ))}

      <group position={[0, 0.91, 0]}>
        <mesh position={[0, 0.055, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[
            island.id === 'center' ? 0.72 : 0.56,
            island.id === 'center' ? 0.82 : 0.64,
            0.11,
            island.id === 'center' ? 16 : 12,
          ]} />
          <meshStandardMaterial color="#17242D" metalness={0.64} roughness={0.38} />
        </mesh>
        <mesh position={[0, headquartersHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[
            island.id === 'center' ? 0.95 : 0.72,
            headquartersHeight,
            island.id === 'center' ? 0.95 : 0.72,
          ]} />
          <meshStandardMaterial
            color="#263849"
            emissive="#4D8DFF"
            emissiveIntensity={0.16}
            metalness={0.45}
            roughness={0.38}
          />
        </mesh>
        {[0.28, 0.5, 0.72].map((fraction, index) => {
          const width = island.id === 'center' ? 0.66 : 0.48;
          const depth = island.id === 'center' ? 0.95 : 0.72;
          const glow = windowIntensity * (index === 1 ? 0.9 : 0.62);
          return (
            <group key={`hq-window-${fraction}`}>
              <mesh position={[0, headquartersHeight * fraction, depth / 2 + 0.008]}>
                <boxGeometry args={[width, 0.055, 0.016]} />
                <meshStandardMaterial color="#9BC5F2" emissive="#4D8DFF" emissiveIntensity={glow} toneMapped={false} />
              </mesh>
              <mesh position={[width / 2 + 0.15, headquartersHeight * fraction, 0]}>
                <boxGeometry args={[0.016, 0.055, width]} />
                <meshStandardMaterial color="#9BC5F2" emissive="#4D8DFF" emissiveIntensity={glow * 0.82} toneMapped={false} />
              </mesh>
            </group>
          );
        })}
        <mesh position={[0, headquartersHeight + 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.055, 0.7, 8]} />
          <meshStandardMaterial color="#8AB8FF" emissive="#4D8DFF" emissiveIntensity={0.9} />
        </mesh>
        <mesh position={[0, headquartersHeight + 0.05, 0]} castShadow>
          <boxGeometry args={[
            island.id === 'center' ? 0.72 : 0.54,
            0.12,
            island.id === 'center' ? 0.72 : 0.54,
          ]} />
          <meshStandardMaterial color="#3B5363" metalness={0.7} roughness={0.28} />
        </mesh>
      </group>
    </group>
  );
}

function AetherEngine({ radius, isCenter }: { radius: number; isCenter: boolean }) {
  const upperRingRef = useRef<THREE.Group>(null);
  const lowerRingRef = useRef<THREE.Group>(null);
  const coreMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }, delta) => {
    if (upperRingRef.current) upperRingRef.current.rotation.y += delta * 0.22;
    if (lowerRingRef.current) lowerRingRef.current.rotation.y -= delta * 0.16;
    if (coreMaterialRef.current) {
      coreMaterialRef.current.emissiveIntensity = 1.25 + Math.sin(clock.elapsedTime * 1.7) * 0.18;
    }
  });

  const engineRadius = isCenter ? 1.55 : 1.08;
  const subEngineCount = isCenter ? 6 : 4;

  return (
    <group>
      {Array.from({ length: 6 }, (_, index) => {
        const angle = (index / 6) * Math.PI * 2;
        const length = radius * 0.72;
        return (
          <mesh
            key={`frame-${index}`}
            position={[Math.cos(angle) * length * 0.37, -1.05, Math.sin(angle) * length * 0.37]}
            rotation={[0, -angle, index % 2 === 0 ? 0.16 : -0.16]}
            castShadow
          >
            <boxGeometry args={[length * 0.72, 0.12, 0.16]} />
            <meshStandardMaterial color="#27343E" metalness={0.82} roughness={0.28} />
          </mesh>
        );
      })}

      <mesh position={[0, -2.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[engineRadius * 1.12, engineRadius * 0.82, 2.5, 32]} />
        <meshStandardMaterial color="#17212A" metalness={0.72} roughness={0.34} />
      </mesh>

      {Array.from({ length: isCenter ? 18 : 12 }, (_, index) => {
        const count = isCenter ? 18 : 12;
        const angle = index / count * Math.PI * 2;
        const finRadius = engineRadius * 1.08;
        return (
          <group
            key={`cooling-fin-${index}`}
            position={[Math.cos(angle) * finRadius, -2.25, Math.sin(angle) * finRadius]}
            rotation={[0, -angle, 0]}
          >
            <mesh castShadow>
              <boxGeometry args={[0.07, 1.55, 0.26]} />
              <meshStandardMaterial color="#344652" metalness={0.86} roughness={0.23} />
            </mesh>
            {index % 3 === 0 && (
              <mesh position={[0, -0.48, 0.145]}>
                <boxGeometry args={[0.035, 0.32, 0.02]} />
                <meshStandardMaterial color="#85B7FF" emissive="#4D8DFF" emissiveIntensity={0.72} toneMapped={false} />
              </mesh>
            )}
          </group>
        );
      })}

      <group ref={upperRingRef} position={[0, -1.7, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[engineRadius * 1.42, 0.09, 10, 64]} />
          <meshStandardMaterial color="#465866" metalness={0.88} roughness={0.22} />
        </mesh>
        {[0, 1, 2].map((index) => {
          const angle = (index / 3) * Math.PI * 2;
          return (
            <mesh key={index} position={[Math.cos(angle) * engineRadius * 1.42, 0, Math.sin(angle) * engineRadius * 1.42]}>
              <boxGeometry args={[0.2, 0.18, 0.28]} />
              <meshStandardMaterial color="#8AB8FF" emissive="#4D8DFF" emissiveIntensity={0.35} toneMapped={false} />
            </mesh>
          );
        })}
      </group>

      <group ref={lowerRingRef} position={[0, -2.9, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[engineRadius * 1.2, 0.075, 10, 56]} />
          <meshStandardMaterial color="#364854" metalness={0.86} roughness={0.25} />
        </mesh>
        {[0, 1, 2, 3].map((index) => {
          const angle = (index / 4) * Math.PI * 2;
          return (
            <mesh key={index} position={[Math.cos(angle) * engineRadius * 1.2, 0, Math.sin(angle) * engineRadius * 1.2]}>
              <boxGeometry args={[0.16, 0.14, 0.22]} />
              <meshStandardMaterial color="#61788A" metalness={0.7} roughness={0.3} />
            </mesh>
          );
        })}
      </group>

      {Array.from({ length: subEngineCount }, (_, index) => {
        const angle = (index / subEngineCount) * Math.PI * 2;
        const distance = isCenter ? 2.15 : 1.55;
        return (
          <group key={`sub-engine-${index}`} position={[Math.cos(angle) * distance, -2.05, Math.sin(angle) * distance]}>
            <mesh>
              <cylinderGeometry args={[0.3, 0.24, 1.25, 18]} />
              <meshStandardMaterial color="#1A2630" metalness={0.75} roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.68, 0]}>
              <cylinderGeometry args={[0.18, 0.22, 0.1, 18]} />
              <meshStandardMaterial color="#4D8DFF" emissive="#4D8DFF" emissiveIntensity={0.85} toneMapped={false} />
            </mesh>
          </group>
        );
      })}

      <mesh position={[0, -3.57, 0]}>
        <cylinderGeometry args={[engineRadius * 0.58, engineRadius * 0.68, 0.2, 36]} />
        <meshStandardMaterial
          ref={coreMaterialRef}
          color="#74ABFF"
          emissive="#4D8DFF"
          emissiveIntensity={1.3}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, -5.1, 0]}>
        <cylinderGeometry args={[engineRadius * 0.6, engineRadius * 0.18, 2.85, 36]} />
        <meshBasicMaterial
          color="#4D8DFF"
          transparent
          opacity={0.13}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <Sparkles
        count={isCenter ? 28 : 16}
        position={[0, -5, 0]}
        scale={[engineRadius * 2.4, 3.4, engineRadius * 2.4]}
        size={1.4}
        speed={0.22}
        opacity={0.42}
        color="#8AB8FF"
        noise={0.5}
      />
    </group>
  );
}

function HologramIslandOverlay({
  visual,
  isCenter,
  active,
}: {
  visual: IslandVisual;
  isCenter: boolean;
  active: boolean;
}) {
  const ringsRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.y += delta * (active ? 0.18 : 0.06);
    }
  });

  return (
    <group>
      <mesh position={[0, 0.3, 0]} scale={[1.018, 1.03, 1.018]}>
        <cylinderGeometry
          args={[visual.radius, visual.radius * 0.91, 1.06, isCenter ? 48 : 36, 4]}
        />
        <meshBasicMaterial
          color={active ? '#79E6FF' : '#28B9F5'}
          transparent
          opacity={active ? 0.24 : 0.1}
          wireframe
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh position={[0, -1.3, 0]} scale={[1.02, 1.02, 1.02]}>
        <cylinderGeometry
          args={[visual.radius * 0.88, visual.radius * 0.35, 3.4, isCenter ? 40 : 28, 5]}
        />
        <meshBasicMaterial
          color="#159DD6"
          transparent
          opacity={active ? 0.2 : 0.07}
          wireframe
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <group ref={ringsRef} position={[0, 1.12, 0]}>
        {[1.08, 1.18].map((scale, index) => (
          <mesh
            key={`hologram-ring-${scale}`}
            rotation={[-Math.PI / 2, 0, index * 0.36]}
            scale={scale}
          >
            <ringGeometry
              args={[
                visual.radius + 0.12 + index * 0.1,
                visual.radius + 0.16 + index * 0.1,
                96,
                1,
                index * 0.4,
                Math.PI * (index === 0 ? 1.72 : 1.34),
              ]}
            />
            <meshBasicMaterial
              color={index === 0 ? '#65DFFF' : '#208ED5'}
              transparent
              opacity={active ? 0.72 - index * 0.18 : 0.3 - index * 0.08}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      <mesh position={[0, -5.25, 0]}>
        <cylinderGeometry args={[0.025, 0.22, 6.5, 16, 1, true]} />
        <meshBasicMaterial
          color="#159DFF"
          transparent
          opacity={active ? 0.22 : 0.08}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      <Sparkles
        count={isCenter ? 30 : 18}
        position={[0, -0.8, 0]}
        scale={[visual.radius * 2.1, 5.5, visual.radius * 2.1]}
        size={1.1}
        speed={0.18}
        opacity={active ? 0.65 : 0.28}
        color="#55D8FF"
        noise={0.8}
      />
    </group>
  );
}

function IslandModel({
  island,
  isHovered,
  isSelected,
  phase,
}: {
  island: Island;
  isHovered: boolean;
  isSelected: boolean;
  phase: PacificDayPhase;
}) {
  const visual = ISLAND_VISUALS[island.id];
  const isCenter = island.id === 'center';
  const textures = useMemo(() => ({
    terrain: createProceduralTexture(
      visual.surface,
      visual.surfaceAccent,
      seedFromString(`${island.id}-terrain`),
      'terrain',
    ),
    rock: createProceduralTexture(
      visual.rock,
      '#52616A',
      seedFromString(`${island.id}-rock`),
      'rock',
    ),
  }), [island.id, visual]);

  const relief = useMemo(() => {
    const random = createSeededRandom(seedFromString(`${island.id}-relief`));
    return Array.from({ length: isCenter ? 12 : 16 }, () => {
      const angle = random() * Math.PI * 2;
      const distance = 1.25 + Math.sqrt(random()) * (visual.radius - 1.45);
      return {
        x: Math.cos(angle) * distance,
        z: Math.sin(angle) * distance,
        rotation: random() * Math.PI,
        scale: [
          0.35 + random() * 0.55,
          0.12 + random() * 0.28,
          0.32 + random() * 0.55,
        ] as [number, number, number],
      };
    });
  }, [isCenter, island.id, visual.radius]);

  useEffect(() => () => {
    textures.terrain.dispose();
    textures.rock.dispose();
  }, [textures]);

  return (
    <group>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[visual.radius, visual.radius * 0.91, 1.06, isCenter ? 64 : 48]} />
        <meshStandardMaterial
          color="#FFFFFF"
          map={textures.terrain}
          bumpMap={textures.terrain}
          bumpScale={0.055}
          emissive={isHovered || isSelected ? '#4D8DFF' : '#000000'}
          emissiveIntensity={isHovered ? 0.16 : isSelected ? 0.08 : 0}
          roughness={0.82}
        />
      </mesh>
      <mesh position={[0, 0.84, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[visual.radius * 0.92, visual.radius * 0.96, 0.13, isCenter ? 64 : 48]} />
        <meshStandardMaterial
          color="#FFFFFF"
          map={textures.terrain}
          bumpMap={textures.terrain}
          bumpScale={0.09}
          roughness={0.88}
        />
      </mesh>

      <mesh position={[0, -0.48, 0]} rotation={[0, 0.08, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[visual.radius * 0.89, visual.radius * 0.67, 1.46, isCenter ? 56 : 40]} />
        <meshStandardMaterial color="#FFFFFF" map={textures.rock} bumpMap={textures.rock} bumpScale={0.12} roughness={0.96} flatShading />
      </mesh>
      <mesh position={[0, -1.57, 0]} rotation={[0, -0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[visual.radius * 0.69, visual.radius * 0.47, 0.9, isCenter ? 48 : 36]} />
        <meshStandardMaterial color="#DDE3E6" map={textures.rock} bumpMap={textures.rock} bumpScale={0.15} roughness={0.98} flatShading />
      </mesh>
      <mesh position={[0, -2.45, 0]} rotation={[0, 0.16, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[visual.radius * 0.49, visual.radius * 0.34, 0.92, isCenter ? 40 : 30]} />
        <meshStandardMaterial color="#C8D0D4" map={textures.rock} bumpMap={textures.rock} bumpScale={0.18} roughness={1} flatShading />
      </mesh>

      {[
        { y: -0.95, radius: visual.radius * 0.69 },
        { y: -2.02, radius: visual.radius * 0.48 },
      ].map((seam, index) => (
        <mesh key={`strata-seam-${index}`} position={[0, seam.y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[seam.radius, 0.045, 6, isCenter ? 36 : 24]} />
          <meshStandardMaterial color="#40515C" metalness={0.78} roughness={0.3} />
        </mesh>
      ))}

      {Array.from({ length: isCenter ? 12 : 8 }, (_, index) => {
        const braceCount = isCenter ? 12 : 8;
        const angle = index / braceCount * Math.PI * 2;
        const braceRadius = visual.radius * 0.57;
        return (
          <group
            key={`underside-brace-${index}`}
            position={[Math.cos(angle) * braceRadius, -1.48, Math.sin(angle) * braceRadius]}
            rotation={[0, -angle, index % 2 === 0 ? 0.16 : -0.16]}
          >
            <mesh castShadow>
              <boxGeometry args={[0.11, 1.72, 0.17]} />
              <meshStandardMaterial color="#2D3B45" metalness={0.82} roughness={0.28} />
            </mesh>
            <mesh position={[0, 0.5, 0.095]}>
              <boxGeometry args={[0.055, 0.24, 0.025]} />
              <meshStandardMaterial color="#779ECC" emissive="#4D8DFF" emissiveIntensity={index % 3 === 0 ? 0.55 : 0.12} />
            </mesh>
          </group>
        );
      })}

      {[0, 1, 2, 3].map((index) => {
        const angle = index * Math.PI / 2 + Math.PI / 4;
        const conduitRadius = visual.radius * 0.36;
        return (
          <group
            key={`engine-conduit-${index}`}
            position={[Math.cos(angle) * conduitRadius, -2.18, Math.sin(angle) * conduitRadius]}
          >
            <mesh castShadow>
              <cylinderGeometry args={[0.045, 0.045, 1.5, 8]} />
              <meshStandardMaterial color="#536875" metalness={0.84} roughness={0.22} />
            </mesh>
            <mesh position={[0, -0.76, 0]}>
              <cylinderGeometry args={[0.075, 0.075, 0.07, 8]} />
              <meshStandardMaterial color="#8AB8FF" emissive="#4D8DFF" emissiveIntensity={0.45} />
            </mesh>
          </group>
        );
      })}

      <mesh position={[0, 0.93, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[visual.radius * 0.9, isCenter ? 72 : 52]} />
        <meshStandardMaterial color="#FFFFFF" map={textures.terrain} bumpMap={textures.terrain} bumpScale={0.11} roughness={0.9} />
      </mesh>

      {relief.map((feature, index) => (
        <mesh
          key={`relief-${index}`}
          position={[feature.x, 0.96 + feature.scale[1] * 0.34, feature.z]}
          rotation={[0, feature.rotation, 0]}
          scale={feature.scale}
          castShadow
          receiveShadow
        >
          <icosahedronGeometry args={[0.8, 1]} />
          <meshStandardMaterial
            color={island.id === 'north' && index % 3 === 0 ? '#C5D1D5' : '#FFFFFF'}
            map={textures.terrain}
            bumpMap={textures.terrain}
            bumpScale={0.08}
            roughness={0.94}
            flatShading
          />
        </mesh>
      ))}

      <mesh position={[0, 0.79, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[visual.radius * 0.955, 0.075, 10, isCenter ? 72 : 48]} />
        <meshStandardMaterial color="#3B4B56" metalness={0.82} roughness={0.28} />
      </mesh>

      {Array.from({ length: isCenter ? 32 : 24 }, (_, index) => {
        const angle = (index / (isCenter ? 32 : 24)) * Math.PI * 2;
        const edgeRadius = visual.radius * 0.945;
        return (
          <group
            key={`edge-panel-${index}`}
            position={[Math.cos(angle) * edgeRadius, 0.43, Math.sin(angle) * edgeRadius]}
            rotation={[0, -angle - Math.PI / 2, 0]}
          >
            <mesh castShadow>
              <boxGeometry args={[0.42, 0.54, 0.09]} />
              <meshStandardMaterial color={index % 2 === 0 ? '#26343E' : '#31414C'} metalness={0.78} roughness={0.32} />
            </mesh>
            {index % 4 === 0 && (
              <mesh position={[0, 0.05, 0.055]}>
                <boxGeometry args={[0.12, 0.035, 0.025]} />
                <meshStandardMaterial color="#8AB8FF" emissive="#4D8DFF" emissiveIntensity={0.5} />
              </mesh>
            )}
          </group>
        );
      })}

      {[0, 1, 2, 3].map((index) => {
        const angle = (index / 4) * Math.PI * 2 + 0.35;
        return (
          <mesh
            key={`rock-${index}`}
            position={[
              Math.cos(angle) * visual.radius * 0.68,
              -0.85 - (index % 2) * 0.35,
              Math.sin(angle) * visual.radius * 0.68,
            ]}
            rotation={[0.2 + index * 0.08, angle, 0.18]}
            scale={[1, 1.3, 0.85]}
            castShadow
            receiveShadow
          >
            <dodecahedronGeometry args={[visual.radius * 0.3, 0]} />
            <meshStandardMaterial color="#D6DDE0" map={textures.rock} bumpMap={textures.rock} bumpScale={0.14} roughness={1} flatShading />
          </mesh>
        );
      })}

      <CitySurface island={island} visual={visual} phase={phase} />
      <AetherEngine radius={visual.radius} isCenter={isCenter} />
      <HologramIslandOverlay
        visual={visual}
        isCenter={isCenter}
        active={isHovered || isSelected}
      />
    </group>
  );
}

function HologramNetworkField() {
  return (
    <group>
      {islands.map((island) => {
        const visual = ISLAND_VISUALS[island.id];
        return (
          <group key={`network-field-${island.id}`} position={new THREE.Vector3(...island.position)}>
            <mesh position={[0, -4.2, 0]}>
              <cylinderGeometry args={[0.025, 0.09, 9.2, 8, 1, true]} />
              <meshBasicMaterial
                color="#2CCBFF"
                transparent
                opacity={0.16}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh position={[0, -8.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[visual.radius * 0.2, visual.radius * 0.38, 36]} />
              <meshBasicMaterial
                color="#20BFFF"
                transparent
                opacity={0.3}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function WorldMap({
  selectedIsland,
  onSelectIsland,
  phase,
  lowPower,
}: {
  selectedIsland: Island | null;
  onSelectIsland: (island: Island) => void;
  phase: PacificDayPhase;
  lowPower: boolean;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => () => {
    document.body.style.cursor = 'auto';
  }, []);

  return (
    <group>
      <MapGuides />
      <CloudDeck phase={phase} lowPower={lowPower} />
      <HologramNetworkField />
      <BridgeNetwork selectedIslandId={selectedIsland?.id} />
      {islands.map((island) => {
        const isHovered = hovered === island.id;
        const isSelected = selectedIsland?.id === island.id;
        const visual = ISLAND_VISUALS[island.id];

        return (
          <group key={island.id} position={new THREE.Vector3(...island.position)}>
            <group
              onPointerOver={(event) => {
                event.stopPropagation();
                setHovered(island.id);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(event) => {
                event.stopPropagation();
                setHovered(null);
                document.body.style.cursor = 'auto';
              }}
              onClick={(event) => {
                event.stopPropagation();
                onSelectIsland(island);
              }}
            >
              <IslandModel
                island={island}
                isHovered={isHovered}
                isSelected={isSelected}
                phase={phase}
              />
            </group>

            <Html position={[0, visual.radius + 2.5, 0]} center style={{ pointerEvents: 'none' }}>
              <div className={`world-map-label min-w-[118px] border px-3 py-2 text-center whitespace-nowrap shadow-[0_0_28px_rgba(32,191,255,0.12)] backdrop-blur-sm transition-colors ${
                isHovered || isSelected
                  ? 'border-[#68DFFF] bg-[#03101D]/95'
                  : 'border-[#17628A] bg-[#020B16]/82'
              }`}>
                <div className="mb-1 font-mono text-[9px] tracking-[0.2em] text-[#39C8FF]">
                  SECTOR {visual.sector}
                </div>
                <div className="text-xs font-bold tracking-wider text-white">{island.name}</div>
                {(isHovered || isSelected) && (
                  <div className="mt-1 border-t border-[#17628A] pt-1 text-[10px] text-[#8FE6FF]">
                    {island.organization} · {island.climate}
                  </div>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function WorldHeroProfile({ hero }: { hero: Character }) {
  return (
    <div className="space-y-6">
      <CharacterImageViewer key={hero.id} character={hero} />

      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="bg-[#293644] px-2 py-0.5 text-xs font-bold tracking-widest text-[#8AB8FF]">
            {hero.organization}
          </span>
          <span className="font-mono text-sm text-[#E05A63]">Grade {hero.grade}</span>
        </div>
        <h2 className="mb-2 text-4xl font-bold text-white">{hero.name}</h2>
        <p className="flex gap-2 text-sm text-[#8996A3]">
          <span>{hero.gender}</span>
          <span>·</span>
          <span>{hero.age}세</span>
        </p>
      </div>

      <div className="h-px w-full bg-[#293644]" />

      <section>
        <h3 className="mb-2 text-xs uppercase tracking-widest text-[#8996A3]">Pulse</h3>
        <p className="mb-1 text-lg font-bold text-[#4D8DFF]">{hero.pulse.name}</p>
        <p className="text-sm leading-relaxed text-[#E9EEF3]">{hero.pulse.description}</p>
      </section>

      <section>
        <h3 className="mb-2 text-xs uppercase tracking-widest text-[#8996A3]">Personality</h3>
        <p className="text-sm leading-relaxed text-[#E9EEF3]">{hero.personality}</p>
      </section>

      <section>
        <h3 className="mb-2 text-xs uppercase tracking-widest text-[#8996A3]">Features</h3>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#E9EEF3]">{hero.features}</p>
      </section>
    </div>
  );
}

export default function World() {
  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null);
  const [selectedHero, setSelectedHero] = useState<Character | null>(null);
  const [pacificClock, setPacificClock] = useState(getPacificClock);
  const [lowPowerMode, setLowPowerMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const device = navigator as Navigator & { deviceMemory?: number };
    return window.matchMedia('(max-width: 767px)').matches
      || (device.deviceMemory !== undefined && device.deviceMemory <= 4)
      || navigator.hardwareConcurrency <= 4;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateMode = () => {
      const device = navigator as Navigator & { deviceMemory?: number };
      setLowPowerMode(
        mediaQuery.matches
        || (device.deviceMemory !== undefined && device.deviceMemory <= 4)
        || navigator.hardwareConcurrency <= 4,
      );
    };
    mediaQuery.addEventListener('change', updateMode);
    return () => mediaQuery.removeEventListener('change', updateMode);
  }, []);

  useEffect(() => {
    void startWorldServerAmbience();
    return stopWorldServerAmbience;
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setPacificClock(getPacificClock());
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const heroGroups = useMemo(() => {
    if (!selectedIsland) return [];
    if (selectedIsland.organization === 'LADER & PACTUM') {
      return [
        {
          organization: 'LADER',
          heroes: characters.filter((character) => character.organization === 'LADER'),
        },
        {
          organization: 'PACTUM',
          heroes: characters.filter((character) => character.organization === 'PACTUM'),
        },
      ];
    }
    return [{
      organization: selectedIsland.organization,
      heroes: characters.filter((character) => character.organization === selectedIsland.organization),
    }];
  }, [selectedIsland]);

  const handleSelectIsland = (island: Island) => {
    setSelectedHero(null);
    setSelectedIsland(island);
  };

  const closeIsland = () => {
    setSelectedHero(null);
    setSelectedIsland(null);
  };

  return (
    <div className="relative -mx-3 -mb-5 -mt-20 min-h-[100svh] flex-1 overflow-hidden bg-[#01050D] sm:-mx-8 sm:-mb-8 sm:-mt-24">
      <BackButton onClick={
        selectedHero
          ? () => setSelectedHero(null)
          : selectedIsland
            ? closeIsland
            : undefined
      } />

      <div className="absolute inset-0 z-0">
        <Canvas
          shadows={!lowPowerMode}
          camera={{ position: [44, 40, 70], fov: 44, near: 0.1, far: 300 }}
          dpr={lowPowerMode ? [1, 1.25] : [1.25, 1.8]}
          gl={{
            antialias: !lowPowerMode,
            alpha: false,
            precision: lowPowerMode ? 'mediump' : 'highp',
            powerPreference: 'high-performance',
            stencil: false,
          }}
          performance={{ min: 0.55 }}
        >
          <SceneAtmosphere clock={pacificClock} lowPower={lowPowerMode} />
          <WorldMap
            selectedIsland={selectedIsland}
            onSelectIsland={handleSelectIsland}
            phase={pacificClock.phase}
            lowPower={lowPowerMode}
          />
          <WorldCamera selectedIsland={selectedIsland} />
          {!lowPowerMode && <CinematicPostProcessing phase={pacificClock.phase} />}
        </Canvas>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.18] mix-blend-screen"
        style={{
          backgroundImage: [
            'repeating-linear-gradient(180deg, rgba(89, 216, 255, 0.13) 0, rgba(89, 216, 255, 0.13) 1px, transparent 1px, transparent 4px)',
            'radial-gradient(circle at 50% 48%, rgba(25, 172, 234, 0.09), transparent 54%)',
          ].join(', '),
        }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-[2] h-px w-full bg-gradient-to-r from-transparent via-[#76DFFF] to-transparent opacity-35 shadow-[0_0_16px_rgba(56,202,255,0.8)]"
        animate={{ y: ['-12vh', '112vh'] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'linear' }}
      />

      <div className="pointer-events-none absolute left-3 top-20 z-10 sm:left-8 sm:top-24">
        <div className="category-route-kicker mb-2 hidden items-center gap-2 font-mono text-[9px] tracking-[0.2em] min-[430px]:flex sm:mb-3 sm:text-[10px] sm:tracking-[0.24em]">
          <span className="category-accent-bar h-1.5 w-1.5" />
          AETHER NAVIGATION ONLINE
        </div>
        <h1 className="category-route-title mb-1 text-3xl font-bold tracking-widest text-white drop-shadow-md sm:mb-2 sm:text-4xl">WORLD</h1>
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#8996A3] drop-shadow-md sm:text-sm sm:tracking-widest">Global Map & Headquarters</p>
        <div className="category-route-panel mt-2 inline-flex items-center gap-2 border bg-[#0B1016]/80 px-2.5 py-1.5 font-mono text-[9px] tracking-[0.12em] text-[#8AB8FF] backdrop-blur-sm sm:mt-3 sm:px-3 sm:py-2 sm:text-[10px] sm:tracking-[0.16em]">
          <span>PACIFIC {pacificClock.label} {pacificClock.zone}</span>
          <span className="text-[#8996A3]">·</span>
          <span>{pacificClock.phase.toUpperCase()}</span>
        </div>
      </div>

      {!selectedIsland && (
        <div className="category-route-panel pointer-events-none absolute right-4 top-24 z-10 hidden border bg-[#0B1016]/78 px-4 py-3 text-right backdrop-blur-sm sm:right-8 md:block">
          <div className="font-mono text-[10px] tracking-[0.22em] text-[#8996A3]">WORLD NETWORK</div>
          <div className="mt-1 text-sm font-semibold tracking-wider text-[#E9EEF3]">5 FLOATING ISLANDS</div>
          <div className="mt-1 font-mono text-[10px] tracking-[0.18em] text-[#8996A3]">4 AETHER BRIDGE LINKS</div>
          <div className="mt-2 flex items-center justify-end gap-2 text-[10px] tracking-widest text-[#8AB8FF]">
            <span className="h-px w-8 bg-[#4D8DFF]" /> LINK STABLE
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedIsland && (
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0, transitionEnd: { transform: 'none' } }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="category-route-panel absolute bottom-0 left-0 right-0 top-16 z-20 flex flex-col border-x-0 border-b-0 bg-[#0B1016]/[0.98] backdrop-blur-md sm:bottom-6 sm:left-auto sm:right-8 sm:top-24 sm:w-[420px] sm:border"
          >
            <div className="flex items-start justify-between border-b border-[#293644] p-4 sm:p-6">
              {selectedHero ? (
                <div>
                  <button
                    onClick={() => setSelectedHero(null)}
                    className="mb-3 flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-[#8AB8FF] transition-colors hover:text-white"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {selectedIsland.name} HERO LIST
                  </button>
                  <div className="mb-1 font-mono text-[10px] tracking-[0.22em] text-[#4D8DFF]">HERO PROFILE</div>
                  <h2 className="text-2xl font-bold text-white">{selectedHero.name}</h2>
                </div>
              ) : (
                <div>
                  <div className="mb-2 font-mono text-[10px] tracking-[0.22em] text-[#4D8DFF]">
                    SECTOR {ISLAND_VISUALS[selectedIsland.id].sector}
                  </div>
                  <h2 className="mb-2 text-3xl font-bold text-white">{selectedIsland.name}</h2>
                  <div className="inline-block border border-[#E05A63] bg-[#E05A63]/10 px-2 py-0.5 text-xs font-bold tracking-widest text-[#E05A63]">
                    {selectedIsland.organization} HQ
                  </div>
                </div>
              )}
              <button
                onClick={selectedHero ? () => setSelectedHero(null) : closeIsland}
                className="border border-transparent p-2 text-[#8996A3] transition-colors hover:border-[#293644] hover:text-white"
                aria-label={selectedHero ? '캐릭터 상세 닫기' : '섬 상세 닫기'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:space-y-6 sm:p-6">
              {selectedHero ? (
                <WorldHeroProfile hero={selectedHero} />
              ) : (
                <>
                  <section>
                    <h3 className="mb-2 text-xs uppercase tracking-widest text-[#8996A3]">Environment</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm text-[#E9EEF3]">
                      <div className="border border-[#293644] bg-[#121A23] p-3">
                        <span className="mb-1 block text-xs text-[#8AB8FF]">기후</span>
                        {selectedIsland.climate}
                      </div>
                      <div className="border border-[#293644] bg-[#121A23] p-3">
                        <span className="mb-1 block text-xs text-[#8AB8FF]">인프라</span>
                        {selectedIsland.cityLevel}
                      </div>
                    </div>
                  </section>

                  <section className="border border-[#293644] bg-[#101820] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-[#8996A3]">Aether System</div>
                        <div className="mt-1 text-sm font-semibold text-[#E9EEF3]">부유·추진 엔진</div>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-[#8AB8FF]">
                        <span className="h-1.5 w-1.5 bg-[#4D8DFF]" /> 가동 중
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-3 text-xs uppercase tracking-widest text-[#8996A3]">Deployed Heroes</h3>
                    {heroGroups.every((group) => group.heroes.length === 0) ? (
                      <p className="border border-[#293644] bg-[#121A23] p-4 text-sm italic text-[#8996A3]">
                        현재 배치된 히어로 데이터가 없습니다.
                      </p>
                    ) : (
                      <div className="space-y-5">
                        {heroGroups.map((group) => (
                          <div key={group.organization}>
                            <div className="mb-2 flex items-center justify-between border-b border-[#293644] pb-2">
                              <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#8AB8FF]">
                                {group.organization}
                              </span>
                              <span className="font-mono text-[10px] text-[#8996A3]">{group.heroes.length} HEROES</span>
                            </div>
                            <div className="space-y-2">
                              {group.heroes.map((hero) => (
                                <button
                                  key={hero.id}
                                  type="button"
                                  onClick={() => setSelectedHero(hero)}
                                  className="flex w-full items-center gap-3 border border-[#293644] bg-[#121A23] p-2 text-left transition-colors hover:border-[#4D8DFF] focus-visible:border-[#4D8DFF] focus-visible:outline-none"
                                >
                                  <div className="h-11 w-11 flex-shrink-0 overflow-hidden bg-[#18232F]">
                                    <ImagePlaceholder
                                      src={getCharacterImageUrl(hero.id, 0)}
                                      loading="lazy"
                                      alt={hero.name}
                                      text="?"
                                      className="h-full w-full object-cover object-top"
                                      imageStyle={getCharacterImageStyle(hero.id)}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-bold text-white">{hero.name}</div>
                                    <div className="truncate text-xs text-[#8AB8FF]">{hero.grade}등급 · {hero.pulse.name}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 border-l border-[#4D8DFF] pl-3 font-mono text-[10px] tracking-wider text-[#8996A3] drop-shadow-md sm:left-8">
        DRAG: 시점 변경&nbsp;&nbsp;·&nbsp;&nbsp;SCROLL: 거리 조절&nbsp;&nbsp;·&nbsp;&nbsp;SELECT: 섬 확대
      </div>
    </div>
  );
}

