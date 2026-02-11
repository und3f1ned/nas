import { motion } from 'framer-motion';
import type { NASConfig } from '../../types/config';
import { formatWatts } from '../../utils/formatters';

interface ConfigCardProps {
  config: NASConfig;
}

export function ConfigCard({ config }: ConfigCardProps) {
  const rows = [
    { label: 'Корпус', value: config.case.name, detail: `${config.case.bays_35} × 3.5" HDD` },
    { label: 'Плата / CPU', value: config.motherboard.name, detail: config.explanations.cpu },
    { label: 'Оперативная память', value: config.ramModules, detail: config.explanations.ram },
    {
      label: 'Диски HDD',
      value: `${config.storageBreakdown.driveCount}× ${config.drives[0]?.name || 'N/A'}`,
      detail: config.explanations.drives,
    },
    ...(config.ssdCache.length > 0
      ? [{
          label: 'SSD кэш',
          value: `${config.ssdCache.length}× ${config.ssdCache[0].name}`,
          detail: 'Кэш чтения/записи для ускорения операций',
        }]
      : []),
    {
      label: 'RAID',
      value: config.raidType.toUpperCase(),
      detail: config.explanations.raid,
    },
    {
      label: 'Сеть',
      value: `${config.motherboard.eth_10g > 0 ? `${config.motherboard.eth_10g}× 10GbE` : ''} ${config.motherboard.eth_1g > 0 ? `${config.motherboard.eth_1g}× 1GbE` : ''}`.trim(),
      detail: '',
    },
    { label: 'Блок питания', value: `${config.psuWatts}W 80+ Gold`, detail: `Потребление: ~${formatWatts(config.totalPowerW)}` },
    ...(config.ups
      ? [{ label: 'ИБП (UPS)', value: config.ups, detail: 'Защита от отключений питания' }]
      : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="bg-accent/10 border-b border-border px-5 py-3">
        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
          </svg>
          Ваша конфигурация NAS на Xpenology
        </h3>
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
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
