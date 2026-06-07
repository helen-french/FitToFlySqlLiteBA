import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ========================================================================
// USERS: editiable table for user to maintain their profile and preferences
// ========================================================================
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
});

// TypeScript inference types
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

// ========================================================================
// PERSON DETAILS: peresonal details held by carrier for the user to link to their profile
// ========================================================================
export const personDetails = sqliteTable("person_details", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  staffNumber: text("staff_number").notNull(),
  surname: text("surname").notNull(),
  initials: text("initials").notNull(),
  nameCode: text("name_code").notNull(),
  seniorityNumber: integer("seniority_number"),
  individualCap: text("individual_cap"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Export clean TypeScript inference types for your application layers
export type PersonDetails = typeof personDetails.$inferSelect;
export type NewPersonDetails = typeof personDetails.$inferInsert;

// ========================================================================
// TRIP CREW: crew details for each roster month feed
// ========================================================================

// CREW
export const tripCrew = sqliteTable("trip_crew", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  staffNumber: text("staff_number").notNull(), // Relates directly to personDetails.staffNumber
  surname: text("surname").notNull(),
  initials: text("initials").notNull(),
  nameCode: text("name_code").notNull(),
  crewFunction: integer("crew_function"), //Captures '11' or '12' role ranks
  aircraftType: text("aircraft_type"), // Captures '777' assignment (mapped to Fleet)
  crewBase: text("crew_base"), // Captures 'LHR' home station
  rosterMonth: text("roster_month"), //Tracks '2026-05' feed cycles
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// TypeScript Compilation Type Shapes
export type TripCrewMember = typeof tripCrew.$inferSelect;
export type NewTripCrewMember = typeof tripCrew.$inferInsert;
