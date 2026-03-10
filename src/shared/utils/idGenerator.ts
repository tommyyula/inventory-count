export function generateId(): string {
  return crypto.randomUUID();
}

export function generatePlanNo(): string {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  const seq = Math.floor(Math.random() * 999) + 1;
  return `CP-${dateStr}-${seq.toString().padStart(3, '0')}`;
}

export function generateTaskNo(planNo: string, index: number, round: number): string {
  const base = planNo.replace('CP-', 'CT-');
  return `${base}-${index.toString().padStart(2, '0')}-R${round}`;
}

export function generateClientSyncId(): string {
  return `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
