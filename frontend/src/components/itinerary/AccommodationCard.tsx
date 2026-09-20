import type { Accommodation } from "../../lib/types";

interface Props {
  accommodation: Accommodation | null | undefined;
}

export default function AccommodationCard({ accommodation }: Props) {
  if (!accommodation) return null;

  return (
    <div className="glass rounded-2xl p-6 shadow-card w-full mb-6">
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
  );
}
