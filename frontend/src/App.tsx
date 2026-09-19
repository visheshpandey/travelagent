import { useState } from "react";
import AmbientField from "./components/background/AmbientField";
import Navbar from "./components/layout/Navbar";
import Hero from "./components/hero/Hero";
import ConstraintForm from "./components/forms/ConstraintForm";
import ItineraryBoard from "./components/itinerary/ItineraryBoard";
import DisruptPanel from "./components/itinerary/DisruptPanel";
import DashboardSummary from "./components/itinerary/DashboardSummary";
import ChatPanel from "./components/chat/ChatPanel";
import type { ItineraryResponse } from "./lib/types";

function App() {
  const [trip, setTrip] = useState<ItineraryResponse | null>(null);
  const [destination, setDestination] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleGenerated(res: ItineraryResponse, dest: string) {
    setTrip(res);
    setDestination(dest);
    setSelectedItemId(null);
    setExplanation(null);
    setRefreshKey((k) => k + 1);
    requestAnimationFrame(() => {
      document.getElementById("itinerary")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  function handleDisrupted(days: ItineraryResponse["days"], explanationText: string) {
    setTrip((prev) => (prev ? { ...prev, days } : prev));
    setExplanation(explanationText);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="relative min-h-screen">
      <AmbientField />
      <Navbar />
      <Hero />
      <ConstraintForm onGenerated={handleGenerated} />

      {trip ? (
        <>
          <ItineraryBoard
            destination={destination}
            days={trip.days}
            totalCost={trip.total_cost}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
          />
          <DisruptPanel
            tripId={trip.trip_id}
            days={trip.days}
            selectedItemId={selectedItemId}
            explanation={explanation}
            onSelectItem={setSelectedItemId}
            onDisrupted={handleDisrupted}
          />
          <DashboardSummary tripId={trip.trip_id} refreshKey={refreshKey} />
        </>
      ) : (
        <div id="itinerary" className="max-w-3xl mx-auto px-6 py-28 text-center">
          <p className="text-white/40 text-sm">
            Generate an itinerary above to see it laid out here, trigger a live disruption, and view the
            dashboard.
          </p>
          <div id="dashboard" />
        </div>
      )}

      <ChatPanel tripId={trip?.trip_id ?? null} />

      <footer className="text-center text-xs text-white/30 py-10">
        TravelPilot — built for a 2-day hackathon.
      </footer>
    </div>
  );
}

export default App;
