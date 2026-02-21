import type { SynologyComparison, PriceRange } from '../types/config';
import componentsCatalog from '../data/components.json';
import profilesData from '../data/profiles.json';

interface SynologyModel {
  model: string;
  bays: number;
  cpu: string;
  ram_gb: number;
  max_ram_gb: number;
  max_cameras: number;
  network: string;
  price_rub: number;
  has_10gbe?: boolean;
  notes?: string;
}

export function findClosestSynology(params: {
  requiredBays: number;
  ramGB: number;
  cameras: number;
  has10gbe: boolean;
  driveCostRange: PriceRange;
  xpenologyTotalRange: PriceRange;
}): SynologyComparison {
  const models = componentsCatalog.synology_models as SynologyModel[];

  const candidates = models
    .filter((m) => m.bays >= params.requiredBays)
    .sort((a, b) => a.price_rub - b.price_rub);

  const bestMatch = candidates[0] || models[models.length - 1];

  const camerasOverDefault = Math.max(0, params.cameras - profilesData.surveillance_free_cameras);
  const licenseCost = camerasOverDefault * profilesData.surveillance_license_cost_rub;

  const synologyTotal = bestMatch.price_rub + ((params.driveCostRange.min + params.driveCostRange.max) / 2) + licenseCost;

  const limitations: string[] = [];

  if (params.cameras > profilesData.surveillance_free_cameras) {
    limitations.push(
      `Лицензии Surveillance Station: ${camerasOverDefault} камер × ${profilesData.surveillance_license_cost_rub.toLocaleString('ru-RU')} ₽ = ${licenseCost.toLocaleString('ru-RU')} ₽`
    );
  }

  if (bestMatch.max_ram_gb < params.ramGB) {
    limitations.push(`RAM ограничена ${bestMatch.max_ram_gb} ГБ (вам нужно ${params.ramGB} ГБ)`);
  }

  if (params.has10gbe && !bestMatch.has_10gbe) {
    limitations.push('Нет встроенного 10GbE (потребуется дорогой модуль расширения)');
  }

  if (bestMatch.notes) {
    limitations.push(bestMatch.notes);
  }

  limitations.push('Закрытая экосистема, ограниченная модернизация');

  const estimatedXpenologyMid = Math.round((params.xpenologyTotalRange.min + params.xpenologyTotalRange.max) / 2);

  return {
    model: bestMatch,
    synologyTotal: Math.round(synologyTotal),
    licenseCost,
    estimatedXpenologyTotal: estimatedXpenologyMid,
    savings: {
      min: Math.round(synologyTotal - params.xpenologyTotalRange.max),
      max: Math.round(synologyTotal - params.xpenologyTotalRange.min),
    },
    limitations,
  };
}
