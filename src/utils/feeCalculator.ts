import { VehicleType, FeeSlab } from "../types";

export const DEFAULT_FEE_SLABS: FeeSlab[] = [
  { minKm: 0, maxKm: 5, monthlyFee: 800 },
  { minKm: 5.1, maxKm: 10, monthlyFee: 1200 },
  { minKm: 10.1, maxKm: 15, monthlyFee: 1600 },
  { minKm: 15.1, maxKm: 30, monthlyFee: 2000 },
];

export const VEHICLE_TYPE_MULTIPLIERS: Record<VehicleType, number> = {
  "Van (14-Seater)": 1.0,
  "Force Traveller (20-Seater)": 1.1,
  "Mini Bus (26-Seater)": 1.25,
  "School Bus (40-Seater)": 1.35,
};

export const TUITION_FEES_PER_TERM: Record<string, number> = {
  "Nursery / Pre-KG": 10000,
  "LKG": 12000,
  "UKG": 12000,
  "Grade I": 14000,
  "Grade II": 14000,
  "Grade III": 15000,
  "Grade IV": 15000,
  "Grade V": 16000,
};

/**
 * Calculates the monthly transport fee based on distance (km) and vehicle type
 */
export function calculateMonthlyTransportFee(
  distanceKm: number,
  vehicleType: VehicleType,
  feeSlabs: FeeSlab[] = DEFAULT_FEE_SLABS
): number {
  if (distanceKm <= 0) return 0;

  // Find matching slab
  const slab = feeSlabs.find(
    (s) => distanceKm >= s.minKm && distanceKm <= s.maxKm
  ) || feeSlabs[feeSlabs.length - 1];

  const baseFee = slab ? slab.monthlyFee : 2000;
  const multiplier = VEHICLE_TYPE_MULTIPLIERS[vehicleType] || 1.0;

  return Math.round(baseFee * multiplier);
}

/**
 * Calculates total automated fee breakdown for a student
 */
export function calculateStudentTotalBill(
  grade: string,
  distanceKm: number,
  vehicleType: VehicleType,
  includeGPSAddon: boolean = true
) {
  const tuitionTermFee = TUITION_FEES_PER_TERM[grade] || 14000;
  const transportMonthlyFee = calculateMonthlyTransportFee(distanceKm, vehicleType);
  const transportTermFee = transportMonthlyFee * 3; // 3 months per term
  const gpsAddonFee = includeGPSAddon ? 150 : 0; // ₹150 nominal GPS tracking & SMS alert charge

  const totalTermAmount = tuitionTermFee + transportTermFee + gpsAddonFee;

  return {
    tuitionTermFee,
    transportMonthlyFee,
    transportTermFee,
    gpsAddonFee,
    totalTermAmount,
    formattedTuition: `₹${tuitionTermFee.toLocaleString("en-IN")}`,
    formattedTransportMonthly: `₹${transportMonthlyFee.toLocaleString("en-IN")}`,
    formattedTransportTerm: `₹${transportTermFee.toLocaleString("en-IN")}`,
    formattedTotalTerm: `₹${totalTermAmount.toLocaleString("en-IN")}`,
  };
}
