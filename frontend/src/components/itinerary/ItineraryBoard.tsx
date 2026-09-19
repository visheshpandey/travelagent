import { motion } from "framer-motion";
import DayCard from "./DayCard";
import type { DayPlan } from "../../lib/types";

interface Props {
  destination: string;
  days: DayPlan[];
  totalCost: number;
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
}

export default function ItineraryBoard({ destination, days, totalCost, selectedItemId, onSelectItem }: Props) {
  return (
    <section id="itinerary" className="relative py-28 px-6 sm:px-10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-end justify-between gap-4 mb-10"
        >
          <div>
            <p className="uppercase tracking-[0.3em] text-xs text-accent/80 font-semibold mb-2">
              Itinerary — {destination}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">
              {days.length} day{days.length === 1 ? "" : "s"}, planned by the agent
            </h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50 uppercase tracking-wide">Total cost</p>
            <p className="text-2xl font-display font-bold text-gradient">
              ₹{totalCost.toLocaleString("en-IN")}
            </p>
          </div>
        </motion.div>

        <p className="text-xs text-white/40 mb-4">
          Tap any activity to select it, then use the disruption panel below to simulate it closing.
        </p>

        <div className="perspective">
          <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory">
            {days.map((day, i) => (
              <div key={day.date} className="snap-start">
                <DayCard day={day} index={i} onSelectItem={onSelectItem} selectedItemId={selectedItemId} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
