import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { DayPlan } from "../../lib/types";
import PoiPopup from "../poi/PoiPopup";
import type { PoiKind, PoiPopupData } from "../../lib/poiPopup";

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
  nightlife: "#6b5b95",
  shopping: "#34d399",
  nature: "#7dd3fc",
};

function InfoIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 11v5M12 8v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

interface Props {
  day: DayPlan;
  index: number;
  onSelectItem?: (itemId: string) => void;
  selectedItemId?: string | null;
}

export default function DayCard({ day, index, onSelectItem, selectedItemId }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [popupData, setPopupData] = useState<PoiPopupData | null>(null);
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
    <>
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      variants={cardVariants}
      className="glass rounded-2xl p-6 w-80 shrink-0 shadow-card"
    >
      <div style={{ transform: "translateZ(40px)" }}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs uppercase tracking-wide text-tertiary">Day {index + 1}</p>
          {day.destination && (
            <span className="text-[10px] uppercase tracking-wide text-accent2 font-semibold px-2 py-0.5 rounded-full bg-accent2/15">
              {day.destination}
            </span>
          )}
        </div>
        <h3 className="font-display font-semibold text-lg mb-4">{day.date}</h3>
        {day.is_travel_day ? (
          <div className="rounded-xl border border-dashed border-subtle px-3 py-6 text-center">
            <p className="text-sm text-secondary font-medium mb-1">Travel day</p>
            <p className="text-xs text-tertiary">No activities scheduled — time to move between cities.</p>
          </div>
        ) : (
        <div className="space-y-3">
          {day.items.map((item) => (
            <div key={item.id} className="relative">
              <button
                onClick={() => onSelectItem?.(item.id)}
                className={`w-full text-left rounded-xl px-3 py-2 border transition ${
                  selectedItemId === item.id
                    ? "border-ember bg-ember/10"
                    : "border-subtle hover:border-outline"
                }`}
              >
                <div className="flex items-center justify-between gap-2 pr-4">
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
              <button
                type="button"
                aria-label="View details"
                onClick={(e) => {
                  e.stopPropagation();
                  setPopupData({
                    kind: (item.category in CATEGORY_COLOR ? item.category : "nature") as PoiKind,
                    title: item.poi,
                    subtitle: `${item.start}–${item.end}`,
                    accentColor: CATEGORY_COLOR[item.category] ?? "#7dd3fc",
                    rows: [
                      { label: "Category", value: item.category },
                      { label: "Cost", value: `₹${item.cost}` },
                    ],
                  });
                }}
                className="absolute top-2 right-2 text-tertiary hover:text-primary transition p-0.5"
              >
                <InfoIcon />
              </button>
            </div>
          ))}
        </div>
        )}
        <div className="mt-4 pt-4 border-t border-subtle flex items-center justify-between text-sm">
          <span className="text-tertiary">Day total</span>
          <span className="font-semibold text-accent">₹{day.day_cost.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </motion.div>
    <PoiPopup data={popupData} onClose={() => setPopupData(null)} />
    </>
  );
}
