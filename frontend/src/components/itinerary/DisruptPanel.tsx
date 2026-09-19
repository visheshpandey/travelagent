import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { disruptTrip } from "../../lib/api";
import type { DayPlan } from "../../lib/types";

interface Props {
  tripId: string;
  days: DayPlan[];
  selectedItemId: string | null;
  explanation: string | null;
  onDisrupted: (days: DayPlan[], explanation: string) => void;
}

export default function DisruptPanel({ tripId, days, selectedItemId, explanation, onDisrupted }: Props) {
  const [reason, setReason] = useState("closed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItem = days.flatMap((d) => d.items).find((i) => i.id === selectedItemId);

  async function handleDisrupt() {
    if (!selectedItemId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await disruptTrip({ trip_id: tripId, item_id: selectedItemId, reason });
      onDisrupted(res.days, res.explanation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disruption failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 -mt-10 mb-24">
      <div className="glass rounded-2xl p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-white/50 mb-1">Simulate disruption</p>
          <p className="text-sm">
            {selectedItem ? (
              <>
                Selected: <span className="text-ember font-semibold">{selectedItem.poi}</span>
              </>
            ) : (
              "Select an activity above to disrupt it."
            )}
          </p>
        </div>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="reason (e.g. closed)"
          className="rounded-full bg-panel border border-white/10 px-4 py-2 text-xs w-40 focus:border-ember focus:outline-none"
        />
        <button
          onClick={handleDisrupt}
          disabled={!selectedItemId || loading}
          className="rounded-full bg-ember text-ink font-semibold px-5 py-2 text-sm hover:brightness-110 transition disabled:opacity-40"
        >
          {loading ? "Replanning…" : "Trigger disruption"}
        </button>
      </div>

      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

      <AnimatePresence>
        {explanation && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-4 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4"
          >
            <p className="text-xs uppercase tracking-wide text-accent font-semibold mb-1">
              Why this changed
            </p>
            <p className="text-sm text-white/85">{explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
