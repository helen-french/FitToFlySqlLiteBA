/**
 * Loads and sorts data_load rows for Roster Load History.
 */

import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import { desc } from "drizzle-orm";

import { db } from "@/db/db";
import { dataLoad, type DataLoad } from "@/db/schema";
import { getFeedTimestampKey } from "./formatRosterLoadHistory";

export type RosterLoadHistorySortKey = "feed" | "loaded";
export type RosterLoadHistorySortDirection = "asc" | "desc";

export type RosterLoadHistorySortState = {
  key: RosterLoadHistorySortKey;
  direction: RosterLoadHistorySortDirection;
};

export function useRosterLoadHistory() {
  const [rows, setRows] = useState<DataLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<RosterLoadHistorySortState>({
    key: "loaded",
    direction: "desc",
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await db
        .select()
        .from(dataLoad)
        .orderBy(desc(dataLoad.createdAt));
      setRows(result);
    } catch (err) {
      console.error("Failed to load roster load history:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const sortedRows = useMemo(() => {
    const next = [...rows];
    const mult = sort.direction === "asc" ? 1 : -1;
    next.sort((a, b) => {
      if (sort.key === "feed") {
        const aKey = getFeedTimestampKey(
          a.rosterDateOfCreation || "",
          a.rosterTimeOfCreation || "",
        );
        const bKey = getFeedTimestampKey(
          b.rosterDateOfCreation || "",
          b.rosterTimeOfCreation || "",
        );
        return aKey.localeCompare(bKey) * mult;
      }
      return a.createdAt.localeCompare(b.createdAt) * mult;
    });
    return next;
  }, [rows, sort]);

  return { rows: sortedRows, loading, sort, setSort, reload };
}
