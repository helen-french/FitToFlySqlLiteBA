import { db } from "@/db/db";
import { airportComments, airports, type AirportComment } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { useCallback, useMemo, useState } from "react";

import type { NoteCategoryFilter } from "./noteCategory";

export function useNotesByStation() {
  const [searchCode, setSearchCode] = useState("");
  const [airportName, setAirportName] = useState<string | null>(null);
  const [comments, setComments] = useState<AirportComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<NoteCategoryFilter>("ALL");

  const runSearch = useCallback(
    async (rawCode: string, initialCategory?: NoteCategoryFilter) => {
      if (!rawCode.trim()) return;
      const cleanCode = rawCode.trim().toUpperCase();

      setLoading(true);
      setHasSearched(true);
      setAirportName(null);
      setSearchCode(cleanCode);
      if (initialCategory) {
        setSelectedCategory(initialCategory);
      }

      try {
        const airportRow = await db
          .select()
          .from(airports)
          .where(eq(airports.iataCode, cleanCode))
          .limit(1);

        if (airportRow.length > 0) {
          setAirportName(
            airportRow[0].name.replace(/airport|international/gi, "").trim(),
          );
        }

        const commentRows = await db
          .select()
          .from(airportComments)
          .where(eq(airportComments.iataCode, cleanCode))
          .orderBy(desc(airportComments.createdAt));

        setComments(commentRows);
      } catch (err) {
        console.error("Failed to load notes stream:", err);
        setComments([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setSearchCode("");
    setAirportName(null);
    setComments([]);
    setLoading(false);
    setHasSearched(false);
    setSelectedCategory("ALL");
  }, []);

  const filteredComments = useMemo(() => {
    if (selectedCategory === "ALL") return comments;
    return comments.filter((comment) => comment.category === selectedCategory);
  }, [comments, selectedCategory]);

  return {
    searchCode,
    setSearchCode,
    airportName,
    comments,
    filteredComments,
    loading,
    hasSearched,
    setHasSearched,
    selectedCategory,
    setSelectedCategory,
    runSearch,
    reset,
  };
}
