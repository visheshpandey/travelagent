import { useState } from "react";
import { INTERESTS } from "../../lib/destinations";
import { modifyTrip } from "../../lib/api";
import type { ItineraryResponse, TripConstraints } from "../../lib/types";

interface Props {
  tripId: string;
  constraints: TripConstraints | null;
  onModified: (res: ItineraryResponse, used: TripConstraints) => void;
}

export default function EditConstraintsPanel({ tripId, constraints, onModified }: Props) {
  const [startDate, setStartDate] = useState(constraints?.start_date ?? "");
  const [endDate, setEndDate] = useState(constraints?.end_date ?? "");
  const [budget, setBudget] = useState(constraints?.budget_total ?? 15000);
  const [interests, setInterests] = useState<string[]>(constraints?.interests ?? []);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!constraints) return null;

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!constraints) return;
    setError(null);
    setLoading(true);
    try {
      const res = await modifyTrip({
        trip_id: tripId,
        budget_total: budget,
        interests,
        start_date: startDate,
        end_date: endDate,
      });
      onModified(res, {
        start_date: startDate,
        end_date: endDate,
        budget_total: budget,
        interests,
        must_visit: constraints.must_visit,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update itinerary");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-6 shadow-card">
      <h3 className="font-display font-semibold mb-4">Edit constraints</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-tertiary mb-2">
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl bg-panel border border-subtle px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-tertiary mb-2">
              End date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl bg-panel border border-subtle px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-tertiary mb-2">
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
          <label className="block text-xs uppercase tracking-wide text-tertiary mb-2">
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
                    : "border-subtle text-secondary hover:border-outline"
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
          className="w-full rounded-full bg-accent text-onaccent font-semibold py-3 text-sm shadow-glow hover:brightness-110 transition disabled:opacity-50"
        >
          {loading ? "Updating…" : "Update itinerary"}
        </button>
      </form>
    </div>
  );
}
