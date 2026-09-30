const euro = new Intl.NumberFormat('en-BE', { style: 'currency', currency: 'EUR' });

export function formatEuro(amount: number, { signed = false } = {}): string {
  const formatted = euro.format(Math.abs(amount));
  if (!signed) return amount < 0 ? `-${formatted}` : formatted;
  return `${amount < 0 ? '−' : '+'}${formatted}`;
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function monthLabel(iso: string): string {
  return new Date(`${iso}-01T12:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
