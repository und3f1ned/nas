import { describe, test, expect } from 'vitest';
import { generateConfig } from '../configurator';
import type { WizardAnswers } from '../../types/wizard';
import type { NASConfig } from '../../types/config';

// ═══════════════════════════════════════════════════════════════════
// Тесты на адекватность — проверка здравого смысла результатов
// Смотрим глазами пользователя И специалиста
// ═══════════════════════════════════════════════════════════════════

const base: WizardAnswers = {
  useCases: [],
  network: { currentSpeed: '1gbe', needUpgrade: false, remoteAccess: 'tailscale' },
  reliability: { raidType: 'auto', ssdCache: false, criticality: 'medium' },
  formFactor: { placement: 'home', noiseLevel: 'quiet', bayCount: 'auto' },
  budget: { includeDisks: true, range: '30-60', usedEquipment: false },
};

function gen(overrides: Partial<WizardAnswers>): NASConfig {
  return generateConfig({ ...base, ...overrides });
}

// ─── КАК ПОЛЬЗОВАТЕЛЬ: "не хочу переплачивать, но чтобы работало" ───

describe('Глазами пользователя', () => {

  test('Минимальный NAS для фильмов не стоит как сервер', () => {
    const c = gen({
      useCases: ['file_storage', 'media'],
      fileStorage: { currentDataTB: 2, growthPercent: 25 },
      media: { libraryTB: 4, transcoding: '1080p', streams: 2 },
    });
    // Пользователь ожидает 15-40к, не 100к
    expect(c.priceEstimate.totalRange.min).toBeLessThan(80000);
    expect(c.cpu.tier).not.toBe('server');
    expect(c.storage.driveCount).toBeLessThanOrEqual(4);
    expect(c.ram.minGB).toBeLessThanOrEqual(8);
  });

  test('Просто файлопомойка — дёшево и сердито', () => {
    const c = gen({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 1, growthPercent: 25 },
    });
    expect(c.cpu.tier).toBe('basic');
    expect(c.ram.minGB).toBe(4);
    expect(c.storage.driveCount).toBe(2); // raid1
    expect(c.ssdCache).toBeNull();
    expect(c.transcoding).toBeNull();
    expect(c.ai).toBeNull();
  });

  test('8 камер — не нужен серверный CPU', () => {
    const c = gen({
      useCases: ['surveillance'],
      surveillance: { cameras: 8, resolution: '2k', fps: 15, codec: 'h265', storageDays: 14, motionOnly: false },
    });
    expect(c.cpu.tier).not.toBe('server');
    // 8 камер = score ceil(8/4)=2, итого 2 → basic
    expect(['basic', 'mid']).toContain(c.cpu.tier);
  });

  test('Много камер (32) — ДОЛЖЕН быть мощный CPU', () => {
    const c = gen({
      useCases: ['surveillance'],
      surveillance: { cameras: 32, resolution: '4k', fps: 25, codec: 'h265', storageDays: 60, motionOnly: false },
      formFactor: { placement: 'rack', noiseLevel: 'normal', bayCount: 12 },
    });
    expect(['heavy', 'server']).toContain(c.cpu.tier);
  });

  test('Docker с Plex — QuickSync обязателен', () => {
    const c = gen({
      useCases: ['media', 'docker'],
      media: { libraryTB: 10, transcoding: '4k', streams: 3 },
      docker: { containerRange: '5-15', heavyServices: ['plex'] },
    });
    expect(c.cpu.needsQuickSync).toBe(true);
    expect(c.transcoding).not.toBeNull();
    expect(c.transcoding!.method).toBe('quicksync');
  });

  test('Docker без медиа — QuickSync НЕ нужен', () => {
    const c = gen({
      useCases: ['docker'],
      docker: { containerRange: '5-15', heavyServices: ['nextcloud', 'postgres'] },
    });
    expect(c.cpu.needsQuickSync).toBe(false);
    expect(c.transcoding).toBeNull();
  });

  test('Отключение дисков реально убирает их из итого', () => {
    const withDisks = gen({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 10, growthPercent: 25 },
      budget: { includeDisks: true, range: '30-60', usedEquipment: false },
    });
    const noDisks = gen({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 10, growthPercent: 25 },
      budget: { includeDisks: false, range: '30-60', usedEquipment: false },
    });
    expect(noDisks.priceEstimate.totalRange.min).toBeLessThan(withDisks.priceEstimate.totalRange.min);
    expect(noDisks.priceEstimate.includeDisks).toBe(false);
    expect(withDisks.priceEstimate.includeDisks).toBe(true);
    // Цена дисков всё равно рассчитана (для информации), просто не в итого
    expect(noDisks.priceEstimate.drives.min).toBeGreaterThan(0);
  });
});

// ─── КАК СПЕЦИАЛИСТ: "что бы я посоветовал клиенту?" ───

describe('Глазами специалиста', () => {

  test('ECC рекомендуется для бизнеса', () => {
    const c = gen({
      useCases: ['file_storage', 'business'],
      fileStorage: { currentDataTB: 5, growthPercent: 25 },
      business: { users: 10, hasAD: true, needsMail: false },
    });
    expect(c.ram.eccRecommendation).toBe('strongly_recommended');
  });

  test('ECC рекомендуется для VM', () => {
    const c = gen({
      useCases: ['vm'],
      vm: { count: 2, osTypes: ['linux'] },
    });
    expect(c.ram.eccRecommendation).toBe('recommended');
  });

  test('ECC не нужна для домашнего файлохранилища', () => {
    const c = gen({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 2, growthPercent: 25 },
    });
    expect(c.ram.eccRecommendation).toBe('not_needed');
  });

  test('SHR-2 для критичных данных с >=5 дисков', () => {
    const c = gen({
      useCases: ['file_storage', 'business'],
      fileStorage: { currentDataTB: 20, growthPercent: 25 },
      business: { users: 10, hasAD: true, needsMail: false },
      reliability: { raidType: 'auto', ssdCache: false, criticality: 'high' },
      formFactor: { placement: 'server_room', noiseLevel: 'normal', bayCount: 8 },
    });
    expect(c.storage.raidType).toBe('shr-2');
  });

  test('RAID1 для 2 дисков', () => {
    const c = gen({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 2, growthPercent: 25 },
      formFactor: { placement: 'home', noiseLevel: 'quiet', bayCount: 2 },
    });
    expect(c.storage.raidType).toBe('raid1');
    expect(c.storage.driveCount).toBe(2);
  });

  test('RAM: 5 VM по 4 ГБ = минимум 32 ГБ', () => {
    const c = gen({
      useCases: ['vm'],
      vm: { count: 5, osTypes: ['linux', 'windows'] },
    });
    // 4 (base) + 5*4 = 24, -> minGB = 32
    expect(c.ram.minGB).toBeGreaterThanOrEqual(32);
  });

  test('RAM: файлы + Docker лёгкий = 8 ГБ хватит', () => {
    const c = gen({
      useCases: ['file_storage', 'docker'],
      fileStorage: { currentDataTB: 4, growthPercent: 25 },
      docker: { containerRange: '1-5', heavyServices: [] },
    });
    expect(c.ram.minGB).toBeLessThanOrEqual(8);
  });

  test('SSD-кэш не появляется если не включён', () => {
    const c = gen({
      useCases: ['docker', 'vm'],
      docker: { containerRange: '15+', heavyServices: ['postgres', 'nextcloud'] },
      vm: { count: 2, osTypes: ['linux'] },
      reliability: { raidType: 'auto', ssdCache: false, criticality: 'medium' },
    });
    expect(c.ssdCache).toBeNull();
  });

  test('SSD-кэш появляется если включён, с правильными параметрами', () => {
    const c = gen({
      useCases: ['docker', 'vm'],
      docker: { containerRange: '15+', heavyServices: ['postgres', 'nextcloud'] },
      vm: { count: 2, osTypes: ['linux'] },
      reliability: { raidType: 'auto', ssdCache: true, criticality: 'medium' },
    });
    expect(c.ssdCache).not.toBeNull();
    expect(c.ssdCache!.count).toBe(2);
    expect(c.ssdCache!.interface).toBe('nvme');
    expect(c.ssdCache!.minNandType).toBe('tlc');
    expect(c.ssdCache!.dramRequired).toBe(true);
    // Тяжёлая нагрузка (VM + Docker 15+) → 500 ГБ, TBW 600+
    expect(c.ssdCache!.minCapacityGB).toBe(500);
    expect(c.ssdCache!.minTBW).toBe(600);
  });

  test('10GbE рекомендуется для VM', () => {
    const c = gen({
      useCases: ['vm'],
      vm: { count: 3, osTypes: ['linux'] },
    });
    expect(c.network.recommendedSpeed).toBe('10gbe');
  });

  test('1GbE хватит для файлопомойки', () => {
    const c = gen({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 2, growthPercent: 25 },
      network: { currentSpeed: '100mbps', needUpgrade: false, remoteAccess: 'tailscale' },
    });
    // currentSpeed=100mbps и !needUpgrade → stays at 1gbe
    expect(c.network.recommendedSpeed).toBe('1gbe');
  });

  test('Surveillance → диски класса surveillance (не NAS)', () => {
    const c = gen({
      useCases: ['surveillance'],
      surveillance: { cameras: 4, resolution: '1080p', fps: 25, codec: 'h265', storageDays: 14, motionOnly: false },
    });
    expect(c.storage.driveClass).toBe('surveillance');
  });

  test('Enterprise диски для бизнеса >15 юзеров', () => {
    const c = gen({
      useCases: ['file_storage', 'business'],
      fileStorage: { currentDataTB: 10, growthPercent: 25 },
      business: { users: 20, hasAD: true, needsMail: false },
    });
    expect(c.storage.driveClass).toBe('enterprise');
  });

  test('AI-ускоритель для Frigate', () => {
    const c = gen({
      useCases: ['docker'],
      docker: { containerRange: '5-15', heavyServices: ['frigate'] },
    });
    expect(c.ai).not.toBeNull();
    expect(c.ai!.useCases.some(u => u.includes('Frigate'))).toBe(true);
  });

  test('AI-ускоритель для 8+ камер', () => {
    const c = gen({
      useCases: ['surveillance'],
      surveillance: { cameras: 8, resolution: '2k', fps: 15, codec: 'h265', storageDays: 14, motionOnly: false },
    });
    expect(c.ai).not.toBeNull();
  });

  test('Нет AI-ускорителя для 4 камер без Frigate', () => {
    const c = gen({
      useCases: ['surveillance'],
      surveillance: { cameras: 4, resolution: '1080p', fps: 15, codec: 'h265', storageDays: 14, motionOnly: false },
    });
    expect(c.ai).toBeNull();
  });

  test('UPS минимум 400 ВА', () => {
    const c = gen({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 1, growthPercent: 25 },
    });
    expect(c.ups.minVA).toBeGreaterThanOrEqual(400);
  });

  test('UPS растёт для тяжёлых конфигураций', () => {
    const light = gen({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 1, growthPercent: 25 },
    });
    const heavy = gen({
      useCases: ['file_storage', 'vm', 'docker'],
      fileStorage: { currentDataTB: 20, growthPercent: 25 },
      vm: { count: 5, osTypes: ['linux', 'windows'] },
      docker: { containerRange: '15+', heavyServices: ['postgres', 'nextcloud', 'gitlab', 'frigate'] },
      reliability: { raidType: 'auto', ssdCache: true, criticality: 'high' },
      formFactor: { placement: 'server_room', noiseLevel: 'normal', bayCount: 8 },
    });
    // Heavy config draws significantly more power
    expect(heavy.estimatedPowerW).toBeGreaterThan(light.estimatedPowerW * 2);
    expect(heavy.ups.minVA).toBeGreaterThanOrEqual(light.ups.minVA);
  });

  test('Корпус ATX для серверных нагрузок', () => {
    const c = gen({
      useCases: ['vm', 'docker', 'file_storage', 'business'],
      fileStorage: { currentDataTB: 20, growthPercent: 25 },
      vm: { count: 3, osTypes: ['linux'] },
      docker: { containerRange: '15+', heavyServices: ['postgres', 'nextcloud', 'gitlab'] },
      business: { users: 25, hasAD: true, needsMail: true },
      reliability: { raidType: 'auto', ssdCache: true, criticality: 'high' },
      formFactor: { placement: 'server_room', noiseLevel: 'normal', bayCount: 'auto' },
    });
    expect(c.formFactor.maxMbFormFactor).toBe('atx');
  });

  test('Mini-ITX для лёгкого домашнего NAS', () => {
    const c = gen({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 2, growthPercent: 25 },
    });
    expect(c.formFactor.maxMbFormFactor).toBe('mini-itx');
  });
});

// ─── ГРАНИЧНЫЕ СЛУЧАИ: "а что если..." ───

describe('Граничные случаи', () => {

  test('Всё выбрано сразу — не падает, адекватный результат', () => {
    const c = gen({
      useCases: ['file_storage', 'media', 'surveillance', 'docker', 'vm', 'backup', 'business'],
      fileStorage: { currentDataTB: 10, growthPercent: 50 },
      media: { libraryTB: 20, transcoding: '4k', streams: 4 },
      surveillance: { cameras: 16, resolution: '4k', fps: 25, codec: 'h265', storageDays: 30, motionOnly: false },
      docker: { containerRange: '15+', heavyServices: ['plex', 'nextcloud', 'postgres', 'frigate'] },
      vm: { count: 3, osTypes: ['linux', 'windows'] },
      backup: { sources: ['pc', 'mac', 'phone'], deviceRange: '3-10' },
      business: { users: 25, hasAD: true, needsMail: true },
      reliability: { raidType: 'auto', ssdCache: true, criticality: 'mission_critical' },
      formFactor: { placement: 'rack', noiseLevel: 'normal', bayCount: 12 },
    });
    expect(c.cpu.tier).toBe('server');
    expect(c.ram.minGB).toBeGreaterThanOrEqual(32);
    expect(c.storage.driveCount).toBeGreaterThanOrEqual(6);
    expect(c.ssdCache).not.toBeNull();
    expect(c.transcoding).not.toBeNull();
    expect(c.ai).not.toBeNull();
    expect(c.priceEstimate.totalRange.min).toBeGreaterThan(0);
    expect(c.priceEstimate.totalRange.max).toBeGreaterThan(c.priceEstimate.totalRange.min);
    expect(c.ups.minVA).toBeGreaterThanOrEqual(400);
    expect(c.insights.length).toBeGreaterThan(0);
  });

  test('Storage breakdown не выходит за usableTiB', () => {
    const c = gen({
      useCases: ['file_storage', 'media', 'backup'],
      fileStorage: { currentDataTB: 4, growthPercent: 25 },
      media: { libraryTB: 6, transcoding: 'none', streams: 0 },
      backup: { sources: ['pc'], deviceRange: '1-3' },
    });
    const totalAllocated = c.storageBreakdown.allocations.reduce((s, a) => s + a.sizeTB, 0);
    // Allocated in TB, usable in TiB — allocated * 0.909 ≈ TiB
    expect(totalAllocated * 0.909).toBeLessThanOrEqual(c.storageBreakdown.usableTiB * 1.15); // 15% tolerance
  });

  test('Цена итого = сумма частей', () => {
    const c = gen({
      useCases: ['file_storage', 'docker'],
      fileStorage: { currentDataTB: 4, growthPercent: 25 },
      docker: { containerRange: '5-15', heavyServices: ['nextcloud'] },
      reliability: { raidType: 'auto', ssdCache: true, criticality: 'medium' },
    });
    const pe = c.priceEstimate;
    const sumMin = pe.hardware.min + pe.drives.min + (pe.ssdCache?.min ?? 0) + pe.accessories.min + pe.assembly;
    const sumMax = pe.hardware.max + pe.drives.max + (pe.ssdCache?.max ?? 0) + pe.accessories.max + pe.assembly;
    expect(pe.totalRange.min).toBe(sumMin);
    expect(pe.totalRange.max).toBe(sumMax);
  });

  test('Цена итого БЕЗ дисков = сумма без дисков', () => {
    const c = gen({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 10, growthPercent: 25 },
      budget: { includeDisks: false, range: '30-60', usedEquipment: false },
    });
    const pe = c.priceEstimate;
    const sumMin = pe.hardware.min + (pe.ssdCache?.min ?? 0) + pe.accessories.min + pe.assembly;
    const sumMax = pe.hardware.max + (pe.ssdCache?.max ?? 0) + pe.accessories.max + pe.assembly;
    expect(pe.totalRange.min).toBe(sumMin);
    expect(pe.totalRange.max).toBe(sumMax);
    // Drives должны быть рассчитаны, но не в итого
    expect(pe.drives.min).toBeGreaterThan(0);
  });

  test('Потребление всегда > 0', () => {
    const c = gen({
      useCases: ['file_storage'],
      fileStorage: { currentDataTB: 1, growthPercent: 25 },
    });
    expect(c.estimatedPowerW).toBeGreaterThan(0);
    expect(c.psu.recommendedWatts).toBeGreaterThan(c.estimatedPowerW);
  });

  test('Surveillance storageDays реально влияет на объём', () => {
    const c14 = gen({
      useCases: ['surveillance'],
      surveillance: { cameras: 8, resolution: '4k', fps: 25, codec: 'h265', storageDays: 14, motionOnly: false },
    });
    const c60 = gen({
      useCases: ['surveillance'],
      surveillance: { cameras: 8, resolution: '4k', fps: 25, codec: 'h265', storageDays: 60, motionOnly: false },
    });
    const alloc14 = c14.storageBreakdown.allocations.find(a => a.label === 'Видеонаблюдение');
    const alloc60 = c60.storageBreakdown.allocations.find(a => a.label === 'Видеонаблюдение');
    expect(alloc14).toBeDefined();
    expect(alloc60).toBeDefined();
    // 60 дней должно быть ~4.3x больше чем 14
    expect(alloc60!.sizeTB / alloc14!.sizeTB).toBeGreaterThan(3);
    expect(alloc60!.sizeTB / alloc14!.sizeTB).toBeLessThan(5);
  });

  test('motionOnly уменьшает объём', () => {
    const full = gen({
      useCases: ['surveillance'],
      surveillance: { cameras: 8, resolution: '2k', fps: 25, codec: 'h265', storageDays: 30, motionOnly: false },
    });
    const motion = gen({
      useCases: ['surveillance'],
      surveillance: { cameras: 8, resolution: '2k', fps: 25, codec: 'h265', storageDays: 30, motionOnly: true },
    });
    const allocFull = full.storageBreakdown.allocations.find(a => a.label === 'Видеонаблюдение');
    const allocMotion = motion.storageBreakdown.allocations.find(a => a.label === 'Видеонаблюдение');
    expect(allocMotion!.sizeTB).toBeLessThan(allocFull!.sizeTB);
  });

  test('h264 занимает больше места чем h265', () => {
    const h264 = gen({
      useCases: ['surveillance'],
      surveillance: { cameras: 8, resolution: '2k', fps: 25, codec: 'h264', storageDays: 30, motionOnly: false },
    });
    const h265 = gen({
      useCases: ['surveillance'],
      surveillance: { cameras: 8, resolution: '2k', fps: 25, codec: 'h265', storageDays: 30, motionOnly: false },
    });
    const a264 = h264.storageBreakdown.allocations.find(a => a.label === 'Видеонаблюдение');
    const a265 = h265.storageBreakdown.allocations.find(a => a.label === 'Видеонаблюдение');
    expect(a264!.sizeTB).toBeGreaterThan(a265!.sizeTB);
  });
});
