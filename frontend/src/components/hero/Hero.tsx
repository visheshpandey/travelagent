import { motion } from "framer-motion";
import TerrainHero from "./TerrainHero";

interface Props {
  cityName: string;
  seed: number;
  disrupted: boolean;
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Hero({ cityName, seed, disrupted }: Props) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <TerrainHero cityName={cityName} seed={seed} disrupted={disrupted} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-xl"
        >
          <p
            className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold mb-5"
            style={{ color: "#ffe7bf" }}
          >
            <span className="w-4 h-px" style={{ background: "#ffe7bf" }} />
            AI trip copilot
          </p>
          <h1
            className="font-display italic font-semibold text-4xl sm:text-6xl leading-[1.05] mb-6"
            style={{ color: "#fff8ee" }}
          >
            Fly over the trip
            <br />
            before you take it.
          </h1>
          <p className="text-base sm:text-lg max-w-md mb-8" style={{ color: "rgba(255,248,238,0.82)" }}>
            Constraints in, day-by-day itinerary out. When a booking falls through, TravelPilot
            rebuilds your plan and tells you exactly why it changed.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#plan"
              className="inline-flex items-center gap-2 rounded-full bg-accent text-onaccent font-semibold px-6 py-3 text-sm shadow-glow hover:brightness-110 transition"
            >
              <SparkleIcon />
              Plan my trip
            </a>
            <a
              href="#itinerary"
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium backdrop-blur-sm transition hover:bg-white/10"
              style={{ borderColor: "rgba(255,248,238,0.4)", color: "#fff8ee" }}
            >
              See a sample itinerary
              <ArrowIcon />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
