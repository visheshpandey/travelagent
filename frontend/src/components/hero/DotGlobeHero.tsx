import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { getLandDots } from "../../lib/worldDots";
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

function DotCloud() {
  const dots = useMemo(() => getLandDots(), []);
  const positions = useMemo(() => {
    const arr = new Float32Array(dots.length * 3);
    dots.forEach((d, i) => {
      const v = latLngToVec3(d.lat, d.lng, RADIUS);
      arr[i * 3] = v.x;
      arr[i * 3 + 1] = v.y;
      arr[i * 3 + 2] = v.z;
    });
    return arr;
  }, [dots]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.024} color="#fdf6ec" transparent opacity={0.9} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function GlobeScene() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[RADIUS * 0.86, 48, 48]} />
        <meshStandardMaterial color="#0f9488" emissive="#0d7d72" emissiveIntensity={0.3} roughness={0.6} />
      </mesh>
      <DotCloud />
    </group>
  );
}

/** Scattered teal/orange dots decorating the ring around the circle. */
function DotRing() {
  const dots = useMemo(() => {
    const rng = mulberry32(42);
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

export default function DotGlobeHero({ cityName, disrupted }: Props) {
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
