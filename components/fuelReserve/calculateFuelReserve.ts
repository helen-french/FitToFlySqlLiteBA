import type {
  FuelReserveInput,
  FuelReserveResult,
  FuelReserveRow,
} from "./types";

/** Spreadsheet ROUNDDOWN, towards zero, after stripping binary float dust. */
function roundDown(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  const snapped = Math.round(value * 1e8) / 1e8;
  return Math.trunc(snapped * factor) / factor;
}

/** Holding minutes. Spreadsheet form: (holdingPointFuel - minFuel) * 10. */
function holdingTime(holdingPointFuel: number, minFuel: number): number {
  return roundDown((holdingPointFuel - minFuel) * 10, 2);
}

export function calculateFuelReserve(
  input: FuelReserveInput,
): FuelReserveResult {
  const minFuel =
    input.finalReserveFuel != null && input.finalApproachFuel != null
      ? input.finalReserveFuel + input.finalApproachFuel
      : null;

  const destinationRow: FuelReserveRow = {
    destination: input.destination,
    holdingTime:
      input.holdingPointFuel != null && minFuel != null
        ? holdingTime(input.holdingPointFuel, minFuel)
        : null,
    minFuel,
    fuelToAlt: null,
    isDestination: true,
  };

  const alternateRows: FuelReserveRow[] = input.altDestData.map((alt) => {
    const altMinFuel =
      minFuel != null && alt.fuelToAlt != null ? minFuel + alt.fuelToAlt : null;

    return {
      destination: alt.destination,
      holdingTime:
        input.holdingPointFuel != null && altMinFuel != null
          ? holdingTime(input.holdingPointFuel, altMinFuel)
          : null,
      minFuel: altMinFuel,
      fuelToAlt: alt.fuelToAlt,
      isDestination: false,
    };
  });

  return {
    minFuel,
    rows: [destinationRow, ...alternateRows],
  };
}
