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

// One orchestrated entrance for the whole board — header, then cards in a
// short stagger — triggered once when the itinerary first mounts, not a
// separate scroll-triggered animation per section/card.
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function ItineraryBoard({ destination, days, totalCost, selectedItemId, onSelectItem }: Props) {
  return (
    <section id="itinerary" className="relative py-28 px-6 sm:px-10">
      <motion.div className="max-w-6xl mx-auto" initial="hidden" animate="visible" variants={containerVariants}>
        <motion.div variants={itemVariants} className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-sm text-accent/80 font-medium mb-2">{destination} itinerary</p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold">
              {days.length} day{days.length === 1 ? "" : "s"}, planned by the agent
            </h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-tertiary">Total cost</p>
            <p className="text-2xl font-display font-semibold text-gradient">
              ₹{totalCost.toLocaleString("en-IN")}
            </p>
          </div>
        </motion.div>

        <motion.p variants={itemVariants} className="text-xs text-tertiary mb-4">
          Tap any activity to select it, then use the disruption panel below to simulate it closing.
        </motion.p>

        <div className="perspective">
          <motion.div
            variants={containerVariants}
            className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory"
          >
            {days.map((day, i) => (
              <div key={day.date} id={`day-${day.date}`} className="snap-start">
                <DayCard day={day} index={i} onSelectItem={onSelectItem} selectedItemId={selectedItemId} />
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
