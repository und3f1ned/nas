import type { WizardAnswers } from '../types/wizard';
import type { NASConfig, StorageBreakdownResult, StorageAllocation } from '../types/config';
import { calcSurveillanceStorageTB } from './surveillance-calculator';
import { calcRaidCapacity, calcTotalRequiredTB, selectRaidType } from './storage-calculator';
import {
  calcCpuScore,
  calcRamGB,
  selectMotherboard,
  selectCase,
  selectDrives,
  selectSSDCache,
  shouldRecommendUPS,
} from './component-selector';
import { calcPowerWatts, selectPSU, selectUPS } from './power-calculator';
import { calcPriceBreakdown } from './price-calculator';
import { findClosestSynology } from './synology-comparator';

export function generateConfig(answers: WizardAnswers): NASConfig {
  // 1. Calculate storage needs
  let surveillanceTB = 0;
  if (answers.useCases.includes('surveillance') && answers.surveillance) {
    surveillanceTB = calcSurveillanceStorageTB(answers.surveillance);
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

  // 2. Determine bay count
  let maxBays: number;
  if (answers.formFactor.bayCount === 'auto') {
    // Auto-determine based on storage needs
    if (totalRequiredTB <= 8) maxBays = 2;
    else if (totalRequiredTB <= 32) maxBays = 4;
    else if (totalRequiredTB <= 64) maxBays = 6;
    else if (totalRequiredTB <= 128) maxBays = 8;
    else maxBays = 12;
  } else {
    maxBays = answers.formFactor.bayCount;
  }

  // 3. Select RAID type
  const raidType = selectRaidType(
    answers.reliability.raidType,
    maxBays,
    answers.reliability.criticality,
    answers.useCases
  );

  // 4. Select drives
  const hasSurveillance = answers.useCases.includes('surveillance');
  const { drives, driveCount, driveSizeTB } = selectDrives(
    totalRequiredTB,
    raidType,
    maxBays,
    hasSurveillance
  );

  // 5. Calculate actual RAID capacity
  const usableTiB = calcRaidCapacity(driveCount, driveSizeTB, raidType);
  const rawTB = driveCount * driveSizeTB;

  // 6. Build storage breakdown
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
    raidType: raidType as any,
    driveCount,
    driveSizeTB,
  };

  // 7. Select components
  const cpuScore = calcCpuScore(answers);
  const motherboard = selectMotherboard(cpuScore, answers);
  const ramGB = calcRamGB(answers);
  const ssdCache = selectSSDCache(answers);
  const nasCase = selectCase(
    driveCount,
    motherboard.form_factor,
    answers.formFactor.placement,
    answers.formFactor.noiseLevel
  );

  // 8. Power & PSU
  const has10gbe = motherboard.eth_10g > 0;
  const totalPowerW = calcPowerWatts({
    motherboard,
    drives,
    ssdCache,
    ramGB,
    has10gbe,
  });
  const psu = selectPSU(totalPowerW);
  const needUps = answers.reliability.needUps || shouldRecommendUPS(answers);
  const ups = needUps ? selectUPS(totalPowerW) : null;

  // 9. Price breakdown
  const priceBreakdown = calcPriceBreakdown({
    nasCase,
    motherboard,
    ramGB,
    drives,
    ssdCache,
    psuPrice: psu.price_rub,
    upsPrice: ups?.price_rub || null,
  });

  // 10. Synology comparison
  const cameras = answers.surveillance?.cameras || 0;
  const synologyComparison = findClosestSynology({
    requiredBays: driveCount,
    ramGB,
    cameras,
    has10gbe,
    driveCostTotal: priceBreakdown.drives,
    xpenologyTotal: priceBreakdown.total,
  });

  // 11. Generate explanations
  const explanations: Record<string, string> = {};
  explanations.cpu = `${motherboard.cpu} (оценка нагрузки: ${cpuScore}/10)${motherboard.quicksync ? ' — аппаратный транскодинг Quick Sync' : ''}`;
  explanations.ram = `${ramGB} ГБ — ${ramGB <= 8 ? 'достаточно для базовых задач' : ramGB <= 16 ? 'оптимально для Docker и мультизадачности' : 'необходимо для VM и тяжёлых нагрузок'}`;
  explanations.raid = `${raidType.toUpperCase()} — ${raidType === 'shr' ? 'гибкий RAID, легко расширять' : raidType === 'shr-2' ? 'двойная избыточность для критичных данных' : raidType === 'raid1' ? 'зеркалирование для 2 дисков' : raidType === 'raid10' ? 'производительность + надёжность' : 'оптимальный для вашей конфигурации'}`;
  explanations.drives = `${driveCount}× ${drives[0].name} — ${drives[0].type === 'surveillance' ? 'оптимизированы для записи видео 24/7' : drives[0].type === 'enterprise' ? 'серверного класса, повышенная надёжность' : 'серия NAS, оптимальны для RAID-массивов'}`;

  // 12. RAM module description
  const ramModules = `${ramGB} ГБ ${motherboard.ram_type}`;

  return {
    case: nasCase,
    motherboard,
    ramGB,
    ramModules,
    drives,
    ssdCache,
    psuWatts: psu.watts,
    ups: ups?.name || null,
    totalPowerW,
    raidType,
    storageBreakdown,
    priceBreakdown,
    synologyComparison,
    explanations,
  };
}
