import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { POI_ENTER_MS, POI_SETTLE_MS, type PoiKind } from "../../lib/poiPopup";

interface Props {
  kind: PoiKind;
  accentColor: string;
  active: boolean;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

// Hand-written overshoot cubic — gives the icon a "pop" rather than a
// coast-to-a-stop ease, matching the "pop up" brief.
function easeOutBack(t: number) {
  const s = t - 1;
  return 1 + s * s * (2.7 * s + 1.7);
}

function Geometry({ kind }: { kind: PoiKind }) {
  switch (kind) {
    case "heritage":
      return <coneGeometry args={[0.5, 0.9, 4]} />;
    case "food":
      return <torusGeometry args={[0.35, 0.16, 6, 3]} />;
    case "nightlife":
      return <octahedronGeometry args={[0.55, 0]} />;
    case "shopping":
      return <boxGeometry args={[0.7, 0.7, 0.7]} />;
    case "nature":
      return <icosahedronGeometry args={[0.55, 0]} />;
    case "stay":
      return <cylinderGeometry args={[0.4, 0.5, 0.8, 5]} />;
  }
}

export default function PoiIconScene({ kind, accentColor, active }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const phaseStart = useRef(performance.now());
  const wasActive = useRef(active);

  useEffect(() => {
    if (active && !wasActive.current) {
      phaseStart.current = performance.now();
    }
    wasActive.current = active;
  }, [active]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (!active) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;

    const elapsed = performance.now() - phaseStart.current;
    if (elapsed < POI_ENTER_MS) {
      const t = Math.min(elapsed / POI_ENTER_MS, 1);
      mesh.scale.setScalar(THREE.MathUtils.lerp(0.15, 1, easeOutBack(t)));
      mesh.rotation.y = THREE.MathUtils.lerp(-Math.PI * 0.6, 0, easeOutCubic(t));
    } else {
      mesh.scale.setScalar(1);
      mesh.rotation.y += delta * 0.35;
    }
  });

  const elapsed = performance.now() - phaseStart.current;
  const showBurst = active && elapsed < POI_ENTER_MS + POI_SETTLE_MS;

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[2, 2, 3]} intensity={1} color={accentColor} />

      <mesh ref={meshRef} visible={false}>
        <Geometry kind={kind} />
        <meshStandardMaterial
          flatShading
          color="#1c1c24"
          roughness={0.8}
          metalness={0.05}
          emissive={accentColor}
          emissiveIntensity={0.35}
        />
        <Edges>
          <lineBasicMaterial color={accentColor} />
        </Edges>
      </mesh>

      {showBurst && (
        <Sparkles count={10} scale={0.6} size={2} speed={0.5} color={accentColor} />
      )}
    </>
  );
}
