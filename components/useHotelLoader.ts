import { Alert } from "react-native";
import { hotelCsvData } from "../data/hotelData";
import { loadHotelCsvData } from "../db/hotel-loader"; // Points to renamed file cleanly

export function useHotelLoader(onSuccess?: () => void) {
  const importHotelFile = async () => {
    console.log("🔄 Hook activated: Ingesting static Hotel string resource...");
    try {
      const result = await loadHotelCsvData(hotelCsvData);

      if (onSuccess) {
        onSuccess();
      }

      if (result && result.success) {
        Alert.alert(
          "Hotels Loaded",
          `🏨 Station Brief Database updated!\n• Total Records: ${result.count}`,
          [{ text: "OK" }],
        );
      }
    } catch (err: any) {
      Alert.alert("Import Failed", `CSV engine error: ${err.message}`);
    }
  };

  return { importHotelFile };
}
