import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { loadRosterXmlData } from "../db/xml-parser";
import type { RosterImportNoticeTone } from "./modals/RosterImportNoticeModal";

function formatSuccessMessage(stats: {
  tripsTotal: number;
  groundTotal: number;
  rosterFileName?: string;
  tripFileName?: string;
  feedCreated?: string;
}): string {
  const lines = [
    "Roster Update:",
    `• Trips: ${stats.tripsTotal}`,
    `• Ground duties: ${stats.groundTotal}`,
    "",
    "Feed Details:",
  ];
  if (stats.rosterFileName) lines.push(`• ${stats.rosterFileName}`);
  if (stats.tripFileName) lines.push(`• ${stats.tripFileName}`);
  if (stats.feedCreated) lines.push(`• Created: ${stats.feedCreated}`);
  return lines.join("\n");
}

export type RosterImportNotice = {
  title: string;
  message: string;
  tone: RosterImportNoticeTone;
};

// Hook accepts an optional onSuccess callback function to refresh views reactive channels
export function useRosterLoader(onSuccess?: () => void) {
  const [importNotice, setImportNotice] = useState<RosterImportNotice | null>(
    null,
  );

  const dismissImportNotice = useCallback(() => {
    setImportNotice(null);
  }, []);

  const importRosterFile = useCallback(async () => {
    console.log(
      "🔄 Hook activated: Resolving dynamic XML file paths from asset folder...",
    );
    try {
      //const xmlModule = require("../data/Maestro_MAR26.xml");
      //const xmlModule = require("../data/Maestro_APR26.xml");
      //const xmlModule = require("../data/Maestro_MAY26.xml");
      //const xmlModule = require("../data/Maestro_JUN26.xml");
      //const xmlModule = require("../data/Maestro_JUL26_1.xml");
      //const xmlModule = require("../data/Maestro_JUL26_2.xml");
      //const xmlModule = require("../data/Maestro_JUL26_3.xml");
      //const xmlModule = require("../data/Maestro_JUL26_4.xml");
      //const xmlModule = require("../data/Maestro_JUL26_5.xml");
      //const xmlModule = require("../data/Maestro_JUL26_6.xml");
      //const xmlModule = require("../data/Maestro_AUG26_1.xml");
      const xmlModule = require("../data/Maestro_AUG26_2.xml");

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
        if (result.isDuplicateBypass || result.isOlderFeedRejected) {
          setImportNotice({
            title: "Roster Load Unsuccessful",
            message: result.message ?? "",
            tone: "warning",
          });
        } else if (result.stats) {
          setImportNotice({
            title: "Roster Load Successful",
            message: formatSuccessMessage(result.stats),
            tone: "success",
          });
        }
      }
    } catch (err: any) {
      Alert.alert("Import Failed", `File read engine error: ${err.message}`);
    }
  }, [onSuccess]);

  return { importRosterFile, importNotice, dismissImportNotice };
}
