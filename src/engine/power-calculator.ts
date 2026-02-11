import type { NASConfig } from '../types/config';
import type { Motherboard, DriveHDD, DriveSSD } from '../types/components';
import profilesData from '../data/profiles.json';

export function calcPowerWatts(params: {
  motherboard: Motherboard;
  drives: DriveHDD[];
  ssdCache: DriveSSD[];
  ramGB: number;
  has10gbe: boolean;
}): number {
  let power = 0;

  power += params.motherboard.tdp_w;
  power += params.drives.reduce((sum, d) => sum + d.power_w, 0);
  power += params.ssdCache.reduce((sum, d) => sum + d.power_w, 0);
  power += params.ramGB * 0.3;
  power += params.has10gbe ? 10 : 2;
  power += 15; // Fans, misc

  return power;
}

export function selectPSU(powerWatts: number): { watts: number; name: string; price_rub: number } {
  const withHeadroom = powerWatts * 1.3;
  const psuModels = profilesData.psu_models;

  const suitable = psuModels.find((p) => p.watts >= withHeadroom);
  return suitable || psuModels[psuModels.length - 1];
}

export function selectUPS(powerWatts: number): { name: string; price_rub: number } {
  const upsModels = profilesData.ups_models;
  // Pick smallest UPS that can handle the load for ~15 min
  if (powerWatts > 400) return upsModels[1]; // 1100VA
  return upsModels[0]; // 650VA
}
