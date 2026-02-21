// Types for wizard steps and answers

export type UseCase = 'file_storage' | 'media' | 'surveillance' | 'docker' | 'vm' | 'backup' | 'business';

export type Resolution = '1080p' | '2k' | '4k';
export type Codec = 'h264' | 'h265' | 'h265plus';
export type TranscodingLevel = 'none' | '1080p' | '4k';
export type RaidType = 'auto' | 'shr' | 'shr-2' | 'raid1' | 'raid5' | 'raid6' | 'raid10';
export type NetworkSpeed = '100mbps' | '1gbe' | '2.5gbe' | '10gbe';
export type RemoteAccess = 'quickconnect' | 'vpn' | 'tailscale' | 'none';
export type Placement = 'home' | 'server_room' | 'rack';
export type NoiseLevel = 'quiet' | 'normal';
export type DataCriticality = 'low' | 'medium' | 'high' | 'mission_critical';
export type BudgetRange = '15-30' | '30-60' | '60-120' | '120+';
export type BayCount = 2 | 4 | 6 | 8 | 12 | 'auto';

export interface FileStorageAnswers {
  currentDataTB: number;
  growthPercent: number;
}

export interface MediaAnswers {
  libraryTB: number;
  transcoding: TranscodingLevel;
  streams: number;
  engine: 'plex' | 'jellyfin' | 'emby';
}

export interface SurveillanceAnswers {
  cameras: number;
  resolution: Resolution;
  fps: number;
  codec: Codec;
  storageDays: number;
  motionOnly: boolean;
}

export interface DockerAnswers {
  containerRange: '1-5' | '5-15' | '15+';
  heavyServices: string[];
}

export interface VMAnswers {
  count: number;
  purpose: 'dev' | 'production';
}

export interface BackupAnswers {
  deviceRange: '1-3' | '3-10' | '10+';
  deviceTypes: string[];
  cloudBackup: string | null;
}

export interface BusinessAnswers {
  users: number;
  synologyDrive: boolean;
  activeDirectory: boolean;
}

export interface NetworkAnswers {
  currentSpeed: NetworkSpeed;
  needUpgrade: boolean;
  remoteAccess: RemoteAccess;
}

export interface ReliabilityAnswers {
  raidType: RaidType;
  ssdCache: boolean;
  criticality: DataCriticality;
}

export interface FormFactorAnswers {
  placement: Placement;
  noiseLevel: NoiseLevel;
  bayCount: BayCount;
}

export interface BudgetAnswers {
  includeDisks: boolean;
  range: BudgetRange;
  usedEquipment: boolean;
}

export interface WizardAnswers {
  useCases: UseCase[];
  fileStorage?: FileStorageAnswers;
  media?: MediaAnswers;
  surveillance?: SurveillanceAnswers;
  docker?: DockerAnswers;
  vm?: VMAnswers;
  backup?: BackupAnswers;
  business?: BusinessAnswers;
  network: NetworkAnswers;
  reliability: ReliabilityAnswers;
  formFactor: FormFactorAnswers;
  budget: BudgetAnswers;
}

export type WizardStep = 'use_cases' | 'details' | 'network' | 'reliability' | 'form_factor' | 'budget';

export const WIZARD_STEPS: WizardStep[] = ['use_cases', 'details', 'network', 'reliability', 'form_factor', 'budget'];

export const STEP_LABELS: Record<WizardStep, string> = {
  use_cases: 'Назначение',
  details: 'Детали',
  network: 'Сеть',
  reliability: 'Надёжность',
  form_factor: 'Форм-фактор',
  budget: 'Бюджет',
};
