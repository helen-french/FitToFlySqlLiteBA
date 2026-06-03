import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import { Alert } from "react-native";
import { loadRosterXmlData } from "../db/xml-parser";

// MODIFIED DELTA: Hook now accepts an optional onSuccess callback function
export function useRosterLoader(onSuccess?: () => void) {
  const importRosterFile = async () => {
    console.log(
      "🔄 Hook activated: Resolving dynamic XML file paths from asset folder...",
    );
    try {
      const xmlModule = require("../data/MELRKMAY26Maestro.xml");
      const asset = Asset.fromModule(xmlModule);

      await asset.downloadAsync();
      const localUri = asset.localUri;

      if (!localUri) {
        throw new Error(
          "Could not find local storage path mapping for 'MELRKMAY26Maestro.xml'.",
        );
      }

      const fileInstance = new File(localUri);
      const xmlFileText = await fileInstance.text();

      const { personInserts, personUpdates, tripInserts, tripUpdates } =
        await loadRosterXmlData(xmlFileText);

      // MODIFIED DELTA: If a refresh function was passed to the hook, fire it NOW!
      if (onSuccess) {
        console.log(
          "⚡ XML write detected! Triggering reactive UI refresh callback channel...",
        );
        onSuccess();
      }

      Alert.alert(
        "Relational Sync Completed",
        `Database audit updates applied:\n\n` +
          `📊 Personal Registries:\n` +
          `• New History Rows: ${personInserts}\n` +
          `• Refreshed Stamped Entries: ${personUpdates}\n\n` +
          `✈️ Operational Rosters:\n` +
          `• New Duty Rows: ${tripInserts}\n` +
          `• Refreshed Stamped Entries: ${tripUpdates}`,
      );
    } catch (err: any) {
      Alert.alert("Import Failed", `File read engine error: ${err.message}`);
    }
  };

  return { importRosterFile };
}
