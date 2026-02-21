import type { CpuTier, PsuRequirements } from '../types/config';

interface PowerEstimateParams {
  cpuTier: CpuTier;
  cpuTdpMax: number;
  driveCount: number;
  driveSizeTB: number;
  ssdCacheCount: number;
  ramGB: number;
  has10gbe: boolean;
}

export function estimatePowerWatts(params: PowerEstimateParams): number {
  let power = 0;

  // CPU — use TDP max as base, idle is typically 30-50% of TDP
  power += params.cpuTdpMax * 0.7;

  // HDDs: ~5-9W each depending on size
  const hddPower = params.driveSizeTB >= 12 ? 9 : params.driveSizeTB >= 8 ? 7 : 5;
  power += params.driveCount * hddPower;

  // NVMe SSDs: ~5W each
  power += params.ssdCacheCount * 5;

  // RAM: ~0.3W per GB
  power += params.ramGB * 0.3;

  // Network
  power += params.has10gbe ? 10 : 2;

  // Fans, misc
  power += 15;

  return Math.round(power);
}

export function determinePsu(totalPowerW: number): PsuRequirements {
  const minWatts = Math.round(totalPowerW * 1.3);
  // Round up to nearest standard size
  const standardSizes = [200, 250, 300, 350, 450, 550];
  const recommendedWatts = standardSizes.find((s) => s >= minWatts) || 550;

  return {
    minWatts,
    recommendedWatts,
    efficiency: '80+ Gold',
    explanation: `БП от ${recommendedWatts} Вт, 80+ Gold. Расчётное потребление ~${totalPowerW} Вт. Для 24/7 системы КПД и надёжность важнее мощности — не берите 800 Вт для системы на ${totalPowerW} Вт.`,
  };
}
