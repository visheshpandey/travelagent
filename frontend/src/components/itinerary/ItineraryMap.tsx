import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface Props {
  stops: MapStop[];
  travelMode?: "driving" | "walking";
}

const CONTAINER_STYLE = { width: "100%", height: "420px", borderRadius: "16px" };

// Standard OpenStreetMap tiles — genuinely free, no API key, no signup, ever.
const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function accentColor(): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim();
  return v || "#7dd3fc";
}

function numberedIcon(n: number, color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:26px;height:26px;border-radius:50%;
      background:${color};color:#05060a;
      display:flex;align-items:center;justify-content:center;
      font:700 12px Inter, sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.5);
      border:2px solid rgba(255,255,255,0.25);
    ">${n}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function FitBounds({ stops }: { stops: MapStop[] }) {
  const map = useMap();
  useEffect(() => {
    if (stops.length === 0) return;
    if (stops.length === 1) {
      map.setView([stops[0].lat, stops[0].lng], 13);
      return;
    }
    const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [map, stops]);
  return null;
}

export default function ItineraryMap({ stops, travelMode = "driving" }: Props) {
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const accent = accentColor();

  const stopsKey = useMemo(() => stops.map((s) => s.id).join(","), [stops]);

  useEffect(() => {
    if (stops.length < 2) {
      setRouteCoords(null);
      return;
    }
    let cancelled = false;
    const coordPath = stops.map((s) => `${s.lng},${s.lat}`).join(";");
    fetch(`https://router.project-osrm.org/route/v1/${travelMode}/${coordPath}?overview=full&geometries=geojson`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const geometry = data?.routes?.[0]?.geometry?.coordinates;
        if (Array.isArray(geometry)) {
          setRouteCoords(geometry.map(([lng, lat]: [number, number]) => [lat, lng]));
          setRouteError(null);
        } else {
          // Fall back to a straight line through the stops in order.
          setRouteCoords(stops.map((s) => [s.lat, s.lng]));
          setRouteError("Couldn't fetch a real street route — showing a straight line between stops instead.");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setRouteCoords(stops.map((s) => [s.lat, s.lng]));
        setRouteError("Couldn't fetch a real street route — showing a straight line between stops instead.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopsKey, travelMode]);

  if (stops.length === 0) return null;

  const center: [number, number] = [stops[0].lat, stops[0].lng];

  return (
    <div className="glass rounded-2xl p-3 shadow-card">
      <MapContainer center={center} zoom={13} style={CONTAINER_STYLE} scrollWheelZoom={false}>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <FitBounds stops={stops} />
        {routeCoords && <Polyline positions={routeCoords} pathOptions={{ color: accent, weight: 4, opacity: 0.85 }} />}
        {stops.map((stop, i) => (
          <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={numberedIcon(i + 1, accent)}>
            <Popup>
              <span className="text-primary text-xs font-medium">{stop.name}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {routeError && <p className="text-xs text-tertiary mt-2">{routeError}</p>}
    </div>
  );
}
