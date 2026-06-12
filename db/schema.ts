import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

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
// CREW MEMBERS: Master list of co-workers captured across feeds
// ========================================================================
export const crewMembers = sqliteTable("crew_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  staffNumber: text("staff_number").notNull().unique(), // Unique base key
  surname: text("surname").notNull(),
  initials: text("initials").notNull(),
  nameCode: text("name_code").notNull(),
  crewFunction: integer("crew_function"), //Captures '11' or '12' role ranks
  aircraftType: text("aircraft_type"), // e.g., '777'
  crewBase: text("crew_base"), // e.g., 'LHR'
  rosterMonth: text("roster_month"), //Tracks '2026-05' feed cycles
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type CrewMember = typeof crewMembers.$inferSelect;
export type NewCrewMember = typeof crewMembers.$inferInsert;

// ========================================================================
// TRIP CREW: Relational junction matching crew directly to assignments
// ========================================================================
export const tripCrew = sqliteTable("trip_crew", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripNumber: text("trip_number")
    .notNull()
    .references(() => trips.tripNumber, { onDelete: "cascade" }),
  staffNumber: text("staff_number")
    .notNull()
    .references(() => crewMembers.staffNumber, { onDelete: "cascade" }),
  crewFunction: integer("crew_function"), // Captures '11' or '12' role ranks on this trip
  rosterMonth: text("roster_month").notNull(), // Tracks '2026-05' feed cycles
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type TripCrewAssignment = typeof tripCrew.$inferSelect;
export type NewTripCrewAssignment = typeof tripCrew.$inferInsert;

// ========================================================================
// TRIPS (The macro flight pairing / blocks)
// ========================================================================
export const trips = sqliteTable("trips", {
  tripNumber: text("trip_number").primaryKey(), // ── Key identifier
  rosterMonth: text("roster_month").notNull(), // e.g., "2026-06"
  blockNumber: text("block_number"), // (e.g., "0001")
  startDate: text("start_date").notNull(), // e.g., "2026-06-07"
  endDate: text("end_date").notNull(),
  numberOfDuties: integer("number_of_duties"),
  tripLength: integer("trip_length"),
  heavyCrewIndicator: text("heavy_crew_indicator"),
  base: text("base"),
  localDayShift: text("local_day_shift"), // (e.g., "+0")
  crewComplementPilots: integer("crew_comp_pilots"), //(maps array index 0)
  crewComplementCabin: integer("crew_comp_cabin"), // (maps array index 1)
  dayCodes: text("day_codes"), // <── Added (e.g., "      Z")

  creditCategory: text("credit_category"), // e.g., "TR1"
  creditAmount: text("credit_amount"), // e.g., "PT21H45M"
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type Trip = typeof trips.$inferSelect;

// ========================================================================
// DUTIES (Individual working days within a trip pairing)
// ========================================================================
export const duties = sqliteTable(
  "duties",
  {
    tripNumber: text("trip_number") // ── Link on tripNumber
      .notNull()
      .references(() => trips.tripNumber, { onDelete: "cascade" }),
    dutyNumber: integer("duty_number").notNull(), // ── Link on dutyNumber
    dutyHours: text("duty_hours"), // ISO duration e.g., PT13H10M
    flyingHours: text("flying_hours"),
    numberOfSectors: integer("number_of_sectors"),
    actualReportTime: text("actual_report_time"),

    // FDTL Legal Work Timings Blocks
    industrialBriefTime: text("industrial_brief_time"), // <── Added
    industrialDebriefTime: text("industrial_debrief_time"), // <── Added
    schemeBriefTime: text("scheme_brief_time"), // <── Added
    schemeDebriefTime: text("scheme_debrief_time"), // <── Added

    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    // Composite Key ensures uniqueness for a specific trip day combo
    pk: primaryKey({ columns: [table.tripNumber, table.dutyNumber] }),
  }),
);

export type Duty = typeof duties.$inferSelect;
// ========================================================================
// SECTORS (The individual flight legs flown inside a single duty day)
// ========================================================================
export const sectors = sqliteTable("sectors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tripNumber: text("trip_number").notNull(), // ── Flat composite lookups
  dutyNumber: integer("duty_number").notNull(), // ── Flat composite lookups
  sectorNumber: integer("sector_number").notNull(),
  carrier: text("carrier").notNull(),
  flightNumber: text("flight_number").notNull(),
  aircraftTypeSpecific: text("aircraft_type_specific"),
  departureStation: text("departure_station").notNull(),
  arrivalStation: text("arrival_station").notNull(),

  // Timings & Local Shifts
  departureTime: text("departure_time").notNull(), // Zulu time e.g., "13:30"
  departureTimeLocal: text("departure_time_local"),
  departureTimeShift: text("departure_time_shift"), // <── Added
  arrivalTime: text("arrival_time").notNull(),
  arrivalTimeLocal: text("arrival_time_local"),
  arrivalTimeShift: text("arrival_time_shift"), // <── Added
  relativeDepartureDay: integer("relative_departure_day"),

  // Operational Metadata
  sectorType: text("sector_type"),
  heavyCrewIdentifier: text("heavy_crew_identifier"),
  flyingHours: text("flying_hours"),
  flyingHoursCredit: text("flying_hours_credit"), // <── Added
  scheduleIndicator: text("schedule_indicator"),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type Sector = typeof sectors.$inferSelect;
