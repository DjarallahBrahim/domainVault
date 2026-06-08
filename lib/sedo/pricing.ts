export function computeSedoPricing(
  price: number,
  minprice: number,
  fixedprice: 0 | 1
) {
  return {
    price,
    minprice,
    fixedprice,
    currency: 1 as const,
    forsale: 1 as const,
  };
}

export interface PriceSuggestion {
  label: string;
  value: number;
}

export function askingPriceSuggestions(bin: number | null): PriceSuggestion[] {
  if (!bin) return [];

  const round = (n: number) => Math.round(n * 100) / 100;

  return [
    { label: "BIN", value: bin },
    { label: "BIN −20%", value: round(bin * 0.8) },
    { label: "BIN −30%", value: round(bin * 0.7) },
  ];
}

export function minPriceSuggestions(askingPrice: number): PriceSuggestion[] {
  const round = (n: number) => Math.round(n * 100) / 100;

  return [
    { label: "20%", value: round(askingPrice * 0.2) },
    { label: "30%", value: round(askingPrice * 0.3) },
    { label: "40%", value: round(askingPrice * 0.4) },
    { label: "50%", value: round(askingPrice * 0.5) },
  ];
}
