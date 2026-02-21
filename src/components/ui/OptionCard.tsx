import { motion } from 'framer-motion';

interface OptionCardProps {
  icon: string;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
}

export function OptionCard({
  icon,
  label,
  description,
  selected,
  onClick,
  compact = false,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex ${compact ? 'flex-row items-center gap-3 p-3' : 'flex-col items-center gap-2 p-5'}
        rounded-xl border-2 transition-all duration-200 cursor-pointer text-left w-full
        ${selected
          ? 'border-accent bg-accent/10 shadow-lg shadow-accent/10'
          : 'border-border bg-bg-card hover:border-border-active hover:bg-bg-card-hover'}
        active:brightness-90
      `}
    >
      <span className={compact ? 'text-2xl' : 'text-4xl'}>{icon}</span>
      <div className={compact ? '' : 'text-center'}>
        <div className={`font-medium text-text-primary ${compact ? 'text-sm' : 'text-base'}`}>
          {label}
        </div>
        {description && (
          <div className="text-xs text-text-muted mt-0.5">{description}</div>
        )}
      </div>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center"
        >
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </button>
  );
}
