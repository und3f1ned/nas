import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWizardStore } from '../../store/wizard-store';
import { ProgressBar } from './ProgressBar';
import { StepUseCases } from './StepUseCases';
import { StepDetails } from './StepDetails';
import { StepNetwork } from './StepNetwork';
import { StepReliability } from './StepReliability';
import { StepFormFactor } from './StepFormFactor';
import { StepBudget } from './StepBudget';
import { Button } from '../ui/Button';
import { generateConfig } from '../../engine/configurator';
import type { WizardStep } from '../../types/wizard';

const STEP_COMPONENTS: Record<WizardStep, React.FC> = {
  use_cases: StepUseCases,
  details: StepDetails,
  network: StepNetwork,
  reliability: StepReliability,
  form_factor: StepFormFactor,
  budget: StepBudget,
};

export function WizardContainer() {
  const {
    currentStep,
    answers,
    goToStep,
    nextStep,
    prevStep,
    nextDetail,
    prevDetail,
    setResult,
  } = useWizardStore();

  const StepComponent = STEP_COMPONENTS[currentStep];
  const isFirst = currentStep === 'use_cases';
  const isLast = currentStep === 'budget';
  const isDetails = currentStep === 'details';

  const prevStepRef = useRef(currentStep);
  const direction = (() => {
    const steps: WizardStep[] = ['use_cases', 'details', 'network', 'reliability', 'form_factor', 'budget'];
    const prev = steps.indexOf(prevStepRef.current);
    const curr = steps.indexOf(currentStep);
    prevStepRef.current = currentStep;
    return curr >= prev ? 1 : -1;
  })();

  const completedSteps: WizardStep[] = [];
  const steps: WizardStep[] = ['use_cases', 'details', 'network', 'reliability', 'form_factor', 'budget'];
  const currentIdx = steps.indexOf(currentStep);
  steps.forEach((s, i) => {
    if (i < currentIdx) completedSteps.push(s);
  });

  const canProceed = () => {
    if (currentStep === 'use_cases') return answers.useCases.length > 0;
    return true;
  };

  const handleNext = () => {
    if (isLast) {
      const config = generateConfig(answers);
      setResult(config);
      return;
    }
    if (isDetails) {
      nextDetail();
    } else {
      nextStep();
    }
  };

  const handlePrev = () => {
    if (isDetails) {
      prevDetail();
    } else {
      prevStep();
    }
  };

  return (
    <div className="space-y-6">
      <ProgressBar
        currentStep={currentStep}
        onStepClick={goToStep}
        completedSteps={completedSteps}
      />

      <div className="relative overflow-x-hidden -mx-2 px-2 -my-1 py-1">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={currentStep + (isDetails ? `-${useWizardStore.getState().currentDetailIndex}` : '')}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40, position: 'absolute', top: 0, left: 0, right: 0 }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
          >
            <StepComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={handlePrev}
          disabled={isFirst}
        >
          ← Назад
        </Button>

        <Button
          variant="primary"
          onClick={handleNext}
          disabled={!canProceed()}
        >
          {isLast ? 'Рассчитать конфигурацию →' : 'Далее →'}
        </Button>
      </div>
    </div>
  );
}
