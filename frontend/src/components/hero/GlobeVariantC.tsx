import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { Vector3 } from "three";
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
const LIGHT_DIR = new Vector3(-0.55, 0.45, 0.7).normalize();

/** Dense real-geography dot cloud, shaded per-point by a fake directional light so it
 *  reads as a lit sphere without any solid fill mesh underneath. */
function LitDotCloud() {
  const dots = useMemo(() => getLandDots(), []);
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(dots.length * 3);
    const col = new Float32Array(dots.length * 3);
    dots.forEach((d, i) => {
      const v = latLngToVec3(d.lat, d.lng, RADIUS);
      pos[i * 3] = v.x;
      pos[i * 3 + 1] = v.y;
      pos[i * 3 + 2] = v.z;

      const normal = v.clone().normalize();
      const b = 0.5 + Math.max(0, normal.dot(LIGHT_DIR)) * 0.5;
      col[i * 3] = b;
      col[i * 3 + 1] = b;
      col[i * 3 + 2] = b * 0.98;
    });
    return { positions: pos, colors: col };
  }, [dots]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.036}
        vertexColors
        transparent
        opacity={0.95}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/** Smooth great-circle arcs that lift off the surface and land back down,
 *  like flight paths — built via spherical interpolation, not a spline
 *  through an arbitrary elevated midpoint (which produced spikes). */
function slerpArc(a: Vector3, b: Vector3, bulge: number, segments = 48): [number, number, number][] {
  const angle = a.angleTo(b);
  const sinAngle = Math.sin(angle);
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    let p: Vector3;
    if (sinAngle < 1e-6) {
      p = a.clone();
    } else {
      const w1 = Math.sin((1 - t) * angle) / sinAngle;
      const w2 = Math.sin(t * angle) / sinAngle;
      p = a.clone().multiplyScalar(w1).add(b.clone().multiplyScalar(w2));
    }
    const base = p.length();
    p.setLength(base + Math.sin(t * Math.PI) * bulge);
    pts.push([p.x, p.y, p.z]);
  }
  return pts;
}

function OrbitArcs({ seed }: { seed: number }) {
  const arcs = useMemo(() => {
    const rng = mulberry32(seed || 1);
    const lines: { points: [number, number, number][]; pink: boolean }[] = [];
    for (let i = 0; i < 4; i++) {
      const latA = rng() * 100 - 50;
      const lngA = rng() * 360 - 180;
      const latB = rng() * 100 - 50;
      const lngB = lngA + (rng() * 100 - 50);
      const a = latLngToVec3(latA, lngA, RADIUS);
      const b = latLngToVec3(latB, lngB, RADIUS);
      lines.push({ points: slerpArc(a, b, RADIUS * (0.35 + rng() * 0.3)), pink: i === 0 });
    }
    return lines;
  }, [seed]);

  return (
    <group>
      {arcs.map((arc, i) => (
        <Line
          key={i}
          points={arc.points}
          color={arc.pink ? "#ec4899" : "#ffffff"}
          transparent
          opacity={arc.pink ? 0.65 : 0.3}
          lineWidth={1}
        />
      ))}
    </group>
  );
}

// Faces the globe toward Africa/Europe/Asia on load, rather than an arbitrary
// (often empty-ocean) default orientation. OrbitControls' autoRotate (below)
// handles all rotation after that — this is a static offset, not animated,
// so it doesn't fight with the camera's own orbit.
const INITIAL_YAW = (4 * Math.PI) / 3;

function GlobeScene({ seed }: { seed: number }) {
  return (
    <group rotation={[0, INITIAL_YAW, 0]}>
      <LitDotCloud />
      <OrbitArcs seed={seed} />
    </group>
  );
}

export default function GlobeVariantC({ cityName, seed, disrupted }: Props) {
  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: "radial-gradient(circle at 35% 30%, #14141c, #050507 72%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px -24px rgba(0,0,0,0.6), inset 0 0 60px rgba(0,0,0,0.5)",
        }}
      >
        <Canvas camera={{ position: [0, 0, 5.6], fov: 40 }} dpr={[1, 1.6]} gl={{ alpha: true, antialias: true }}>
          <GlobeScene seed={seed} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={1.1}
            rotateSpeed={0.6}
            minPolarAngle={Math.PI / 2.6}
            maxPolarAngle={Math.PI / 1.6}
          />
        </Canvas>
      </div>

      <div className="absolute top-5 right-5 flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: disrupted ? "#f97316" : "#ec4899", boxShadow: `0 0 8px ${disrupted ? "#f97316" : "#ec4899"}` }} />
        <span className="text-xs tracking-[0.2em] font-medium" style={{ color: "#f4f4f5" }}>
          {disrupted ? "REPLANNING" : "ONLINE"} · {cityName.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
