import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getDashboard } from "../../lib/api";
import type { DashboardResponse } from "../../lib/types";

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
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="uppercase tracking-[0.3em] text-xs text-accent/80 font-semibold mb-2"
        >
          Dashboard
        </motion.p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold mb-10">Trip overview</h2>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {data && (
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              className="glass rounded-2xl p-6 shadow-card"
            >
              <h3 className="font-display font-semibold mb-4">Transportation</h3>
              {data.transportation.length === 0 ? (
                <p className="text-sm text-white/40">No transfers between activities.</p>
              ) : (
                <ul className="space-y-3">
                  {data.transportation.map((leg, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span className="text-white/70">
                        {leg.from} → {leg.to}
                      </span>
                      <span className="text-accent font-medium">{leg.estimated_minutes} min</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6 shadow-card"
            >
              <h3 className="font-display font-semibold mb-4">Backup options</h3>
              {data.backup_options.length === 0 ? (
                <p className="text-sm text-white/40">No backups suggested.</p>
              ) : (
                <ul className="space-y-3">
                  {data.backup_options.map((opt, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span className="text-white/70">{opt.poi}</span>
                      <span className="text-xs uppercase tracking-wide text-accent2 capitalize">
                        {opt.category}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}
