import type { RaidType } from '../types/wizard';

export function calcRaidCapacity(
  drives: number,
  driveSizeTB: number,
  raidType: string
): number {
  let rawUsable: number;

  switch (raidType) {
    case 'shr':
    case 'raid5':
      rawUsable = (drives - 1) * driveSizeTB;
      break;
    case 'shr-2':
    case 'raid6':
      rawUsable = (drives - 2) * driveSizeTB;
      break;
    case 'raid1':
      rawUsable = Math.floor(drives / 2) * driveSizeTB;
      break;
    case 'raid10':
      rawUsable = Math.floor(drives / 2) * driveSizeTB;
      break;
    case 'raid0':
      rawUsable = drives * driveSizeTB;
      break;
    case 'jbod':
      rawUsable = drives * driveSizeTB;
      break;
    default:
      rawUsable = (drives - 1) * driveSizeTB;
  }

  // TB (decimal) → TiB (binary): 1 TB = 0.909 TiB
  const realTiB = rawUsable * 0.909;

  // Overhead: ~10GB system partition per drive + 4% Btrfs metadata
  const systemOverhead = (drives * 10) / 1024;
  const usable = (realTiB - systemOverhead) * 0.96;

  return Math.max(0, usable);
}

export function calcTotalRequiredTB(params: {
  fileStorageTB?: number;
  mediaLibraryTB?: number;
  surveillanceTB?: number;
  dockerTB?: number;
  vmTB?: number;
  backupTB?: number;
  growthMultiplier?: number;
}): number {
  const storage = (params.fileStorageTB || 0)
    + (params.mediaLibraryTB || 0)
    + (params.backupTB || 0);

  const grown = storage * (params.growthMultiplier || 1.25);

  return grown
    + (params.surveillanceTB || 0)
    + (params.dockerTB || 0)
    + (params.vmTB || 0);
}

export function selectRaidType(
  preferredRaid: RaidType,
  driveCount: number,
  criticality: string,
  useCases: string[]
): string {
  if (preferredRaid !== 'auto') return preferredRaid;

  // Auto-select based on context
  if (driveCount <= 1) return 'jbod';
  if (driveCount === 2) return 'raid1';

  const needsPerformance = useCases.includes('vm') || useCases.includes('docker');
  const needsSafety = criticality === 'high' || criticality === 'mission_critical'
    || useCases.includes('business') || useCases.includes('surveillance');

  if (driveCount >= 5 && needsSafety) return 'shr-2';
  if (driveCount >= 4 && needsPerformance) return 'raid10';
  return 'shr';
}

export function minDrivesForRaid(raidType: string): number {
  switch (raidType) {
    case 'raid1': return 2;
    case 'shr': case 'raid5': return 3;
    case 'shr-2': case 'raid6': return 4;
    case 'raid10': return 4;
    default: return 1;
  }
}
