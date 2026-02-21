import type { WizardAnswers } from '../types/wizard';
import type { NASConfig, PriceRange } from '../types/config';

export interface SynologyComparisonItem {
  icon: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface SynologyComparison {
  closestModel: string;
  synologyPriceRub: PriceRange;
  customPriceRub: PriceRange;
  savingsPercent: number;
  problems: SynologyComparisonItem[];
}

interface SynologyModel {
  model: string;
  priceUsd: number;
  priceRubMin: number;
  priceRubMax: number;
  bays: number;
  cpu: string;
  cpuTier: 'basic' | 'mid';
  hasHwTranscoding: boolean;
  ram: number;
  maxRam: number;
  supportsEcc: boolean;
  network: '1gbe' | '2.5gbe';
}

const SYNOLOGY_MODELS: SynologyModel[] = [
  { model: 'DS224+', priceUsd: 300, priceRubMin: 48000, priceRubMax: 128000, bays: 2, cpu: 'Intel J4125 (2019)', cpuTier: 'basic', hasHwTranscoding: true, ram: 2, maxRam: 6, supportsEcc: false, network: '1gbe' },
  { model: 'DS423+', priceUsd: 450, priceRubMin: 62000, priceRubMax: 150000, bays: 4, cpu: 'Intel J4125 (2019)', cpuTier: 'basic', hasHwTranscoding: true, ram: 2, maxRam: 6, supportsEcc: false, network: '1gbe' },
  { model: 'DS923+', priceUsd: 600, priceRubMin: 76000, priceRubMax: 207000, bays: 4, cpu: 'AMD Ryzen R1600 (2C/4T, без iGPU)', cpuTier: 'mid', hasHwTranscoding: false, ram: 4, maxRam: 32, supportsEcc: true, network: '1gbe' },
  { model: 'DS925+', priceUsd: 640, priceRubMin: 86000, priceRubMax: 215000, bays: 4, cpu: 'AMD Ryzen V1500B (4C/8T, 2018, без iGPU)', cpuTier: 'mid', hasHwTranscoding: false, ram: 4, maxRam: 32, supportsEcc: true, network: '2.5gbe' },
  { model: 'DS1522+', priceUsd: 700, priceRubMin: 92000, priceRubMax: 230000, bays: 5, cpu: 'AMD Ryzen R1600 (2C/4T)', cpuTier: 'mid', hasHwTranscoding: false, ram: 8, maxRam: 32, supportsEcc: true, network: '1gbe' },
  { model: 'DS1825+', priceUsd: 1100, priceRubMin: 140000, priceRubMax: 350000, bays: 8, cpu: 'AMD Ryzen V1500B (4C/8T, 2018, без iGPU)', cpuTier: 'mid', hasHwTranscoding: false, ram: 8, maxRam: 32, supportsEcc: true, network: '2.5gbe' },
];

function findClosestModel(config: NASConfig): SynologyModel {
  const baysNeeded = config.storage.driveCount;
  const eligible = SYNOLOGY_MODELS.filter(m => m.bays >= baysNeeded);
  return eligible.length > 0 ? eligible[0] : SYNOLOGY_MODELS[SYNOLOGY_MODELS.length - 1];
}

export function generateSynologyComparison(config: NASConfig, answers: WizardAnswers): SynologyComparison {
  const model = findClosestModel(config);
  const problems: SynologyComparisonItem[] = [];

  // ─── Russia-specific problems (always shown) ───

  problems.push({
    icon: '🇷🇺',
    title: 'Наценка в России: ×2-3 от глобальной цены',
    description: `${model.model} стоит $${model.priceUsd} в США, но ${(model.priceRubMin / 1000).toFixed(0)}-${(model.priceRubMax / 1000).toFixed(0)}к руб. в России. Это серый импорт без официальной гарантии. С учётом санкций поставки нестабильны, цены скачут.`,
    severity: 'critical',
  });

  problems.push({
    icon: '🔒',
    title: 'Привязка к дискам (Drive Lock-in)',
    description: 'С DSM 7.2 Synology блокировала создание массивов с «непроверенными» дисками на моделях Plus/Value. В 2025 частично отменили для HDD, но NVMe SSD по-прежнему ограничены. Synology продвигает собственные диски HAT5310 с наценкой 30-50%.',
    severity: 'critical',
  });

  problems.push({
    icon: '🛡️',
    title: 'Гарантия и поддержка в России: нет',
    description: 'Synology официально ушла из России. Нет авторизованных сервис-центров, нет RMA, нет русскоязычной поддержки. Сломался — чини сам или выбрасывай.',
    severity: 'critical',
  });

  // ─── Hardware limitations ───

  if (config.cpu.needsQuickSync && !model.hasHwTranscoding) {
    problems.push({
      icon: '📺',
      title: `${model.model}: НЕТ аппаратного транскодинга`,
      description: `${model.model} на AMD ${model.cpu} — нет Intel QuickSync. Plex/Jellyfin будут использовать программный транскодинг, перегружая слабый CPU. Кастомный NAS с Intel N100 ($80) обходит ${model.model} ($${model.priceUsd}) в транскодинге.`,
      severity: 'critical',
    });
  }

  if (config.ram.minGB > model.maxRam) {
    problems.push({
      icon: '🧠',
      title: `RAM: максимум ${model.maxRam} ГБ, вам нужно ${config.ram.minGB} ГБ`,
      description: `${model.model} поддерживает максимум ${model.maxRam} ГБ RAM. Вашей конфигурации нужно минимум ${config.ram.minGB} ГБ. Synology не подходит.`,
      severity: 'critical',
    });
  } else if (model.ram < config.ram.minGB) {
    problems.push({
      icon: '🧠',
      title: `RAM: ${model.model} идёт с ${model.ram} ГБ, а нужно ${config.ram.minGB} ГБ`,
      description: `Придётся докупать RAM отдельно. Synology продаёт свои модули вдвое дороже рыночных. Неофициальная память может вызвать проблемы с обновлениями DSM.`,
      severity: 'warning',
    });
  }

  if (config.ram.eccRecommendation !== 'not_needed' && !model.supportsEcc) {
    problems.push({
      icon: '⚠️',
      title: `ECC-память: ${model.model} не поддерживает`,
      description: `Для вашей задачи рекомендуется ECC, но ${model.model} на Intel J4125 не поддерживает ECC на аппаратном уровне. AMD-модели (DS923+, DS925+, DS1522+, DS1825+) поддерживают ECC, но стоят от 76к руб.`,
      severity: 'warning',
    });
  }

  // ─── Surveillance costs ───

  if (answers.useCases.includes('surveillance') && answers.surveillance) {
    const cams = answers.surveillance.cameras;
    const freeCams = 2; // Synology includes 2 free licenses
    const extraCams = Math.max(0, cams - freeCams);
    const licenseCost = extraCams * 4200; // ~$50 per license at Russian prices

    problems.push({
      icon: '📹',
      title: `Surveillance Station: ${extraCams} платных лицензий = ${(licenseCost / 1000).toFixed(0)}к руб.`,
      description: `Synology даёт 2 камеры бесплатно. За каждую дополнительную — ~4 200 руб. ($50). Для ${cams} камер это ${(licenseCost / 1000).toFixed(0)}к руб. сверху. На кастомном NAS: Frigate или AgentDVR — бесплатно, без ограничений.`,
      severity: 'critical',
    });
  }

  // ─── Expandability ───

  if (config.storage.driveCount > model.bays) {
    problems.push({
      icon: '📦',
      title: `Мало слотов: ${model.model} = ${model.bays} дисков, вам нужно ${config.storage.driveCount}`,
      description: `Расширение возможно только через DX517 (~$500) и теряет производительность. Кастомный NAS можно собрать сразу с нужным количеством слотов.`,
      severity: 'critical',
    });
  }

  // ─── Closed ecosystem ───

  problems.push({
    icon: '🔐',
    title: 'Закрытая экосистема',
    description: 'DSM — проприетарная ОС. Нет выбора файловой системы (только Btrfs/ext4), нет root-доступа без взлома, нет кастомных пакетов без хаков. Docker на ARM-моделях ограничен. Обновления могут сломать совместимость без предупреждения.',
    severity: 'warning',
  });

  problems.push({
    icon: '📊',
    title: 'Телеметрия и устаревшее железо',
    description: `${model.model} использует процессор ${model.cpu} — архитектура 2018-2019 годов. Synology берёт серверную наценку за железо 5-летней давности. Также: DSM собирает телеметрию (список пакетов, активность), отключить полностью невозможно.`,
    severity: 'info',
  });

  // ─── Price comparison (hardware only — drives are same for both) ───

  const synologyTotalMin = model.priceRubMin;
  const synologyTotalMax = model.priceRubMax;

  // Custom NAS price WITHOUT drives — fair comparison since you buy drives either way
  const pe = config.priceEstimate;
  const customHwMin = pe.hardware.min + pe.accessories.min + pe.assembly + (pe.ssdCache?.min ?? 0);
  const customHwMax = pe.hardware.max + pe.accessories.max + pe.assembly + (pe.ssdCache?.max ?? 0);

  const synologyMid = (synologyTotalMin + synologyTotalMax) / 2;
  const customMid = (customHwMin + customHwMax) / 2;
  const savingsPercent = Math.round(((synologyMid - customMid) / synologyMid) * 100);

  return {
    closestModel: model.model,
    synologyPriceRub: { min: synologyTotalMin, max: synologyTotalMax },
    customPriceRub: { min: customHwMin, max: customHwMax },
    savingsPercent: Math.max(savingsPercent, 0),
    problems,
  };
}
