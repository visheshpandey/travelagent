import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import type { Group } from "three";
import { latLngToVec3 } from "../../lib/geo";
import { mulberry32 } from "../../lib/hash";

interface Props {
  cityName: string;
  seed: number;
  disrupted: boolean;
}

const RADIUS = 2.1;
const SIZE = 460;
const RING_PAD = 60;

const PINS: { lat: number; lng: number }[] = [
  { lat: 26.9855, lng: 75.8513 }, // Jaipur
  { lat: 28.6139, lng: 77.209 }, // Delhi
  { lat: 19.076, lng: 72.8777 }, // Mumbai
  { lat: 12.9716, lng: 77.5946 }, // Bengaluru
];

function circlePoints(radius: number, segments = 96): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    pts.push([Math.cos(t) * radius, Math.sin(t) * radius, 0]);
  }
  return pts;
}

/** Latitude & longitude wireframe grid, rendered as thin great-circle lines. */
function WireGrid() {
  const parallels = useMemo(() => {
    const lines: { points: [number, number, number][]; y: number }[] = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      const rad = (lat * Math.PI) / 180;
      const r = RADIUS * Math.cos(rad);
      const y = RADIUS * Math.sin(rad);
      lines.push({ points: circlePoints(r).map(([x, , z]) => [x, y, z]), y });
    }
    return lines;
  }, []);

  const meridians = useMemo(() => {
    const lines: [number, number, number][][] = [];
    for (let lng = 0; lng < 180; lng += 30) {
      const rad = (lng * Math.PI) / 180;
      const pts = circlePoints(RADIUS).map(([x, y]) => [
        x * Math.cos(rad),
        y,
        x * Math.sin(rad),
      ]) as [number, number, number][];
      lines.push(pts);
    }
    return lines;
  }, []);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[RADIUS * 0.985, 48, 48]} />
        <meshBasicMaterial color="#faf6f0" transparent opacity={0.04} />
      </mesh>
      {parallels.map((p, i) => (
        <Line key={`p${i}`} points={p.points} color="#0f9488" transparent opacity={0.35} lineWidth={1} />
      ))}
      {meridians.map((pts, i) => (
        <Line key={`m${i}`} points={pts} color="#0f9488" transparent opacity={0.35} lineWidth={1} />
      ))}
      {/* equator + prime meridian, emphasized */}
      <Line points={circlePoints(RADIUS)} color="#f97316" transparent opacity={0.6} lineWidth={1.5} />
      <Line
        points={circlePoints(RADIUS).map(([x, y]) => [x, 0, y]) as [number, number, number][]}
        color="#f97316"
        transparent
        opacity={0.45}
        lineWidth={1.5}
      />
    </group>
  );
}

function Pins() {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.18;
    ref.current.scale.setScalar(s);
  });
  return (
    <group>
      {PINS.map((p, i) => {
        const v = latLngToVec3(p.lat, p.lng, RADIUS * 1.01);
        return (
          <mesh key={i} position={[v.x, v.y, v.z]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={1.1} toneMapped={false} />
          </mesh>
        );
      })}
      <group ref={ref}>
        {PINS.slice(0, 1).map((p, i) => {
          const v = latLngToVec3(p.lat, p.lng, RADIUS * 1.02);
          return (
            <mesh key={i} position={[v.x, v.y, v.z]}>
              <ringGeometry args={[0.05, 0.07, 24]} />
              <meshBasicMaterial color="#f97316" transparent opacity={0.5} side={2} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function GlobeScene() {
  return (
    <group>
      <WireGrid />
      <Pins />
    </group>
  );
}

function DotRing() {
  const dots = useMemo(() => {
    const rng = mulberry32(7);
    const arr: { x: number; y: number; r: number; color: string; opacity: number }[] = [];
    const center = SIZE / 2 + RING_PAD;
    for (let i = 0; i < 110; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = SIZE / 2 + 14 + rng() * (RING_PAD - 8);
      arr.push({
        x: center + Math.cos(angle) * radius,
        y: center + Math.sin(angle) * radius,
        r: 1.3 + rng() * 2.3,
        color: rng() > 0.5 ? "#0f9488" : "#f97316",
        opacity: 0.3 + rng() * 0.5,
      });
    }
    return arr;
  }, []);

  const dim = SIZE + RING_PAD * 2;
  return (
    <svg
      className="absolute pointer-events-none"
      style={{ left: -RING_PAD, top: -RING_PAD, width: dim, height: dim }}
      viewBox={`0 0 ${dim} ${dim}`}
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.color} opacity={d.opacity} />
      ))}
    </svg>
  );
}

function FlightPath() {
  return (
    <svg className="absolute inset-0 pointer-events-none" viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <path
        d={`M ${SIZE * 0.16} ${SIZE * 0.72} Q ${SIZE * 0.5} ${SIZE * 0.34} ${SIZE * 0.82} ${SIZE * 0.22}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeDasharray="2 8"
        strokeLinecap="round"
        opacity="0.9"
      />
      <g transform={`translate(${SIZE * 0.82}, ${SIZE * 0.22}) rotate(-32)`}>
        <path
          d="M0 0 L18 4 L4 8 L0 18 L-3 8 L-16 4 Z"
          fill="#ffffff"
          stroke="#f97316"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export default function GlobeVariantB({ cityName, disrupted }: Props) {
  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <DotRing />

      <div
        className="absolute inset-0 rounded-full p-[3px]"
        style={{ background: "linear-gradient(135deg, #0f9488, #f97316)" }}
      >
        <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "var(--bg-page)" }}>
          <Canvas camera={{ position: [0, 0, 5.6], fov: 40 }} dpr={[1, 1.6]} gl={{ alpha: true, antialias: true }}>
            <ambientLight intensity={0.9} />
            <pointLight position={[4, 4, 4]} intensity={0.8} color="#f97316" />
            <pointLight position={[-3, -2, 3]} intensity={0.4} color="#0f9488" />
            <GlobeScene />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={1.4}
              rotateSpeed={0.6}
              minPolarAngle={Math.PI / 2.6}
              maxPolarAngle={Math.PI / 1.6}
            />
          </Canvas>
        </div>
      </div>

      <FlightPath />

      <div className="absolute -top-8 right-0 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: disrupted ? "#f97316" : "#16a34a" }} />
        <span className="text-xs tracking-[0.2em] font-medium text-secondary">
          {disrupted ? "REPLANNING" : "ONLINE"} · {cityName.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
