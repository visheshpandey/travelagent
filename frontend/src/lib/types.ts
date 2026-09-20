export interface ItineraryItem {
  id: string;
  poi: string;
  start: string;
  end: string;
  cost: number;
  category: string;
  lat?: number | null;
  lng?: number | null;
}

export interface DayPlan {
  date: string;
  items: ItineraryItem[];
  day_cost: number;
}

export interface Accommodation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rating: number | null;
  cost_per_night: number;
}

export interface ConflictItem {
  day: string;
  item_ids: string[];
  issue: string;
}

export interface ItineraryResponse {
  trip_id: string;
  days: DayPlan[];
  total_cost: number;
  accommodation?: Accommodation | null;
  conflicts?: ConflictItem[];
}

export interface DisruptResponse {
  trip_id: string;
  days: DayPlan[];
  explanation: string;
  conflicts?: ConflictItem[];
}

export interface TripConstraints {
  start_date: string;
  end_date: string;
  budget_total: number;
  interests: string[];
  must_visit: string[];
}

export interface AlternativeSuggestion {
  id: string;
  name: string;
  category: string;
  rating: number | null;
}

export interface TransportLeg {
  from: string;
  to: string;
  estimated_minutes: number;
  estimated_cost: number;
}

export interface DayBreakdown {
  date: string;
  accommodation_cost: number;
  travel_cost: number;
  legs: TransportLeg[];
}

export interface BackupOption {
  poi: string;
  category: string;
}

export interface DashboardResponse {
  trip_id: string;
  itinerary: DayPlan[];
  day_breakdown: DayBreakdown[];
  total_cost: number;
  backup_options: BackupOption[];
  accommodation?: Accommodation | null;
  grand_total: number;
}

export interface ChatMessage {
  role: "user" | "agent";
  text: string;
}

export interface AtRiskItem {
  item_id: string;
  poi: string;
  date: string;
  category: string;
}

export interface WeatherCheckResponse {
  destination: string;
  condition: string;
  description: string;
  temp_c: number;
  is_severe: boolean;
  at_risk_items: AtRiskItem[];
}

export interface User {
  sub: string;
  email: string;
  name: string;
  picture: string | null;
}

export interface PoiSummary {
  id: string;
  name: string;
  category: string;
  rating: number | null;
}
