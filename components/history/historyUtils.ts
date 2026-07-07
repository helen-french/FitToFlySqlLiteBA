// Formats a "YYYY-MM-DD" date string into UK "DD/MM/YYYY" for display.
// Returns the input unchanged if it is not a hyphenated date string.
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}
