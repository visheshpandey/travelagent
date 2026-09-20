import type { ConflictItem } from "../../lib/types";

interface Props {
  conflicts: ConflictItem[] | undefined;
}

export default function ConflictBanner({ conflicts }: Props) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="rounded-2xl border border-ember/30 bg-ember/10 px-5 py-4 mb-6">
      <p className="text-xs text-ember font-medium mb-2">Scheduling conflicts</p>
      <ul className="space-y-1">
        {conflicts.map((conflict, i) => (
          <li key={i} className="text-sm text-primary">
            <span className="text-secondary">{conflict.day}</span> — {conflict.issue}
          </li>
        ))}
      </ul>
    </div>
  );
}
