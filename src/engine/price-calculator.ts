import type { PriceBreakdown } from '../types/config';
import type { NASCase, Motherboard, DriveHDD, DriveSSD } from '../types/components';
import profilesData from '../data/profiles.json';

export function calcPriceBreakdown(params: {
  nasCase: NASCase;
  motherboard: Motherboard;
  ramGB: number;
  drives: DriveHDD[];
  ssdCache: DriveSSD[];
  psuPrice: number;
  upsPrice: number | null;
}): PriceBreakdown {
  const ramPrices = profilesData.ram_prices_rub as Record<string, number>;
  const ramPrice = ramPrices[String(params.ramGB)] || ramPrices['32'];

  const hardware =
    params.nasCase.price_rub +
    params.motherboard.price_rub +
    ramPrice +
    params.psuPrice;

  const drives = params.drives.reduce((sum, d) => sum + d.price_rub, 0);
  const ssdCache = params.ssdCache.reduce((sum, d) => sum + d.price_rub, 0);
  const accessories = (params.upsPrice || 0) + 2000; // Cables, SATA cables, screws, etc.
  const assembly = profilesData.assembly_price_rub;

  return {
    hardware,
    drives,
    ssdCache,
    accessories,
    assembly,
    total: hardware + drives + ssdCache + accessories + assembly,
  };
}
