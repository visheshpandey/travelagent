import { useState } from "react";
import { motion } from "framer-motion";
import { DESTINATIONS, INTERESTS } from "../../lib/destinations";
import { generateItinerary } from "../../lib/api";
import type { ItineraryResponse } from "../../lib/types";

interface Props {
  onGenerated: (trip: ItineraryResponse, destination: string) => void;
}

export default function ConstraintForm({ onGenerated }: Props) {
  const [destination, setDestination] = useState(DESTINATIONS[0].name);
  const [startDate, setStartDate] = useState("2026-11-10");
  const [endDate, setEndDate] = useState("2026-11-12");
  const [budget, setBudget] = useState(15000);
  const [interests, setInterests] = useState<string[]>(["heritage", "food"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const trip = await generateItinerary({
        destination,
        start_date: startDate,
        end_date: endDate,
        budget_total: budget,
        interests,
      });
      onGenerated(trip, destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="plan" className="relative py-28 px-6 sm:px-10">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="glass rounded-3xl p-8 sm:p-10 shadow-card"
        >
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-1">Set your constraints</h2>
          <p className="text-white/50 text-sm mb-8">
            Pick a destination — the agent handles hours, budget, and travel time.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-wide text-white/50 mb-2">
                Destination
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {DESTINATIONS.map((d) => (
                  <button
                    type="button"
                    key={d.name}
                    onClick={() => setDestination(d.name)}
                    className={`rounded-xl px-3 py-2 text-xs font-medium border transition ${
                      destination === d.name
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-white/10 text-white/60 hover:border-white/25"
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wide text-white/50 mb-2">
                  Start date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl bg-panel border border-white/10 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-white/50 mb-2">
                  End date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl bg-panel border border-white/10 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-white/50 mb-2">
                Budget: <span className="text-accent font-semibold">₹{budget.toLocaleString("en-IN")}</span>
              </label>
              <input
                type="range"
                min={2000}
                max={50000}
                step={500}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-accent"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-white/50 mb-2">
                Interests
              </label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => (
                  <button
                    type="button"
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium border capitalize transition ${
                      interests.includes(interest)
                        ? "border-accent2 bg-accent2/15 text-accent2"
                        : "border-white/10 text-white/60 hover:border-white/25"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-accent text-ink font-semibold py-3 text-sm shadow-glow hover:brightness-110 transition disabled:opacity-50"
            >
              {loading ? "Generating itinerary…" : "Generate itinerary"}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
