import type { SiteFacts } from "./types";

const TIMEOUT_MS = 12000;
const IRV = "https://gis.cityofirvine.org/arcgis/rest/services";

async function getJson(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

type Attrs = Record<string, unknown>;

// Query an ArcGIS REST layer. Only the listed fields are requested (never owner names).
async function query(
  layerUrl: string,
  params: Record<string, string>,
): Promise<Attrs[]> {
  const q = new URLSearchParams({
    returnGeometry: "false",
    f: "json",
    ...params,
  });
  const data = await getJson(`${layerUrl}/query?${q}`);
  if (data.error) throw new Error(JSON.stringify(data.error));
  return ((data.features as { attributes: Attrs }[] | undefined) ?? []).map(
    (f) => f.attributes,
  );
}

const atPoint = (lon: number, lat: number, outFields: string) => ({
  geometry: `${lon},${lat}`,
  geometryType: "esriGeometryPoint",
  inSR: "4326",
  spatialRel: "esriSpatialRelIntersects",
  outFields,
});

interface Layer {
  label: string;
  publisher: string;
  url: string;
  read: (lon: number, lat: number) => Promise<Partial<SiteFacts> | null>;
}

const LAYERS: Layer[] = [
  {
    label: "Zoning district",
    publisher: "City of Irvine zoning map",
    url: `${IRV}/OnlineParcel/MapServer/7`,
    read: async (lon, lat) => {
      const [a] = await query(
        `${IRV}/OnlineParcel/MapServer/7`,
        atPoint(lon, lat, "ZONING,DESCRIPTION,PLANAREA"),
      );
      return a
        ? {
            zoning:
              `${a.ZONING} ${a.DESCRIPTION ?? ""}`.trim() +
              (a.PLANAREA ? `, Planning Area ${a.PLANAREA}` : ""),
          }
        : null;
    },
  },
  {
    label: "Parcel",
    publisher: "City of Irvine parcel map",
    url: `${IRV}/OnlineParcel/MapServer/4`,
    read: async (lon, lat) => {
      const layer = `${IRV}/OnlineParcel/MapServer/4`;
      const [a] = await query(layer, atPoint(lon, lat, "APN"));
      if (!a?.APN) return null;
      // One APN can be stored as several polygons; add them up for the whole lot (area is in sq ft).
      const parts = await query(layer, {
        where: `APN=${Number(a.APN)}`,
        outFields: "SHAPE.STArea()",
      });
      const area = parts.reduce(
        (sum, p) => sum + Number(p["SHAPE.STArea()"] ?? 0),
        0,
      );
      const apn = String(a.APN).padStart(8, "0");
      return {
        apn: `${apn.slice(0, 3)}-${apn.slice(3, 6)}-${apn.slice(6)}`,
        lot_area_sf: area ? Math.round(area) : null,
      };
    },
  },
  {
    label: "Flood zone",
    publisher: "FEMA National Flood Hazard Layer",
    url: "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28",
    read: async (lon, lat) => {
      const [a] = await query(
        "https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28",
        atPoint(lon, lat, "FLD_ZONE,ZONE_SUBTY"),
      );
      return a?.FLD_ZONE ? { flood_zone: String(a.FLD_ZONE) } : null;
    },
  },
  {
    label: "Fire hazard zone",
    publisher: "CAL FIRE Fire Hazard Severity Zones (2025)",
    url: "https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/FHSALRA25_v1_All/FeatureServer/0",
    read: async (lon, lat) => {
      const base =
        "https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services";
      const [[lra], [sra]] = await Promise.all([
        query(
          `${base}/FHSALRA25_v1_All/FeatureServer/0`,
          atPoint(lon, lat, "FHSZ,FHSZ_Description"),
        ),
        query(
          `${base}/FHSZSRA25_3/FeatureServer/0`,
          atPoint(lon, lat, "*"),
        ).catch(() => [] as Attrs[]),
      ]);
      // A positive class is Moderate/High/Very High; "NonWildland" (negative) means no zone.
      if (lra && Number(lra.FHSZ) > 0)
        return {
          fire_hazard: `${lra.FHSZ_Description} (local responsibility area)`,
        };
      const sraClass =
        sra &&
        Object.entries(sra).find(([k]) => k.endsWith("FHSZ_Description"))?.[1];
      if (sraClass)
        return { fire_hazard: `${sraClass} (state responsibility area)` };
      return lra ? {} : null;
    },
  },
];

async function geocode(address: string, site: SiteFacts) {
  // Irvine's own geocoder places the point on the lot; the Census geocoder (fallback) places it on the street.
  const irvine = `${IRV}/GISComposite/GeocodeServer/findAddressCandidates`;
  // The city geocoder matches the street part best, and only knows Irvine streets.
  const [street, ...rest] = address.split(",");
  const inIrvine = rest.length === 0 || /irvine/i.test(rest.join(","));
  if (inIrvine) try {
    const q = new URLSearchParams({
      SingleLine: street,
      outSR: "4326",
      maxLocations: "1",
      outFields: "Match_addr",
      f: "json",
    });
    const data = await getJson(`${irvine}?${q}`);
    const c = (
      data.candidates as
        | {
            address: string;
            score: number;
            location: { x: number; y: number };
          }[]
        | undefined
    )?.[0];
    if (c && c.score >= 90) {
      Object.assign(site, {
        matched_address: `${c.address}, IRVINE, CA`,
        lon: c.location.x,
        lat: c.location.y,
      });
      site.lookups.push({
        label: "Address location",
        publisher: "City of Irvine geocoder",
        url: irvine,
        ok: true,
      });
      return;
    }
  } catch {
    // fall through to the Census geocoder
  }
  const census =
    "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";
  try {
    const q = new URLSearchParams({
      address,
      benchmark: "Public_AR_Current",
      format: "json",
    });
    const data = await getJson(`${census}?${q}`);
    const m = (
      data.result as {
        addressMatches?: {
          matchedAddress: string;
          coordinates: { x: number; y: number };
        }[];
      }
    )?.addressMatches?.[0];
    if (m)
      Object.assign(site, {
        matched_address: m.matchedAddress,
        lon: m.coordinates.x,
        lat: m.coordinates.y,
      });
    site.lookups.push({
      label: "Address location",
      publisher: "U.S. Census Bureau geocoder",
      url: census,
      ok: !!m,
      note: m
        ? "Street-level position; lot layers may miss"
        : "No match for this address",
    });
  } catch (err) {
    site.lookups.push({
      label: "Address location",
      publisher: "U.S. Census Bureau geocoder",
      url: census,
      ok: false,
      note: String(err),
    });
  }
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
  await geocode(address, site);
  if (site.lon === null || site.lat === null) return site;

  const results = await Promise.allSettled(
    LAYERS.map((l) => l.read(site.lon!, site.lat!)),
  );
  results.forEach((r, i) => {
    const found = r.status === "fulfilled" ? r.value : null;
    if (found) Object.assign(site, found);
    site.lookups.push({
      label: LAYERS[i].label,
      publisher: LAYERS[i].publisher,
      url: LAYERS[i].url,
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
