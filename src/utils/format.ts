export function formatPrice(value: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function discountPercent(selling: number, discount?: number): number {
  if (!discount || discount >= selling) return 0;
  return Math.round(((selling - discount) / selling) * 100);
}

export function truncate(text: string, max = 50): string {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}
