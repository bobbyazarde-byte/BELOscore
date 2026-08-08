import { Fondamentaux } from "@/lib/fondamentaux";

export type Lettre = "S" | "A" | "B" | "C" | "D" | "F";

export interface Metrique {
  cle: string;
  label: string;
  valeur: number | null;
  unite: "%" | "x";
  seuil: string; // description du seuil favorable, affichée à l'utilisateur
  favorable: boolean | null; // null si non calculable
}

export interface ScoreVQ {
  lettre: Lettre;
  valeur: number; // 0-100
  value: { valeur: number | null; metriques: Metrique[] };
  quality: { valeur: number | null; metriques: Metrique[] };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Normalise une métrique "plus haut = mieux" sur une plage [min, max] -> 0-100
function normaliserCroissant(v: number, min: number, max: number) {
  return clamp(((v - min) / (max - min)) * 100, 0, 100);
}

// Normalise une métrique "plus bas = mieux" sur une plage [min, max] -> 0-100
function normaliserDecroissant(v: number, min: number, max: number) {
  return clamp(((max - v) / (max - min)) * 100, 0, 100);
}

function moyenne(valeurs: number[]): number | null {
  if (valeurs.length === 0) return null;
  return valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
}

/**
 * Score Value/Qualité inspiré des plateformes de notation boursière :
 * 50% approche "value" (l'action est-elle bon marché ?), 50% approche
 * "qualité" (l'entreprise est-elle financièrement solide ?).
 *
 * Construit uniquement à partir de métriques calculables via les données
 * fondamentales Yahoo Finance disponibles gratuitement (pas de Piotroski
 * F-Score / Altman Z-Score / Beneish M-Score, qui demandent plusieurs
 * années d'états financiers détaillés) : ce n'est donc pas une réplique
 * exacte d'un score propriétaire existant, seulement une approche inspirée
 * du même principe, avec sa propre méthodologie affichée en toute
 * transparence.
 */
export function calculerScoreVQ(f: Fondamentaux | null): ScoreVQ | null {
  if (!f || f.erreur) return null;

  const valueMetriques: Metrique[] = [
    {
      cle: "earningsYield",
      label: "Rendement des bénéfices",
      valeur: f.earningsYield,
      unite: "%",
      seuil: "Favorable au-delà de 6%",
      favorable: f.earningsYield !== null ? f.earningsYield >= 6 : null,
    },
    {
      cle: "fcfYield",
      label: "Rendement du cash-flow libre",
      valeur: f.fcfYield,
      unite: "%",
      seuil: "Favorable au-delà de 5%",
      favorable: f.fcfYield !== null ? f.fcfYield >= 5 : null,
    },
    {
      cle: "evEbitda",
      label: "VE / EBITDA",
      valeur: f.evEbitda,
      unite: "x",
      seuil: "Favorable en dessous de 10x",
      favorable: f.evEbitda !== null ? f.evEbitda <= 10 : null,
    },
    {
      cle: "priceToBook",
      label: "Cours / Actif net (P/B)",
      valeur: f.priceToBook,
      unite: "x",
      seuil: "Favorable en dessous de 3x",
      favorable: f.priceToBook !== null ? f.priceToBook <= 3 : null,
    },
  ];

  const qualityMetriques: Metrique[] = [
    {
      cle: "roe",
      label: "Rentabilité des capitaux (ROE)",
      valeur: f.roe,
      unite: "%",
      seuil: "Favorable au-delà de 12%",
      favorable: f.roe !== null ? f.roe >= 12 : null,
    },
    {
      cle: "roa",
      label: "Rentabilité des actifs (ROA)",
      valeur: f.roa,
      unite: "%",
      seuil: "Favorable au-delà de 5%",
      favorable: f.roa !== null ? f.roa >= 5 : null,
    },
    {
      cle: "margeOperationnelle",
      label: "Marge opérationnelle",
      valeur: f.margeOperationnelle,
      unite: "%",
      seuil: "Favorable au-delà de 12%",
      favorable: f.margeOperationnelle !== null ? f.margeOperationnelle >= 12 : null,
    },
    {
      cle: "detteNetteEbitda",
      label: "Dette nette / EBITDA",
      valeur: f.detteNetteEbitda,
      unite: "x",
      seuil: "Favorable en dessous de 2x",
      favorable: f.detteNetteEbitda !== null ? f.detteNetteEbitda <= 2 : null,
    },
    {
      cle: "croissanceCA",
      label: "Croissance du chiffre d'affaires",
      valeur: f.croissanceCA,
      unite: "%",
      seuil: "Favorable au-delà de 3%",
      favorable: f.croissanceCA !== null ? f.croissanceCA >= 3 : null,
    },
  ];

  const scoresValue: number[] = [];
  if (f.earningsYield !== null) scoresValue.push(normaliserCroissant(f.earningsYield, 0, 12));
  if (f.fcfYield !== null) scoresValue.push(normaliserCroissant(f.fcfYield, 0, 10));
  if (f.evEbitda !== null) scoresValue.push(normaliserDecroissant(f.evEbitda, 5, 20));
  if (f.priceToBook !== null) scoresValue.push(normaliserDecroissant(f.priceToBook, 1, 6));

  const scoresQuality: number[] = [];
  if (f.roe !== null) scoresQuality.push(normaliserCroissant(f.roe, 0, 25));
  if (f.roa !== null) scoresQuality.push(normaliserCroissant(f.roa, 0, 12));
  if (f.margeOperationnelle !== null)
    scoresQuality.push(normaliserCroissant(f.margeOperationnelle, 0, 25));
  if (f.detteNetteEbitda !== null)
    scoresQuality.push(normaliserDecroissant(f.detteNetteEbitda, 0, 5));
  if (f.croissanceCA !== null) scoresQuality.push(normaliserCroissant(f.croissanceCA, -5, 15));

  const scoreValue = moyenne(scoresValue);
  const scoreQuality = moyenne(scoresQuality);

  if (scoreValue === null && scoreQuality === null) return null;

  let valeur: number;
  if (scoreValue !== null && scoreQuality !== null) {
    valeur = 0.5 * scoreValue + 0.5 * scoreQuality;
  } else {
    valeur = (scoreValue ?? scoreQuality) as number;
  }
  valeur = Math.round(clamp(valeur, 0, 100));

  let lettre: Lettre;
  if (valeur >= 90) lettre = "S";
  else if (valeur >= 75) lettre = "A";
  else if (valeur >= 60) lettre = "B";
  else if (valeur >= 45) lettre = "C";
  else if (valeur >= 30) lettre = "D";
  else lettre = "F";

  return {
    lettre,
    valeur,
    value: { valeur: scoreValue !== null ? Math.round(scoreValue) : null, metriques: valueMetriques },
    quality: { valeur: scoreQuality !== null ? Math.round(scoreQuality) : null, metriques: qualityMetriques },
  };
}

export const COULEURS_LETTRE: Record<Lettre, { texte: string; fond: string; bordure: string }> = {
  S: { texte: "#F5D98A", fond: "rgba(201,161,90,0.18)", bordure: "rgba(201,161,90,0.5)" },
  A: { texte: "#7FE0BC", fond: "rgba(63,182,139,0.18)", bordure: "rgba(63,182,139,0.5)" },
  B: { texte: "#8FD1D6", fond: "rgba(90,180,190,0.16)", bordure: "rgba(90,180,190,0.45)" },
  C: { texte: "#E7D98A", fond: "rgba(210,190,90,0.16)", bordure: "rgba(210,190,90,0.4)" },
  D: { texte: "#E8AD7A", fond: "rgba(220,150,90,0.16)", bordure: "rgba(220,150,90,0.4)" },
  F: { texte: "#EF9088", fond: "rgba(226,87,76,0.16)", bordure: "rgba(226,87,76,0.45)" },
};
