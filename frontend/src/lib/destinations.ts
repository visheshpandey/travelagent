export interface Destination {
  name: string;
  lat: number;
  lng: number;
  tagline: string;
}

export const DESTINATIONS: Destination[] = [
  { name: "Jaipur", lat: 26.9124, lng: 75.7873, tagline: "Forts & bazaars" },
  { name: "Delhi", lat: 28.6139, lng: 77.209, tagline: "Capital heritage" },
  { name: "Agra", lat: 27.1767, lng: 78.0081, tagline: "Taj Mahal" },
  { name: "Goa", lat: 15.2993, lng: 74.124, tagline: "Beaches & nightlife" },
  { name: "Udaipur", lat: 24.5854, lng: 73.7125, tagline: "City of lakes" },
  { name: "Kochi", lat: 9.9312, lng: 76.2673, tagline: "Backwaters" },
];

export const HUB_DESTINATION = "Delhi";

export const INTERESTS = ["heritage", "food", "nightlife", "shopping", "nature"] as const;
