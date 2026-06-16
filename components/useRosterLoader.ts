import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import { Alert } from "react-native";
import { loadRosterXmlData } from "../db/xml-parser";

// Hook accepts an optional onSuccess callback function to refresh views reactive channels
export function useRosterLoader(onSuccess?: () => void) {
  const importRosterFile = async () => {
    console.log(
      "🔄 Hook activated: Resolving dynamic XML file paths from asset folder...",
    );
    try {
      // ──✅ RESTORED: All asset variants put back in place for your toggle testing
      //const xmlModule = require("../data/JUL26.xml");
      //const xmlModule = require("../data/JUN26.xml");
      const xmlModule = require("../data/MAY26.xml");
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

      // ──✅ STEP 2: Fire your screen FlatList layout reactive updates instantly
      if (onSuccess) {
        console.log(
          "⚡ XML write detected! Triggering reactive UI refresh callback channel...",
        );
        onSuccess();
      }

      // ──✅ STEP 3: Handle alerts based on the duplicate condition flags returned by the parser
      if (result && result.success) {
        if (result.isDuplicateBypass) {
          // PATH A: It's a duplicate file! Display your history reminder prompt string
          Alert.alert("📋 Roster Feed History", result.message, [
            { text: "OK" },
          ]);
        } else if (result.stats) {
          // PATH B: It's a brand new file! Extract and show the updated metric counter metrics
          Alert.alert(
            "Data Load Completed",
            `✈️ Operational Rosters:\n` +
              `• Trips: ${result.stats.tripInserts}\n` +
              `• Ground Duties: ${result.stats.tripUpdates}\n`,
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
