import type { SiteFacts } from "./types";

const TIMEOUT_MS = 12000;

async function getJson(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// One ArcGIS REST layer queried at a point. `read` turns the first feature's attributes into site facts.
interface Layer {
  label: string;
  publisher: string;
  url: string; // .../MapServer/N or .../FeatureServer/N
  read: (a: Record<string, unknown>) => Partial<SiteFacts>;
}

const LAYERS: Layer[] = [];

async function queryLayer(layer: Layer, lon: number, lat: number) {
  const q = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    returnGeometry: "false",
    f: "json",
  });
  const data = await getJson(`${layer.url}/query?${q}`);
  const features =
    (data.features as { attributes: Record<string, unknown> }[] | undefined) ??
    [];
  return features.length ? layer.read(features[0].attributes) : null;
}

export async function lookupSite(address: string): Promise<SiteFacts> {
  const site: SiteFacts = {
    address,
    matched_address: null,
    lat: null,
    lon: null,
    apn: null,
    lot_area_sf: null,
    zoning: null,
    flood_zone: null,
    fire_hazard: null,
    lookups: [],
  };

  const geocoder =
    "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";
  try {
    const q = new URLSearchParams({
      address,
      benchmark: "Public_AR_Current",
      format: "json",
    });
    const data = await getJson(`${geocoder}?${q}`);
    const match = (
      data.result as {
        addressMatches?: {
          matchedAddress: string;
          coordinates: { x: number; y: number };
        }[];
      }
    )?.addressMatches?.[0];
    if (match) {
      site.matched_address = match.matchedAddress;
      site.lon = match.coordinates.x;
      site.lat = match.coordinates.y;
    }
    site.lookups.push({
      label: "Address location",
      publisher: "U.S. Census Bureau Geocoder",
      url: geocoder,
      ok: !!match,
      note: match ? undefined : "No match for this address",
    });
  } catch (err) {
    site.lookups.push({
      label: "Address location",
      publisher: "U.S. Census Bureau Geocoder",
      url: geocoder,
      ok: false,
      note: String(err),
    });
  }
  if (site.lon === null || site.lat === null) return site;

  const results = await Promise.allSettled(
    LAYERS.map((l) => queryLayer(l, site.lon!, site.lat!)),
  );
  results.forEach((r, i) => {
    const layer = LAYERS[i];
    const found = r.status === "fulfilled" ? r.value : null;
    if (found) Object.assign(site, found);
    site.lookups.push({
      label: layer.label,
      publisher: layer.publisher,
      url: layer.url,
      ok: !!found,
      note:
        r.status === "rejected"
          ? String(r.reason)
          : found
            ? undefined
            : "Nothing at this point",
    });
  });
  return site;
}
