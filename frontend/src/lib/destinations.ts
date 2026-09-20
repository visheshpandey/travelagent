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
  { name: "Mumbai", lat: 19.076, lng: 72.8777, tagline: "Bollywood & bay" },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946, tagline: "Gardens & tech" },
  { name: "Chennai", lat: 13.0827, lng: 80.2707, tagline: "Temples & coast" },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639, tagline: "Colonial soul" },
  { name: "Varanasi", lat: 25.3176, lng: 82.9739, tagline: "Ganges ghats" },
  { name: "Amritsar", lat: 31.634, lng: 74.8723, tagline: "Golden Temple" },
  { name: "Shimla", lat: 31.1048, lng: 77.1734, tagline: "Hill station" },
  { name: "Manali", lat: 32.2432, lng: 77.1892, tagline: "Himalayan valleys" },
  { name: "Mysuru", lat: 12.2958, lng: 76.6394, tagline: "Palaces & silk" },
  { name: "Jaisalmer", lat: 26.9157, lng: 70.9083, tagline: "Desert fort" },
  { name: "Rishikesh", lat: 30.0869, lng: 78.2676, tagline: "Yoga & rapids" },
  { name: "Darjeeling", lat: 27.041, lng: 88.2663, tagline: "Tea & peaks" },
  { name: "Hampi", lat: 15.335, lng: 76.46, tagline: "Ruins & boulders" },
  { name: "Munnar", lat: 10.0889, lng: 77.0595, tagline: "Tea hills" },
];

export const HUB_DESTINATION = "Delhi";

export const INTERESTS = ["heritage", "food", "nightlife", "shopping", "nature"] as const;
