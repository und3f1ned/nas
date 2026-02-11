import { motion } from 'framer-motion';
import type { SynologyComparison as SynologyComparisonType } from '../../types/config';
import { formatPrice } from '../../utils/formatters';

interface SynologyComparisonProps {
  comparison: SynologyComparisonType;
}

export function SynologyComparison({ comparison }: SynologyComparisonProps) {
  const savingsPositive = comparison.savings > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-lg font-bold text-text-primary">Сравнение с Synology</h3>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Synology column */}
          <div className="bg-bg-input rounded-lg p-4 space-y-2">
            <div className="text-sm font-medium text-text-primary">
              Synology {comparison.model.model}
            </div>
            <div className="text-xs text-text-muted">
              {comparison.model.bays} слотов, {comparison.model.cpu}, {comparison.model.ram_gb} ГБ RAM
            </div>
            <div className="space-y-1 pt-2 border-t border-border">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">NAS</span>
                <span className="font-mono">{formatPrice(comparison.model.price_rub)}</span>
              </div>
              {comparison.licenseCost > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Лицензии SS</span>
                  <span className="font-mono text-warning">{formatPrice(comparison.licenseCost)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold pt-1 border-t border-border">
                <span>Итого (без дисков)</span>
                <span className="font-mono">{formatPrice(comparison.synologyTotal - comparison.xpenologyTotal + comparison.savings + comparison.model.price_rub + comparison.licenseCost - comparison.model.price_rub - comparison.licenseCost)}</span>
              </div>
            </div>
            <div className="text-xs font-bold pt-1">
              <div className="flex justify-between">
                <span>Итого Synology</span>
                <span className="font-mono">{formatPrice(comparison.synologyTotal)}</span>
              </div>
            </div>
          </div>

          {/* Xpenology column */}
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 space-y-2">
            <div className="text-sm font-medium text-accent-light">
              Xpenology (кастомная сборка)
            </div>
            <div className="text-xs text-text-muted">
              Полный контроль, без ограничений
            </div>
            <div className="pt-2 border-t border-accent/20">
              <div className="flex justify-between text-xs font-bold">
                <span>Итого Xpenology</span>
                <span className="font-mono text-accent-light">{formatPrice(comparison.xpenologyTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {savingsPositive && (
          <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-center">
            <span className="text-success font-bold text-lg">
              Экономия: {formatPrice(comparison.savings)}
            </span>
            <p className="text-xs text-success/70 mt-1">
              + безлимит камер + больше RAM + полный контроль
            </p>
          </div>
        )}

        {comparison.limitations.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-text-muted mb-1">Ограничения Synology:</div>
            {comparison.limitations.map((lim, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-warning">
                <span className="shrink-0">⚠️</span>
                <span>{lim}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
