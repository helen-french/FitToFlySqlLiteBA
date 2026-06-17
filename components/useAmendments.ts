/* This is a dedicated hook thats will listen to whatever month is currently being viewed and automatically
 return any amendments found in the database. */

import { db } from "@/db/db";
import { dataLoad, RosterAmendment, rosterAmendments } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { useCallback, useEffect, useState } from "react";

export function useAmendments(viewingDate: Date) {
  const [amendments, setAmendments] = useState<RosterAmendment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchAmendments = useCallback(async () => {
    try {
      setIsLoading(true);

      // Convert Date object to your database month string format: "YYYY-MM"
      const viewMonthStr = viewingDate.toISOString().substring(0, 7);

      // Look up the latest import run for this specific month
      const latestMonthLoad = await db
        .select({ id: dataLoad.id })
        .from(dataLoad)
        .where(eq(dataLoad.rosterMonthNumber, viewMonthStr))
        .orderBy(asc(dataLoad.id));

      if (latestMonthLoad.length > 0) {
        const targetLoadId = latestMonthLoad[latestMonthLoad.length - 1].id;

        // Fetch the true coordinate-tracked deltas for this run
        const activeAmendments = await db
          .select()
          .from(rosterAmendments)
          .where(eq(rosterAmendments.dataLoadId, targetLoadId));

        setAmendments(activeAmendments);
      } else {
        setAmendments([]);
      }
    } catch (error) {
      console.error("❌ Error fetching roster amendments:", error);
      setAmendments([]);
    } finally {
      setIsLoading(false);
    }
  }, [viewingDate]);

  // Automatically refresh when the user changes months
  useEffect(() => {
    fetchAmendments();
  }, [fetchAmendments]);

  return { amendments, isLoading, refreshAmendments: fetchAmendments };
}
