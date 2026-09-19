export interface ItineraryItem {
  id: string;
  poi: string;
  start: string;
  end: string;
  cost: number;
  category: string;
}

export interface DayPlan {
  date: string;
  items: ItineraryItem[];
  day_cost: number;
}

export interface ItineraryResponse {
  trip_id: string;
  days: DayPlan[];
  total_cost: number;
}

export interface DisruptResponse {
  trip_id: string;
  days: DayPlan[];
  explanation: string;
}

export interface TransportLeg {
  day: string;
  from: string;
  to: string;
  estimated_minutes: number;
}

export interface BackupOption {
  poi: string;
  category: string;
}

export interface DashboardResponse {
  trip_id: string;
  itinerary: DayPlan[];
  transportation: TransportLeg[];
  total_cost: number;
  backup_options: BackupOption[];
}

export interface ChatMessage {
  role: "user" | "agent";
  text: string;
}
