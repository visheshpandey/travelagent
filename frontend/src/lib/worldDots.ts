import { feature } from "topojson-client";
import { geoEquirectangular, geoPath } from "d3-geo";
import type { Topology, GeometryCollection } from "topojson-specification";
import landTopology from "world-atlas/land-110m.json";

export interface LatLng {
  lat: number;
  lng: number;
}

const CANDIDATE_COUNT = 6000;
const RASTER_W = 720;
const RASTER_H = 360;

/** Evenly distributes N points on a unit sphere (Fibonacci sphere). */
function fibonacciSphere(n: number): LatLng[] {
  const points: LatLng[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2; // -1..1
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    const lat = Math.asin(y) * (180 / Math.PI);
    const lng = Math.atan2(z, x) * (180 / Math.PI);
    points.push({ lat, lng });
  }
  return points;
}

let cached: LatLng[] | null = null;

/** Land-masked, roughly-evenly-spaced points across the globe's landmasses.
 *
 * Rather than testing each candidate point against the land polygons
 * directly (d3-geo's geoContains is far too slow for thousands of calls
 * against a multi-ring polygon — it blocked the main thread for tens of
 * seconds), this rasterizes the land shape once onto a small offscreen
 * canvas and samples pixels, which is effectively instant.
 */
export function getLandDots(): LatLng[] {
  if (cached) return cached;

  const landFeature = feature(
    landTopology as unknown as Topology,
    landTopology.objects.land as GeometryCollection,
  );

  const canvas = document.createElement("canvas");
  canvas.width = RASTER_W;
  canvas.height = RASTER_H;
  const ctx = canvas.getContext("2d")!;

  const projection = geoEquirectangular()
    .scale(RASTER_W / (2 * Math.PI))
    .translate([RASTER_W / 2, RASTER_H / 2]);
  const path = geoPath(projection, ctx);

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  path(landFeature as any);
  ctx.fill();

  const mask = ctx.getImageData(0, 0, RASTER_W, RASTER_H).data;

  cached = fibonacciSphere(CANDIDATE_COUNT).filter((p) => {
    const xy = projection([p.lng, p.lat]);
    if (!xy) return false;
    const px = Math.round(xy[0]);
    const py = Math.round(xy[1]);
    if (px < 0 || px >= RASTER_W || py < 0 || py >= RASTER_H) return false;
    return mask[(py * RASTER_W + px) * 4 + 3] > 128;
  });
  return cached;
}
