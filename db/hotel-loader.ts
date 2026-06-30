/**
 * ============================================================================
 * ENGINE: Station Contract Hotels SQLite Ingestion Module (hotel-loader.ts)
 * ============================================================================
 * * DESCRIPTION:
 * This module provides a highly resilient, native runtime CSV character tokenizer
 * tailored specifically for handling complex data records inside SQLite.
 * * ARCHITECTURE FLOW:
 * ── STEP 1: Character Tokenization Loop (parseFullCSV)
 * Iterates through the raw template string one character at a time. Commas or
 * newlines are only evaluated as column/row boundaries when outside of quote marks.
 * ── STEP 2: Header Index Matrix Mapping
 * Checks row zero for specific column header text titles dynamically, ensuring
 * column index resilience if structural data columns change positions in the future.
 * ── STEP 3: Transaction Batch Ingestion
 * Drops the old hotel table entries and saves fresh mapped datasets using atomic
 * SQLite transactions in batches of 50 to prevent constraint collisions.
 * ============================================================================
 */

import { db } from "./db";
import { hotels } from "./schema";

function parseFullCSV(text: string): string[][] {
  const records: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let insideQuote = false;

  const n = text.length;
  let i = 0;

  while (i < n) {
    const char = text[i];

    if (char === '"') {
      insideQuote = !insideQuote;
    } else if (char === "," && !insideQuote) {
      currentRow.push(
        currentField
          .trim()
          .replace(/^["']|["']$/g, "")
          .trim(),
      );
      currentField = "";
    } else if ((char === "\n" || char === "\r") && !insideQuote) {
      if (char === "\r" && i + 1 < n && text[i + 1] === "\n") {
        i++;
      }
      currentRow.push(
        currentField
          .trim()
          .replace(/^["']|["']$/g, "")
          .trim(),
      );

      if (currentRow.some((field) => field.length > 0)) {
        records.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
    i++;
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(
      currentField
        .trim()
        .replace(/^["']|["']$/g, "")
        .trim(),
    );
    if (currentRow.some((field) => field.length > 0)) {
      records.push(currentRow);
    }
  }

  return records;
}

export async function loadHotelCsvData(fullRawContent: string) {
  try {
    console.log("🚀 Initializing Load Hotels...");
    const timestampString = new Date().toISOString();

    const rows = parseFullCSV(fullRawContent);
    if (rows.length < 2) {
      throw new Error("Invalid CSV: Document contains no data rows.");
    }

    const headers = rows[0];
    const getIndex = (name: string) => headers.indexOf(name);

    const indices = {
      title: getIndex("Title"),
      iata: getIndex("IATA"),
      workflow: getIndex("Set Title to IATA - Hotel"),
      crew: getIndex("Crew"),
      effectiveFrom: getIndex("Effective From"),
      effectiveTo: getIndex("Effective To"),
      name: getIndex("Name"),
      tel: getIndex("Tel"),
      fax: getIndex("Fax"),
      web: getIndex("Web"),
      email: getIndex("Email"),
      address: getIndex("Address"),
      discounts: getIndex("Discounts Available"),
      host: getIndex("HOST"),
      internet: getIndex("Internet"),
      health: getIndex("Health Club"),
      comments: getIndex("Comments"),
      transProvider: getIndex("Transport Provider"),
      transPhone: getIndex("Transport Phone"),
      transEmail: getIndex("Transport Email"),
      roomSpec: getIndex("Hotel Room Specification"),
      modified: getIndex("Modified"),
    };

    if (indices.name === -1 || indices.iata === -1) {
      throw new Error(
        `CSV Schema Mismatch: Missing core required columns 'Name' or 'IATA'.`,
      );
    }

    const recordsToInsert: any[] = [];

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i];
      const hotelName = values[indices.name];
      const iataCode = values[indices.iata];

      if (!hotelName || !iataCode) continue;

      const hostStr = values[indices.host]?.toLowerCase() || "";
      const isHost = hostStr === "true" || hostStr === "yes" || hostStr === "y";

      recordsToInsert.push({
        title: values[indices.title] || null,
        iata: iataCode,
        workflowUrl: values[indices.workflow] || null,
        crew: values[indices.crew] || null,
        effectiveFrom: values[indices.effectiveFrom] || null,
        effectiveTo: values[indices.effectiveTo] || null,
        name: hotelName,
        tel: values[indices.tel] || null,
        fax: values[indices.fax] || null,
        web: values[indices.web] || null,
        email: values[indices.email] || null,
        address: values[indices.address] || null,
        discountsAvailable: values[indices.discounts] || null,
        host: isHost,
        internet: values[indices.internet] || null,
        healthClub: values[indices.health] || null,
        comments: values[indices.comments] || null,
        transportProvider: values[indices.transProvider] || null,
        transportPhone: values[indices.transPhone] || null,
        transportEmail: values[indices.transEmail] || null,
        hotelRoomSpecification: values[indices.roomSpec] || null,
        sourceModified: values[indices.modified] || null,
        createdAt: timestampString,
        updatedAt: timestampString,
      });
    }

    let insertedCount = 0;
    await db.transaction(async (tx) => {
      await tx.delete(hotels);

      const chunkSize = 50;
      for (let j = 0; j < recordsToInsert.length; j += chunkSize) {
        const chunk = recordsToInsert.slice(j, j + chunkSize);
        await tx.insert(hotels).values(chunk);
        insertedCount += chunk.length;
      }
    });

    console.log(
      `🏁 Hotel database synchronization complete. Ingested ${insertedCount} rows.`,
    );
    return { success: true, count: insertedCount };
  } catch (error) {
    console.error("❌ Hotel Data Load Failure:", error);
    throw error;
  }
}
