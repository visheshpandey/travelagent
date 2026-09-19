import type { DashboardResponse, DisruptResponse, ItineraryResponse } from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export function generateItinerary(payload: {
  destination: string;
  start_date: string;
  end_date: string;
  budget_total: number;
  interests: string[];
}) {
  return request<ItineraryResponse>("/generate-itinerary", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function modifyTrip(payload: {
  trip_id: string;
  budget_total?: number;
  interests?: string[];
  start_date?: string;
  end_date?: string;
}) {
  return request<ItineraryResponse>("/modify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function disruptTrip(payload: { trip_id: string; item_id: string; reason: string }) {
  return request<DisruptResponse>("/disrupt", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function askQuestion(payload: { trip_id: string; question: string }) {
  return request<{ answer: string }>("/ask", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getDashboard(tripId: string) {
  return request<DashboardResponse>(`/dashboard?trip_id=${encodeURIComponent(tripId)}`);
}
