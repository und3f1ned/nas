import { describe, it, expect } from 'vitest';
import { generateConfig } from '../configurator';
import type { WizardAnswers, UseCase } from '../../types/wizard';
import type { NASConfig } from '../../types/config';

// ─── Default answer templates ───

const baseAnswers: WizardAnswers = {
  useCases: [],
  network: { currentSpeed: '1gbe', needUpgrade: false, remoteAccess: 'tailscale' },
  reliability: { raidType: 'auto', ssdCache: false, criticality: 'medium' },
  formFactor: { placement: 'home', noiseLevel: 'quiet', bayCount: 'auto' },
  budget: { includeDisks: true, range: '30-60', usedEquipment: false },
};

function makeAnswers(overrides: Partial<WizardAnswers> & { useCases: UseCase[] }): WizardAnswers {
  return { ...baseAnswers, ...overrides };
}

// ─── Validation helpers ───

function assertValidConfig(config: NASConfig, label: string) {
  // CPU sanity
  expect(config.cpu.minCores, `${label}: CPU cores`).toBeGreaterThanOrEqual(2);
  expect(config.cpu.minThreads, `${label}: CPU threads`).toBeGreaterThanOrEqual(config.cpu.minCores);
  expect(config.cpu.tdpRange[0], `${label}: TDP min`).toBeLessThanOrEqual(config.cpu.tdpRange[1]);

  // RAM sanity
  expect(config.ram.minGB, `${label}: RAM min`).toBeGreaterThanOrEqual(4);
  expect(config.ram.recommendedGB, `${label}: RAM recommended`).toBeGreaterThanOrEqual(config.ram.minGB);
  const validRamSizes = [4, 8, 16, 32, 64];
  expect(validRamSizes, `${label}: RAM min is standard size`).toContain(config.ram.minGB);

  // Storage sanity
  expect(config.storage.driveCount, `${label}: drive count`).toBeGreaterThanOrEqual(1);
  expect(config.storage.minDriveSizeTB, `${label}: drive size`).toBeGreaterThanOrEqual(4);
  expect(config.storage.cmrRequired, `${label}: CMR required`).toBe(true);
  expect(config.storage.tlerRequired, `${label}: TLER required`).toBe(true);

  // RAID sanity: enough drives for the chosen RAID
  const raidMinDrives: Record<string, number> = {
    jbod: 1, raid0: 1, raid1: 2, shr: 3, raid5: 3, 'shr-2': 4, raid6: 4, raid10: 4,
  };
  const minForRaid = raidMinDrives[config.storage.raidType] || 1;
  expect(config.storage.driveCount, `${label}: enough drives for ${config.storage.raidType}`)
    .toBeGreaterThanOrEqual(minForRaid);

  // Storage breakdown
  expect(config.storageBreakdown.rawTB, `${label}: rawTB`).toBeGreaterThan(0);
  expect(config.storageBreakdown.usableTiB, `${label}: usableTiB`).toBeGreaterThan(0);
  expect(config.storageBreakdown.usableTiB, `${label}: usable < raw`).toBeLessThan(config.storageBreakdown.rawTB);

  // PSU sanity
  expect(config.psu.recommendedWatts, `${label}: PSU watts`).toBeGreaterThanOrEqual(200);
  expect(config.psu.minWatts, `${label}: PSU min < recommended`).toBeLessThanOrEqual(config.psu.recommendedWatts);

  // UPS is ALWAYS present (mandatory)
  expect(config.ups, `${label}: UPS exists`).toBeDefined();
  expect(config.ups.minVA, `${label}: UPS minVA`).toBeGreaterThanOrEqual(400);

  // Form factor
  expect(config.formFactor.minBays35, `${label}: form factor bays`).toBeGreaterThanOrEqual(config.storage.driveCount);

  // Price estimate
  expect(config.priceEstimate.totalRange.min, `${label}: price min`).toBeGreaterThan(0);
  expect(config.priceEstimate.totalRange.max, `${label}: price max`).toBeGreaterThan(config.priceEstimate.totalRange.min);
  expect(config.priceEstimate.hardware.min, `${label}: hardware price`).toBeGreaterThan(0);
  expect(config.priceEstimate.drives.min, `${label}: drives price`).toBeGreaterThan(0);

  // Power
  expect(config.estimatedPowerW, `${label}: power watts`).toBeGreaterThan(0);
  expect(config.estimatedPowerW, `${label}: power reasonable`).toBeLessThan(500);

  // Insights always present
  expect(config.insights.length, `${label}: has insights`).toBeGreaterThan(0);
}

// ─── Single use case scenarios ───

describe('Single use case configs', () => {
  it('file_storage — basic home NAS', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 2, growthPercent: 25 },
    }));

    assertValidConfig(config, 'file_storage basic');
    expect(config.cpu.tier).toBe('basic');
    expect(config.ram.minGB).toBeLessThanOrEqual(8);
    expect(config.transcoding).toBeNull();
    expect(config.ai).toBeNull();
  });

  it('file_storage — large archive (20TB)', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 20, growthPercent: 50 },
    }));

    assertValidConfig(config, 'file_storage large');
    expect(config.storage.driveCount).toBeGreaterThanOrEqual(3);
    // 20TB * 1.5 growth = 30TB needed — should have decent drive count
    expect(config.storage.minDriveSizeTB).toBeGreaterThanOrEqual(8);
  });

  it('media — 1080p transcoding', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['media'],
      media: { libraryTB: 4, transcoding: '1080p', streams: 2, engine: 'plex' },
    }));

    assertValidConfig(config, 'media 1080p');
    expect(config.cpu.needsQuickSync).toBe(true);
    expect(config.transcoding).not.toBeNull();
    expect(config.transcoding!.method).toBe('quicksync');
  });

  it('media — 4K HDR transcoding', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['media'],
      media: { libraryTB: 10, transcoding: '4k', streams: 3, engine: 'jellyfin' },
    }));

    assertValidConfig(config, 'media 4k');
    expect(config.cpu.needsQuickSync).toBe(true);
    expect(config.cpu.minQuickSyncGen).toContain('Kaby Lake');
    expect(config.transcoding!.minCodecSupport).toContain('hevc_10bit');
    // 4K + 3 streams should push CPU above basic
    expect(['mid', 'heavy', 'server']).toContain(config.cpu.tier);
  });

  it('media — no transcoding (direct play)', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['media'],
      media: { libraryTB: 8, transcoding: 'none', streams: 1, engine: 'plex' },
    }));

    assertValidConfig(config, 'media direct');
    expect(config.cpu.needsQuickSync).toBe(false);
    expect(config.transcoding).toBeNull();
  });

  it('surveillance — small (4 cameras 1080p)', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['surveillance'],
      surveillance: { cameras: 4, resolution: '1080p', fps: 25, codec: 'h265', storageDays: 14, motionOnly: false },
    }));

    assertValidConfig(config, 'surveillance small');
    expect(config.storage.driveClass).toBe('surveillance');
    expect(config.ai).toBeNull(); // <5 cameras, no Frigate
  });

  it('surveillance — large (16 cameras 4K)', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['surveillance'],
      surveillance: { cameras: 16, resolution: '4k', fps: 25, codec: 'h264', storageDays: 30, motionOnly: false },
    }));

    assertValidConfig(config, 'surveillance large');
    expect(config.storage.driveClass).toBe('surveillance');
    expect(config.ai).not.toBeNull();
    // 16 cameras * 4K * h264 * 30 days = massive storage
    expect(config.storage.driveCount).toBeGreaterThanOrEqual(4);
  });

  it('docker — light (1-5 containers)', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['docker'],
      docker: { containerRange: '1-5', heavyServices: [] },
    }));

    assertValidConfig(config, 'docker light');
    expect(config.cpu.tier).toBe('basic');
  });

  it('docker — heavy (15+ containers, heavy services)', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['docker'],
      docker: { containerRange: '15+', heavyServices: ['nextcloud', 'gitlab', 'frigate', 'homeassistant'] },
    }));

    assertValidConfig(config, 'docker heavy');
    expect(['mid', 'heavy', 'server']).toContain(config.cpu.tier);
    expect(config.ram.minGB).toBeGreaterThanOrEqual(8);
    expect(config.ai).not.toBeNull(); // frigate present
  });

  it('docker — with Frigate for AI', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['docker'],
      docker: { containerRange: '5-15', heavyServices: ['frigate'] },
    }));

    assertValidConfig(config, 'docker frigate');
    expect(config.ai).not.toBeNull();
    expect(config.ai!.useCases).toContain('Frigate NVR — детекция объектов');
  });

  it('vm — 1-2 VMs dev', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['vm'],
      vm: { count: 2, purpose: 'dev' },
    }));

    assertValidConfig(config, 'vm small');
    expect(config.ram.minGB).toBeGreaterThanOrEqual(8); // 4 base + 2*4 = 12 → 16
  });

  it('vm — 5 VMs production', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['vm'],
      vm: { count: 5, purpose: 'production' },
    }));

    assertValidConfig(config, 'vm large');
    expect(config.ram.minGB).toBeGreaterThanOrEqual(16); // 4 + 5*4 = 24 → 32
    expect(['heavy', 'server']).toContain(config.cpu.tier);
  });

  it('backup — small (1-3 devices)', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['backup'],
      backup: { deviceRange: '1-3', deviceTypes: ['mac', 'pc'], cloudBackup: null },
    }));

    assertValidConfig(config, 'backup small');
    expect(config.cpu.tier).toBe('basic');
  });

  it('backup — large (10+ devices)', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['backup'],
      backup: { deviceRange: '10+', deviceTypes: ['mac', 'pc', 'phone'], cloudBackup: 'b2' },
    }));

    assertValidConfig(config, 'backup large');
    expect(config.storage.minDriveSizeTB).toBeGreaterThanOrEqual(4);
  });

  it('business — small office (5 users)', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['business'],
      business: { users: 5, synologyDrive: true, activeDirectory: false },
    }));

    assertValidConfig(config, 'business small');
    expect(config.storage.driveClass).not.toBe('surveillance');
  });

  it('business — large office (25 users)', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['business'],
      business: { users: 25, synologyDrive: true, activeDirectory: true },
    }));

    assertValidConfig(config, 'business large');
    expect(config.storage.driveClass).toBe('enterprise');
    expect(config.ram.eccRecommendation).toBe('strongly_recommended');
    expect(['heavy', 'server']).toContain(config.cpu.tier);
  });
});

// ─── Multi-use-case combos ───

describe('Multi-use-case combinations', () => {
  it('file_storage + media — home media server', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage', 'media'],
      fileStorage: { currentDataTB: 5, growthPercent: 25 },
      media: { libraryTB: 8, transcoding: '4k', streams: 2, engine: 'plex' },
    }));

    assertValidConfig(config, 'files+media');
    expect(config.cpu.needsQuickSync).toBe(true);
    // Combined storage: 5*1.25 + 8 = 14.25 TB — should handle
    expect(config.storageBreakdown.allocations.length).toBeGreaterThanOrEqual(2);
  });

  it('file_storage + backup + docker — home power user', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage', 'backup', 'docker'],
      fileStorage: { currentDataTB: 4, growthPercent: 30 },
      backup: { deviceRange: '3-10', deviceTypes: ['mac', 'pc'], cloudBackup: null },
      docker: { containerRange: '5-15', heavyServices: ['nextcloud'] },
    }));

    assertValidConfig(config, 'files+backup+docker');
    expect(config.storageBreakdown.allocations.length).toBeGreaterThanOrEqual(3);
  });

  it('media + surveillance — home with cameras', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['media', 'surveillance'],
      media: { libraryTB: 4, transcoding: '1080p', streams: 2, engine: 'jellyfin' },
      surveillance: { cameras: 8, resolution: '2k', fps: 15, codec: 'h265', storageDays: 14, motionOnly: true },
    }));

    assertValidConfig(config, 'media+surveillance');
    expect(config.storage.driveClass).toBe('surveillance');
    expect(config.cpu.needsQuickSync).toBe(true);
  });

  it('docker + vm + business — enterprise powerhouse', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['docker', 'vm', 'business'],
      docker: { containerRange: '15+', heavyServices: ['nextcloud', 'gitlab', 'homeassistant'] },
      vm: { count: 3, purpose: 'production' },
      business: { users: 20, synologyDrive: true, activeDirectory: true },
    }));

    assertValidConfig(config, 'docker+vm+business');
    expect(config.cpu.tier).toBe('server');
    expect(config.ram.minGB).toBeGreaterThanOrEqual(16);
    expect(config.ram.eccRecommendation).toBe('strongly_recommended');
    expect(config.storage.driveClass).toBe('enterprise');
  });

  it('ALL use cases combined — maximum load', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage', 'media', 'surveillance', 'docker', 'vm', 'backup', 'business'],
      fileStorage: { currentDataTB: 10, growthPercent: 50 },
      media: { libraryTB: 20, transcoding: '4k', streams: 4, engine: 'jellyfin' },
      surveillance: { cameras: 16, resolution: '4k', fps: 25, codec: 'h265', storageDays: 30, motionOnly: false },
      docker: { containerRange: '15+', heavyServices: ['nextcloud', 'gitlab', 'frigate', 'homeassistant'] },
      vm: { count: 5, purpose: 'production' },
      backup: { deviceRange: '10+', deviceTypes: ['mac', 'pc', 'phone'], cloudBackup: 'b2' },
      business: { users: 30, synologyDrive: true, activeDirectory: true },
    }));

    assertValidConfig(config, 'ALL use cases');
    expect(config.cpu.tier).toBe('server');
    expect(config.ram.minGB).toBeGreaterThanOrEqual(32);
    expect(config.ai).not.toBeNull();
    expect(config.transcoding).not.toBeNull();
    expect(config.storageBreakdown.allocations.length).toBeGreaterThanOrEqual(6);
  });

  it('file_storage + surveillance + business — office with CCTV', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage', 'surveillance', 'business'],
      fileStorage: { currentDataTB: 5, growthPercent: 25 },
      surveillance: { cameras: 8, resolution: '2k', fps: 25, codec: 'h265plus', storageDays: 30, motionOnly: false },
      business: { users: 10, synologyDrive: true, activeDirectory: false },
    }));

    assertValidConfig(config, 'files+surveillance+business');
    expect(config.storage.driveClass).toBe('surveillance');
  });

  it('media + docker — selfhosted media stack', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['media', 'docker'],
      media: { libraryTB: 15, transcoding: '4k', streams: 3, engine: 'jellyfin' },
      docker: { containerRange: '5-15', heavyServices: ['nextcloud'] },
    }));

    assertValidConfig(config, 'media+docker');
    expect(config.cpu.needsQuickSync).toBe(true);
    expect(['mid', 'heavy']).toContain(config.cpu.tier);
  });
});

// ─── Network variations ───

describe('Network settings', () => {
  it('10GbE upgrade requested', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 4, growthPercent: 25 },
      network: { currentSpeed: '1gbe', needUpgrade: true, remoteAccess: 'tailscale' },
    }));

    assertValidConfig(config, 'network 10gbe');
    expect(config.network.recommendedSpeed).toBe('10gbe');
    expect(config.network.need10gbe).toBe(true);
  });

  it('already on 10GbE', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 4, growthPercent: 25 },
      network: { currentSpeed: '10gbe', needUpgrade: false, remoteAccess: 'vpn' },
    }));

    assertValidConfig(config, 'network existing 10gbe');
    expect(config.network.recommendedSpeed).toBe('10gbe');
  });

  it('100mbps legacy', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 2, growthPercent: 10 },
      network: { currentSpeed: '100mbps', needUpgrade: false, remoteAccess: 'none' },
    }));

    assertValidConfig(config, 'network 100mbps');
    expect(config.network.recommendedSpeed).toBe('1gbe');
  });

  it('VM use case triggers 10GbE recommendation', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['vm'],
      vm: { count: 2, purpose: 'dev' },
      network: { currentSpeed: '1gbe', needUpgrade: false, remoteAccess: 'tailscale' },
    }));

    assertValidConfig(config, 'network vm');
    expect(config.network.recommendedSpeed).toBe('10gbe');
  });
});

// ─── Reliability variations ───

describe('Reliability settings', () => {
  it('mission_critical — triggers ECC strongly recommended', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 4, growthPercent: 25 },
      reliability: { raidType: 'auto', ssdCache: false, criticality: 'mission_critical' },
    }));

    assertValidConfig(config, 'reliability critical');
    expect(config.ram.eccRecommendation).toBe('strongly_recommended');
  });

  it('SSD cache enabled', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['docker'],
      docker: { containerRange: '5-15', heavyServices: ['nextcloud'] },
      reliability: { raidType: 'auto', ssdCache: true, criticality: 'medium' },
    }));

    assertValidConfig(config, 'reliability ssd cache');
    expect(config.ssdCache).not.toBeNull();
    expect(config.ssdCache!.count).toBe(2);
    expect(config.ssdCache!.interface).toBe('nvme');
    expect(config.ssdCache!.dramRequired).toBe(true);
    // SSD cache should add to price
    expect(config.priceEstimate.ssdCache).not.toBeNull();
  });

  it('SSD cache for VMs — larger capacity', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['vm'],
      vm: { count: 3, purpose: 'production' },
      reliability: { raidType: 'auto', ssdCache: true, criticality: 'high' },
    }));

    assertValidConfig(config, 'reliability ssd cache vm');
    expect(config.ssdCache!.minCapacityGB).toBe(500);
    expect(config.ssdCache!.minTBW).toBe(600);
  });

  it('explicit RAID selection — raid6', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 10, growthPercent: 25 },
      reliability: { raidType: 'raid6', ssdCache: false, criticality: 'high' },
    }));

    assertValidConfig(config, 'reliability raid6');
    expect(config.storage.raidType).toBe('raid6');
    expect(config.storage.driveCount).toBeGreaterThanOrEqual(4);
  });

  it('explicit RAID selection — raid1 with 2 bays', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 2, growthPercent: 10 },
      reliability: { raidType: 'raid1', ssdCache: false, criticality: 'low' },
      formFactor: { placement: 'home', noiseLevel: 'quiet', bayCount: 2 },
    }));

    assertValidConfig(config, 'reliability raid1');
    expect(config.storage.raidType).toBe('raid1');
    expect(config.storage.driveCount).toBe(2);
  });
});

// ─── Form factor variations ───

describe('Form factor settings', () => {
  it('rack placement', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['business'],
      business: { users: 15, synologyDrive: true, activeDirectory: true },
      formFactor: { placement: 'rack', noiseLevel: 'normal', bayCount: 8 },
    }));

    assertValidConfig(config, 'form factor rack');
    expect(config.formFactor.placement).toBe('rack');
  });

  it('explicit 12-bay', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage', 'media'],
      fileStorage: { currentDataTB: 40, growthPercent: 25 },
      media: { libraryTB: 30, transcoding: '4k', streams: 3, engine: 'plex' },
      formFactor: { placement: 'server_room', noiseLevel: 'normal', bayCount: 12 },
    }));

    assertValidConfig(config, 'form factor 12-bay');
    expect(config.formFactor.minBays35).toBeGreaterThanOrEqual(4);
  });

  it('2-bay explicit — small budget NAS', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['backup'],
      backup: { deviceRange: '1-3', deviceTypes: ['mac'], cloudBackup: null },
      formFactor: { placement: 'home', noiseLevel: 'quiet', bayCount: 2 },
    }));

    assertValidConfig(config, 'form factor 2-bay');
  });
});

// ─── Budget variations ───

describe('Budget settings', () => {
  it('tight budget (15-30k)', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 2, growthPercent: 20 },
      budget: { includeDisks: true, range: '15-30', usedEquipment: true },
    }));

    assertValidConfig(config, 'budget tight');
  });

  it('high budget (120k+)', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage', 'docker', 'vm'],
      fileStorage: { currentDataTB: 10, growthPercent: 30 },
      docker: { containerRange: '15+', heavyServices: ['nextcloud', 'gitlab'] },
      vm: { count: 3, purpose: 'production' },
      budget: { includeDisks: true, range: '120+', usedEquipment: false },
    }));

    assertValidConfig(config, 'budget high');
  });
});

// ─── Edge cases & regression guards ───

describe('Edge cases', () => {
  it('empty use cases — should still produce valid config', () => {
    const config = generateConfig(makeAnswers({ useCases: [] }));
    assertValidConfig(config, 'empty use cases');
    expect(config.cpu.tier).toBe('basic');
  });

  it('surveillance with motion detection — storage savings', () => {
    const withMotion = generateConfig(makeAnswers({
      useCases: ['surveillance'],
      surveillance: { cameras: 8, resolution: '4k', fps: 25, codec: 'h264', storageDays: 30, motionOnly: true },
    }));

    const withoutMotion = generateConfig(makeAnswers({
      useCases: ['surveillance'],
      surveillance: { cameras: 8, resolution: '4k', fps: 25, codec: 'h264', storageDays: 30, motionOnly: false },
    }));

    // Motion detection should reduce storage
    const motionSurvAlloc = withMotion.storageBreakdown.allocations.find(a => a.label === 'Видеонаблюдение');
    const fullSurvAlloc = withoutMotion.storageBreakdown.allocations.find(a => a.label === 'Видеонаблюдение');
    expect(motionSurvAlloc!.sizeTB).toBeLessThan(fullSurvAlloc!.sizeTB);
  });

  it('h265plus codec — smaller storage than h264', () => {
    const h264 = generateConfig(makeAnswers({
      useCases: ['surveillance'],
      surveillance: { cameras: 8, resolution: '1080p', fps: 25, codec: 'h264', storageDays: 14, motionOnly: false },
    }));
    const h265plus = generateConfig(makeAnswers({
      useCases: ['surveillance'],
      surveillance: { cameras: 8, resolution: '1080p', fps: 25, codec: 'h265plus', storageDays: 14, motionOnly: false },
    }));

    const h264TB = h264.storageBreakdown.allocations.find(a => a.label === 'Видеонаблюдение')!.sizeTB;
    const h265pTB = h265plus.storageBreakdown.allocations.find(a => a.label === 'Видеонаблюдение')!.sizeTB;
    expect(h265pTB).toBeLessThan(h264TB);
  });

  it('auto RAID selection — 2 bays gets raid1', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 1, growthPercent: 10 },
      formFactor: { placement: 'home', noiseLevel: 'quiet', bayCount: 2 },
    }));

    assertValidConfig(config, 'auto raid 2 bay');
    expect(config.storage.raidType).toBe('raid1');
  });

  it('auto RAID selection — high criticality + 5 bays gets shr-2', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['business'],
      business: { users: 10, synologyDrive: true, activeDirectory: false },
      reliability: { raidType: 'auto', ssdCache: false, criticality: 'mission_critical' },
      formFactor: { placement: 'server_room', noiseLevel: 'normal', bayCount: 8 },
    }));

    assertValidConfig(config, 'auto raid critical');
    expect(config.storage.raidType).toBe('shr-2');
  });

  it('auto RAID selection — VM/docker gets raid10 with enough bays', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['vm', 'docker'],
      vm: { count: 2, purpose: 'dev' },
      docker: { containerRange: '5-15', heavyServices: ['nextcloud'] },
      formFactor: { placement: 'home', noiseLevel: 'quiet', bayCount: 4 },
    }));

    assertValidConfig(config, 'auto raid vm');
    expect(config.storage.raidType).toBe('raid10');
  });
});

// ─── Real-world scenario audits ───

describe('Real-world scenario audits', () => {
  it('Home user: Plex + files + TimeMachine — should be affordable', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage', 'media', 'backup'],
      fileStorage: { currentDataTB: 3, growthPercent: 25 },
      media: { libraryTB: 6, transcoding: '1080p', streams: 2, engine: 'plex' },
      backup: { deviceRange: '1-3', deviceTypes: ['mac', 'pc'], cloudBackup: null },
    }));

    assertValidConfig(config, 'home plex');
    // Should not over-specify for a home user
    expect(['basic', 'mid']).toContain(config.cpu.tier);
    expect(config.ram.minGB).toBeLessThanOrEqual(16);
    expect(config.psu.recommendedWatts).toBeLessThanOrEqual(350);
  });

  it('Homelab enthusiast: Docker + VM + files', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage', 'docker', 'vm'],
      fileStorage: { currentDataTB: 8, growthPercent: 30 },
      docker: { containerRange: '15+', heavyServices: ['nextcloud', 'homeassistant', 'frigate'] },
      vm: { count: 2, purpose: 'dev' },
      reliability: { raidType: 'auto', ssdCache: true, criticality: 'medium' },
    }));

    assertValidConfig(config, 'homelab');
    expect(['heavy', 'server']).toContain(config.cpu.tier);
    expect(config.ssdCache).not.toBeNull();
    expect(config.ai).not.toBeNull(); // frigate
  });

  it('Small business: 15 users + CCTV + file server', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage', 'surveillance', 'business'],
      fileStorage: { currentDataTB: 10, growthPercent: 25 },
      surveillance: { cameras: 8, resolution: '2k', fps: 15, codec: 'h265', storageDays: 30, motionOnly: false },
      business: { users: 15, synologyDrive: true, activeDirectory: true },
      reliability: { raidType: 'auto', ssdCache: false, criticality: 'high' },
      formFactor: { placement: 'server_room', noiseLevel: 'normal', bayCount: 'auto' },
    }));

    assertValidConfig(config, 'small business');
    expect(config.ram.eccRecommendation).not.toBe('not_needed');
    expect(config.storage.driveClass).toBe('surveillance');
  });

  it('Budget NAS: just file storage, 2 bays, minimal', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 1, growthPercent: 10 },
      formFactor: { placement: 'home', noiseLevel: 'quiet', bayCount: 2 },
      budget: { includeDisks: true, range: '15-30', usedEquipment: true },
    }));

    assertValidConfig(config, 'budget minimal');
    expect(config.cpu.tier).toBe('basic');
    expect(config.ram.minGB).toBe(4);
    expect(config.storage.driveCount).toBe(2);
    expect(config.storage.raidType).toBe('raid1');
  });

  it('4K media hoarder: massive library, no transcoding', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['media', 'file_storage'],
      fileStorage: { currentDataTB: 5, growthPercent: 20 },
      media: { libraryTB: 50, transcoding: 'none', streams: 1, engine: 'plex' },
      formFactor: { placement: 'home', noiseLevel: 'quiet', bayCount: 'auto' },
    }));

    assertValidConfig(config, 'media hoarder');
    // 50TB media + 6TB files → needs lots of bays
    expect(config.storage.driveCount).toBeGreaterThanOrEqual(4);
    expect(config.storage.minDriveSizeTB).toBeGreaterThanOrEqual(12);
    // But CPU should be modest since no transcoding
    expect(['basic', 'mid']).toContain(config.cpu.tier);
  });

  it('Security system: 32 cameras, 4K, 60 days retention', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['surveillance'],
      surveillance: { cameras: 32, resolution: '4k', fps: 25, codec: 'h265', storageDays: 60, motionOnly: false },
      reliability: { raidType: 'auto', ssdCache: false, criticality: 'mission_critical' },
      formFactor: { placement: 'rack', noiseLevel: 'normal', bayCount: 12 },
    }));

    assertValidConfig(config, 'security 32cam');
    expect(config.storage.driveClass).toBe('surveillance');
    expect(config.storage.driveCount).toBeGreaterThanOrEqual(6);
    expect(config.ai).not.toBeNull();
  });
});

// ─── SSD cache explanation tests ───

describe('SSD cache explanations', () => {
  it('Docker use case gets Docker-specific explanation', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['docker'],
      docker: { containerRange: '5-15', heavyServices: ['nextcloud'] },
      reliability: { raidType: 'auto', ssdCache: true, criticality: 'medium' },
    }));

    expect(config.ssdCache).not.toBeNull();
    expect(config.ssdCache!.explanation).toContain('Docker');
  });

  it('VM use case gets VM-specific explanation', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['vm'],
      vm: { count: 2, purpose: 'dev' },
      reliability: { raidType: 'auto', ssdCache: true, criticality: 'medium' },
    }));

    expect(config.ssdCache).not.toBeNull();
    expect(config.ssdCache!.explanation).toContain('Виртуальные машины');
  });

  it('Business gets concurrent access explanation', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['business'],
      business: { users: 10, synologyDrive: true, activeDirectory: false },
      reliability: { raidType: 'auto', ssdCache: true, criticality: 'medium' },
    }));

    expect(config.ssdCache).not.toBeNull();
    expect(config.ssdCache!.explanation).toContain('пользователей');
  });

  it('No SSD cache when not requested', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['docker', 'vm'],
      docker: { containerRange: '15+', heavyServices: ['nextcloud'] },
      vm: { count: 2, purpose: 'dev' },
      reliability: { raidType: 'auto', ssdCache: false, criticality: 'medium' },
    }));

    expect(config.ssdCache).toBeNull();
    expect(config.priceEstimate.ssdCache).toBeNull();
  });
});

// ─── Insights triggers ───

describe('Insights selection', () => {
  it('always includes CMR and RAID-not-backup warnings', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 2, growthPercent: 25 },
    }));

    const ids = config.insights.map(i => i.id);
    expect(ids).toContain('cmr_vs_smr');
    expect(ids).toContain('raid_not_backup');
    expect(ids).toContain('psu_sizing');
  });

  it('4K media triggers QuickSync gen warning', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['media'],
      media: { libraryTB: 4, transcoding: '4k', streams: 2, engine: 'plex' },
    }));

    const ids = config.insights.map(i => i.id);
    expect(ids).toContain('quicksync_gen');
    expect(ids).toContain('quicksync_value');
  });

  it('media + surveillance triggers transcoding_vs_ai', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['media', 'surveillance'],
      media: { libraryTB: 4, transcoding: '1080p', streams: 2, engine: 'plex' },
      surveillance: { cameras: 4, resolution: '1080p', fps: 25, codec: 'h265', storageDays: 14, motionOnly: false },
    }));

    const ids = config.insights.map(i => i.id);
    expect(ids).toContain('transcoding_vs_ai');
  });

  it('SSD cache triggers QLC and TBW warnings', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['docker'],
      docker: { containerRange: '5-15', heavyServices: ['nextcloud'] },
      reliability: { raidType: 'auto', ssdCache: true, criticality: 'medium' },
    }));

    const ids = config.insights.map(i => i.id);
    expect(ids).toContain('ssd_qlc');
    expect(ids).toContain('ssd_tbw');
  });

  it('mission_critical triggers ECC insight', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 4, growthPercent: 25 },
      reliability: { raidType: 'auto', ssdCache: false, criticality: 'mission_critical' },
    }));

    const ids = config.insights.map(i => i.id);
    expect(ids).toContain('ecc_zfs');
  });

  it('2-bay triggers "start with 4" tip', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 1, growthPercent: 10 },
      formFactor: { placement: 'home', noiseLevel: 'quiet', bayCount: 2 },
    }));

    const ids = config.insights.map(i => i.id);
    expect(ids).toContain('start_4bay');
  });
});

// ─── Power and PSU calculations ───

describe('Power and PSU', () => {
  it('basic config gets small PSU', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 2, growthPercent: 25 },
    }));

    expect(config.psu.recommendedWatts).toBeLessThanOrEqual(300);
  });

  it('server-class config gets larger PSU', () => {
    const config = generateConfig(makeAnswers({
      useCases: ['docker', 'vm', 'business', 'media'],
      docker: { containerRange: '15+', heavyServices: ['nextcloud', 'gitlab', 'frigate'] },
      vm: { count: 5, purpose: 'production' },
      business: { users: 25, synologyDrive: true, activeDirectory: true },
      media: { libraryTB: 20, transcoding: '4k', streams: 4, engine: 'plex' },
      formFactor: { placement: 'rack', noiseLevel: 'normal', bayCount: 12 },
    }));

    expect(config.psu.recommendedWatts).toBeGreaterThanOrEqual(250);
    expect(config.estimatedPowerW).toBeGreaterThan(100);
  });

  it('10GbE adds to power estimate', () => {
    const without10g = generateConfig(makeAnswers({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 4, growthPercent: 25 },
      network: { currentSpeed: '1gbe', needUpgrade: false, remoteAccess: 'tailscale' },
    }));

    const with10g = generateConfig(makeAnswers({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 4, growthPercent: 25 },
      network: { currentSpeed: '1gbe', needUpgrade: true, remoteAccess: 'tailscale' },
    }));

    expect(with10g.estimatedPowerW).toBeGreaterThan(without10g.estimatedPowerW);
  });
});
