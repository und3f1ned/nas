import type { PriceEstimate, PriceRange, CpuTier, DriveClass } from '../types/config';

interface PriceEstimateParams {
  cpuTier: CpuTier;
  ramGB: number;
  driveCount: number;
  driveSizeTB: number;
  driveClass: DriveClass;
  ssdCacheCount: number;
  ssdMinCapacityGB: number;
  psuWatts: number;
  upsMinVA: number;
  maxMbFormFactor: string;
  driveSlots: number;
}

// Approximate market price ranges (no specific brands)
const CPU_BOARD_PRICES: Record<CpuTier, PriceRange> = {
  basic: { min: 8000, max: 15000 },
  mid: { min: 14000, max: 25000 },
  heavy: { min: 22000, max: 35000 },
  server: { min: 35000, max: 60000 },
};

const CASE_PRICES: Record<string, PriceRange> = {
  '2-4': { min: 5000, max: 12000 },
  '5-6': { min: 8000, max: 16000 },
  '8': { min: 12000, max: 20000 },
  '12': { min: 12000, max: 25000 },
};

const RAM_PRICES_PER_GB: PriceRange = { min: 400, max: 700 };

const PSU_PRICES: Record<string, PriceRange> = {
  '200': { min: 3000, max: 5000 },
  '250': { min: 4000, max: 6000 },
  '300': { min: 4500, max: 7000 },
  '350': { min: 5000, max: 8000 },
  '450': { min: 7000, max: 11000 },
  '550': { min: 9000, max: 14000 },
};

// HDD price per TB ranges by class
const HDD_PRICE_PER_TB: Record<DriveClass, PriceRange> = {
  nas: { min: 1800, max: 2500 },
  surveillance: { min: 1900, max: 2700 },
  enterprise: { min: 1500, max: 2200 },
};

// NVMe SSD price per 250GB
const SSD_PRICE_PER_250GB: PriceRange = { min: 3500, max: 6000 };

function addRanges(...ranges: PriceRange[]): PriceRange {
  return {
    min: ranges.reduce((sum, r) => sum + r.min, 0),
    max: ranges.reduce((sum, r) => sum + r.max, 0),
  };
}

function scaleRange(range: PriceRange, factor: number): PriceRange {
  return { min: Math.round(range.min * factor), max: Math.round(range.max * factor) };
}

export function calcPriceEstimate(params: PriceEstimateParams): PriceEstimate {
  // Hardware: case + board/CPU + RAM + PSU
  const boardPrice = CPU_BOARD_PRICES[params.cpuTier];

  const caseKey = params.driveSlots <= 4 ? '2-4' : params.driveSlots <= 6 ? '5-6' : params.driveSlots <= 8 ? '8' : '12';
  const casePrice = CASE_PRICES[caseKey];

  const ramPrice = scaleRange(RAM_PRICES_PER_GB, params.ramGB);

  const psuKey = String(params.psuWatts);
  const psuPrice = PSU_PRICES[psuKey] || PSU_PRICES['350'];

  const hardware = addRanges(boardPrice, casePrice, ramPrice, psuPrice);

  // Drives
  const hddPricePerTB = HDD_PRICE_PER_TB[params.driveClass];
  const drives = scaleRange(hddPricePerTB, params.driveCount * params.driveSizeTB);

  // SSD cache
  let ssdCache: PriceRange | null = null;
  if (params.ssdCacheCount > 0) {
    const ssdMultiplier = params.ssdCacheCount * (params.ssdMinCapacityGB / 250);
    ssdCache = scaleRange(SSD_PRICE_PER_250GB, ssdMultiplier);
  }

  // Accessories: UPS (always included) + cables
  const upsPrice: PriceRange = params.upsMinVA <= 650
    ? { min: 6000, max: 10000 }
    : params.upsMinVA <= 1100
      ? { min: 9000, max: 15000 }
      : { min: 14000, max: 22000 };
  const accessories: PriceRange = addRanges({ min: 1500, max: 3000 }, upsPrice);

  const assembly = 10000;

  const totalRange = addRanges(
    hardware,
    drives,
    ssdCache || { min: 0, max: 0 },
    accessories,
    { min: assembly, max: assembly },
  );

  return {
    hardware,
    drives,
    ssdCache,
    accessories,
    assembly,
    totalRange,
  };
}

export function estimateMidpoint(range: PriceRange): number {
  return Math.round((range.min + range.max) / 2);
}
