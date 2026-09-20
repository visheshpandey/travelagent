import { useState } from "react";
import type { Accommodation } from "../../lib/types";
import PoiPopup from "../poi/PoiPopup";
import type { PoiPopupData } from "../../lib/poiPopup";

interface Props {
  accommodation: Accommodation | null | undefined;
}

export default function AccommodationCard({ accommodation }: Props) {
  const [showPopup, setShowPopup] = useState(false);

  if (!accommodation) return null;

  const popupData: PoiPopupData | null = showPopup
    ? {
        kind: "stay",
        title: accommodation.name,
        subtitle: accommodation.rating !== null ? `★ ${accommodation.rating.toFixed(1)}` : undefined,
        accentColor: "#b1502c",
        rows: [
          { label: "Cost / night", value: `₹${accommodation.cost_per_night.toLocaleString("en-IN")}` },
        ],
      }
    : null;

  return (
    <>
    <div
      onClick={() => setShowPopup(true)}
      className="glass rounded-2xl p-6 shadow-card w-full mb-6 cursor-pointer hover:border-accent/40 transition"
    >
      <h3 className="font-display font-semibold mb-4">Where you're staying</h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-primary font-medium">{accommodation.name}</p>
          {accommodation.rating !== null && (
            <p className="text-xs text-tertiary mt-1">★ {accommodation.rating.toFixed(1)}</p>
          )}
        </div>
        <p className="text-accent font-semibold text-sm">
          ₹{accommodation.cost_per_night.toLocaleString("en-IN")}/night
        </p>
      </div>
    </div>
    <PoiPopup data={popupData} onClose={() => setShowPopup(false)} />
    </>
  );
}
