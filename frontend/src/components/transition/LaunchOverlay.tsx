import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";
import SequenceScene from "./SequenceScene";
import type { LaunchPhase, ScreenPoint } from "../../lib/useLaunchSequence";

interface Props {
  phase: LaunchPhase;
  origin: ScreenPoint | null;
  target: ScreenPoint | null;
}

const BACKDROP_OPACITY: Record<LaunchPhase, number> = {
  idle: 0,
  launch: 0.1,
  arc: 0.5,
  burst: 0.25,
  reveal: 0,
};

// The bright pink blast flash that washes over the screen right as the new
// page "opens" — builds through burst, then cuts away fast during reveal.
const FLASH_OPACITY: Record<LaunchPhase, number> = {
  idle: 0,
  launch: 0,
  arc: 0,
  burst: 0.8,
  reveal: 0,
};

const OFFSCREEN: ScreenPoint = { x: -1000, y: -1000 };

/**
 * Fixed, always-mounted overlay for the Generate Trip transition — a
 * rocket dives off the bottom of the viewport, blasts near the bottom
 * edge, and a flash-cut reveals the new page. Kept mounted for the app's
 * lifetime so the WebGL context never has to spin up mid-click.
 */
export default function LaunchOverlay({ phase, origin, target }: Props) {
  const o = origin ?? OFFSCREEN;
  const t = target ?? OFFSCREEN;

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      <motion.div
        className="absolute inset-0 bg-black"
        animate={{ opacity: BACKDROP_OPACITY[phase] }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />

      <Canvas
        orthographic
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <SequenceScene phase={phase} origin={o} target={t} />
      </Canvas>

      <motion.div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 100%, #ec4899, transparent 75%)" }}
        animate={{ opacity: FLASH_OPACITY[phase] }}
        transition={{ duration: phase === "burst" ? 0.2 : 0.3, ease: phase === "burst" ? "easeIn" : "easeOut" }}
      />
    </div>
  );
}
