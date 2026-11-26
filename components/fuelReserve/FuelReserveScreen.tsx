/**
 * Fuel Reserve Calculator (Tools → Fuel Reserve Calculator).
 * The calculator itself stays free of navigation and roster data.
 */

import { FuelReserveCalculator } from "@/components/fuelReserve/FuelReserveCalculator";
import FeatureBannerLayout from "@/components/layout/FeatureBannerLayout";
import FeatureScreenBody from "@/components/layout/FeatureScreenBody";
import React from "react";

export default function FuelReserveScreen() {
  return (
    <FeatureBannerLayout title="Fuel Reserve Calculator">
      <FeatureScreenBody>
        <FuelReserveCalculator />
      </FeatureScreenBody>
    </FeatureBannerLayout>
  );
}
