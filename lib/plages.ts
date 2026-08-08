export interface Plage {
  valeur: string; // valeur du paramètre "range" Yahoo Finance
  label: string;
  interval: string; // intervalle Yahoo Finance adapté à cette plage
}

export const PLAGES: Plage[] = [
  { valeur: "1d", label: "1 jour", interval: "5m" },
  { valeur: "5d", label: "5 jours", interval: "15m" },
  { valeur: "1mo", label: "1 mois", interval: "1d" },
  { valeur: "ytd", label: "YTD", interval: "1d" },
  { valeur: "1y", label: "1 an", interval: "1d" },
  { valeur: "5y", label: "5 ans", interval: "1wk" },
];

export function intervalPour(range: string): string {
  return PLAGES.find((p) => p.valeur === range)?.interval ?? "1d";
}

export const PLAGES_AUTORISEES = new Set(PLAGES.map((p) => p.valeur));
