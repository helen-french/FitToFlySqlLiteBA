import { sql } from "drizzle-orm";
import { db } from "./db";

export async function wipeAllTablesForTesting() {
  console.log("🧼 Executing targeted database purge routine...");
  try {
    // ──✅ SAFE PURGE: Manually truncate/delete your operational tables
    // This safely keeps the '__drizzle_migrations' internal tracking table completely intact!
    await db.run(sql`DELETE FROM data_load;`);
    await db.run(sql`DELETE FROM roster;`);
    await db.run(sql`DELETE FROM trips;`);
    await db.run(sql`DELETE FROM duties;`);
    await db.run(sql`DELETE FROM sectors;`);
    await db.run(sql`DELETE FROM ground_duties;`);
    await db.run(sql`DELETE FROM person_details;`);
    await db.run(sql`DELETE FROM crew_members;`);
    await db.run(sql`DELETE FROM trip_crew;`);

    // Reset SQLite's auto-incrementing primary key counters back to 0
    await db.run(
      sql`DELETE FROM sqlite_sequence WHERE name IN ('data_load', 'roster', 'trips', 'duties', 'sectors', 'ground_duties', 'person_details', 'crew_members', 'trip_crew');`,
    );

    console.log("✅ Purge successful. Operational schemas cleared safely.");
  } catch (error) {
    console.error("❌ Purge routine encountered a structural failure:", error);
    throw error;
  }
}
