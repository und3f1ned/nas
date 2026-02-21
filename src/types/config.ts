// Types for the resulting NAS configuration — vendor-agnostic abstract specs

import type { RaidType } from './wizard';

// ─── CPU ───

export type CpuTier = 'basic' | 'mid' | 'heavy' | 'server';

export interface CpuRequirements {
  tier: CpuTier;
  minCores: number;
  minThreads: number;
  needsQuickSync: boolean;
  minQuickSyncGen: string | null;
  tdpRange: [number, number];
  explanation: string;
}

// ─── RAM ───

export type EccRecommendation = 'not_needed' | 'recommended' | 'strongly_recommended';

export interface RamRequirements {
  minGB: number;
  recommendedGB: number;
  eccRecommendation: EccRecommendation;
  explanation: string;
}

// ─── Storage ───

export type DriveClass = 'nas' | 'surveillance' | 'enterprise';

export interface StorageRequirements {
  driveCount: number;
  minDriveSizeTB: number;
  raidType: string;
  driveClass: DriveClass;
  cmrRequired: true;
  tlerRequired: true;
  explanation: string;
}

// ─── SSD Cache ───

export interface SsdCacheRequirements {
  count: number;
  minCapacityGB: number;
  interface: 'nvme';
  minNandType: 'tlc';
  dramRequired: true;
  minTBW: number;
  explanation: string;
}

// ─── Transcoding ───

export interface TranscodingRequirements {
  needed: boolean;
  method: 'quicksync' | 'nvenc' | 'any_hw';
  minCodecSupport: string[];
  explanation: string;
}

// ─── AI Acceleration ───

export interface AiRequirements {
  needed: boolean;
  useCases: string[];
  explanation: string;
}

// ─── Network ───

export interface NetworkRequirements {
  recommendedSpeed: '1gbe' | '2.5gbe' | '10gbe';
  need10gbe: boolean;
  explanation: string;
}

// ─── PSU ───

export interface PsuRequirements {
  minWatts: number;
  recommendedWatts: number;
  efficiency: string;
  explanation: string;
}

// ─── UPS ───

export interface UpsRequirements {
  minVA: number;
  explanation: string;
}

// ─── Form Factor ───

export interface FormFactorRequirements {
  minBays35: number;
  maxMbFormFactor: 'mini-itx' | 'mini-dtx' | 'atx';
  placement: string;
  explanation: string;
}

// ─── Storage breakdown ───

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

// ─── Price estimate (ranges) ───

export interface PriceRange {
  min: number;
  max: number;
}

export interface PriceEstimate {
  hardware: PriceRange;
  drives: PriceRange;
  ssdCache: PriceRange | null;
  accessories: PriceRange;
  assembly: number;
  totalRange: PriceRange;
}

// ─── Educational insights ───

export type InsightSeverity = 'info' | 'warning' | 'tip';
export type InsightCategory = 'cpu' | 'ram' | 'storage' | 'ssd' | 'network' | 'power' | 'general' | 'transcoding';

export interface Insight {
  id: string;
  icon: string;
  title: string;
  text: string;
  severity: InsightSeverity;
  category: InsightCategory;
}

// ─── Main config result ───

export interface NASConfig {
  cpu: CpuRequirements;
  ram: RamRequirements;
  storage: StorageRequirements;
  ssdCache: SsdCacheRequirements | null;
  transcoding: TranscodingRequirements | null;
  ai: AiRequirements | null;
  network: NetworkRequirements;
  psu: PsuRequirements;
  ups: UpsRequirements;
  formFactor: FormFactorRequirements;
  storageBreakdown: StorageBreakdownResult;
  priceEstimate: PriceEstimate;
  insights: Insight[];
  estimatedPowerW: number;
}
