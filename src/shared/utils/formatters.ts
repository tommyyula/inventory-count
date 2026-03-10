export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('zh-CN');
}

export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('zh-CN');
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals = 0): string {
  return value.toFixed(decimals);
}

export function formatCurrency(value: number): string {
  return `¥${value.toFixed(2)}`;
}
