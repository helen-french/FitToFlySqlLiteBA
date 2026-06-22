/**
 * ============================================================================
 * MODULE: Hotel Database Queries (hotel-queries.ts)
 * ============================================================================
 * * DESCRIPTION:
 * This module manages asynchronous data access operations targeting the SQLite
 * 'hotels' database table using Drizzle ORM syntax.
 * * MECHANICS:
 * - getHotelByIataCode: Filters and matches rows based on a unique 3-letter IATA string.
 * - getHotelsByStation: Used for batch mapping tasks.
 * All incoming string parameters are automatically sanitized with .trim() and
 * forced to uppercase to guarantee robust indexing matches.
 * ============================================================================
 */

import { eq } from "drizzle-orm";
import { db } from "./db";
import { hotels } from "./schema";

/**
 * Queries the SQLite database for a specific manually searched airport station hotel.
 */
export async function getHotelByIataCode(code: string) {
  try {
    if (!code || !code.trim()) return [];

    return await db
      .select()
      .from(hotels)
      .where(eq(hotels.iata, code.trim().toUpperCase()));
  } catch (error) {
    console.error(`❌ SQLite Error looking up hotel code [${code}]:`, error);
    return [];
  }
}

/**
 * Queries the database for hotel contracts matching automated roster destinations.
 */
export async function getHotelsByStation(iataCode: string) {
  try {
    if (!iataCode || !iataCode.trim()) return [];

    return await db
      .select({
        id: hotels.id,
        iata: hotels.iata,
        name: hotels.name,
        address: hotels.address,
        tel: hotels.tel,
        crew: hotels.crew,
        comments: hotels.comments,
      })
      .from(hotels)
      .where(eq(hotels.iata, iataCode.trim().toUpperCase()));
  } catch (error) {
    console.error(
      `❌ SQLite Error performing station lookups for [${iataCode}]:`,
      error,
    );
    return [];
  }
}
