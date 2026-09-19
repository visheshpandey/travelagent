import { motion } from "framer-motion";
import Globe from "./Globe";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <Globe />
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, #05060a 0%, rgba(5,6,10,0.85) 30%, rgba(5,6,10,0.35) 50%, transparent 68%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink/10 to-ink pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 w-full grid md:grid-cols-2 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="uppercase tracking-[0.3em] text-xs text-accent/80 font-semibold mb-4">
            AI trip copilot
          </p>
          <h1 className="font-display text-4xl sm:text-6xl font-bold leading-[1.05] mb-6">
            Plan a trip across <span className="text-gradient">India</span>,
            <br />
            replanned live when it breaks.
          </h1>
          <p className="text-white/60 text-base sm:text-lg max-w-md mb-8">
            Constraints in, day-by-day itinerary out. When a booking falls through,
            TravelPilot rebuilds your plan and tells you exactly why it changed.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#plan"
              className="rounded-full bg-accent text-ink font-semibold px-6 py-3 text-sm shadow-glow hover:brightness-110 transition"
            >
              Plan my trip
            </a>
            <a
              href="#itinerary"
              className="rounded-full border border-white/15 px-6 py-3 text-sm text-white/80 hover:bg-white/5 transition"
            >
              See a sample itinerary
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
