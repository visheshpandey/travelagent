import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { checkWeather, disruptTrip } from "../../lib/api";
import type { DayPlan, WeatherCheckResponse } from "../../lib/types";

interface Props {
  tripId: string;
  days: DayPlan[];
  selectedItemId: string | null;
  explanation: string | null;
  onSelectItem: (itemId: string) => void;
  onDisrupted: (days: DayPlan[], explanation: string) => void;
}

const WEATHER_ICON: Record<string, string> = {
  Thunderstorm: "⛈️",
  Drizzle: "🌦️",
  Rain: "🌧️",
  Snow: "❄️",
  Clear: "☀️",
  Clouds: "☁️",
};

export default function DisruptPanel({
  tripId,
  days,
  selectedItemId,
  explanation,
  onSelectItem,
  onDisrupted,
}: Props) {
  const [reason, setReason] = useState("closed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherCheckResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const selectedItem = days.flatMap((d) => d.items).find((i) => i.id === selectedItemId);

  async function handleCheckWeather() {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      setWeather(await checkWeather(tripId));
    } catch (err) {
      setWeatherError(err instanceof Error ? err.message : "Weather check failed");
    } finally {
      setWeatherLoading(false);
    }
  }

  function handlePickAtRiskItem(itemId: string, poi: string) {
    onSelectItem(itemId);
    setReason(`${weather?.description ?? "bad weather"} in ${weather?.destination} — ${poi} is outdoors`);
  }

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
      <div className="glass rounded-2xl p-6 shadow-card mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-white/50 mb-1">Live weather check</p>
            {weather ? (
              <p className="text-sm">
                {WEATHER_ICON[weather.condition] ?? "🌡️"} {weather.destination} right now:{" "}
                <span className="font-medium">{weather.description}</span>,{" "}
                {Math.round(weather.temp_c)}°C
                {weather.is_severe && (
                  <span className="text-ember font-semibold"> — outdoor plans at risk</span>
                )}
              </p>
            ) : (
              <p className="text-sm text-white/50">Check today's real conditions at the destination.</p>
            )}
          </div>
          <button
            onClick={handleCheckWeather}
            disabled={weatherLoading}
            className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/80 hover:bg-white/5 transition disabled:opacity-40"
          >
            {weatherLoading ? "Checking…" : "Check live weather"}
          </button>
        </div>

        {weatherError && <p className="text-sm text-red-400 mt-3">{weatherError}</p>}

        {weather && weather.is_severe && weather.at_risk_items.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-white/50 mb-2">
              These outdoor activities may be affected — tap one to select it for disruption:
            </p>
            <div className="flex flex-wrap gap-2">
              {weather.at_risk_items.map((item) => (
                <button
                  key={item.item_id}
                  onClick={() => handlePickAtRiskItem(item.item_id, item.poi)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium border transition ${
                    selectedItemId === item.item_id
                      ? "border-ember bg-ember/10 text-ember"
                      : "border-white/10 text-white/70 hover:border-white/25"
                  }`}
                >
                  {item.poi} · {item.date}
                </button>
              ))}
            </div>
          </div>
        )}

        {weather && weather.is_severe && weather.at_risk_items.length === 0 && (
          <p className="text-xs text-white/40 mt-3">
            Conditions are severe, but no outdoor activities are currently scheduled.
          </p>
        )}
      </div>

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
