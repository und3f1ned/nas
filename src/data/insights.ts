import type { Insight, InsightCategory, InsightSeverity } from '../types/config';
import type { WizardAnswers } from '../types/wizard';

interface InsightDef {
  id: string;
  icon: string;
  title: string;
  text: string;
  severity: InsightSeverity;
  category: InsightCategory;
  when: (a: WizardAnswers) => boolean;
}

const ALL_INSIGHTS: InsightDef[] = [
  // ─── CPU ───
  {
    id: 'pe_cores',
    icon: '🧠',
    title: 'P-ядра vs E-ядра: не верьте маркетингу',
    text: 'В гибридных Intel (12th gen+) «8 ядер» означает, например, 2P+8E. E-ядра на ~50% слабее P-ядер и не поддерживают Hyper-Threading. Для NAS это значит: реальная производительность «8-ядерного» i3-1215U ≈ 6 честных ядер. Если видите гибридный процессор — считайте только P-ядра как полноценные.',
    severity: 'warning',
    category: 'cpu',
    when: () => true,
  },
  {
    id: 'quicksync_value',
    icon: '🎬',
    title: 'QuickSync: дешёвый Intel лучше дорогой GPU',
    text: 'Intel QuickSync — выделенный аппаратный кодек на кристалле CPU. Потребляет ~10 Вт при транскодинге, 0 Вт в простое. Дешёвый Intel N100 (~$80) обрабатывает несколько 4K HEVC потоков одновременно. Дискретная видеокарта за $300+ будет потреблять 20+ Вт просто простаивая. Главное — не берите CPU с суффиксом «F» (например i5-12400F) — у них iGPU отключена.',
    severity: 'tip',
    category: 'transcoding',
    when: (a) => a.useCases.includes('media') && a.media?.transcoding !== 'none',
  },
  {
    id: 'quicksync_gen',
    icon: '📺',
    title: 'Минимум Kaby Lake для 4K HDR',
    text: 'Для аппаратного транскодинга 4K HEVC 10-bit (HDR) нужен QuickSync минимум 7-го поколения (Kaby Lake). Более старые CPU не поддерживают 10-bit HEVC — Plex будет падать на программный транскодинг и нагружать CPU на 100%.',
    severity: 'warning',
    category: 'transcoding',
    when: (a) => a.useCases.includes('media') && a.media?.transcoding === '4k',
  },
  {
    id: 'transcoding_vs_ai',
    icon: '🤖',
    title: 'Транскодинг ≠ AI-детекция',
    text: 'Транскодинг видео (Plex, Jellyfin) и AI-распознавание (Frigate NVR) — совершенно разные задачи на разном железе. QuickSync/NVENC кодируют видеопотоки. AI-детекция работает на отдельных ускорителях: Coral TPU, Hailo-8L, Intel OpenVINO. Они могут работать одновременно и не мешают друг другу.',
    severity: 'info',
    category: 'transcoding',
    when: (a) =>
      a.useCases.includes('media') &&
      a.useCases.includes('surveillance') &&
      a.media?.transcoding !== 'none',
  },

  // ─── RAM ───
  {
    id: 'ddr_generation',
    icon: '🧩',
    title: 'DDR3/DDR4/DDR5 — для NAS без разницы',
    text: 'NAS упирается в скорость дисков и сети, а не в пропускную способность памяти. DDR4 @ 2133 МГц даёт ~17 ГБ/с — это в 17 раз быстрее 10GbE сети. Берите самый дешёвый вариант под вашу платформу и максимизируйте объём. DDR4 ECC сейчас — лучшее соотношение цена/ёмкость.',
    severity: 'tip',
    category: 'ram',
    when: () => true,
  },
  {
    id: 'ecc_zfs',
    icon: '🛡️',
    title: 'ECC-память: не обязательна, но крайне желательна',
    text: 'Миф: «ECC обязательна для ZFS». Правда: ZFS — единственная FS с контрольными суммами, она лучше всех справляется БЕЗ ECC. Но если бит в RAM перевернётся и запишется на все зеркала — данные будут «правильно» повреждены, и ZFS их не отдаст. Исследование Google: ~8% планок RAM дают хотя бы 1 ошибку в год. ECC — страховка, а не обязательство.',
    severity: 'info',
    category: 'ram',
    when: (a) =>
      a.reliability.criticality === 'high' ||
      a.reliability.criticality === 'mission_critical' ||
      a.useCases.includes('business'),
  },
  {
    id: 'ddr5_ondie_ecc',
    icon: '⚠️',
    title: 'DDR5 «on-die ECC» — это не настоящий ECC',
    text: 'DDR5 рекламируется с «встроенной ECC». Но on-die ECC защищает только ячейки внутри чипа — она НЕ проверяет данные между модулем и CPU. Для реальной защиты нужен ECC на уровне системы (отдельные модули ECC UDIMM/RDIMM + поддержка платформой).',
    severity: 'warning',
    category: 'ram',
    when: () => true,
  },

  // ─── Storage ───
  {
    id: 'cmr_vs_smr',
    icon: '💀',
    title: 'CMR обязательно! SMR — катастрофа для RAID',
    text: 'SMR-диски перекрывают дорожки для увеличения плотности. При ребилде RAID массива это замедляет процесс в 13-16 раз: вместо часов — дни. Диск может вылететь из массива по таймауту, потеряв данные. В 2020 WD продавал SMR-диски под маркой «Red» для NAS без предупреждения. Правило: NAS-серии (IronWolf, Red Plus, N300) — CMR. Диски от 10 ТБ практически всегда CMR.',
    severity: 'warning',
    category: 'storage',
    when: () => true,
  },
  {
    id: 'tler_erc',
    icon: '⏱️',
    title: 'TLER/ERC: почему десктопные диски вылетают из RAID',
    text: 'Десктопный HDD при ошибке чтения может «думать» 30+ секунд, пытаясь восстановить сектор. RAID-контроллер решит, что диск умер, и выбросит его из массива. NAS/Enterprise диски ограничивают это время до 7 секунд (TLER/ERC). Обычный Barracuda/Blue в RAID — это бомба замедленного действия.',
    severity: 'warning',
    category: 'storage',
    when: (a) => {
      const bd = a.formFactor.bayCount;
      return bd === 'auto' || bd >= 2;
    },
  },
  {
    id: 'vibration',
    icon: '📳',
    title: 'Вибрация при ≥4 дисках',
    text: 'Когда 4+ HDD стоят рядом, их вибрации могут резонировать и снижать производительность/надёжность. NAS-серии (IronWolf, Red Plus) имеют RV-сенсоры (датчики вибрации), которые компенсируют это. Десктопные диски — нет. Также помогает: 5400 RPM вместо 7200, резиновые демпферы, правильный обдув.',
    severity: 'info',
    category: 'storage',
    when: (a) => {
      const bd = a.formFactor.bayCount;
      return bd !== 'auto' && bd >= 4;
    },
  },

  // ─── SSD ───
  {
    id: 'ssd_qlc',
    icon: '🔋',
    title: 'QLC SSD — не для кэша записи',
    text: 'NAND-память имеет ограниченный ресурс: SLC ~100K циклов, MLC ~3-10K, TLC ~500-3K, QLC ~100-1K. Для кэша NAS с постоянной записью QLC износится слишком быстро. Минимум — TLC с DRAM-буфером. DRAMless SSD увеличивает износ NAND и даёт просадки скорости (тест: копирование 50 ГБ — 15 мин вместо 2.5 мин).',
    severity: 'warning',
    category: 'ssd',
    when: (a) => a.reliability.ssdCache,
  },
  {
    id: 'ssd_tbw',
    icon: '📊',
    title: 'TBW: сколько реально проживёт SSD',
    text: 'TBW (Total Bytes Written) — гарантированный ресурс записи. 600 TBW при гарантии 5 лет = ~329 ГБ/день. Но из-за write amplification реальная запись на NAND в 3-4 раза больше, чем данные от хоста. Для NAS-кэша выбирайте SSD с TBW от 300+, а для ZFS SLOG — enterprise-класс.',
    severity: 'info',
    category: 'ssd',
    when: (a) => a.reliability.ssdCache,
  },

  // ─── Network ───
  {
    id: 'link_aggregation',
    icon: '🔗',
    title: 'Link Aggregation НЕ ускоряет одного клиента',
    text: 'Два склеенных 1GbE порта дают 2 Гбит/с суммарно, но каждый клиент всё равно получает максимум 1 Гбит/с (одно TCP-соединение = один линк). Для реальной скорости одного клиента нужен один быстрый линк: 2.5GbE или 10GbE.',
    severity: 'warning',
    category: 'network',
    when: () => true,
  },
  {
    id: 'usb_ethernet',
    icon: '🔌',
    title: 'USB-Ethernet адаптеры: маркетинг vs реальность',
    text: 'USB-to-2.5GbE адаптеры обещают 280+ МБ/с, но реально выдают 70-80 МБ/с из-за: нагрузки на USB-стек, общей шины USB-контроллера, теплового троттлинга маленького чипа. PCIe 2.5GbE карта за $25-35 всегда лучше USB-адаптера.',
    severity: 'tip',
    category: 'network',
    when: (a) =>
      a.network.currentSpeed === '2.5gbe' || a.network.currentSpeed === '10gbe',
  },
  {
    id: '25gbe_sweet_spot',
    icon: '🌐',
    title: '2.5GbE — оптимальный апгрейд',
    text: 'Один HDD выдаёт 180-200 МБ/с, что уже перегружает 1GbE (125 МБ/с). 2.5GbE (312 МБ/с) работает на существующей Cat5e проводке до 100 м. Полный комплект (свитч + адаптеры) ~$170. 10GbE часто требует Cat6/6a и стоит от $500 на точку.',
    severity: 'tip',
    category: 'network',
    when: (a) => a.network.currentSpeed === '1gbe',
  },

  // ─── Power ───
  {
    id: 'psu_sizing',
    icon: '⚡',
    title: 'Правильный размер БП для 24/7',
    text: '80+ тестирует КПД только при 20-100% нагрузки. БП на 800 Вт для системы, потребляющей 50 Вт (6% нагрузки) — это КПД 75-80% вместо заявленных 90%. Правило: макс. потребление × 1.3 = мощность БП. И проверьте, что 20% от мощности БП ниже вашего idle.',
    severity: 'tip',
    category: 'power',
    when: () => true,
  },

  // ─── General ───
  {
    id: 'raid_not_backup',
    icon: '🚨',
    title: 'RAID ≠ бэкап!',
    text: 'RAID защищает от выхода диска из строя. Он НЕ защищает от: случайного удаления, шифровальщиков, пожара, кражи, ошибок контроллера. Настоящий бэкап — на отдельном устройстве, идеально — offsite (облако, второй NAS).',
    severity: 'warning',
    category: 'general',
    when: () => true,
  },
  {
    id: 'test_remote',
    icon: '🏠',
    title: 'Тестируйте перезагрузку до отъезда',
    text: 'NAS, который не поднимается после отключения питания, пока вы в отпуске — катастрофа. Проверьте: автозапуск после сбоя питания (BIOS → Restore on AC Power Loss), удалённый доступ (Tailscale/VPN), Wake-on-LAN.',
    severity: 'tip',
    category: 'general',
    when: () => true,
  },
  {
    id: 'start_4bay',
    icon: '📦',
    title: 'Начинайте минимум с 4 слотов',
    text: '2 слота — частое разочарование. Расширить позже дороже и сложнее: нужен новый корпус, RAID-ребилд, риски. 4 слота дают гибкость: SHR с 3 дисками + 1 горячий резерв, или SHR-2 для критичных данных.',
    severity: 'tip',
    category: 'general',
    when: (a) => {
      const bd = a.formFactor.bayCount;
      return bd !== 'auto' && bd <= 2;
    },
  },
];

export function selectInsights(answers: WizardAnswers): Insight[] {
  return ALL_INSIGHTS
    .filter((def) => def.when(answers))
    .map(({ when: _, ...insight }) => insight);
}
