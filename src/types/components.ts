// Types for hardware components from the JSON catalog

export interface NASCase {
  id: string;
  name: string;
  bays_35: number;
  bays_25: number;
  form_factor: 'compact' | 'standard' | 'rack-4u';
  max_mb: 'mini-itx' | 'mini-dtx' | 'atx';
  noise_level: 'low' | 'medium' | 'high';
  price_rub: number;
  available: boolean;
}

export interface Motherboard {
  id: string;
  name: string;
  cpu: string;
  cpu_score: number;
  igpu: boolean;
  quicksync: boolean;
  sata_ports: number;
  m2_slots: number;
  max_ram_gb: number;
  ram_type: string;
  ram_slots: number;
  eth_1g: number;
  eth_10g: number;
  form_factor: 'mini-itx' | 'mini-dtx' | 'atx';
  tdp_w: number;
  price_rub: number;
  xpenology_compat: 'confirmed' | 'experimental' | 'unknown';
}

export interface DriveHDD {
  id: string;
  name: string;
  capacity_tb: number;
  type: 'nas' | 'surveillance' | 'enterprise';
  rpm: number;
  power_w: number;
  price_rub: number;
}

export interface DriveSSD {
  id: string;
  name: string;
  capacity_tb: number;
  interface: 'nvme' | 'sata';
  power_w: number;
  price_rub: number;
}

export interface SynologyModel {
  model: string;
  bays: number;
  cpu: string;
  ram_gb: number;
  max_ram_gb: number;
  max_cameras: number;
  network: string;
  price_rub: number;
  has_10gbe?: boolean;
  notes?: string;
}

export interface ComponentsCatalog {
  cases: NASCase[];
  motherboards: Motherboard[];
  drives_hdd: DriveHDD[];
  drives_ssd: DriveSSD[];
  synology_models: SynologyModel[];
}
