/**
 * Names match the Fuel Reserve Calculator spec.
 * minFuel is derived (finalReserveFuel + finalApproachFuel), not typed.
 */

export type AltDestData = {
  destination: string;
  /** Fuel from the holding point to this alternate, in tonnes. Null while the field is empty. */
  fuelToAlt: number | null;
};

export type FuelReserveInput = {
  destination: string;
  holdingPoint: string;
  /** Fuel at the holding point, in tonnes. */
  holdingPointFuel: number | null;
  /** Required fuel reserve, in tonnes. */
  finalReserveFuel: number | null;
  /** Fuel from the holding point to the runway, in tonnes. */
  finalApproachFuel: number | null;
  altDestData: AltDestData[];
};

export type FuelReserveRow = {
  destination: string;
  /** Minutes. Null until the fuel values needed for the formula are present. */
  holdingTime: number | null;
  minFuel: number | null;
  /**
   * Diversion fuel in tonnes. Null on the destination row (shown as -------)
   * and while an alternate's diversion field is empty.
   */
  fuelToAlt: number | null;
  isDestination: boolean;
};

export type FuelReserveResult = {
  minFuel: number | null;
  rows: FuelReserveRow[];
};

export function emptyFuelReserveInput(): FuelReserveInput {
  return {
    destination: "",
    holdingPoint: "",
    holdingPointFuel: null,
    finalReserveFuel: null,
    finalApproachFuel: null,
    altDestData: [
      { destination: "", fuelToAlt: null },
      { destination: "", fuelToAlt: null },
    ],
  };
}
