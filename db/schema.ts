import {
  integer,
  primaryKey,
  real,
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

// ========================================================================
// DATALOAD (data load audit registry)
// ========================================================================
export const dataLoad = sqliteTable("data_load", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Roster XML File Metadata
  rosterFileName: text("roster_file_name"),
  rosterDateOfCreation: text("roster_date_of_creation"),
  rosterTimeOfCreation: text("roster_time_of_creation"),
  rosterMonthNumber: text("roster_month_number"), // e.g., "2026-07"
  rosterStartDateOfFeed: text("roster_start_date_of_feed"),
  rosterEndDateOfFeed: text("roster_end_date_of_feed"),

  // Trip XML File Metadata
  tripFileName: text("trip_file_name"),
  tripDateOfCreation: text("trip_date_of_creation"),
  tripTimeOfCreation: text("trip_time_of_creation"),

  createdAt: text("created_at").notNull(),
  //updatedAt: text("updated_at").notNull(),
});
export type DataLoad = typeof dataLoad.$inferSelect;

// ========================================================================
// GROUND DUTIES (Non-flying workdays like training, leave, etc.)
// ========================================================================
export const groundDuties = sqliteTable("ground_duties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  crewMovementCode: text("crew_movement_code").notNull(), // e.g., "GLD", "TA", "CH"
  startDate: text("start_date").notNull(), // e.g., "2026-07-23"
  startTime: text("start_time"), // e.g., "00:01"
  endDate: text("end_date").notNull(), // e.g., "2026-07-23"
  endTime: text("end_time"), // e.g., "24:00"
  creditAmount: text("credit_amount"), // e.g., "PT03H25M"
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export type GroundDuty = typeof groundDuties.$inferSelect;
// ========================================================================
// ROSTER (current duty roster, month is dropped and rebuilt
// ========================================================================
export const roster = sqliteTable("roster", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dataLoadId: integer("data_load_id")
    .notNull()
    .references(() => dataLoad.id),
  type: text("type").notNull(), // "T" (Trip) or "G" (Ground Duty)

  tripNumber: text("trip_number"),
  groundDutyId: integer("ground_duty_id"),

  // Fast performance lookup indices for chronology
  rosterMonth: text("roster_month").notNull(), // e.g., "2026-07"
  startDate: text("start_date").notNull(), // e.g., "2026-07-04"

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export type RosterIndex = typeof roster.$inferSelect;

// ========================================================================
// ROSTER HISTORY (Audit trail mapping historical changes per data load)
// ========================================================================
export const rosterHistory = sqliteTable("roster_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dataLoadId: integer("data_load_id")
    .notNull()
    .references(() => dataLoad.id),
  type: text("type").notNull(), // "T" (Trip) or "G" (Ground Duty)

  tripNumber: text("trip_number"),
  groundDutyId: integer("ground_duty_id"),

  // Chronological tracking metadata
  rosterMonth: text("roster_month").notNull(), // e.g., "2026-07"
  startDate: text("start_date").notNull(), // e.g., "2026-07-04"

  createdAt: text("created_at").notNull(),
});

export type RosterHistoryIndex = typeof rosterHistory.$inferSelect;

// ========================================================================
// ROSTER AMENDMENTS (Pre-calculated deltas for UI notifications)
// ========================================================================
export const rosterAmendments = sqliteTable("roster_amendments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dataLoadId: integer("data_load_id")
    .notNull()
    .references(() => dataLoad.id),
  rosterMonth: text("roster_month").notNull(),

  changeType: text("change_type").notNull(), // 'C' (Create/Added) | 'U' (Update/Modified) | 'D' (Delete/Removed)
  itemType: text("item_type").notNull(), // 'T' (Trip) or 'G' (Ground Duty)

  identifier: text("identifier").notNull(), // e.g., TripNumber or Ground Duty identifier
  dutyNumber: integer("duty_number"), //  (Nullable)
  sectorNumber: integer("sector_number"),
  details: text("details").notNull(), // descriptive summary of the amendment
  createdAt: text("created_at").notNull(),
});

export type RosterAmendment = typeof rosterAmendments.$inferSelect;

// ========================================================================
// HOTELS: Station Brief Crew Hotels data
// ========================================================================
export const hotels = sqliteTable("hotels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title"),
  iata: text("iata").notNull(), // Airport / Station code (e.g., 'ABV', 'ZRH')
  workflowUrl: text("workflow_url"), // Maps to "Set Title to IATA - Hotel" URL
  crew: text("crew"), // Target crew type (e.g., 'Flight Crew & Cabin Crew')
  effectiveFrom: text("effective_from"), // Date text
  effectiveTo: text("effective_to"), // Date text
  name: text("name").notNull(), // Hotel Name
  tel: text("tel"),
  fax: text("fax"),
  web: text("web"),
  email: text("email"),
  address: text("address"),
  discountsAvailable: text("discounts_available"),
  host: integer("host", { mode: "boolean" }).notNull().default(false), // Maps to boolean 'HOST' column
  internet: text("internet"),
  healthClub: text("health_club"),
  comments: text("comments"),
  transportProvider: text("transport_provider"),
  transportPhone: text("transport_phone"),
  transportEmail: text("transport_email"),
  hotelRoomSpecification: text("hotel_room_specification"),
  sourceModified: text("source_modified"), // Maps to the original "Modified" timestamp in CSV

  // App-specific tracking timestamps matching your other tables
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// TypeScript inference types for application layers
export type Hotel = typeof hotels.$inferSelect;
export type NewHotel = typeof hotels.$inferInsert;

// the manual configuration of sample data file
// ========================================================================
// AIRPORTS: Global Reference Data Lookup Master List
// ========================================================================
export const airports = sqliteTable("airports", {
  iataCode: text("iata_code").primaryKey(),
  name: text("name").notNull(),
  countryName: text("country_name"),
  isoCountry: text("iso_country"),
  latitude: integer("latitude"),
  longitude: integer("longitude"),
});

export type Airport = typeof airports.$inferSelect;
export type NewAirport = typeof airports.$inferInsert;

// ========================================================================
// AIRPORT COMMENTS: User Log History Stream
// ========================================================================
export const airportComments = sqliteTable("airport_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  iataCode: text("iata_code")
    .notNull()
    .references(() => airports.iataCode, { onDelete: "cascade" }),
  category: text("category").notNull(),
  content: text("content").notNull(),
  authorName: text("author_name").default("Anonymous").notNull(),
  createdAt: text("created_at").notNull(),
});

export type AirportComment = typeof airportComments.$inferSelect;
export type NewAirportComment = typeof airportComments.$inferInsert;

// ========================================================================
// CREDIT RATES: Lookup table for credit rate calculations
// ========================================================================
export const creditRates = sqliteTable("credit_rates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  staffNumber: text("staff_number").notNull(),
  flyingRate: real("flying_rate").notNull(),
  overseasRate: real("overseas_rate").notNull(),
  timeAwayRate: real("time_away_rate").notNull(),
  effectiveFrom: text("effective_from").notNull(), // YYYY-MM-DD
  effectiveTo: text("effective_to"), // NULL means 'indefinite'
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type CreditRate = typeof creditRates.$inferSelect;
export type NewCreditRate = typeof creditRates.$inferInsert;
