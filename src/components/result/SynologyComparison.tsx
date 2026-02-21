import type { SynologyComparison as SynologyComparisonType } from '../../engine/synology-comparison';

interface Props {
  comparison: SynologyComparisonType;
}

function formatPrice(n: number): string {
  return n.toLocaleString('ru-RU');
}

const severityStyles = {
  critical: 'border-danger/30 bg-danger/5',
  warning: 'border-warning/30 bg-warning/5',
  info: 'border-border bg-bg-card',
};

const severityLabels = {
  critical: 'text-danger',
  warning: 'text-warning',
  info: 'text-text-secondary',
};

export function SynologyComparison({ comparison }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-text-primary">
          А может Synology {comparison.closestModel}?
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          Ближайший по характеристикам готовый NAS — и почему он хуже
        </p>
      </div>

      {/* Price comparison bar */}
      <div className="bg-bg-card rounded-xl p-4 border border-border">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-text-secondary">Цена сравнения (без дисков)</span>
          {comparison.savingsPercent > 0 && (
            <span className="text-sm font-bold text-success">
              Экономия ~{comparison.savingsPercent}%
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted w-24 shrink-0">Кастомный NAS</span>
            <div className="flex-1 bg-bg-primary rounded-full h-6 overflow-hidden">
              <div
                className="h-full bg-success/70 rounded-full flex items-center px-2"
                style={{ width: `${Math.min(100, (comparison.customPriceRub.max / comparison.synologyPriceRub.max) * 100)}%` }}
              >
                <span className="text-[10px] text-white font-medium whitespace-nowrap">
                  {formatPrice(comparison.customPriceRub.min)} – {formatPrice(comparison.customPriceRub.max)} ₽
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted w-24 shrink-0">Synology {comparison.closestModel}</span>
            <div className="flex-1 bg-bg-primary rounded-full h-6 overflow-hidden">
              <div
                className="h-full bg-danger/70 rounded-full flex items-center px-2"
                style={{ width: '100%' }}
              >
                <span className="text-[10px] text-white font-medium whitespace-nowrap">
                  {formatPrice(comparison.synologyPriceRub.min)} – {formatPrice(comparison.synologyPriceRub.max)} ₽
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-text-muted mt-2">
          * Цена Synology в России: серый импорт, без гарантии. Цена кастомного NAS включает сборку.
        </p>
      </div>

      {/* Problems list */}
      <div className="space-y-3">
        {comparison.problems.map((problem, i) => (
          <div
            key={i}
            className={`rounded-lg p-3 border ${severityStyles[problem.severity]}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg shrink-0">{problem.icon}</span>
              <div>
                <h4 className={`text-sm font-semibold ${severityLabels[problem.severity]}`}>
                  {problem.title}
                </h4>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  {problem.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
