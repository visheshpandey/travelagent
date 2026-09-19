import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Float, Line, Html, MeshDistortMaterial, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { DESTINATIONS, HUB_DESTINATION, type Destination } from "../../lib/destinations";
import { latLngToVec3 } from "../../lib/geo";

const RADIUS = 1.9;
// India's real destinations span only a few degrees of lat/lng — exaggerate
// the spread around the hub so pins/arcs read clearly across the globe.
const SPREAD = 6;

function pinPosition(dest: Destination, hub: Destination) {
  const lat = hub.lat + (dest.lat - hub.lat) * SPREAD;
  const lng = hub.lng + (dest.lng - hub.lng) * SPREAD;
  return latLngToVec3(lat, lng, RADIUS);
}

function Pin({ position, name }: { position: THREE.Vector3; name: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <group position={position}>
      <mesh onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? "#fb923c" : "#7dd3fc"}
          emissive={hovered ? "#fb923c" : "#7dd3fc"}
          emissiveIntensity={2.2}
        />
      </mesh>
      {hovered && (
        <Html distanceFactor={7} style={{ pointerEvents: "none" }}>
          <div className="px-2 py-1 rounded-md bg-black/85 border border-accent/40 text-xs text-white whitespace-nowrap -translate-x-1/2 -translate-y-8">
            {name}
          </div>
        </Html>
      )}
    </group>
  );
}

function Arc({ start, end }: { start: THREE.Vector3; end: THREE.Vector3 }) {
  const points = useMemo(() => {
    const mid = start
      .clone()
      .add(end)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(RADIUS * 1.4);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(64);
  }, [start, end]);

  const ref = useRef<any>(null);
  useFrame((_, delta) => {
    if (ref.current?.material) {
      ref.current.material.dashOffset -= delta * 0.7;
    }
  });

  return (
    <Line
      ref={ref}
      points={points}
      color="#7dd3fc"
      lineWidth={1.2}
      transparent
      opacity={0.6}
      dashed
      dashScale={8}
      dashSize={0.55}
      gapSize={0.6}
    />
  );
}

function GlobeScene() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.1 + state.pointer.x * 0.0006;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      state.pointer.y * 0.2,
      0.04,
    );
  });

  const hub = DESTINATIONS.find((d) => d.name === HUB_DESTINATION)!;
  const hubPos = pinPosition(hub, hub);

  return (
    <group ref={groupRef}>
      <mesh>
        <icosahedronGeometry args={[RADIUS, 3]} />
        <meshBasicMaterial color="#3b4874" wireframe transparent opacity={0.22} />
      </mesh>
      <mesh scale={0.55}>
        <sphereGeometry args={[RADIUS, 64, 64]} />
        <MeshDistortMaterial
          color="#0ea5e9"
          emissive="#38bdf8"
          emissiveIntensity={0.9}
          distort={0.25}
          speed={1.6}
          roughness={0.2}
          metalness={0.7}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh scale={0.98}>
        <sphereGeometry args={[RADIUS, 48, 48]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      {DESTINATIONS.map((d) => (
        <Pin key={d.name} position={pinPosition(d, hub)} name={d.name} />
      ))}
      {DESTINATIONS.filter((d) => d.name !== HUB_DESTINATION).map((d) => (
        <Arc key={d.name} start={hubPos} end={pinPosition(d, hub)} />
      ))}
    </group>
  );
}

export default function Globe() {
  return (
    <Canvas camera={{ position: [0, 0, 7.4], fov: 42 }} dpr={[1, 1.8]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={1.2} color="#7dd3fc" />
      <pointLight position={[-5, -3, -5]} intensity={0.6} color="#c4b5fd" />
      <Stars radius={80} depth={50} count={2500} factor={3} fade speed={0.6} />
      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.6}>
        <group position={[1.7, -0.2, 0]}>
          <GlobeScene />
        </group>
      </Float>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 2.6}
        maxPolarAngle={Math.PI / 1.6}
      />
    </Canvas>
  );
}
