import type { NASConfig } from '../../types/config';
import { formatWatts } from '../../utils/formatters';

interface ConfigCardProps {
  config: NASConfig;
}

const TIER_LABELS = {
  basic: 'Базовый',
  mid: 'Средний',
  heavy: 'Производительный',
  server: 'Серверный',
};

const ECC_LABELS = {
  not_needed: 'Не обязательна',
  recommended: 'Рекомендуется',
  strongly_recommended: 'Крайне рекомендуется',
};

const SPEED_LABELS = {
  '1gbe': '1 GbE',
  '2.5gbe': '2.5 GbE',
  '10gbe': '10 GbE',
};

export function ConfigCard({ config }: ConfigCardProps) {
  const rows = [
    {
      label: 'Процессор',
      value: `${TIER_LABELS[config.cpu.tier]} — от ${config.cpu.minCores} ядер / ${config.cpu.minThreads} потоков`,
      detail: config.cpu.explanation,
      tags: [
        `TDP ${config.cpu.tdpRange[0]}–${config.cpu.tdpRange[1]} Вт`,
        ...(config.cpu.needsQuickSync ? ['QuickSync'] : []),
      ],
    },
    ...(config.cpu.minQuickSyncGen ? [{
      label: 'Транскодинг',
      value: config.transcoding?.method === 'quicksync' ? 'Intel QuickSync' : 'Аппаратный',
      detail: config.transcoding?.explanation || '',
      tags: config.transcoding?.minCodecSupport || [],
    }] : []),
    ...(config.ai ? [{
      label: 'AI-ускоритель',
      value: config.ai.useCases.join(', '),
      detail: config.ai.explanation,
      tags: [] as string[],
    }] : []),
    {
      label: 'Оперативная память',
      value: config.ram.minGB === config.ram.recommendedGB
        ? `${config.ram.minGB} ГБ`
        : `от ${config.ram.minGB} ГБ (рекомендуется ${config.ram.recommendedGB} ГБ)`,
      detail: config.ram.explanation,
      tags: [
        `ECC: ${ECC_LABELS[config.ram.eccRecommendation]}`,
        'DDR3/4/5 — без разницы',
      ],
    },
    {
      label: 'Диски HDD',
      value: `${config.storage.driveCount}× от ${config.storage.minDriveSizeTB} ТБ`,
      detail: config.storage.explanation,
      tags: ['CMR', 'TLER/ERC', config.storage.driveClass.toUpperCase()],
    },
    ...(config.ssdCache ? [{
      label: 'SSD-кэш',
      value: `${config.ssdCache.count}× NVMe от ${config.ssdCache.minCapacityGB} ГБ`,
      detail: config.ssdCache.explanation,
      tags: ['TLC+', 'DRAM', `TBW ${config.ssdCache.minTBW}+`],
    }] : []),
    {
      label: 'RAID',
      value: config.storage.raidType.toUpperCase(),
      detail: config.storage.raidType === 'shr' ? 'Гибкий RAID, легко расширять'
        : config.storage.raidType === 'shr-2' ? 'Двойная избыточность для критичных данных'
          : config.storage.raidType === 'raid1' ? 'Зеркалирование для 2 дисков'
            : config.storage.raidType === 'raid10' ? 'Производительность + надёжность'
              : 'Оптимальный для конфигурации',
      tags: [] as string[],
    },
    {
      label: 'Сеть',
      value: SPEED_LABELS[config.network.recommendedSpeed],
      detail: config.network.explanation,
      tags: config.network.need10gbe ? ['PCIe NIC'] : [],
    },
    {
      label: 'Блок питания',
      value: `от ${config.psu.recommendedWatts} Вт, ${config.psu.efficiency}`,
      detail: config.psu.explanation,
      tags: [`~${formatWatts(config.estimatedPowerW)} потребление`],
    },
    {
      label: 'ИБП (UPS)',
      value: `от ${config.ups.minVA} ВА`,
      detail: config.ups.explanation,
      tags: ['Обязательно'],
    },
    {
      label: 'Корпус',
      value: `от ${config.formFactor.minBays35} отсеков 3.5", до ${config.formFactor.maxMbFormFactor.toUpperCase()}`,
      detail: config.formFactor.explanation,
      tags: [] as string[],
    },
  ];

  return (
    <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
      <div className="bg-accent/10 border-b border-border px-5 py-3">
        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
          </svg>
          Требования к железу
        </h3>
        <p className="text-xs text-text-muted mt-0.5">Абстрактные спецификации — выбирайте любого производителя</p>
      </div>

      <div className="divide-y divide-border">
        {rows.map((row, idx) => (
          <div key={idx} className="px-5 py-3 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
            <div className="text-sm text-text-muted min-w-[140px] shrink-0">{row.label}</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary">{row.value}</div>
              {row.detail && (
                <div className="text-xs text-text-muted mt-0.5">{row.detail}</div>
              )}
              {row.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {row.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent-light font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
