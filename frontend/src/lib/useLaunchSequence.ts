import { useCallback, useEffect, useRef, useState } from "react";

export type LaunchPhase = "idle" | "launch" | "arc" | "burst" | "reveal";

export const LAUNCH_MS = 180;
export const ARC_MS = 450;
export const BURST_MS = 260;
export const REVEAL_MS = 350;

export interface ScreenPoint {
  x: number;
  y: number;
}

interface Options {
  /** Fires once, right as the burst settles into the reveal phase — mount real content here. */
  onReveal?: () => void;
  /** Fires when the reveal settle finishes and the overlay returns to idle. */
  onDone?: () => void;
}

/**
 * Drives the Launch -> Dive -> Blast -> Reveal state machine for the
 * Generate Trip transition. `start()` is only called once real data is
 * already in hand (the caller awaits the API response first) — there's no
 * "waiting for data" phase here, the whole sequence just plays start to
 * finish at a fixed, predictable pace.
 */
export function useLaunchSequence({ onReveal, onDone }: Options = {}) {
  const [phase, setPhase] = useState<LaunchPhase>("idle");
  const [origin, setOrigin] = useState<ScreenPoint | null>(null);
  const [target, setTarget] = useState<ScreenPoint | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const start = useCallback(
    (originPoint: ScreenPoint, targetPoint: ScreenPoint) => {
      clearTimers();
      setOrigin(originPoint);
      setTarget(targetPoint);
      setPhase("launch");
      schedule(() => setPhase("arc"), LAUNCH_MS);
      schedule(() => setPhase("burst"), LAUNCH_MS + ARC_MS);
    },
    [clearTimers, schedule],
  );

  const cancel = useCallback(() => {
    clearTimers();
    setPhase("idle");
    setOrigin(null);
    setTarget(null);
  }, [clearTimers]);

  useEffect(() => {
    if (phase === "burst") {
      schedule(() => {
        onReveal?.();
        setPhase("reveal");
      }, BURST_MS);
    } else if (phase === "reveal") {
      schedule(() => {
        onDone?.();
        setPhase("idle");
        setOrigin(null);
        setTarget(null);
      }, REVEAL_MS);
    }
    // Only the phase transition itself should re-trigger this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    phase,
    origin,
    target,
    start,
    cancel,
    isActive: phase !== "idle",
  };
}
