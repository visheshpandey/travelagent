import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { mulberry32 } from "../../lib/hash";

interface Props {
  cityName: string;
  seed: number;
  disrupted: boolean;
}

const WIDTH = 60;
const DEPTH = 40;
const SEGMENTS_X = 100;
const SEGMENTS_Z = 60;
const MARKER_COUNT = 5;

const VALLEY = new THREE.Color("#4a3550");
const MID = new THREE.Color("#c97a4a");
const PEAK = new THREE.Color("#f3c78a");

const SUN_CALM = new THREE.Color("#ffd3a0");
const SUN_ALERT = new THREE.Color("#e07a5c");
const FOG_CALM = new THREE.Color("#c98a5e");
const FOG_ALERT = new THREE.Color("#7a3a3a");
const MARKER_CALM = "#ffe9c2";
const MARKER_ALERT = "#ff5b4a";
const HALO_CALM = "#f3a35c";
const HALO_ALERT = "#c9382a";

// Cheap multi-octave sine/cosine "fake terrain" — no noise dependency, deterministic
// per city so the same destination always renders the same landscape.
function heightAt(x: number, z: number, offsets: number[]) {
  let h = 0;
  h += Math.sin(x * 0.18 + offsets[0]) * Math.cos(z * 0.15 + offsets[1]) * 2.6;
  h += Math.sin(x * 0.4 + offsets[2]) * Math.cos(z * 0.35 + offsets[3]) * 1.1;
  h += Math.sin(x * 0.9 + offsets[4]) * Math.cos(z * 0.8 + offsets[5]) * 0.4;
  return h;
}

function Terrain({ seed }: { seed: number }) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(WIDTH, DEPTH, SEGMENTS_X, SEGMENTS_Z);
    const rng = mulberry32(seed || 1);
    const offsets = Array.from({ length: 6 }, () => rng() * Math.PI * 2);

    const position = geo.attributes.position;
    const colors = new Float32Array(position.count * 3);
    let minH = Infinity;
    let maxH = -Infinity;
    const heights = new Float32Array(position.count);
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getY(i); // plane is authored in local XY before rotation
      const h = heightAt(x, z, offsets);
      heights[i] = h;
      minH = Math.min(minH, h);
      maxH = Math.max(maxH, h);
      position.setZ(i, h);
    }

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
  }, [seed]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]}>
      <meshStandardMaterial vertexColors flatShading roughness={0.95} metalness={0} />
    </mesh>
  );
}

function Markers({ seed, disrupted }: { seed: number; disrupted: boolean }) {
  const haloRefs = useRef<(THREE.Mesh | null)[]>([]);
  const points = useMemo(() => {
    const rng = mulberry32((seed || 1) + 7);
    const offsets = Array.from({ length: 6 }, () => rng() * Math.PI * 2);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < MARKER_COUNT; i++) {
      const x = (rng() - 0.5) * WIDTH * 0.7;
      const z = (rng() - 0.5) * DEPTH * 0.7;
      const y = heightAt(x, z, offsets) - 1.4 + 0.15;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, [seed]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    haloRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const scale = 1 + Math.sin(t * 1.8 + i) * 0.25;
      mesh.scale.setScalar(scale);
    });
  });

  const coreColor = disrupted ? MARKER_ALERT : MARKER_CALM;
  const haloColor = disrupted ? HALO_ALERT : HALO_CALM;

  return (
    <group>
      <Line points={points} color={haloColor} transparent opacity={disrupted ? 0.7 : 0.5} lineWidth={1.5} dashed dashSize={0.3} gapSize={0.2} />
      {points.map((p, i) => (
        <group key={i} position={p}>
          <mesh>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color={coreColor} emissive={coreColor} emissiveIntensity={1.6} />
          </mesh>
          <mesh
            ref={(el) => {
              haloRefs.current[i] = el;
            }}
          >
            <ringGeometry args={[0.16, 0.2, 24]} />
            <meshBasicMaterial color={haloColor} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      {disrupted && <Sparkles count={40} scale={[WIDTH * 0.6, 2, DEPTH * 0.6]} size={2} speed={0.4} color={HALO_ALERT} opacity={0.5} />}
    </group>
  );
}

export default function TerrainScene({ seed, disrupted }: Props) {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const t = useRef(0);

  useFrame(({ camera }, delta) => {
    t.current += delta;
    // Slow, hands-off drift — an establishing shot, not an interactive orbit.
    camera.position.x = Math.sin(t.current * 0.06) * 3;
    camera.position.y = 2.4 + Math.sin(t.current * 0.04) * 0.4;
    camera.position.z = 14 + Math.cos(t.current * 0.05) * 1.5;
    camera.lookAt(0, -0.6, -4);

    if (sunRef.current) {
      const target = disrupted ? SUN_ALERT : SUN_CALM;
      sunRef.current.color.lerp(target, 0.04);
    }
  });

  const fogColor = disrupted ? FOG_ALERT : FOG_CALM;

  return (
    <>
      <fog attach="fog" args={[fogColor, 14, 42]} />
      <directionalLight ref={sunRef} position={[-8, 5, -6]} intensity={1.6} color="#ffd3a0" />
      <ambientLight intensity={0.22} color="#2b1d3a" />
      <Terrain seed={seed} />
      <Markers seed={seed} disrupted={disrupted} />
    </>
  );
}
