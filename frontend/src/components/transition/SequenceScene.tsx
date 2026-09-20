import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { ARC_MS, BURST_MS, LAUNCH_MS, REVEAL_MS, type LaunchPhase, type ScreenPoint } from "../../lib/useLaunchSequence";

const DURATIONS: Record<LaunchPhase, number> = {
  idle: 0,
  launch: LAUNCH_MS,
  arc: ARC_MS,
  burst: BURST_MS,
  reveal: REVEAL_MS,
};

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}
function easeInCubic(t: number) {
  return t * t * t;
}

function toWorld(p: ScreenPoint, size: { width: number; height: number }) {
  return new THREE.Vector3(p.x - size.width / 2, size.height / 2 - p.y, 0);
}

/** Sizes the orthographic camera's frustum to exactly match CSS pixels. */
function usePixelCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    cam.left = -size.width / 2;
    cam.right = size.width / 2;
    cam.top = size.height / 2;
    cam.bottom = -size.height / 2;
    cam.near = 0.1;
    cam.far = 2000;
    cam.position.set(0, 0, 10);
    cam.updateProjectionMatrix();
  }, [camera, size]);
}

interface Props {
  phase: LaunchPhase;
  origin: ScreenPoint;
  target: ScreenPoint;
}

export default function SequenceScene({ phase, origin, target }: Props) {
  usePixelCamera();
  const { size } = useThree();

  const phaseStart = useRef(performance.now());
  const prevPhase = useRef<LaunchPhase>(phase);
  useEffect(() => {
    if (prevPhase.current !== phase) {
      phaseStart.current = performance.now();
      prevPhase.current = phase;
    }
  }, [phase]);

  const originV = useMemo(() => toWorld(origin, size), [origin, size]);
  // `target` is deliberately off-screen (below the viewport) — the exit
  // point for the dive. `blastPoint` clamps that back onto the visible
  // bottom edge, which is where the flash actually needs to render.
  const blastScreenPoint = useMemo<ScreenPoint>(
    () => ({ x: target.x, y: Math.min(target.y, size.height * 0.9) }),
    [target, size],
  );
  const targetV = useMemo(() => toWorld(target, size), [target, size]);
  const blastV = useMemo(() => toWorld(blastScreenPoint, size), [blastScreenPoint, size]);
  const controlV = useMemo(() => {
    // A lateral swing (rather than an upward bulge) gives a swooping dive
    // trajectory instead of an "arc over" shape.
    const mid = originV.clone().add(targetV).multiplyScalar(0.5);
    const dist = originV.distanceTo(targetV);
    const dir = target.x >= origin.x ? -1 : 1;
    mid.x += dir * Math.max(dist * 0.22, 40);
    return mid;
  }, [originV, targetV, origin.x, target.x]);
  const curve = useMemo(
    () => new THREE.QuadraticBezierCurve3(originV, controlV, targetV),
    [originV, controlV, targetV],
  );

  const headRef = useRef<THREE.Group>(null);
  const headMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const trailRefs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const burstGroupRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const flashMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const head = headRef.current;
    if (!head) return;

    const elapsed = performance.now() - phaseStart.current;
    const dur = DURATIONS[phase];
    const t = Number.isFinite(dur) && dur > 0 ? Math.min(elapsed / dur, 1) : 0;
    const ease = easeOutCubic(t);

    const hideTrail = () => trailRefs.forEach((r) => r.current && (r.current.visible = false));

    if (phase === "idle") {
      head.visible = false;
      hideTrail();
      if (burstGroupRef.current) burstGroupRef.current.visible = false;
      return;
    }

    if (phase === "launch") {
      head.visible = true;
      head.position.copy(originV);
      head.scale.setScalar(THREE.MathUtils.lerp(0.05, 1, ease));
      if (headMatRef.current) headMatRef.current.opacity = ease;
      hideTrail();
      if (burstGroupRef.current) burstGroupRef.current.visible = false;
      return;
    }

    if (phase === "arc") {
      // Dive accelerates rather than easing out — a rocket picking up
      // speed as it drops, not coasting to a stop.
      const diveT = easeInCubic(t);
      head.visible = true;
      head.scale.setScalar(1);
      if (headMatRef.current) headMatRef.current.opacity = 1;
      head.position.copy(curve.getPoint(diveT));
      // Slight nose-down tilt as it dives.
      head.rotation.z = THREE.MathUtils.lerp(0, -0.5, diveT);
      trailRefs.forEach((r, i) => {
        if (!r.current) return;
        const lag = Math.max(diveT - (i + 1) * 0.09, 0);
        r.current.position.copy(curve.getPoint(lag));
        r.current.visible = diveT > (i + 1) * 0.09;
        r.current.scale.setScalar(1 - (i + 1) * 0.22);
      });
      if (burstGroupRef.current) burstGroupRef.current.visible = false;
      return;
    }

    if (phase === "burst") {
      head.visible = false;
      hideTrail();
      if (burstGroupRef.current) {
        burstGroupRef.current.visible = true;
        burstGroupRef.current.position.copy(blastV);
      }
      if (flashRef.current) flashRef.current.scale.setScalar(THREE.MathUtils.lerp(0.4, 7, ease));
      if (flashMatRef.current) flashMatRef.current.opacity = 1 - ease;
      return;
    }

    // reveal
    head.visible = false;
    hideTrail();
    if (burstGroupRef.current) {
      burstGroupRef.current.visible = true;
      burstGroupRef.current.position.copy(blastV);
    }
    if (flashRef.current) flashRef.current.scale.setScalar(THREE.MathUtils.lerp(7, 11, ease));
    if (flashMatRef.current) flashMatRef.current.opacity = Math.max(0, 0.35 * (1 - ease));
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[0, 0, 60]} intensity={1.2} color="#ec4899" />

      <group ref={headRef} visible={false}>
        <mesh>
          <icosahedronGeometry args={[14, 1]} />
          <meshStandardMaterial
            ref={headMatRef}
            color="#0b0d16"
            emissive="#ec4899"
            emissiveIntensity={1.9}
            roughness={0.3}
            metalness={0.6}
            transparent
            opacity={1}
          />
        </mesh>
        <Sparkles count={30} scale={40} size={3.5} speed={0.5} color="#f472b6" />
      </group>

      {trailRefs.map((r, i) => (
        <group ref={r} key={i} visible={false}>
          <Sparkles
            count={14 - i * 3}
            scale={16 - i * 3}
            size={2.2 - i * 0.4}
            speed={0.3}
            color={i === 0 ? "#ec4899" : "#f9a8d4"}
            opacity={0.7 - i * 0.18}
          />
        </group>
      ))}

      <group ref={burstGroupRef} visible={false}>
        <mesh ref={flashRef}>
          <sphereGeometry args={[10, 24, 24]} />
          <meshBasicMaterial
            ref={flashMatRef}
            color="#ec4899"
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <Sparkles count={90} scale={140} size={3} speed={1.4} color="#f9a8d4" opacity={0.9} />
      </group>
    </>
  );
}
