import type {
  AlternativeSuggestion,
  DashboardResponse,
  DisruptResponse,
  ItineraryResponse,
  PoiSummary,
  TripConstraints,
  User,
  WeatherCheckResponse,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

// Set by AuthProvider on login/logout/hydration — kept as a module-level
// variable rather than threaded through every call site or read from React
// context here, since this file has no React dependency otherwise.
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export function getPois(destination: string) {
  return request<PoiSummary[]>(`/pois?destination=${encodeURIComponent(destination)}`);
}

export function generateItinerary(payload: {
  destination: string;
  start_date: string;
  end_date: string;
  budget_total: number;
  interests: string[];
  must_visit: string[];
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
  must_visit?: string[];
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

export interface AskResponse {
  answer: string;
  action: "answer" | "modify" | "disrupt";
  modify_result?: ItineraryResponse | null;
  disrupt_result?: DisruptResponse | null;
  updated_constraints?: TripConstraints | null;
}

export function askQuestion(payload: { trip_id: string; question: string }) {
  return request<AskResponse>("/ask", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getDashboard(tripId: string) {
  return request<DashboardResponse>(`/dashboard?trip_id=${encodeURIComponent(tripId)}`);
}

export function checkWeather(tripId: string) {
  return request<WeatherCheckResponse>(`/weather-check?trip_id=${encodeURIComponent(tripId)}`);
}

export function suggestAlternatives(payload: { trip_id: string; item_id: string }) {
  return request<{ alternatives: AlternativeSuggestion[] }>("/suggest-alternatives", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function googleLogin(idToken: string) {
  return request<{ session_token: string; user: User }>("/auth/google-login", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
  });
}

export function getMe() {
  return request<User>("/auth/me");
}
