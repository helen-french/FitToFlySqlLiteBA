import { useCallback, useEffect, useState } from "react";

import { db } from "@/db/db";
import { type CreditRate, users } from "@/db/schema";
import {
  fetchCreditRatesForStaff,
  saveCreditRateChange,
} from "@/services/creditRateService";

type CreditRateForm = {
  flyingRate: string;
  overseasRate: string;
  timeAwayRate: string;
};

const emptyForm: CreditRateForm = {
  flyingRate: "",
  overseasRate: "",
  timeAwayRate: "",
};

export function useCreditRates() {
  const [staffNumber, setStaffNumber] = useState("");
  const [records, setRecords] = useState<CreditRate[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<CreditRateForm>(emptyForm);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const userResult = await db.select().from(users).limit(1);
      const staffNo = userResult[0]?.staffNumber?.trim() ?? "";
      setStaffNumber(staffNo);

      if (!staffNo) {
        setRecords([]);
        setSelectedIndex(0);
        return;
      }

      const nextRecords = await fetchCreditRatesForStaff(staffNo);
      setRecords(nextRecords);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Failed to load credit rates:", error);
      setRecords([]);
      setSelectedIndex(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectedRecord = records[selectedIndex] ?? null;
  const isCurrentRecord = selectedRecord != null && selectedRecord.effectiveTo == null;
  const canEdit = Boolean(staffNumber) && (records.length === 0 || isCurrentRecord);

  const canGoPrev = selectedIndex < records.length - 1;
  const canGoNext = selectedIndex > 0;

  const beginEdit = useCallback(() => {
    if (!canEdit) {
      return;
    }

    if (selectedRecord) {
      setForm({
        flyingRate: String(selectedRecord.flyingRate),
        overseasRate: String(selectedRecord.overseasRate),
        timeAwayRate: String(selectedRecord.timeAwayRate),
      });
    } else {
      setForm(emptyForm);
    }
    setIsEditing(true);
  }, [canEdit, selectedRecord]);

  const discardEdit = useCallback(() => {
    setIsEditing(false);
    setForm(emptyForm);
  }, []);

  const save = useCallback(async () => {
    if (!staffNumber) {
      return { success: false, error: "Add your staff number in Profile first." };
    }

    setIsSaving(true);
    const result = await saveCreditRateChange(
      staffNumber,
      Number(form.flyingRate),
      Number(form.overseasRate),
      Number(form.timeAwayRate),
    );
    setIsSaving(false);

    if (result.success) {
      setIsEditing(false);
      setForm(emptyForm);
      await load();
    }

    return result;
  }, [form, load, staffNumber]);

  return {
    staffNumber,
    records,
    selectedRecord,
    selectedIndex,
    setSelectedIndex,
    isLoading,
    isSaving,
    isEditing,
    isCurrentRecord,
    canEdit,
    canGoPrev,
    canGoNext,
    form,
    setForm,
    beginEdit,
    discardEdit,
    save,
    reload: load,
  };
}
