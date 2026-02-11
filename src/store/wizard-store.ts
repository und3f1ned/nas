import { create } from 'zustand';
import type {
  UseCase,
  WizardStep,
  WizardAnswers,
  FileStorageAnswers,
  MediaAnswers,
  SurveillanceAnswers,
  DockerAnswers,
  VMAnswers,
  BackupAnswers,
  BusinessAnswers,
  NetworkAnswers,
  ReliabilityAnswers,
  FormFactorAnswers,
  BudgetAnswers,
  WIZARD_STEPS,
} from '../types/wizard';
import type { NASConfig } from '../types/config';

interface WizardState {
  // Current step
  currentStep: WizardStep;
  currentDetailIndex: number; // for substeps in "details" step

  // Answers
  answers: WizardAnswers;

  // Result
  result: NASConfig | null;
  showResult: boolean;

  // Navigation
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  nextDetail: () => void;
  prevDetail: () => void;

  // Setters
  setUseCases: (useCases: UseCase[]) => void;
  setFileStorage: (data: FileStorageAnswers) => void;
  setMedia: (data: MediaAnswers) => void;
  setSurveillance: (data: SurveillanceAnswers) => void;
  setDocker: (data: DockerAnswers) => void;
  setVM: (data: VMAnswers) => void;
  setBackup: (data: BackupAnswers) => void;
  setBusiness: (data: BusinessAnswers) => void;
  setNetwork: (data: NetworkAnswers) => void;
  setReliability: (data: ReliabilityAnswers) => void;
  setFormFactor: (data: FormFactorAnswers) => void;
  setBudget: (data: BudgetAnswers) => void;

  // Result
  setResult: (result: NASConfig) => void;
  setShowResult: (show: boolean) => void;

  // Reset
  reset: () => void;
}

const STEPS: WizardStep[] = ['use_cases', 'details', 'network', 'reliability', 'form_factor', 'budget'];

const defaultAnswers: WizardAnswers = {
  useCases: [],
  network: {
    currentSpeed: '1gbe',
    needUpgrade: false,
    remoteAccess: 'tailscale',
  },
  reliability: {
    raidType: 'auto',
    ssdCache: false,
    criticality: 'medium',
  },
  formFactor: {
    placement: 'home',
    noiseLevel: 'quiet',
    bayCount: 'auto',
    needUps: false,
  },
  budget: {
    includeDisks: true,
    range: '30-60',
    usedEquipment: false,
  },
};

export const useWizardStore = create<WizardState>((set, get) => ({
  currentStep: 'use_cases',
  currentDetailIndex: 0,
  answers: { ...defaultAnswers },
  result: null,
  showResult: false,

  goToStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const { currentStep } = get();
    const idx = STEPS.indexOf(currentStep);
    if (idx < STEPS.length - 1) {
      set({ currentStep: STEPS[idx + 1], currentDetailIndex: 0 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    const idx = STEPS.indexOf(currentStep);
    if (idx > 0) {
      set({ currentStep: STEPS[idx - 1], currentDetailIndex: 0 });
    }
  },

  nextDetail: () => {
    const { currentDetailIndex, answers } = get();
    if (currentDetailIndex < answers.useCases.length - 1) {
      set({ currentDetailIndex: currentDetailIndex + 1 });
    } else {
      get().nextStep();
    }
  },

  prevDetail: () => {
    const { currentDetailIndex } = get();
    if (currentDetailIndex > 0) {
      set({ currentDetailIndex: currentDetailIndex - 1 });
    } else {
      get().prevStep();
    }
  },

  setUseCases: (useCases) =>
    set((state) => ({ answers: { ...state.answers, useCases } })),

  setFileStorage: (data) =>
    set((state) => ({ answers: { ...state.answers, fileStorage: data } })),

  setMedia: (data) =>
    set((state) => ({ answers: { ...state.answers, media: data } })),

  setSurveillance: (data) =>
    set((state) => ({ answers: { ...state.answers, surveillance: data } })),

  setDocker: (data) =>
    set((state) => ({ answers: { ...state.answers, docker: data } })),

  setVM: (data) =>
    set((state) => ({ answers: { ...state.answers, vm: data } })),

  setBackup: (data) =>
    set((state) => ({ answers: { ...state.answers, backup: data } })),

  setBusiness: (data) =>
    set((state) => ({ answers: { ...state.answers, business: data } })),

  setNetwork: (data) =>
    set((state) => ({ answers: { ...state.answers, network: data } })),

  setReliability: (data) =>
    set((state) => ({ answers: { ...state.answers, reliability: data } })),

  setFormFactor: (data) =>
    set((state) => ({ answers: { ...state.answers, formFactor: data } })),

  setBudget: (data) =>
    set((state) => ({ answers: { ...state.answers, budget: data } })),

  setResult: (result) => set({ result, showResult: true }),
  setShowResult: (show) => set({ showResult: show }),

  reset: () =>
    set({
      currentStep: 'use_cases',
      currentDetailIndex: 0,
      answers: { ...defaultAnswers },
      result: null,
      showResult: false,
    }),
}));
