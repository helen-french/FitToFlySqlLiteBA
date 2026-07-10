import { PersonDetails } from "@/db/schema";

/**
 * Collapse person_details rows to points where seniority actually changed.
 * Input is newest-first (as returned from the DB).
 */
export function distinctSeniorityHistory(
  historyNewestFirst: PersonDetails[],
): PersonDetails[] {
  if (historyNewestFirst.length === 0) return [];

  const chronological = [...historyNewestFirst].reverse();
  const distinctChronological = chronological.filter((row, index) => {
    if (index === 0) return true;
    const prev = chronological[index - 1];
    return (
      Number(row.seniorityNumber ?? 0) !== Number(prev.seniorityNumber ?? 0)
    );
  });

  return distinctChronological.reverse();
}
