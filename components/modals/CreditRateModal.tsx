import { Text, View } from "@/components/Themed";
import React, { useState } from "react";
import {
  Button,
  Modal,
  View as RNView,
  StyleSheet,
  TextInput,
} from "react-native";

interface CreditRateModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function CreditRateModal({
  visible,
  onClose,
  onSave,
}: CreditRateModalProps) {
  const [rate1, setRate1] = useState("");
  const [rate2, setRate2] = useState("");
  const [rate3, setRate3] = useState("");

  const handleSave = () => {
    onSave({ rate1, rate2, rate3, effectiveDate: new Date().toISOString() });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Update Credit Rates</Text>

          <TextInput
            style={styles.input}
            placeholder="Rate 1 (e.g. 19.43)"
            keyboardType="numeric"
            onChangeText={setRate1}
          />
          <TextInput
            style={styles.input}
            placeholder="Rate 2"
            keyboardType="numeric"
            onChangeText={setRate2}
          />
          <TextInput
            style={styles.input}
            placeholder="Rate 3"
            keyboardType="numeric"
            onChangeText={setRate3}
          />

          <RNView style={styles.buttonRow}>
            <Button title="Cancel" onPress={onClose} color="red" />
            <Button title="Save Rates" onPress={handleSave} />
          </RNView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    margin: 20,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
});
