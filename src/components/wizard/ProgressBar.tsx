import { motion } from 'framer-motion';
import { STEP_LABELS, WIZARD_STEPS, type WizardStep } from '../../types/wizard';

interface ProgressBarProps {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
  completedSteps: WizardStep[];
}

export function ProgressBar({ currentStep, onStepClick, completedSteps }: ProgressBarProps) {
  const currentIdx = WIZARD_STEPS.indexOf(currentStep);

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, idx) => {
          const isActive = step === currentStep;
          const isCompleted = completedSteps.includes(step) || idx < currentIdx;
          const isClickable = isCompleted || idx <= currentIdx;

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step)}
                className={`
                  flex flex-col items-center gap-1 transition-all duration-200
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isActive
                      ? '#3b82f6'
                      : isCompleted
                      ? '#22c55e'
                      : '#334155',
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                >
                  {isCompleted && !isActive ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </motion.div>
                <span
                  className={`text-xs hidden sm:block ${
                    isActive ? 'text-accent-light font-medium' : 'text-text-muted'
                  }`}
                >
                  {STEP_LABELS[step]}
                </span>
              </button>
              {idx < WIZARD_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded transition-colors duration-300 ${
                    idx < currentIdx ? 'bg-success' : 'bg-border'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
