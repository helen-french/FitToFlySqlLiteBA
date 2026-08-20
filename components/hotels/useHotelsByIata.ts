import { getAirportByIataCode } from "@/db/airport-queries";
import { getActiveHotelsByIata } from "@/db/hotel-queries";
import type { Hotel } from "@/db/schema";
import { useCallback, useState } from "react";

export type MatchedAirport = {
  name: string;
  country: string;
};

export function cleanAirportName(name: string) {
  if (!name) return "";
  return name.replace(/airport/gi, "").trim();
}

export function useHotelsByIata() {
  const [searchCode, setSearchCode] = useState("");
  const [foundHotels, setFoundHotels] = useState<Hotel[]>([]);
  const [matchedAirport, setMatchedAirport] = useState<MatchedAirport | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = useCallback(async (rawCode: string) => {
    if (!rawCode.trim()) return;
    const cleanCode = rawCode.trim().toUpperCase();

    setLoading(true);
    setHasSearched(true);
    setMatchedAirport(null);
    setSearchCode(cleanCode);

    try {
      const [activeHotels, airportResults] = await Promise.all([
        getActiveHotelsByIata(cleanCode),
        getAirportByIataCode(cleanCode),
      ]);

      setFoundHotels(activeHotels);

      if (airportResults && airportResults.length > 0) {
        const target = airportResults[0];
        setMatchedAirport({
          // Full official name — matches Airport details / Tools Airports.
          name: target.name || target.airportName,
          country: target.country || target.countryName,
        });
      }
    } catch (err) {
      console.error(err);
      setFoundHotels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSearchCode("");
    setFoundHotels([]);
    setMatchedAirport(null);
    setLoading(false);
    setHasSearched(false);
  }, []);

  return {
    searchCode,
    setSearchCode,
    foundHotels,
    matchedAirport,
    loading,
    hasSearched,
    setHasSearched,
    runSearch,
    reset,
  };
}
