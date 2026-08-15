const SYMBOLES: Record<string, string> = {
  USD: "$",
  GBP: "£",
  CHF: "CHF",
  CAD: "$CA",
};

export function formatPrix(n: number | null | undefined, devise?: string | null): string {
  if (n === null || n === undefined) return "—";
  const val = n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!devise || devise === "EUR") return `${val} €`;
  if (devise === "USD") return `$${val}`;
  if (devise === "GBP") return `£${val}`;
  const symbole = SYMBOLES[devise];
  return symbole ? `${val} ${symbole}` : `${val} ${devise}`;
}

export function formatVolume(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} k`;
  return `${n}`;
}
