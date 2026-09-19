import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

interface ShapeSpec {
  pos: [number, number, number];
  scale: number;
  speed: number;
  offset: number;
}

function DriftingShapes() {
  const group = useRef<THREE.Group>(null);
  const items = useMemo<ShapeSpec[]>(
    () =>
      Array.from({ length: 14 }, () => ({
        pos: [(Math.random() - 0.5) * 18, (Math.random() - 0.5) * 10, -Math.random() * 12 - 3],
        scale: 0.2 + Math.random() * 0.5,
        speed: 0.1 + Math.random() * 0.2,
        offset: Math.random() * Math.PI * 2,
      })),
    [],
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, state.pointer.x * 0.08, 0.02);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -state.pointer.y * 0.05, 0.02);
    group.current.children.forEach((child, i) => {
      const it = items[i];
      child.position.y += Math.sin(state.clock.elapsedTime * it.speed + it.offset) * 0.0015;
      child.rotation.x += delta * 0.05;
      child.rotation.y += delta * 0.07;
    });
  });

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <mesh key={i} position={it.pos} scale={it.scale}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#1c2540" : "#2a1c40"}
            emissive={i % 2 === 0 ? "#7dd3fc" : "#c4b5fd"}
            emissiveIntensity={0.15}
            wireframe={i % 3 === 0}
            roughness={0.5}
            metalness={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function AmbientField() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.4} />
        <pointLight position={[4, 4, 4]} intensity={0.6} color="#7dd3fc" />
        <Sparkles count={80} scale={[16, 10, 10]} size={2} speed={0.3} color="#7dd3fc" opacity={0.5} />
        <DriftingShapes />
      </Canvas>
    </div>
  );
}
