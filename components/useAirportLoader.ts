**
 * ============================================================================
 * HOOK: User Interface Airport Loader Hook Bridge (useAirportLoader.ts)
 * ============================================================================
 * * DESCRIPTION:
 * Acts as the UI boundary bridge. Listens for user interactions from header buttons,
 * activates the background loading worker, and fires native dialog alert models.
 * ============================================================================
 */

import { loadAirportReferenceData } from "@/db/airport-loader";
import { Alert } from "react-native";

export function useAirportLoader() {
  const importAirportData = async () => {
    console.log(
      "🔄 Hook activated: Syncing airport database reference table...",
    );
    try {
      const result = await loadAirportReferenceData();

      if (result && result.success) {
        Alert.alert(
          "Airports Initialized",
          `✈️ Global Reference Table Updated!\n• Total Records: ${result.count}`,
          [{ text: "OK" }],
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Import Failed",
        `Airport loader execution error: ${err.message}`,
      );
    }
  };

  return { importAirportData };
}
