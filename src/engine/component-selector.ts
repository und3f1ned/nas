import type { WizardAnswers } from '../types/wizard';
import type { NASCase, Motherboard, DriveHDD, DriveSSD } from '../types/components';
import componentsCatalog from '../data/components.json';
import { calcRaidCapacity, minDrivesForRaid } from './storage-calculator';

export function calcCpuScore(answers: WizardAnswers): number {
  let score = 0;

  if (answers.useCases.includes('file_storage')) score += 1;
  if (answers.useCases.includes('backup')) score += 1;

  if (answers.useCases.includes('media') && answers.media) {
    score += answers.media.transcoding === '4k' ? 4 :
      answers.media.transcoding === '1080p' ? 2 : 1;
    score += Math.floor(answers.media.streams / 2);
  }

  if (answers.useCases.includes('surveillance') && answers.surveillance) {
    score += Math.ceil(answers.surveillance.cameras / 16);
  }

  if (answers.useCases.includes('docker') && answers.docker) {
    const heavy = answers.docker.heavyServices.length > 3;
    score += heavy ? 3 : answers.docker.containerRange === '15+' ? 2 : 1;
  }

  if (answers.useCases.includes('vm') && answers.vm) {
    score += answers.vm.count <= 2 ? 2 : 4;
  }

  if (answers.useCases.includes('business') && answers.business) {
    score += answers.business.users > 15 ? 3 : 2;
  }

  return score;
}

export function calcRamGB(answers: WizardAnswers): number {
  let ram = 4; // Base DSM

  if (answers.useCases.includes('surveillance') && answers.surveillance) {
    ram += Math.ceil(answers.surveillance.cameras / 8) * 0.5;
  }

  if (answers.useCases.includes('docker') && answers.docker) {
    ram += Math.max(answers.docker.heavyServices.length * 1, 2);
  }

  if (answers.useCases.includes('vm') && answers.vm) {
    ram += answers.vm.count * 4;
  }

  if (answers.useCases.includes('business') && answers.business) {
    ram += Math.ceil(answers.business.users / 10) * 1;
  }

  if (answers.useCases.includes('media') && answers.media && answers.media.transcoding !== 'none') {
    ram += 2;
  }

  if (answers.reliability.ssdCache) {
    ram += 1;
  }

  // Round to standard size
  const sizes = [4, 8, 16, 32, 64];
  return sizes.find((s) => s >= ram) || 64;
}

export function selectMotherboard(cpuScore: number, answers: WizardAnswers): Motherboard {
  const boards = componentsCatalog.motherboards as Motherboard[];
  const needs10gbe = answers.network.currentSpeed === '10gbe' || answers.network.needUpgrade;
  const needsQuickSync = answers.useCases.includes('media') && answers.media?.transcoding !== 'none';

  // Filter compatible boards
  const candidates = boards.filter((b) => {
    if (needsQuickSync && !b.quicksync) return false;
    return b.xpenology_compat !== 'unknown';
  });

  // Sort by closest cpu_score match (prefer not underpowered)
  candidates.sort((a, b) => {
    const diffA = a.cpu_score - cpuScore;
    const diffB = b.cpu_score - cpuScore;
    // Prefer boards at or above required score
    if (diffA >= 0 && diffB < 0) return -1;
    if (diffA < 0 && diffB >= 0) return 1;
    return Math.abs(diffA) - Math.abs(diffB);
  });

  // Prefer 10GbE if needed
  if (needs10gbe) {
    const with10g = candidates.find((b) => b.eth_10g > 0);
    if (with10g) return with10g;
  }

  return candidates[0] || boards[0];
}

export function selectCase(
  requiredBays: number,
  mbFormFactor: string,
  placement: string,
  noiseLevel: string
): NASCase {
  const cases = componentsCatalog.cases as NASCase[];

  const compatible = cases.filter((c) => {
    if (c.bays_35 < requiredBays) return false;
    if (!c.available) return false;
    // Form factor compatibility
    if (mbFormFactor === 'atx' && c.max_mb !== 'atx') return false;
    if (mbFormFactor === 'mini-dtx' && c.max_mb === 'mini-itx') return false;
    // Placement preference
    if (placement === 'rack' && !c.form_factor.includes('rack')) return false;
    if (placement === 'home' && c.form_factor.includes('rack')) return false;
    // Noise preference
    if (noiseLevel === 'quiet' && c.noise_level === 'high') return false;
    return true;
  });

  // Sort by price (cheapest suitable)
  compatible.sort((a, b) => a.price_rub - b.price_rub);

  return compatible[0] || cases[0];
}

export function selectDrives(
  totalRequiredTB: number,
  raidType: string,
  maxBays: number,
  hasSurveillance: boolean
): { drives: DriveHDD[]; driveCount: number; driveSizeTB: number } {
  const hddCatalog = componentsCatalog.drives_hdd as DriveHDD[];
  const standardSizes = [...new Set(hddCatalog.map((d) => d.capacity_tb))].sort((a, b) => a - b);

  const minDrives = minDrivesForRaid(raidType);
  const effectiveMaxBays = Math.min(maxBays, 12);

  let bestDriveSize = standardSizes[0];
  let bestDriveCount = minDrives;

  for (const size of standardSizes) {
    for (let count = minDrives; count <= effectiveMaxBays; count++) {
      const usable = calcRaidCapacity(count, size, raidType);
      if (usable * 1.1 >= totalRequiredTB) { // TiB to approximate TB
        bestDriveSize = size;
        bestDriveCount = count;
        break;
      }
    }
    if (calcRaidCapacity(bestDriveCount, bestDriveSize, raidType) * 1.1 >= totalRequiredTB) {
      break;
    }
  }

  // Pick the right drive model
  const preferredType = hasSurveillance ? 'surveillance' : 'nas';
  let selectedDrive = hddCatalog.find(
    (d) => d.capacity_tb === bestDriveSize && d.type === preferredType
  );
  if (!selectedDrive) {
    selectedDrive = hddCatalog.find((d) => d.capacity_tb === bestDriveSize);
  }
  if (!selectedDrive) {
    // Fallback: find closest size
    selectedDrive = hddCatalog
      .filter((d) => d.capacity_tb >= bestDriveSize)
      .sort((a, b) => a.capacity_tb - b.capacity_tb)[0] || hddCatalog[hddCatalog.length - 1];
    bestDriveSize = selectedDrive.capacity_tb;
  }

  const drives = Array(bestDriveCount).fill(selectedDrive);

  return { drives, driveCount: bestDriveCount, driveSizeTB: bestDriveSize };
}

export function selectSSDCache(answers: WizardAnswers): DriveSSD[] {
  if (!answers.reliability.ssdCache) return [];

  const ssds = componentsCatalog.drives_ssd as DriveSSD[];
  // Pick cheapest NVMe option, return 2 for read/write cache
  const cheapest = [...ssds].sort((a, b) => a.price_rub - b.price_rub)[0];
  return cheapest ? [cheapest, cheapest] : [];
}

export function shouldRecommendSSDCache(answers: WizardAnswers): boolean {
  return (
    answers.useCases.includes('docker') ||
    answers.useCases.includes('vm') ||
    answers.useCases.includes('business') ||
    (answers.useCases.includes('media') && answers.media?.transcoding !== 'none')
  );
}

export function shouldRecommendUPS(answers: WizardAnswers): boolean {
  return (
    answers.useCases.includes('business') ||
    answers.useCases.includes('surveillance') ||
    answers.reliability.criticality === 'high' ||
    answers.reliability.criticality === 'mission_critical'
  );
}
