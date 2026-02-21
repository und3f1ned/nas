import { useState } from 'react';
import type { Insight } from '../../types/config';

interface InsightsSectionProps {
  insights: Insight[];
}

const SEVERITY_STYLES = {
  warning: 'border-warning/30 bg-warning/5',
  tip: 'border-accent/30 bg-accent/5',
  info: 'border-border bg-bg-input',
};

const SEVERITY_ICON_STYLES = {
  warning: 'text-warning',
  tip: 'text-accent-light',
  info: 'text-text-muted',
};

export function InsightsSection({ insights }: InsightsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (insights.length === 0) return null;

  return (
    <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-lg font-bold text-text-primary">Подводные камни и советы</h3>
        <p className="text-xs text-text-muted mt-0.5">Важные нюансы для вашей конфигурации</p>
      </div>

      <div className="p-4 space-y-2">
        {insights.map((insight) => {
          const isExpanded = expandedId === insight.id;
          return (
            <button
              key={insight.id}
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : insight.id)}
              className={`w-full text-left rounded-lg border p-3 transition-colors cursor-pointer ${SEVERITY_STYLES[insight.severity]}`}
            >
              <div className="flex items-start gap-2">
                <span className={`text-lg shrink-0 ${SEVERITY_ICON_STYLES[insight.severity]}`}>
                  {insight.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{insight.title}</span>
                    <svg
                      className={`w-3.5 h-3.5 text-text-muted transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {isExpanded && (
                    <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                      {insight.text}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
