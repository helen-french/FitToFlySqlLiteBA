/**
 * ============================================================================
 * ENGINE: Station Reference Airport SQLite Ingestion Module (airport-loader.ts)
 * ============================================================================
 * * DESCRIPTION:
 * This module manages mapping the static JSON reference array definitions
 * directly into relational SQLite database rows using Drizzle ORM syntax.
 * * ARCHITECTURE FLOW:
 * ── STEP 1: Payload Sanitation
 * Iterates through `airportJsonData`, strips accidental whitespace, and forces
 * three-letter IATA station codes to clean uppercase values.
 * ── STEP 2: Database Purge Transaction Block
 * Opens an atomic SQLite write block. Sweeps out the existing table dataset to
 * prevent conflicting primary key collisions before writing fresh records.
 * ── STEP 3: Variable-Safe Chunking Insertion
 * Splices records into clean processing batches of 50 rows. This keeps the execution
 * highly optimized and stays safely below SQLite's maximum compound parameter limits.
 * ============================================================================
 */

import { airportJsonData } from "../data/airportData";
import { db } from "./db";
import { airports } from "./schema";

export async function loadAirportReferenceData() {
  try {
    console.log("🚀 Initializing Relational Ingestion Engine for Airports...");

    if (!Array.isArray(airportJsonData) || airportJsonData.length === 0) {
      throw new Error("Invalid or empty airport JSON payload structure.");
    }

    const payload = airportJsonData.map((item) => ({
      iataCode: item.iata_code.trim().toUpperCase(),
      name: item.name.trim(),
      countryName: item.country_name || null,
      isoCountry: item.iso_country || null,
      latitude: item.latitude,
      longitude: item.longitude,
    }));

    let insertedCount = 0;

    await db.transaction(async (tx) => {
      // Clear out the stale tracking set completely
      await tx.delete(airports);

      const chunkSize = 50;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        await tx.insert(airports).values(chunk);
        insertedCount += chunk.length;
      }
    });

    console.log(
      `🏁 Airport database synchronization complete. Ingested ${insertedCount} rows.`,
    );
    return { success: true, count: insertedCount };
  } catch (error) {
    console.error("❌ Airport Reference Ingestion Failure:", error);
    throw error;
  }
}
