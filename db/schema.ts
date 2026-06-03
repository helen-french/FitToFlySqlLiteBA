import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  avatar: text("avatar"), // Stores local file URI or remote URL
  carrier: text("carrier").default("British Airways").notNull(),
  fleet: text("fleet"),
  position: text("position"),
  contract: text("contract"),
  staffNumber: text("staff_number"), // Kept as text to support leading zeros/alphanumerics
  avatarUri: text("avatar_uri"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// TypeScript types for safe coding later
//  Define your strictly allowed values
export type AllowedCarrier = "British Airways" | "EasyJet" | "Virgin";
export type AllowedPosition = "Captain" | "First Officer" | "Training Captain";
// Overwrite the generic 'string' type from Drizzle with our strict lists
export type User = Omit<typeof users.$inferSelect, "carrier" | "position"> & {
  carrier: AllowedCarrier;
  position: AllowedPosition | null; // Nullable because it's optional
};
export type NewUser = Omit<
  typeof users.$inferInsert,
  "carrier" | "position"
> & {
  carrier?: AllowedCarrier;
  position?: AllowedPosition | null;
};
// Users ----------------------------

// CREW
export const crew = sqliteTable("crew", {
  // Absolute primary auto-increment tracking ID for multiple entries per pilot
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Core Profile Linking Fields
  staffNumber: text("staff_number").notNull(),
  surname: text("surname").notNull(),
  firstname: text("firstname").notNull(),
  initials: text("initials"), // NEW DELTA: Captures 'KH' / 'KKH'
  nameCode: text("name_code"), // Captures 'MELRK' / 'BENDM'

  // Professional Ranking & Assignment Identifiers
  crewFunction: integer("crew_function"), // NEW DELTA: Captures '11' or '12' role ranks
  seniorityNumber: integer("seniority_number"),
  aircraftType: text("aircraft_type"), // Captures '777' assignment (mapped to Fleet)
  crewBase: text("crew_base"), // Captures 'LHR' home station

  // Roster Cap Limit Trackers
  rosterMonth: text("roster_month"), // NEW DELTA: Tracks '2026-05' feed cycles
  individualCap: text("individual_cap"), // NEW DELTA: Tracks 'PT82H53M' flight limits

  // Automatic SQLite System Timestamps
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// TypeScript Compilation Type Shapes
export type CrewMember = typeof crew.$inferSelect;
export type NewCrewMember = typeof crew.$inferInsert;
