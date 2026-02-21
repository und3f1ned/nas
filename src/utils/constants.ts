export const USE_CASE_INFO = {
  file_storage: {
    label: 'Файловое хранилище',
    description: 'Документы, фото, общие папки',
    icon: '📁',
  },
  media: {
    label: 'Медиасервер',
    description: 'Plex, Jellyfin, стриминг видео',
    icon: '🎬',
  },
  surveillance: {
    label: 'Видеонаблюдение',
    description: 'Surveillance Station, IP-камеры',
    icon: '📹',
  },
  docker: {
    label: 'Docker / контейнеры',
    description: 'Home Assistant, Nextcloud, Gitea...',
    icon: '🐳',
  },
  vm: {
    label: 'Виртуальные машины',
    description: 'Virtual Machine Manager, тест/прод',
    icon: '🖥️',
  },
  backup: {
    label: 'Бэкап',
    description: 'Time Machine, Active Backup, rsync',
    icon: '💾',
  },
  business: {
    label: 'Бизнес',
    description: 'Synology Drive, офис 5–50 чел.',
    icon: '🏢',
  },
} as const;

export const HEAVY_DOCKER_SERVICES = [
  { id: 'homeassistant', label: 'Home Assistant' },
  { id: 'nextcloud', label: 'Nextcloud' },
  { id: 'gitea', label: 'Gitea' },
  { id: 'postgres', label: 'PostgreSQL / MySQL' },
  { id: 'grafana', label: 'Grafana + Prometheus' },
  { id: 'pihole', label: 'Pi-hole / AdGuard' },
  { id: 'frigate', label: 'Frigate NVR' },
  { id: 'other', label: 'Другое (тяжёлое)' },
] as const;

export const STORAGE_SIZES_TB = [0.5, 1, 2, 4, 8, 16, 32, 64, 100];
export const GROWTH_PERCENTS = [10, 25, 50, 100, 200];
export const FPS_OPTIONS = [10, 15, 25, 30];
export const STORAGE_DAYS_OPTIONS = [7, 14, 30, 60, 90];
