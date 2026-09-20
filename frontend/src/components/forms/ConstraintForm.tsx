import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { DESTINATIONS, INTERESTS } from "../../lib/destinations";
import { generateItinerary, getPois } from "../../lib/api";
import { useLaunchSequence, type ScreenPoint } from "../../lib/useLaunchSequence";
import { getDestinationPhoto } from "../../lib/destinationPhoto";
import LaunchOverlay from "../transition/LaunchOverlay";
import type { ItineraryResponse, PoiSummary, TripConstraints } from "../../lib/types";

interface Props {
  destination: string;
  onDestinationChange: (name: string) => void;
  onGenerated: (trip: ItineraryResponse, destination: string, constraints: TripConstraints) => void;
}

export default function ConstraintForm({ destination, onDestinationChange, onGenerated }: Props) {
  const [startDate, setStartDate] = useState("2026-11-10");
  const [endDate, setEndDate] = useState("2026-11-12");
  const [budget, setBudget] = useState(15000);
  const [interests, setInterests] = useState<string[]>(["heritage", "food"]);
  const [mustVisit, setMustVisit] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const originRef = useRef<ScreenPoint | null>(null);
  const pendingTripRef = useRef<ItineraryResponse | null>(null);
  const pendingDestRef = useRef("");
  const pendingConstraintsRef = useRef<TripConstraints | null>(null);
  const launch = useLaunchSequence({
    onReveal: () => {
      const trip = pendingTripRef.current;
      const usedConstraints = pendingConstraintsRef.current;
      if (trip && usedConstraints) {
        onGenerated(trip, pendingDestRef.current, usedConstraints);
        pendingTripRef.current = null;
        pendingConstraintsRef.current = null;
      }
    },
    onDone: () => setLoading(false),
  });

  const [pois, setPois] = useState<PoiSummary[]>([]);
  const [poisLoading, setPoisLoading] = useState(false);
  const [poisError, setPoisError] = useState<string | null>(null);
  const poiCache = useRef<Record<string, PoiSummary[]>>({});

  const [destPhoto, setDestPhoto] = useState<string | null>(null);
  const [destPhotoError, setDestPhotoError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDestPhoto(null);
    setDestPhotoError(false);
    getDestinationPhoto(destination).then((url) => {
      if (!cancelled) setDestPhoto(url);
    });
    return () => {
      cancelled = true;
    };
  }, [destination]);

  useEffect(() => {
    setMustVisit([]);
    setPoisError(null);

    if (poiCache.current[destination]) {
      setPois(poiCache.current[destination]);
      return;
    }

    let cancelled = false;
    setPoisLoading(true);
    setPois([]);
    getPois(destination)
      .then((res) => {
        if (cancelled) return;
        poiCache.current[destination] = res;
        setPois(res);
      })
      .catch((err) => {
        if (!cancelled) setPoisError(err instanceof Error ? err.message : "Failed to load places");
      })
      .finally(() => {
        if (!cancelled) setPoisLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [destination]);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
    );
  }

  function toggleMustVisit(poiId: string) {
    setMustVisit((prev) => (prev.includes(poiId) ? prev.filter((id) => id !== poiId) : [...prev, poiId]));
  }

  // The rocket dives straight down off the bottom edge of the viewport —
  // this is the exit point the dive curve aims at, deliberately off-screen
  // (SequenceScene clamps a separate on-screen point for the visible blast).
  function computeTarget(origin: ScreenPoint): ScreenPoint {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      x: Math.min(Math.max(origin.x, vw * 0.3), vw * 0.7),
      y: vh + 180,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const usedConstraints: TripConstraints = {
        start_date: startDate,
        end_date: endDate,
        budget_total: budget,
        interests,
        must_visit: mustVisit,
      };
      const trip = await generateItinerary({ destination, ...usedConstraints });
      // Only now — once the itinerary is actually in hand — does the
      // rocket launch. No indeterminate "waiting" animation; the button's
      // own label covers the fetch, and the transition plays as one fast,
      // predictable burst once there's something real to reveal.
      pendingTripRef.current = trip;
      pendingDestRef.current = destination;
      pendingConstraintsRef.current = usedConstraints;
      const origin = originRef.current ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      launch.start(origin, computeTarget(origin));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
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
          <p className="text-tertiary text-sm mb-6">
            Pick a destination — the agent handles hours, budget, and travel time.
          </p>

          <div
            className="relative rounded-2xl overflow-hidden mb-6 h-56"
            style={{ background: "linear-gradient(160deg,#3a2440,#c97a4a)" }}
          >
            {destPhoto && !destPhotoError && (
              <motion.img
                key={destPhoto}
                src={destPhoto}
                alt={destination}
                referrerPolicy="no-referrer"
                onError={() => setDestPhotoError(true)}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(20,10,14,0) 42%, rgba(20,10,14,0.8) 100%)" }}
            />
            <div className="absolute left-5 bottom-4">
              <p className="text-[11px] tracking-[0.14em] uppercase mb-1" style={{ color: "#ffe7bf" }}>
                Destination
              </p>
              <p className="font-display text-2xl font-semibold" style={{ color: "#fff8ee" }}>
                {destination}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-wide text-tertiary mb-2">
                Destination
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {DESTINATIONS.map((d) => (
                  <button
                    type="button"
                    key={d.name}
                    onClick={() => onDestinationChange(d.name)}
                    className={`rounded-xl px-3 py-2 text-xs font-medium border transition ${
                      destination === d.name
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-subtle text-secondary hover:border-outline"
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

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

            <div>
              <label className="block text-xs uppercase tracking-wide text-tertiary mb-2">
                Must-visit places <span className="normal-case text-faint">(optional)</span>
              </label>
              {poisLoading && (
                <p className="text-xs text-tertiary">
                  Loading real places for {destination}… first load can take up to a minute.
                </p>
              )}
              {poisError && <p className="text-xs text-red-400">{poisError}</p>}
              {!poisLoading && !poisError && (
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                  {pois.map((poi) => (
                    <button
                      type="button"
                      key={poi.id}
                      onClick={() => toggleMustVisit(poi.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                        mustVisit.includes(poi.id)
                          ? "border-ember bg-ember/15 text-ember"
                          : "border-subtle text-secondary hover:border-outline"
                      }`}
                    >
                      {poi.name}
                    </button>
                  ))}
                </div>
              )}
              {mustVisit.length > 0 && (
                <p className="text-xs text-tertiary mt-2">
                  The agent will guarantee these {mustVisit.length} place{mustVisit.length === 1 ? "" : "s"}{" "}
                  fit in the plan.
                </p>
              )}
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              onClick={(e) => {
                originRef.current = { x: e.clientX, y: e.clientY };
              }}
              disabled={loading}
              className="w-full rounded-full bg-accent text-onaccent font-semibold py-3 text-sm shadow-glow hover:brightness-110 transition disabled:opacity-50"
            >
              {loading ? "Generating itinerary…" : "Generate itinerary"}
            </button>
          </form>
        </motion.div>
      </div>
      </section>
      {createPortal(
        <LaunchOverlay phase={launch.phase} origin={launch.origin} target={launch.target} />,
        document.body,
      )}
    </>
  );
}
