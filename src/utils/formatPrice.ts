export const formatPrice = (price: number | null): string => {
  if (price === null) return '—';
  
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(price));
};
