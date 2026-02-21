import type { WizardAnswers } from '../types/wizard';
import type {
  CpuRequirements,
  CpuTier,
  RamRequirements,
  EccRecommendation,
  StorageRequirements,
  DriveClass,
  SsdCacheRequirements,
  TranscodingRequirements,
  AiRequirements,
  NetworkRequirements,
  FormFactorRequirements,
  UpsRequirements,
} from '../types/config';
import { calcRaidCapacity, minDrivesForRaid, selectRaidType } from './storage-calculator';

// ─── CPU ───

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
    // Each 4 cameras adds meaningful CPU load (decode, motion detect, recording)
    score += Math.ceil(answers.surveillance.cameras / 4);
  }

  if (answers.useCases.includes('docker') && answers.docker) {
    const heavyCount = answers.docker.heavyServices.length;
    score += heavyCount >= 4 ? 4 : heavyCount >= 2 ? 3 : answers.docker.containerRange === '15+' ? 2 : 1;
  }

  if (answers.useCases.includes('vm') && answers.vm) {
    // VMs are CPU-intensive: 1-2 = mid, 3-4 = heavy, 5+ = server-class
    score += answers.vm.count <= 2 ? 3 : answers.vm.count <= 4 ? 5 : 7;
  }

  if (answers.useCases.includes('business') && answers.business) {
    // Concurrent users create real CPU load: AD, indexing, file locks, search
    score += answers.business.users > 20 ? 6 : answers.business.users > 10 ? 4 : 2;
  }

  return score;
}

export function determineCpuRequirements(answers: WizardAnswers): CpuRequirements {
  const score = calcCpuScore(answers);
  const needsQuickSync = answers.useCases.includes('media') && answers.media?.transcoding !== 'none';
  const is4k = answers.media?.transcoding === '4k';

  let tier: CpuTier;
  let minCores: number;
  let minThreads: number;
  let tdpRange: [number, number];
  let explanation: string;

  if (score <= 2) {
    tier = 'basic';
    minCores = 2;
    minThreads = 4;
    tdpRange = [10, 25];
    explanation = 'Достаточно энергоэффективного 2-4 ядерного CPU (10-25 Вт TDP). Файловое хранилище и бэкапы не требуют вычислительной мощности.';
  } else if (score <= 5) {
    tier = 'mid';
    minCores = 4;
    minThreads = 8;
    tdpRange = [15, 35];
    explanation = 'Нужен 4-ядерный CPU с 8 потоками. Достаточно для Docker, транскодинга 1080p и умеренной многозадачности.';
  } else if (score <= 8) {
    tier = 'heavy';
    minCores = 6;
    minThreads = 12;
    tdpRange = [25, 65];
    explanation = 'Требуется 6+ ядерный CPU. Тяжёлые Docker-контейнеры, 4K транскодинг, виртуальные машины нуждаются в серьёзной вычислительной мощности.';
  } else {
    tier = 'server';
    minCores = 8;
    minThreads = 16;
    tdpRange = [65, 125];
    explanation = 'Серверный класс: 8+ ядер. Множество VM, бизнес-нагрузка на 15+ пользователей, одновременный транскодинг и AI.';
  }

  if (needsQuickSync) {
    explanation += ' Обязательна поддержка Intel QuickSync для аппаратного транскодинга.';
  }

  return {
    tier,
    minCores,
    minThreads,
    needsQuickSync,
    minQuickSyncGen: needsQuickSync
      ? (is4k ? 'Kaby Lake (7th gen) и новее — для HEVC 10-bit (4K HDR)' : 'Skylake (6th gen) и новее — для HEVC 8-bit')
      : null,
    tdpRange,
    explanation,
  };
}

// ─── RAM ───

export function determineRamRequirements(answers: WizardAnswers): RamRequirements {
  let ram = 4;

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

  const sizes = [4, 8, 16, 32, 64];
  const minGB = sizes.find((s) => s >= ram) || 64;
  const recommendedGB = sizes.find((s) => s >= ram * 1.5) || 64;

  let eccRecommendation: EccRecommendation = 'not_needed';
  if (answers.reliability.criticality === 'mission_critical' || answers.useCases.includes('business')) {
    eccRecommendation = 'strongly_recommended';
  } else if (answers.reliability.criticality === 'high' || answers.useCases.includes('vm')) {
    eccRecommendation = 'recommended';
  }

  const explanation = minGB <= 8
    ? `${minGB} ГБ — достаточно для базовых задач (файлы, бэкапы, лёгкий Docker)`
    : minGB <= 16
      ? `${minGB} ГБ — оптимально для Docker, транскодинга и мультизадачности`
      : `${minGB} ГБ — необходимо для VM и тяжёлых нагрузок. При возможности ставьте ${recommendedGB} ГБ`;

  return { minGB, recommendedGB, eccRecommendation, explanation };
}

// ─── Storage ───

export function determineStorageRequirements(
  totalRequiredTB: number,
  maxBays: number,
  answers: WizardAnswers,
): StorageRequirements {
  const raidType = selectRaidType(
    answers.reliability.raidType,
    maxBays,
    answers.reliability.criticality,
    answers.useCases,
  );

  const hasSurveillance = answers.useCases.includes('surveillance');
  const minDrives = minDrivesForRaid(raidType);
  const standardSizes = [4, 8, 12, 16, 20, 24];

  let bestDriveSize = standardSizes[0];
  let bestDriveCount = minDrives;
  let found = false;

  for (const size of standardSizes) {
    for (let count = minDrives; count <= Math.min(maxBays, 12); count++) {
      const usable = calcRaidCapacity(count, size, raidType);
      if (usable * 1.1 >= totalRequiredTB) {
        bestDriveSize = size;
        bestDriveCount = count;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  // If no combo fits, use max bays with largest drives
  if (!found) {
    bestDriveCount = Math.min(maxBays, 12);
    bestDriveSize = standardSizes[standardSizes.length - 1];
  }

  let driveClass: DriveClass = 'nas';
  if (hasSurveillance) driveClass = 'surveillance';
  if (answers.useCases.includes('business') && answers.business && answers.business.users > 15) {
    driveClass = 'enterprise';
  }

  const classLabel = driveClass === 'nas' ? 'NAS-класса'
    : driveClass === 'surveillance' ? 'для видеонаблюдения (24/7 запись)'
      : 'Enterprise-класса';

  return {
    driveCount: bestDriveCount,
    minDriveSizeTB: bestDriveSize,
    raidType,
    driveClass,
    cmrRequired: true,
    tlerRequired: true,
    explanation: `${bestDriveCount}× HDD от ${bestDriveSize} ТБ, ${classLabel}. ${raidType.toUpperCase()} — ${raidType === 'raid1' ? 'зеркалирование' : raidType.includes('shr-2') || raidType === 'raid6' ? 'двойная защита от потери 2 дисков' : 'защита от потери одного диска'}. Только CMR с TLER/ERC!`,
  };
}

// ─── SSD Cache ───

export function determineSsdCache(answers: WizardAnswers): SsdCacheRequirements | null {
  if (!answers.reliability.ssdCache) return null;

  const isHeavy = answers.useCases.includes('vm') ||
    (answers.useCases.includes('docker') && answers.docker?.containerRange === '15+');
  const minCapacityGB = isHeavy ? 500 : 250;
  const minTBW = isHeavy ? 600 : 300;

  // Build per-use-case explanation
  const reasons: string[] = [];
  if (answers.useCases.includes('docker')) {
    reasons.push('Docker-контейнеры создают массу мелких случайных операций (I/O) — базы данных, логи, метаданные. Без SSD-кэша это всё ложится на HDD, вызывая задержки');
  }
  if (answers.useCases.includes('vm')) {
    reasons.push('Виртуальные машины требуют быстрого случайного доступа к дискам (загрузка ОС, swap, база данных). SSD-кэш снижает латентность в 10-50 раз по сравнению с HDD');
  }
  if (answers.useCases.includes('business')) {
    reasons.push('Одновременный доступ нескольких пользователей к файлам создаёт конкурентные запросы. SSD-кэш буферизует горячие данные и метаданные, ускоряя отклик');
  }
  if (answers.useCases.includes('media') && answers.media?.transcoding !== 'none') {
    reasons.push('Транскодинг читает и пишет временные файлы. SSD-кэш ускоряет доступ к метаданным библиотеки и потоковым буферам');
  }

  const reasonsText = reasons.length > 0
    ? `\n\nЗачем именно вам: ${reasons.join('. ')}.`
    : '';

  return {
    count: 2,
    minCapacityGB,
    interface: 'nvme',
    minNandType: 'tlc',
    dramRequired: true,
    minTBW,
    explanation: `2× NVMe SSD от ${minCapacityGB} ГБ для кэша чтения/записи. Обязательно: TLC NAND (не QLC!), DRAM-буфер, TBW от ${minTBW}+.${reasonsText}`,
  };
}

// ─── Transcoding ───

export function determineTranscoding(answers: WizardAnswers): TranscodingRequirements | null {
  if (!answers.useCases.includes('media') || answers.media?.transcoding === 'none') return null;

  const is4k = answers.media?.transcoding === '4k';
  const codecs = ['h264'];
  if (is4k) {
    codecs.push('hevc_10bit');
  } else {
    codecs.push('hevc_8bit');
  }

  return {
    needed: true,
    method: 'quicksync',
    minCodecSupport: codecs,
    explanation: is4k
      ? 'Аппаратный транскодинг 4K HDR (HEVC 10-bit). Intel QuickSync от Kaby Lake (7th gen) — лучший вариант по энергоэффективности. Альтернатива: NVIDIA NVENC (RTX 2000+).'
      : 'Аппаратный транскодинг 1080p. Intel QuickSync от Skylake (6th gen). Даже дешёвый N100 обрабатывает несколько 1080p потоков.',
  };
}

// ─── AI ───

export function determineAiRequirements(answers: WizardAnswers): AiRequirements | null {
  const hasFrigate = answers.useCases.includes('docker') &&
    answers.docker?.heavyServices.includes('frigate');
  const hasSurveillancePlus = answers.useCases.includes('surveillance') &&
    answers.surveillance && answers.surveillance.cameras > 4;

  if (!hasFrigate && !hasSurveillancePlus) return null;

  const useCases: string[] = [];
  if (hasFrigate) useCases.push('Frigate NVR — детекция объектов');
  if (hasSurveillancePlus) useCases.push('Распознавание для камер');

  return {
    needed: true,
    useCases,
    explanation: 'Для AI-детекции нужен отдельный ускоритель: Hailo-8L (M.2), Intel OpenVINO (на iGPU) или USB-ускоритель. Работает параллельно с транскодингом.',
  };
}

// ─── Network ───

export function determineNetworkRequirements(answers: WizardAnswers): NetworkRequirements {
  const wants10gbe = answers.network.currentSpeed === '10gbe' || answers.network.needUpgrade;
  const hasHeavyStorage = answers.useCases.includes('vm') ||
    (answers.useCases.includes('media') && answers.media && answers.media.libraryTB >= 8);

  let recommendedSpeed: '1gbe' | '2.5gbe' | '10gbe' = '1gbe';
  if (wants10gbe || hasHeavyStorage) {
    recommendedSpeed = '10gbe';
  } else if (answers.network.currentSpeed !== '100mbps') {
    recommendedSpeed = '2.5gbe';
  }

  return {
    recommendedSpeed,
    need10gbe: wants10gbe,
    explanation: recommendedSpeed === '10gbe'
      ? '10GbE для максимальной пропускной способности. Нужны Cat6/Cat6a кабели и 10GbE свитч.'
      : recommendedSpeed === '2.5gbe'
        ? '2.5GbE — оптимальный апгрейд. Работает на Cat5e, один HDD уже не упирается в сеть.'
        : '1GbE достаточно. Легко апгрейднуть до 2.5GbE (PCIe карта ~$25).',
  };
}

// ─── Form Factor ───

export function determineFormFactor(driveCount: number, answers: WizardAnswers): FormFactorRequirements {
  const cpuScore = calcCpuScore(answers);
  const placement = answers.formFactor.placement;

  let maxMbFormFactor: 'mini-itx' | 'mini-dtx' | 'atx' = 'mini-itx';
  if (cpuScore >= 8 || driveCount > 8) maxMbFormFactor = 'atx';
  else if (cpuScore >= 5 || driveCount > 6) maxMbFormFactor = 'mini-dtx';

  return {
    minBays35: driveCount,
    maxMbFormFactor,
    placement,
    explanation: `Корпус от ${driveCount} отсеков 3.5". Форм-фактор платы: до ${maxMbFormFactor.toUpperCase()}. ${placement === 'home' ? 'Для дома — тихий NAS-корпус.' : placement === 'rack' ? 'Стойка 19" — 4U для плотности дисков.' : 'Серверная — шум не критичен, приоритет обслуживаемость.'}`,
  };
}

// ─── UPS ───

export function determineUps(totalPowerW: number, _answers: WizardAnswers): UpsRequirements {
  const minVA = Math.ceil(totalPowerW / 0.6 * 1.3 / 50) * 50;

  return {
    minVA: Math.max(minVA, 400),
    explanation: `ИБП от ${Math.max(minVA, 400)} ВА — обязательная часть любого NAS. При внезапном отключении питания диски могут потерять данные из кэша, а файловая система — повредиться. Подключите NAS через USB к ИБП для автоматического корректного выключения.`,
  };
}

// ─── Helpers for wizard UI ───

export function shouldRecommendSSDCache(answers: WizardAnswers): boolean {
  return (
    answers.useCases.includes('docker') ||
    answers.useCases.includes('vm') ||
    answers.useCases.includes('business') ||
    (answers.useCases.includes('media') && answers.media?.transcoding !== 'none')
  );
}
