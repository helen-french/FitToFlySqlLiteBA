import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * Clears roster ingest tables only so feeds can be re-loaded.
 * Does not touch person_details, crew_members, hotels, airports, users, or credits.
 */
export async function clearRosterData() {
  console.log("🧼 Clearing roster data...");
  try {
    // Children first (FK → data_load / trips), then parents.
    await db.run(sql`DELETE FROM roster_amendments;`);
    await db.run(sql`DELETE FROM roster_history;`);
    await db.run(sql`DELETE FROM roster;`);
    await db.run(sql`DELETE FROM sectors;`);
    await db.run(sql`DELETE FROM duties;`);
    await db.run(sql`DELETE FROM trip_crew;`);
    await db.run(sql`DELETE FROM trips;`);
    await db.run(sql`DELETE FROM ground_duties;`);
    await db.run(sql`DELETE FROM data_load;`);

    await db.run(
      sql`DELETE FROM sqlite_sequence WHERE name IN (
        'roster_amendments',
        'roster_history',
        'roster',
        'sectors',
        'duties',
        'ground_duties',
        'data_load'
      );`,
    );

    console.log("✅ Roster data cleared.");
  } catch (error) {
    console.error("❌ clearRosterData failed:", error);
    throw error;
  }
}
