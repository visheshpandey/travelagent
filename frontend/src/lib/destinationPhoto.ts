const cache: Record<string, string | null> = {};

/** Wikipedia's REST summary endpoint is public, key-free, and CORS-enabled —
 *  a reliable source for a real photo of each fixed destination city. */
export async function getDestinationPhoto(cityName: string): Promise<string | null> {
  if (cityName in cache) return cache[cityName];
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cityName)}`,
    );
    if (!res.ok) throw new Error("not found");
    const data = await res.json();
    const url: string | null = data.thumbnail?.source ?? data.originalimage?.source ?? null;
    cache[cityName] = url;
    return url;
  } catch {
    cache[cityName] = null;
    return null;
  }
}
