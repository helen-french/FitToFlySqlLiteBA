import { eq } from "drizzle-orm";
import { db } from "./db";
import { hotels } from "./schema";

/**
 * Direct Manual Lookups:
 * Queries the SQLite database for a specific manually typed airport station IATA code.
 * Automatically handles uppercase sanitation and trims out accidental keyboard spaces.
 */
export async function getHotelByIataCode(code: string) {
  try {
    if (!code || !code.trim()) return [];

    return await db
      .select()
      .from(hotels)
      .where(eq(hotels.iata, code.trim().toUpperCase()));
  } catch (error) {
    console.error(
      `❌ Error performing manual hotel code lookup for [${code}]:`,
      error,
    );
    return [];
  }
}

/**
 * Dynamic Tab Lookups:
 * Efficiently fetches all matching hotel items for a collection of station codes passed
 * directly from your automated trip pairing loops (e.g. ["LGW", "TPA"]).
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
      `❌ Error performing dynamic station lookups for [${iataCode}]:`,
      error,
    );
    return [];
  }
}
