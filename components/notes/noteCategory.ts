export type NoteCategory = "A" | "E" | "D";
export type NoteCategoryFilter = NoteCategory | "ALL";

export const NOTE_CATEGORY_META = {
  A: { label: "Arrival", icon: "square.and.arrow.down", color: "#34C759" },
  E: { label: "Enroute", icon: "arrow.forward", color: "#FF9500" },
  D: { label: "Departure", icon: "square.and.arrow.up", color: "#007AFF" },
} as const;
