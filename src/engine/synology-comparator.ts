import type { SynologyComparison } from '../types/config';
import type { SynologyModel } from '../types/components';
import componentsCatalog from '../data/components.json';
import profilesData from '../data/profiles.json';

export function findClosestSynology(params: {
  requiredBays: number;
  ramGB: number;
  cameras: number;
  has10gbe: boolean;
  driveCostTotal: number;
  xpenologyTotal: number;
}): SynologyComparison {
  const models = componentsCatalog.synology_models as SynologyModel[];

  // Find closest Synology model with >= required bays
  const candidates = models
    .filter((m) => m.bays >= params.requiredBays)
    .sort((a, b) => a.price_rub - b.price_rub);

  const bestMatch = candidates[0] || models[models.length - 1];

  // Calculate license cost for surveillance cameras
  const camerasOverDefault = Math.max(0, params.cameras - profilesData.surveillance_free_cameras);
  const licenseCost = camerasOverDefault * profilesData.surveillance_license_cost_rub;

  const synologyTotal = bestMatch.price_rub + params.driveCostTotal + licenseCost;

  // Collect limitations
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

  return {
    model: bestMatch,
    synologyTotal,
    licenseCost,
    xpenologyTotal: params.xpenologyTotal,
    savings: synologyTotal - params.xpenologyTotal,
  limitations,
  };
}
