/**
 * ============================================================================
 * MODULE: In-Memory Airport Lookup Queries (airport-queries.ts)
 * ============================================================================
 * * DESCRIPTION:
 * This module provides high-speed, zero-latency synchronous dictionary lookups
 * from the static 'airportDictionary' mapped object.
 * * MECHANICS:
 * Instead of wasting CPU cycles making asynchronous calls to SQLite, this uses
 * JavaScript object property checking (O(1) complexity). By searching with
 * `airportDictionary[code]`, it retrieves metadata in micro-seconds.
 * ============================================================================
 */

import { airportDictionary, AirportReference } from "../data/airportData";

/**
 * Synchronously retrieves airport reference data from local system memory.
 * Returns the object match if found, or null if the station doesn't exist.
 */
export function getAirportByIataCode(code: string): AirportReference | null {
  try {
    if (!code || !code.trim()) return null;

    const cleanCode = code.trim().toUpperCase();
    const airportInfo = airportDictionary[cleanCode];

    return airportInfo || null;
  } catch (error) {
    console.error(
      `❌ Memory Error looking up airport dictionary code [${code}]:`,
      error,
    );
    return null;
  }
}
