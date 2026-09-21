import { useState } from "react";
import { motion } from "framer-motion";

const FAQS = [
  {
    q: "How does TravelPilot build my itinerary?",
    a: "You give it a destination, dates, budget, and interests. It pulls real points of interest for that city, then an AI planner sequences them into a day-by-day schedule that respects opening hours, travel time between stops, and your budget.",
  },
  {
    q: "What happens if something on my plan falls through?",
    a: "Trigger a disruption (or just tell the chat assistant, e.g. \"I missed my visit to the fort\") and TravelPilot rebuilds the affected part of your itinerary around it, with a plain-language explanation of what changed and why — not just a silent swap.",
  },
  {
    q: "Which cities can I plan a trip to?",
    a: "20 destinations across India right now — from Jaipur, Delhi, and Goa to Amritsar, Shimla, Hampi, and Munnar. Each one pulls live points of interest, not a fixed script.",
  },
  {
    q: "Is my trip data saved anywhere?",
    a: "Trips live in server memory for the length of your session, not a database — so they're not shared with anyone else, but they also won't persist if the backend restarts. This is a hackathon build, not a production travel service.",
  },
  {
    q: "How accurate are the costs and travel times?",
    a: "Costs are category-based estimates, and travel times are calculated from real coordinates between stops — close enough to plan around, but always worth double-checking specifics (opening hours, exact prices) before you actually travel.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-28 px-6 sm:px-10">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-10">Frequently asked questions</h2>
        <div className="space-y-3">
          {FAQS.map((item, i) => {
            const open = openIndex === i;
            return (
              <div key={item.q} className="glass rounded-2xl shadow-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  aria-expanded={open}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
                >
                  <span className="font-display font-semibold text-sm sm:text-base">{item.q}</span>
                  <span
                    className={`text-tertiary shrink-0 transition-transform ${open ? "rotate-45" : ""}`}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.25 }}
                    className="px-6 pb-5 text-sm text-secondary leading-relaxed"
                  >
                    {item.a}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
