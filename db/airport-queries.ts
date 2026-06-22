// db/airport-queries.ts
import { airportJsonData } from "../data/airportData";

/**
 * Synchronously retrieves airport reference data from local system memory.
 * Maps raw snake_case JSON keys to camelCase to match your UI expectation perfectly.
 */
export function getAirportByIataCode(code: string): any[] {
  try {
    if (!code || !code.trim()) return [];

    const cleanCode = code.trim().toUpperCase();

    // Find matching item inside your static data array
    const matchedRecord = airportJsonData.find(
      (item) => item.iata_code === cleanCode,
    );

    if (!matchedRecord) return [];

    // Return it inside an array container mapped to BOTH property conventions
    // to ensure screen rendering works flawlessly no matter what key it targets
    return [
      {
        name: matchedRecord.name,
        airportName: matchedRecord.name,
        country: matchedRecord.country_name,
        countryName: matchedRecord.country_name,
        iataCode: matchedRecord.iata_code,
        isoCountry: matchedRecord.iso_country,
        latitude: matchedRecord.latitude,
        longitude: matchedRecord.longitude,
      },
    ];
  } catch (error) {
    // Fixed the string template compilation crash here
    console.error(`❌ Memory Error looking up airport code [${code}]:`, error);
    return [];
  }
}
