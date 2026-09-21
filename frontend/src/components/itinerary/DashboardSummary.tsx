import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getDashboard } from "../../lib/api";
import { hashCity } from "../../lib/hash";
import type { DashboardResponse } from "../../lib/types";
import AccommodationCard from "./AccommodationCard";
import TerrainBanner from "../scene/TerrainBanner";

interface Props {
  tripId: string;
  refreshKey: number;
}

export default function DashboardSummary({ tripId, refreshKey }: Props) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const seed = useMemo(() => hashCity(tripId), [tripId]);

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
          <TerrainBanner
            seed={seed}
            segments={data.day_breakdown.map((d) => ({
              label: d.date,
              value: d.accommodation_cost + d.travel_cost,
            }))}
          />

          {data.accommodations && data.accommodations.length > 1 ? (
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {data.accommodations.map((acc) => (
                <AccommodationCard key={acc.id} accommodation={acc} />
              ))}
            </div>
          ) : (
            <AccommodationCard accommodation={data.accommodation} />
          )}

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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="glass rounded-2xl p-6 shadow-card mt-6"
          >
            <h3 className="font-display font-semibold mb-4">Total trip cost</h3>
            <ul className="space-y-2 text-sm mb-4">
              <li className="flex items-center justify-between">
                <span className="text-secondary">Food &amp; activities</span>
                <span className="text-primary">₹{data.total_cost.toLocaleString("en-IN")}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-secondary">Stay</span>
                <span className="text-primary">
                  ₹{data.day_breakdown.reduce((sum, d) => sum + d.accommodation_cost, 0).toLocaleString("en-IN")}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-secondary">Travel</span>
                <span className="text-primary">
                  ₹{data.day_breakdown.reduce((sum, d) => sum + d.travel_cost, 0).toLocaleString("en-IN")}
                </span>
              </li>
            </ul>
            <div className="flex items-center justify-between pt-4 border-t border-subtle">
              <span className="font-display font-semibold">Total</span>
              <span className="font-display font-semibold text-accent text-lg">
                ₹{data.grand_total.toLocaleString("en-IN")}
              </span>
            </div>
          </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
