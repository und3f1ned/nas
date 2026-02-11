import { motion } from 'framer-motion';
import { SERVICE_LIST } from '../../utils/constants';

export function ServicesList() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-lg font-bold text-text-primary">Что входит в услугу</h3>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SERVICE_LIST.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <svg
                className="w-4 h-4 text-success shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-text-secondary">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
