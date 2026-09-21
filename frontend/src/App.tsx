import { useMemo, useState } from "react";
import Navbar from "./components/layout/Navbar";
import Hero from "./components/hero/Hero";
import ConstraintForm from "./components/forms/ConstraintForm";
import EditConstraintsPanel from "./components/forms/EditConstraintsPanel";
import ItineraryBoard from "./components/itinerary/ItineraryBoard";
import ItineraryMap from "./components/itinerary/ItineraryMap";
import ConflictBanner from "./components/itinerary/ConflictBanner";
import DisruptPanel from "./components/itinerary/DisruptPanel";
import DashboardSummary from "./components/itinerary/DashboardSummary";
import StopTimeline from "./components/itinerary/StopTimeline";
import ChatPanel from "./components/chat/ChatPanel";
import FAQSection from "./components/layout/FAQSection";
import AboutSection from "./components/layout/AboutSection";
import ContactSection from "./components/layout/ContactSection";
import { AuthProvider } from "./lib/auth";
import { DESTINATIONS } from "./lib/destinations";
import { hashCity } from "./lib/hash";
import type { ItineraryResponse, TripConstraints } from "./lib/types";

function App() {
  const [trip, setTrip] = useState<ItineraryResponse | null>(null);
  const [destinations, setDestinations] = useState<string[]>([DESTINATIONS[0].name]);
  const [constraints, setConstraints] = useState<TripConstraints | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [disrupted, setDisrupted] = useState(false);

  const heroSeed = useMemo(() => hashCity(destinations.join("|")), [destinations]);
  const heroLabel = useMemo(() => destinations.join(" → "), [destinations]);

  const stops = useMemo(
    () =>
      trip
        ? trip.days
            .flatMap((d) => d.items)
            .filter((item): item is typeof item & { lat: number; lng: number } => item.lat != null && item.lng != null)
            .map((item) => ({ id: item.id, name: item.poi, lat: item.lat, lng: item.lng }))
        : [],
    [trip],
  );

  function handleGenerated(res: ItineraryResponse, dests: string[], usedConstraints: TripConstraints) {
    setTrip(res);
    setDestinations(dests);
    setConstraints(usedConstraints);
    setSelectedItemId(res.days[0]?.items[0]?.id ?? null);
    setExplanation(null);
    setDisrupted(false);
    setRefreshKey((k) => k + 1);
    requestAnimationFrame(() => {
      document.getElementById("itinerary")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  function handleDisrupted(days: ItineraryResponse["days"], explanationText: string, conflicts?: ItineraryResponse["conflicts"]) {
    setTrip((prev) => (prev ? { ...prev, days, conflicts } : prev));
    setExplanation(explanationText);
    setDisrupted(true);
    setRefreshKey((k) => k + 1);
  }

  function handleModified(res: ItineraryResponse, usedConstraints: TripConstraints) {
    setTrip(res);
    setConstraints(usedConstraints);
    setSelectedItemId(res.days[0]?.items[0]?.id ?? null);
    setRefreshKey((k) => k + 1);
  }

  return (
    <AuthProvider>
      <div className="relative min-h-screen">
        <Navbar />
        <main>
        <Hero cityName={heroLabel} seed={heroSeed} disrupted={disrupted} />
        <ConstraintForm destinations={destinations} onDestinationsChange={setDestinations} onGenerated={handleGenerated} />

        {trip ? (
          <>
            <StopTimeline days={trip.days} selectedItemId={selectedItemId} onSelectItem={setSelectedItemId} />
            <div className="lg:pl-64">
              <div className="max-w-6xl mx-auto px-6 sm:px-10 -mt-6 mb-6">
                <ConflictBanner conflicts={trip.conflicts} />
              </div>
              <ItineraryBoard
                destinations={trip.destinations ?? destinations}
                days={trip.days}
                totalCost={trip.total_cost}
                selectedItemId={selectedItemId}
                onSelectItem={setSelectedItemId}
              />
              {stops.length > 0 && (
                <div className="max-w-6xl mx-auto px-6 sm:px-10 -mt-10 mb-16">
                  <ItineraryMap stops={stops} travelMode="driving" />
                </div>
              )}
              <div className="max-w-6xl mx-auto px-6 sm:px-10 -mt-10 mb-6">
                <EditConstraintsPanel
                  key={trip.trip_id}
                  tripId={trip.trip_id}
                  constraints={constraints}
                  onModified={handleModified}
                />
              </div>
              <DisruptPanel
                tripId={trip.trip_id}
                days={trip.days}
                selectedItemId={selectedItemId}
                explanation={explanation}
                onSelectItem={setSelectedItemId}
                onDisrupted={handleDisrupted}
              />
              <DashboardSummary tripId={trip.trip_id} refreshKey={refreshKey} />
            </div>
          </>
        ) : (
          <div id="itinerary" className="max-w-3xl mx-auto px-6 py-28 text-center">
            <p className="text-tertiary text-sm">
              <a href="#plan" className="text-accent hover:underline">
                Generate an itinerary above
              </a>{" "}
              to see it laid out here, trigger a live disruption, and view the dashboard.
            </p>
            <div id="dashboard" />
          </div>
        )}

        <FAQSection />
        <AboutSection />
        <ContactSection />
        </main>

        <ChatPanel tripId={trip?.trip_id ?? null} onModified={handleModified} onDisrupted={handleDisrupted} />

        <footer className="text-center text-xs text-faint py-10">
          TravelPilot — built for a 2-day hackathon.
        </footer>
      </div>
    </AuthProvider>
  );
}

export default App;
