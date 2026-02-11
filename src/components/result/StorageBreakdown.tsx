import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { StorageBreakdownResult } from '../../types/config';
import { formatTB, formatTiB } from '../../utils/formatters';

interface StorageBreakdownProps {
  breakdown: StorageBreakdownResult;
}

export function StorageBreakdown({ breakdown }: StorageBreakdownProps) {
  const chartData = [
    ...breakdown.allocations.map((a) => ({
      name: a.label,
      value: Number(a.sizeTB.toFixed(2)),
      color: a.color,
    })),
    ...(breakdown.freeTiB > 0
      ? [{ name: 'Свободно', value: Number((breakdown.freeTiB / 0.909).toFixed(2)), color: '#334155' }]
      : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-bg-card rounded-xl border border-border p-5"
    >
      <h3 className="text-lg font-bold text-text-primary mb-4">Расчёт хранилища</h3>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-full md:w-1/2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                }}
                formatter={(value: number) => formatTB(value)}
              />
              <Legend
                formatter={(value: string) => (
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full md:w-1/2 space-y-3">
          <div className="bg-bg-input rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">RAW объём</span>
              <span className="font-mono text-text-primary">{formatTB(breakdown.rawTB)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{breakdown.raidType.toUpperCase()} полезный</span>
              <span className="font-mono text-accent-light">{formatTiB(breakdown.usableTiB)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Диски</span>
              <span className="font-mono text-text-primary">
                {breakdown.driveCount}× {breakdown.driveSizeTB} ТБ
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            {breakdown.allocations.map((alloc, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: alloc.color }} />
                <span className="text-text-secondary flex-1">{alloc.label}</span>
                <span className="font-mono text-text-primary">{formatTB(alloc.sizeTB)}</span>
              </div>
            ))}
            {breakdown.freeTiB > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-sm shrink-0 bg-border" />
                <span className="text-text-secondary flex-1">Свободно</span>
                <span className="font-mono text-success">{formatTiB(breakdown.freeTiB)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
