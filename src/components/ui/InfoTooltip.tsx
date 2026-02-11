import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoTooltipProps {
  text: string;
  children?: React.ReactNode;
}

export function InfoTooltip({ text, children }: InfoTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      {children}
      <button
        type="button"
        className="ml-1 w-4 h-4 rounded-full bg-border text-text-muted text-xs flex items-center justify-center hover:bg-accent hover:text-white transition-colors cursor-help"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      >
        ?
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-0 mb-2 p-3 bg-bg-secondary border border-border rounded-lg shadow-xl text-xs text-text-secondary max-w-xs z-50"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
