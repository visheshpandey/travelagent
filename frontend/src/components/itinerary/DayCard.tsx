import { useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { DayPlan } from "../../lib/types";

// Variant keys match the parent stagger container in ItineraryBoard — no own
// initial/animate/whileInView here, so this card's entrance is orchestrated
// by the parent rather than triggering independently.
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const CATEGORY_COLOR: Record<string, string> = {
  heritage: "#fb923c",
  food: "#facc15",
  nightlife: "#c4b5fd",
  shopping: "#34d399",
  nature: "#7dd3fc",
};

interface Props {
  day: DayPlan;
  index: number;
  onSelectItem?: (itemId: string) => void;
  selectedItemId?: string | null;
}

export default function DayCard({ day, index, onSelectItem, selectedItemId }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-10, 10]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      variants={cardVariants}
      className="glass rounded-2xl p-6 w-80 shrink-0 shadow-card"
    >
      <div style={{ transform: "translateZ(40px)" }}>
        <p className="text-xs uppercase tracking-wide text-tertiary mb-1">Day {index + 1}</p>
        <h3 className="font-display font-semibold text-lg mb-4">{day.date}</h3>
        <div className="space-y-3">
          {day.items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectItem?.(item.id)}
              className={`w-full text-left rounded-xl px-3 py-2 border transition ${
                selectedItemId === item.id
                  ? "border-ember bg-ember/10"
                  : "border-subtle hover:border-outline"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{item.poi}</span>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: CATEGORY_COLOR[item.category] ?? "#7dd3fc" }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-tertiary mt-1">
                <span>
                  {item.start}–{item.end}
                </span>
                <span>₹{item.cost}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-subtle flex items-center justify-between text-sm">
          <span className="text-tertiary">Day total</span>
          <span className="font-semibold text-accent">₹{day.day_cost.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </motion.div>
  );
}
