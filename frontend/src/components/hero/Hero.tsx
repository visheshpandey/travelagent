import { useState } from "react";
import { motion } from "framer-motion";
import DotGlobeHero from "./DotGlobeHero";
import GlobeVariantB from "./GlobeVariantB";
import GlobeVariantC from "./GlobeVariantC";

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
  const [variant, setVariant] = useState<"A" | "B" | "C">("C");

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden py-28">
      {/* Soft decorative blobs, bottom-left */}
      <div
        className="absolute -bottom-32 -left-32 w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(15,148,136,0.12), transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 left-24 w-[360px] h-[360px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(249,115,22,0.08), transparent 70%)" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 w-full grid md:grid-cols-2 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-4">
            <span className="w-4 h-px bg-accent" />
            AI trip copilot
          </p>
          <h1 className="font-display text-4xl sm:text-6xl font-semibold leading-[1.05] mb-6 text-primary">
            Plan a trip across <span className="text-accent">India</span>,
            <br />
            replanned live when it breaks.
          </h1>
          <p className="text-secondary text-base sm:text-lg max-w-md mb-8">
            Constraints in, day-by-day itinerary out. When a booking falls through,
            TravelPilot rebuilds your plan and tells you exactly why it changed.
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
              className="inline-flex items-center gap-2 rounded-full border border-outline px-6 py-3 text-sm text-primary hover:bg-hoverwash transition"
            >
              See a sample itinerary
              <ArrowIcon />
            </a>
          </div>
        </motion.div>

        <div className="relative flex flex-col items-center md:items-end gap-4">
          {variant === "A" && <DotGlobeHero cityName={cityName} seed={seed} disrupted={disrupted} />}
          {variant === "B" && <GlobeVariantB cityName={cityName} seed={seed} disrupted={disrupted} />}
          {variant === "C" && <GlobeVariantC cityName={cityName} seed={seed} disrupted={disrupted} />}

          {/* Temporary compare toggle — remove once a globe style is picked */}
          <div className="flex items-center gap-1 rounded-full border border-outline bg-panel p-1 text-xs">
            <button
              type="button"
              onClick={() => setVariant("A")}
              className={`rounded-full px-3 py-1 font-medium transition ${
                variant === "A" ? "bg-accent text-onaccent" : "text-tertiary hover:text-primary"
              }`}
            >
              Solid (A)
            </button>
            <button
              type="button"
              onClick={() => setVariant("B")}
              className={`rounded-full px-3 py-1 font-medium transition ${
                variant === "B" ? "bg-accent text-onaccent" : "text-tertiary hover:text-primary"
              }`}
            >
              Wireframe (B)
            </button>
            <button
              type="button"
              onClick={() => setVariant("C")}
              className={`rounded-full px-3 py-1 font-medium transition ${
                variant === "C" ? "bg-accent text-onaccent" : "text-tertiary hover:text-primary"
              }`}
            >
              Dark dot-earth (C)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
