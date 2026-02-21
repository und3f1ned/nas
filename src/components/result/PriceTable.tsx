import type { PriceEstimate } from '../../types/config';
import { formatPrice } from '../../utils/formatters';

interface PriceTableProps {
  estimate: PriceEstimate;
}

function formatRange(min: number, max: number): string {
  if (min === max) return formatPrice(min);
  return `${formatPrice(min)} – ${formatPrice(max)}`;
}

export function PriceTable({ estimate }: PriceTableProps) {
  const rows = [
    { label: 'Железо (корпус + плата + CPU + RAM + БП)', range: estimate.hardware },
    ...(estimate.includeDisks
      ? [{ label: 'Диски HDD', range: estimate.drives }]
      : []),
    ...(estimate.ssdCache ? [{ label: 'SSD-кэш', range: estimate.ssdCache }] : []),
    { label: 'Доп. оборудование (ИБП, кабели)', range: estimate.accessories },
    { label: 'Сборка и настройка', range: { min: estimate.assembly, max: estimate.assembly } },
  ];

  return (
    <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-lg font-bold text-text-primary">Оценка стоимости</h3>
        <p className="text-xs text-text-muted mt-0.5">
          {estimate.includeDisks
            ? 'Диапазон цен без привязки к конкретным брендам'
            : 'Без дисков — диски не включены в расчёт'}
        </p>
      </div>

      <div className="divide-y divide-border">
        {rows.map((row, idx) => (
          <div key={idx} className="px-5 py-2.5 flex justify-between items-center">
            <span className="text-sm text-text-secondary">{row.label}</span>
            <span className="text-sm font-mono text-text-primary">{formatRange(row.range.min, row.range.max)}</span>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 bg-accent/10 border-t border-border flex justify-between items-center">
        <span className="text-base font-bold text-text-primary">
          ИТОГО{estimate.includeDisks ? '' : ' (без дисков)'}
        </span>
        <span className="text-lg font-bold font-mono text-accent-light">
          {formatRange(estimate.totalRange.min, estimate.totalRange.max)}
        </span>
      </div>
    </div>
  );
}
