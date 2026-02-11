export function formatTB(tb: number): string {
  if (tb >= 1) {
    return `${tb.toFixed(1)} ТБ`;
  }
  return `${Math.round(tb * 1024)} ГБ`;
}

export function formatTiB(tib: number): string {
  if (tib >= 1) {
    return `${tib.toFixed(1)} ТиБ`;
  }
  return `${Math.round(tib * 1024)} ГиБ`;
}

export function formatPrice(rub: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(rub)) + ' ₽';
}

export function formatWatts(w: number): string {
  return `${Math.round(w)} Вт`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
