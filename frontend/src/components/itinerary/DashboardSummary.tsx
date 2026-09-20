import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getDashboard } from "../../lib/api";
import type { DashboardResponse } from "../../lib/types";
import AccommodationCard from "./AccommodationCard";

interface Props {
  tripId: string;
  refreshKey: number;
}

export default function DashboardSummary({ tripId, refreshKey }: Props) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDashboard(tripId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard");
      });
    return () => {
      cancelled = true;
    };
  }, [tripId, refreshKey]);

  return (
    <section id="dashboard" className="relative py-28 px-6 sm:px-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-10">Trip overview</h2>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {data && (
          <>
          <AccommodationCard accommodation={data.accommodation} />

          <div className="space-y-6 mb-6">
            {data.day_breakdown.map((day, i) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-6 shadow-card"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold">{day.date}</h3>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-tertiary">
                      Stay <span className="text-accent font-medium">₹{day.accommodation_cost.toLocaleString("en-IN")}</span>
                    </span>
                    <span className="text-tertiary">
                      Travel <span className="text-accent font-medium">₹{day.travel_cost.toLocaleString("en-IN")}</span>
                    </span>
                  </div>
                </div>
                {day.legs.length === 0 ? (
                  <p className="text-sm text-tertiary">No transfers this day.</p>
                ) : (
                  <ul className="space-y-3">
                    {day.legs.map((leg, j) => (
                      <li key={j} className="flex items-center justify-between text-sm">
                        <span className="text-secondary">
                          {leg.from} → {leg.to}
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="text-accent font-medium">{leg.estimated_minutes} min</span>
                          <span className="text-faint">₹{leg.estimated_cost}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="glass rounded-2xl p-6 shadow-card"
          >
            <h3 className="font-display font-semibold mb-4">Backup options</h3>
            {data.backup_options.length === 0 ? (
              <p className="text-sm text-tertiary">No backups suggested.</p>
            ) : (
              <ul className="space-y-3">
                {data.backup_options.map((opt, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-secondary">{opt.poi}</span>
                    <span className="text-xs uppercase tracking-wide text-accent2 capitalize">
                      {opt.category}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
