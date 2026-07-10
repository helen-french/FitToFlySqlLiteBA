import { db } from "@/db/db";
import { PersonDetails, personDetails, users } from "@/db/schema";
import { distinctSeniorityHistory } from "@/components/seniority/distinctSeniorityHistory";
import { desc, eq } from "drizzle-orm";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useSeniorityHistory() {
  const [loading, setLoading] = useState(true);
  const [staffNumber, setStaffNumber] = useState<string | null>(null);
  const [latest, setLatest] = useState<PersonDetails | null>(null);
  const [history, setHistory] = useState<PersonDetails[]>([]);

  const seniorityTimeline = useMemo(
    () => distinctSeniorityHistory(history),
    [history],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userResult = await db.select().from(users).limit(1);
      const userStaffNumber = userResult[0]?.staffNumber?.trim() || null;
      setStaffNumber(userStaffNumber);

      if (!userStaffNumber) {
        setLatest(null);
        setHistory([]);
        return;
      }

      const personResult = await db
        .select()
        .from(personDetails)
        .where(eq(personDetails.staffNumber, userStaffNumber))
        .orderBy(desc(personDetails.updatedAt));

      if (personResult.length > 0) {
        setLatest(personResult[0] as PersonDetails);
        setHistory(personResult as PersonDetails[]);
      } else {
        setLatest(null);
        setHistory([]);
      }
    } catch (err) {
      console.error("Failed to load seniority history:", err);
      setLatest(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    loading,
    staffNumber,
    latest,
    history,
    seniorityTimeline,
    refresh: load,
  };
}
