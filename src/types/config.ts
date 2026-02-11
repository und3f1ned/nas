// Types for the resulting NAS configuration

import type { NASCase, Motherboard, DriveHDD, DriveSSD, SynologyModel } from './components';
import type { RaidType } from './wizard';

export interface StorageAllocation {
  label: string;
  sizeTB: number;
  color: string;
}

export interface StorageBreakdownResult {
  rawTB: number;
  usableTiB: number;
  allocations: StorageAllocation[];
  freeTiB: number;
  raidType: RaidType;
  driveCount: number;
  driveSizeTB: number;
}

export interface NASConfig {
  // Components
  case: NASCase;
  motherboard: Motherboard;
  ramGB: number;
  ramModules: string;
  drives: DriveHDD[];
  ssdCache: DriveSSD[];
  psuWatts: number;
  ups: string | null;

  // Computed values
  totalPowerW: number;
  raidType: string;
  storageBreakdown: StorageBreakdownResult;

  // Price breakdown
  priceBreakdown: PriceBreakdown;

  // Synology comparison
  synologyComparison: SynologyComparison;

  // Explanations for each choice
  explanations: Record<string, string>;
}

export interface PriceBreakdown {
  hardware: number;        // case + motherboard + RAM + PSU
  drives: number;          // HDDs
  ssdCache: number;        // NVMe SSDs
  accessories: number;     // UPS, cables, etc.
  assembly: number;        // assembly + setup service
  total: number;
}

export interface SynologyComparison {
  model: SynologyModel;
  synologyTotal: number;
  licenseCost: number;
  xpenologyTotal: number;
  savings: number;
  limitations: string[];
}
