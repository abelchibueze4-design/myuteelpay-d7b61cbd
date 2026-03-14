/**
 * Apply a percentage markup to a price.
 * Returns the ceiling to the nearest whole number (Naira).
 */
export function applyMarkup(basePrice: number, markupPercent: number): number {
  if (!markupPercent || markupPercent <= 0) return basePrice;
  return Math.ceil(basePrice * (1 + markupPercent / 100));
}
