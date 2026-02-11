import { motion } from 'framer-motion';
import type { PriceBreakdown } from '../../types/config';
import { formatPrice } from '../../utils/formatters';

interface PriceTableProps {
  breakdown: PriceBreakdown;
}

export function PriceTable({ breakdown }: PriceTableProps) {
  const rows = [
    { label: 'Железо (корпус + плата + RAM + БП)', value: breakdown.hardware },
    { label: 'Диски HDD', value: breakdown.drives },
    ...(breakdown.ssdCache > 0 ? [{ label: 'SSD-кэш', value: breakdown.ssdCache }] : []),
    { label: 'Доп. оборудование (UPS, кабели)', value: breakdown.accessories },
    { label: 'Сборка и настройка', value: breakdown.assembly },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-lg font-bold text-text-primary">Стоимость</h3>
      </div>

      <div className="divide-y divide-border">
        {rows.map((row, idx) => (
          <div key={idx} className="px-5 py-2.5 flex justify-between items-center">
            <span className="text-sm text-text-secondary">{row.label}</span>
            <span className="text-sm font-mono text-text-primary">{formatPrice(row.value)}</span>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 bg-accent/10 border-t border-border flex justify-between items-center">
        <span className="text-base font-bold text-text-primary">ИТОГО</span>
        <span className="text-lg font-bold font-mono text-accent-light">
          {formatPrice(breakdown.total)}
        </span>
      </div>
    </motion.div>
  );
}
