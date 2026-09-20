import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "../../lib/hash";
import type { TerrainBannerSegment } from "./TerrainBanner";

interface Props {
  seed: number;
  segments: TerrainBannerSegment[];
  disrupted?: boolean;
}

const WIDTH = 22;
const DEPTH = 7;
const SEGMENTS_X = 40;
const SEGMENTS_Z = 10;

const VALLEY = new THREE.Color("#4a3550");
const MID = new THREE.Color("#c97a4a");
const PEAK = new THREE.Color("#f3c78a");

const MARKER_CALM = "#ffe9c2";
const MARKER_ALERT = "#ff5b4a";
const SUN_CALM = "#ffd3a0";
const SUN_ALERT = "#e07a5c";

// Smoothly blends between adjacent day values instead of stepping — a hard
// step at bin boundaries produces a near-vertical cliff face that renders as
// an unlit black wedge under a single directional light.
function sampleValue(x: number, values: number[], binWidth: number) {
  if (values.length === 1) return values[0];
  const pos = x / binWidth - 0.5;
  const i0 = Math.floor(pos);
  const frac = pos - i0;
  const c0 = Math.min(Math.max(i0, 0), values.length - 1);
  const c1 = Math.min(Math.max(i0 + 1, 0), values.length - 1);
  const s = frac * frac * (3 - 2 * frac);
  return values[c0] + (values[c1] - values[c0]) * s;
}

function Ridge({ seed, segments }: { seed: number; segments: TerrainBannerSegment[] }) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(WIDTH, DEPTH, SEGMENTS_X, SEGMENTS_Z);
    const rng = mulberry32(seed || 1);
    const texOffset = rng() * Math.PI * 2;

    const values = segments.length > 0 ? segments.map((s) => s.value) : [1];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = WIDTH / Math.max(values.length, 1);

    const position = geo.attributes.position;
    const heights = new Float32Array(position.count);
    let minH = Infinity;
    let maxH = -Infinity;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i) + WIDTH / 2;
      const z = position.getY(i);
      const raw = sampleValue(x, values, binWidth);
      const t = (raw - min) / (max - min || 1);
      const texture = Math.sin(x * 0.6 + texOffset) * Math.cos(z * 0.8 + texOffset) * 0.15;
      const h = 0.3 + t * 1.8 + texture;
      heights[i] = h;
      minH = Math.min(minH, h);
      maxH = Math.max(maxH, h);
      position.setZ(i, h);
    }

    const colors = new Float32Array(position.count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < position.count; i++) {
      const t = (heights[i] - minH) / (maxH - minH || 1);
      if (t < 0.5) color.lerpColors(VALLEY, MID, t / 0.5);
      else color.lerpColors(MID, PEAK, (t - 0.5) / 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    position.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    return geo;
  }, [seed, segments]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
      <meshStandardMaterial vertexColors flatShading roughness={0.95} metalness={0} />
    </mesh>
  );
}

function Markers({ segments, disrupted }: { segments: TerrainBannerSegment[]; disrupted?: boolean }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const positions = useMemo(() => {
    if (segments.length === 0) return [];
    const values = segments.map((s) => s.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = WIDTH / segments.length;
    return segments.map((s, i) => {
      const t = (s.value - min) / (max - min || 1);
      const x = -WIDTH / 2 + binWidth * (i + 0.5);
      const y = -1 + 0.3 + t * 1.8 + 0.15;
      return new THREE.Vector3(x, y, 0);
    });
  }, [segments]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.scale.setScalar(1 + Math.sin(t * 1.6 + i) * 0.2);
    });
  });

  return (
    <group>
      {positions.map((p, i) => {
        const color = segments[i].color ?? (disrupted ? MARKER_ALERT : MARKER_CALM);
        return (
          <mesh
            key={i}
            position={p}
            ref={(el) => {
              refs.current[i] = el;
            }}
          >
            <sphereGeometry args={[0.13, 12, 12]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
          </mesh>
        );
      })}
    </group>
  );
}

export default function TerrainBannerScene({ seed, segments, disrupted }: Props) {
  const sunColor = disrupted ? SUN_ALERT : SUN_CALM;

  return (
    <>
      <directionalLight position={[-6, 4, -3]} intensity={1.5} color={sunColor} />
      <ambientLight intensity={0.24} color="#2b1d3a" />
      <Ridge seed={seed} segments={segments} />
      <Markers segments={segments} disrupted={disrupted} />
    </>
  );
}
