/*
 * ============================================================================
 * WHAT IT IS:
 * A Global State Provider and Custom Hook combination using React Context.
 *
 * WHAT IT DOES:
 * It maintains a single, application-wide preference state ('LOCAL' or 'ZULU')
 * that controls how times and dates are calculated and rendered. When a crew
 * member flips this switch on one screen, it broadcasts the change instantly
 * to all other screens listening to it.
 *
 * HOW IT WORKS:
 * 1. 'TimeModeZOrLProvider' wraps around the core navigation layer (TabLayout).
 * 2. It exposes a 'timeMode' string, an 'isZulu' boolean convenience flag,
 *    and a 'toggleTimeMode' action.
 * 3. Screens consume this context smoothly by invoking the 'useTimeModeZOrL()' hook.
 * ============================================================================
 */

import React, { createContext, ReactNode, useContext, useState } from "react";

type TimeMode = "LOCAL" | "ZULU";

interface TimeModeZOrLType {
  timeMode: TimeMode;
  isZulu: boolean;
  toggleTimeMode: () => void;
}

const TimeModeZOrLContext = createContext<TimeModeZOrLType | undefined>(
  undefined,
);

export function TimeModeZOrLProvider({ children }: { children: ReactNode }) {
  const [timeMode, setTimeMode] = useState<TimeMode>("LOCAL");

  const toggleTimeMode = () => {
    setTimeMode((prev) => (prev === "LOCAL" ? "ZULU" : "LOCAL"));
  };

  return (
    <TimeModeZOrLContext.Provider
      value={{ timeMode, isZulu: timeMode === "ZULU", toggleTimeMode }}
    >
      {children}
    </TimeModeZOrLContext.Provider>
  );
}

export function useTimeModeZOrL() {
  const context = useContext(TimeModeZOrLContext);
  if (!context) {
    throw new Error(
      "useTimeModeZOrL must be used within a TimeModeZOrLProvider",
    );
  }
  return context;
}
