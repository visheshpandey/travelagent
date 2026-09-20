import { useMemo } from "react";
import { motion } from "framer-motion";
import type { DayPlan } from "../../lib/types";

interface Props {
  days: DayPlan[];
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
}

interface Stop {
  id: string;
  poi: string;
  dayDate: string;
  dayIndex: number;
}

const TOP_PAD = 24;
const BOTTOM_PAD = 24;
const TRACK_X = 28;
const LABEL_X = 50;

export default function StopTimeline({ days, selectedItemId, onSelectItem }: Props) {
  const stops = useMemo<Stop[]>(
    () =>
      days.flatMap((d, dayIndex) =>
        d.items.map((item) => ({ id: item.id, poi: item.poi, dayDate: d.date, dayIndex })),
      ),
    [days],
  );

  const height = Math.min(Math.max(stops.length * 60, 320), 640);

  const dotYs = useMemo(
    () =>
      stops.map((_, i) => TOP_PAD + (stops.length <= 1 ? 0 : (i / (stops.length - 1)) * (height - TOP_PAD - BOTTOM_PAD))),
    [stops, height],
  );

  const path = useMemo(() => {
    if (stops.length === 0) return "";
    let d = `M ${TRACK_X} ${dotYs[0]}`;
    for (let i = 1; i < dotYs.length; i++) {
      const y0 = dotYs[i - 1];
      const y1 = dotYs[i];
      const swing = i % 2 === 0 ? 12 : -10;
      d += ` Q ${TRACK_X + swing} ${(y0 + y1) / 2} ${TRACK_X} ${y1}`;
    }
    return d;
  }, [dotYs, stops.length]);

  if (stops.length === 0) return null;

  function goTo(stop: Stop) {
    onSelectItem(stop.id);
    document.getElementById(`day-${stop.dayDate}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
  }

  return (
    <div className="fixed left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:block" style={{ height }}>
      <svg width={56} height={height} className="absolute inset-0 overflow-visible pointer-events-none">
        <path d={path} fill="none" stroke="var(--border-default)" strokeWidth={1.5} />
        {stops.map((stop, i) => {
          const active = stop.id === selectedItemId;
          return (
            <g key={stop.id} transform={`translate(${TRACK_X}, ${dotYs[i]})`}>
              {active && (
                <motion.circle
                  r={11}
                  fill="none"
                  stroke="var(--color-accent2, #6b5b95)"
                  strokeOpacity={0.35}
                  strokeWidth={1.5}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <circle r={active ? 6.5 : 4} fill={active ? "var(--color-accent2, #6b5b95)" : "var(--color-accent, #7dd3fc)"} />
            </g>
          );
        })}
      </svg>

      <div className="relative" style={{ width: 200, height }}>
        {stops.map((stop, i) => {
          const active = stop.id === selectedItemId;
          return (
            <button
              key={stop.id}
              type="button"
              onClick={() => goTo(stop)}
              aria-label={`Jump to ${stop.poi}`}
              className="absolute -translate-y-1/2 text-left pr-2 py-1.5"
              style={{ left: 16, top: dotYs[i], width: LABEL_X + 150 - 16, paddingLeft: LABEL_X - 16 }}
            >
              <p
                className={`text-[9px] tracking-wide font-medium leading-tight ${
                  active ? "text-accent2" : "text-faint"
                }`}
              >
                DAY {stop.dayIndex + 1}
              </p>
              <p
                className={`text-xs leading-tight truncate ${
                  active ? "text-primary font-semibold" : "text-tertiary"
                }`}
              >
                {stop.poi}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
