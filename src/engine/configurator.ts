import type { WizardAnswers } from '../types/wizard';
import type { NASConfig, StorageBreakdownResult, StorageAllocation } from '../types/config';
import { calcSurveillanceStorageTB } from './surveillance-calculator';
import { calcRaidCapacity, calcTotalRequiredTB } from './storage-calculator';
import {
  determineCpuRequirements,
  determineRamRequirements,
  determineStorageRequirements,
  determineSsdCache,
  determineTranscoding,
  determineAiRequirements,
  determineNetworkRequirements,
  determineFormFactor,
  determineUps,
} from './component-selector';
import { estimatePowerWatts, determinePsu } from './power-calculator';
import { calcPriceEstimate } from './price-calculator';
import { selectInsights } from '../data/insights';

export function generateConfig(answers: WizardAnswers): NASConfig {
  // 1. Calculate storage needs
  let surveillanceTB = 0;
  if (answers.useCases.includes('surveillance') && answers.surveillance) {
    surveillanceTB = calcSurveillanceStorageTB({
      cameras: answers.surveillance.cameras,
      resolution: answers.surveillance.resolution,
      fps: answers.surveillance.fps,
      codec: answers.surveillance.codec,
      days: answers.surveillance.storageDays,
      motionOnly: answers.surveillance.motionOnly,
    });
  }

  let fileStorageTB = 0;
  if (answers.useCases.includes('file_storage') && answers.fileStorage) {
    fileStorageTB = answers.fileStorage.currentDataTB;
  }

  let mediaLibraryTB = 0;
  if (answers.useCases.includes('media') && answers.media) {
    mediaLibraryTB = answers.media.libraryTB;
  }

  let backupTB = 0;
  if (answers.useCases.includes('backup') && answers.backup) {
    const deviceMultiplier =
      answers.backup.deviceRange === '10+' ? 5 :
      answers.backup.deviceRange === '3-10' ? 2 : 0.5;
    backupTB = deviceMultiplier;
  }

  let dockerTB = 0;
  if (answers.useCases.includes('docker')) {
    dockerTB = 0.1;
  }

  let vmTB = 0;
  if (answers.useCases.includes('vm') && answers.vm) {
    vmTB = answers.vm.count * 0.1;
  }

  const growthMultiplier = answers.fileStorage
    ? 1 + answers.fileStorage.growthPercent / 100
    : 1.25;

  const totalRequiredTB = calcTotalRequiredTB({
    fileStorageTB,
    mediaLibraryTB,
    surveillanceTB,
    dockerTB,
    vmTB,
    backupTB,
    growthMultiplier,
  });

  // 2. Bay count
  let maxBays: number;
  if (answers.formFactor.bayCount === 'auto') {
    if (totalRequiredTB <= 8) maxBays = 2;
    else if (totalRequiredTB <= 32) maxBays = 4;
    else if (totalRequiredTB <= 64) maxBays = 6;
    else if (totalRequiredTB <= 128) maxBays = 8;
    else maxBays = 12;
  } else {
    maxBays = answers.formFactor.bayCount;
  }

  // 3. Determine abstract requirements
  const cpu = determineCpuRequirements(answers);
  const ram = determineRamRequirements(answers);
  const storage = determineStorageRequirements(totalRequiredTB, maxBays, answers);
  const ssdCache = determineSsdCache(answers);
  const transcoding = determineTranscoding(answers);
  const ai = determineAiRequirements(answers);
  const network = determineNetworkRequirements(answers);
  const formFactor = determineFormFactor(storage.driveCount, answers);

  // 4. Storage breakdown (visual)
  const usableTiB = calcRaidCapacity(storage.driveCount, storage.minDriveSizeTB, storage.raidType);
  const rawTB = storage.driveCount * storage.minDriveSizeTB;

  const allocations: StorageAllocation[] = [];
  if (surveillanceTB > 0) {
    allocations.push({ label: 'Видеонаблюдение', sizeTB: surveillanceTB, color: '#ef4444' });
  }
  if (fileStorageTB > 0) {
    allocations.push({ label: 'Файлы', sizeTB: fileStorageTB * growthMultiplier, color: '#3b82f6' });
  }
  if (mediaLibraryTB > 0) {
    allocations.push({ label: 'Медиатека', sizeTB: mediaLibraryTB, color: '#8b5cf6' });
  }
  if (backupTB > 0) {
    allocations.push({ label: 'Бэкапы', sizeTB: backupTB * growthMultiplier, color: '#22c55e' });
  }
  if (dockerTB > 0) {
    allocations.push({ label: 'Docker', sizeTB: dockerTB, color: '#06b6d4' });
  }
  if (vmTB > 0) {
    allocations.push({ label: 'VM', sizeTB: vmTB, color: '#f59e0b' });
  }

  const usedTB = allocations.reduce((sum, a) => sum + a.sizeTB, 0);
  const freeTiB = Math.max(0, usableTiB - usedTB * 0.909);

  const storageBreakdown: StorageBreakdownResult = {
    rawTB,
    usableTiB,
    allocations,
    freeTiB,
    raidType: storage.raidType as any,
    driveCount: storage.driveCount,
    driveSizeTB: storage.minDriveSizeTB,
  };

  // 5. Power & PSU
  const estimatedPowerW = estimatePowerWatts({
    cpuTier: cpu.tier,
    cpuTdpMax: cpu.tdpRange[1],
    driveCount: storage.driveCount,
    driveSizeTB: storage.minDriveSizeTB,
    ssdCacheCount: ssdCache?.count || 0,
    ramGB: ram.minGB,
    has10gbe: network.need10gbe,
  });
  const psu = determinePsu(estimatedPowerW);

  // 6. UPS
  const ups = determineUps(estimatedPowerW, answers);

  // 7. Price estimate
  const priceEstimate = calcPriceEstimate({
    cpuTier: cpu.tier,
    ramGB: ram.minGB,
    driveCount: storage.driveCount,
    driveSizeTB: storage.minDriveSizeTB,
    driveClass: storage.driveClass,
    ssdCacheCount: ssdCache?.count || 0,
    ssdMinCapacityGB: ssdCache?.minCapacityGB || 0,
    psuWatts: psu.recommendedWatts,
    upsMinVA: ups.minVA,
    maxMbFormFactor: formFactor.maxMbFormFactor,
    driveSlots: formFactor.minBays35,
  });

  // 8. Educational insights
  const insights = selectInsights(answers);

  return {
    cpu,
    ram,
    storage,
    ssdCache,
    transcoding,
    ai,
    network,
    psu,
    ups,
    formFactor,
    storageBreakdown,
    priceEstimate,
    insights,
    estimatedPowerW,
  };
}
