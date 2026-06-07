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

// ========================================================================
// TRIPS (The macro flight pairing / blocks)
// ========================================================================
export const trips = sqliteTable("trips", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripCode: text("trip_code").notNull(), // e.g., "BA173A"
  rosterMonth: text("roster_month").notNull(), // e.g., "2026-05"
  startDate: text("start_date").notNull(), // e.g., "2026-05-12"
  endDate: text("end_date").notNull(), // e.g., "2026-05-15"
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type Trip = typeof trips.$inferSelect;

// ========================================================================
// DUTIES (Individual working days within a trip pairing)
// ========================================================================
export const duties = sqliteTable("duties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripId: integer("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }), // Clears duties if trip is wiped
  dutyDate: text("duty_date").notNull(), // e.g., "2026-05-12"
  reportTime: text("report_time"), // e.g., "10:15"
  clearTime: text("clear_time"), // e.g., "19:30"
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type Duty = typeof duties.$inferSelect;

// ========================================================================
// SECTORS (The individual flight legs flown inside a single duty day)
// ========================================================================
export const sectors = sqliteTable("sectors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dutyId: integer("duty_id")
    .notNull()
    .references(() => duties.id, { onDelete: "cascade" }), // Clears sectors if duty day is wiped
  flightNumber: text("flight_number").notNull(), // e.g., "BA173"
  departureAirport: text("departure_airport").notNull(), // e.g., "LHR"
  arrivalAirport: text("arrival_airport").notNull(), // e.g., "JFK"
  departureTime: text("departure_time").notNull(), // e.g., "11:55"
  arrivalTime: text("arrival_time").notNull(), // e.g., "14:45"
  aircraftRegistration: text("aircraft_reg"), // e.g., "G-YMMB"
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type Sector = typeof sectors.$inferSelect;
