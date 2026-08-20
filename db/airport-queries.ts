/**
 * Airport reference lookups from static `data/airport-codes.json`
 * (ICAO-keyed; indexed by IATA on first use).
 */

export type AirportCodeRecord = {
  icao: string;
  iata: string;
  name: string;
  city: string;
  state: string;
  country: string;
  elevation: number;
  lat: number;
  lon: number;
  tz: string;
};

/** UI-facing shape returned by getAirportByIataCode (hotels / modal / sectors). */
export type AirportLookupResult = {
  name: string;
  airportName: string;
  country: string;
  countryName: string;
  /** ISO region code from the JSON (`GB`, `US`, `BB`, …). */
  isoCountry: string;
  iataCode: string;
  icao: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  elevation: number;
  tz: string;
};

let iataIndex: Map<string, AirportCodeRecord> | null = null;

function isValidIata(code: string): boolean {
  return /^[A-Z]{3}$/.test(code);
}

function getIataIndex(): Map<string, AirportCodeRecord> {
  if (iataIndex) return iataIndex;

  // Lazy load — avoids parsing ~29k airports until first lookup.
  const raw = require("../data/airport-codes.json") as Record<
    string,
    AirportCodeRecord
  >;

  iataIndex = new Map();
  for (const row of Object.values(raw)) {
    const iata = (row.iata || "").trim().toUpperCase();
    if (!isValidIata(iata)) continue;

    const existing = iataIndex.get(iata);
    if (!existing) {
      iataIndex.set(iata, row);
      continue;
    }

    // Prefer the longer / more descriptive name when IATA collides.
    if ((row.name?.length ?? 0) > (existing.name?.length ?? 0)) {
      iataIndex.set(iata, row);
    }
  }

  return iataIndex;
}

/**
 * Drop "Airport" / "International" from a raw airport name.
 * e.g. "London Heathrow Airport" → "London Heathrow"
 */
export function cleanAirportName(rawName: string): string {
  return rawName
    .replace(/\bAirport\b/gi, "")
    .replace(/\bInternational\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ISO country → display label.
 * GB → UK, US → US; others use English region names (e.g. BB → Barbados).
 */
export function formatAirportCountryDisplay(
  isoOrName?: string | null,
): string {
  if (!isoOrName?.trim()) return "";
  const raw = isoOrName.trim();
  const upper = raw.toUpperCase();

  if (upper === "GB" || upper === "UK" || raw === "United Kingdom") return "UK";
  if (upper === "US" || raw === "United States") return "US";

  // Already a long name from the old airportData.ts path.
  if (raw.length > 3) return raw;

  try {
    const display = new Intl.DisplayNames(["en"], { type: "region" }).of(
      upper,
    );
    return display || raw;
  } catch {
    return raw;
  }
}

/**
 * Pipe / modal subtitle: cleaned name + country.
 * e.g. "Grantley Adams, Barbados"
 */
export function formatAirportDisplayName(
  rawName: string,
  isoOrCountry?: string | null,
): string {
  const cleaned = cleanAirportName(rawName);
  const countryLabel = formatAirportCountryDisplay(isoOrCountry);
  return countryLabel ? `${cleaned}, ${countryLabel}` : cleaned;
}

function mapRecord(row: AirportCodeRecord): AirportLookupResult {
  const countryDisplay = formatAirportCountryDisplay(row.country);
  return {
    name: row.name,
    airportName: row.name,
    country: countryDisplay || row.country,
    countryName: countryDisplay || row.country,
    isoCountry: row.country,
    iataCode: row.iata.trim().toUpperCase(),
    icao: row.icao,
    city: row.city,
    state: row.state,
    latitude: row.lat,
    longitude: row.lon,
    elevation: row.elevation,
    tz: row.tz,
  };
}

/**
 * Synchronously retrieves airport reference data by IATA.
 * Returns an array (0–1 items) for compatibility with hotels / modal callers.
 */
export function getAirportByIataCode(code: string): AirportLookupResult[] {
  try {
    if (!code?.trim()) return [];

    const cleanCode = code.trim().toUpperCase();
    if (!isValidIata(cleanCode)) return [];

    const row = getIataIndex().get(cleanCode);
    if (!row) return [];

    return [mapRecord(row)];
  } catch (error) {
    console.error(`❌ Airport lookup failed for [${code}]:`, error);
    return [];
  }
}
