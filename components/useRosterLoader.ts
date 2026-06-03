import { Asset } from "expo-asset";
// Updated: Import 'File' instead of 'FileSystem' for the new Expo API
import { File } from "expo-file-system";
import { Alert } from "react-native";
import { loadRosterXmlData } from "../db/xml-parser";

export function useRosterLoader() {
  const importRosterFile = async () => {
    console.log(
      "🔄 Hook activated: Resolving dynamic XML file paths from asset folder using modern Filesystem API...",
    );
    try {
      // 1. Isolate the module asset token safely
      const xmlModule = require("../data/MELRKMAY26Maestro.xml");
      const asset = Asset.fromModule(xmlModule);

      // Force download/caching resolution to securely unpack the local disk path
      await asset.downloadAsync();
      const localUri = asset.localUri;

      if (!localUri) {
        throw new Error(
          "Could not find local virtual storage path mapping for 'MELRKMAY26Maestro.xml'.",
        );
      }

      // 2. NEW EXPO API: Create a new File class instance and read it as text
      const fileInstance = new File(localUri);
      const xmlFileText = await fileInstance.text();

      // 3. Execute our intelligent parser engine block
      const { insertedRows, updatedRows } =
        await loadRosterXmlData(xmlFileText);

      // 4. Notify the user with the audit feedback
      Alert.alert(
        "Data Sync Complete",
        `Database audit finish metrics:\n\n• New History Rows Created: ${insertedRows}\n• Existing Stamped Updates: ${updatedRows}`,
      );
    } catch (err: any) {
      Alert.alert("Import Failed", `File read engine error: ${err.message}`);
    }
  };

  return { importRosterFile };
}
