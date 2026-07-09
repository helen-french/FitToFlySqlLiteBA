import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import { Alert } from "react-native";
import { loadRosterXmlData } from "../db/xml-parser";

function formatRosterMonthLabel(rosterMonth: string): string {
  const [year, month] = rosterMonth.split("-");
  const monthIndex = parseInt(month, 10) - 1;
  const yearNum = parseInt(year, 10);
  if (
    isNaN(monthIndex) ||
    isNaN(yearNum) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return rosterMonth;
  }

  return new Date(yearNum, monthIndex, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function formatLoadCountMessage(tripsTotal: number, groundTotal: number): string {
  return (
    `✈️ Trips: ${tripsTotal}\n` +
    `📋 Ground duties: ${groundTotal}`
  );
}

// Hook accepts an optional onSuccess callback function to refresh views reactive channels
export function useRosterLoader(onSuccess?: () => void) {
  const importRosterFile = async () => {
    console.log(
      "🔄 Hook activated: Resolving dynamic XML file paths from asset folder...",
    );
    try {
      //const xmlModule = require("../data/JUL26OLD.xml");
      //const xmlModule = require("../data/JUL26.xml");
      //const xmlModule = require("../data/JUL262806.xml");
      const xmlModule = require("../data/FILE_3761.xml");
      //const xmlModule = require("../data/JUN26.xml");
      //const xmlModule = require("../data/MAY26.xml");
      //const xmlModule = require("../data/APR26.xml");
      //const xmlModule = require("../data/MAR26.xml");
      const asset = Asset.fromModule(xmlModule);

      await asset.downloadAsync();
      const localUri = asset.localUri;

      if (!localUri) {
        throw new Error(
          "Could not find local storage path mapping for 'JUL26.xml'.",
        );
      }

      const fileInstance = new File(localUri);
      const xmlFileText = await fileInstance.text();

      // ──✅ STEP 1: Execute the parsing script and capture our updated polymorphically structured result object
      const result = await loadRosterXmlData(xmlFileText);

      if (result?.success && result.stats && onSuccess) {
        console.log(
          "⚡ XML write detected! Triggering reactive UI refresh callback channel...",
        );
        onSuccess();
      }

      if (result && result.success) {
        if (result.isDuplicateBypass) {
          Alert.alert("Already Loaded", result.message, [{ text: "OK" }]);
        } else if (result.isOlderFeedRejected) {
          Alert.alert("Older Feed", result.message, [{ text: "OK" }]);
        } else if (result.stats) {
          const monthLabel = formatRosterMonthLabel(result.stats.rosterMonth);
          Alert.alert(
            `Roster Loaded — ${monthLabel}`,
            formatLoadCountMessage(
              result.stats.tripsTotal,
              result.stats.groundTotal,
            ),
            [{ text: "OK" }],
          );
        }
      }
    } catch (err: any) {
      Alert.alert("Import Failed", `File read engine error: ${err.message}`);
    }
  };

  return { importRosterFile };
}
