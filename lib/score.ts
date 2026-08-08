export type Lettre = "S" | "A" | "B" | "C" | "D" | "F";

export interface ScoreTechnique {
  lettre: Lettre;
  valeur: number; // 0-100
  momentum: number | null; // perf. 1 mois en %
  position52: number | null; // position dans la fourchette 52 sem. en %
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Score technique 0-100 basé uniquement sur des données de prix (aucune
 * donnée fondamentale disponible via l'API gratuite utilisée) :
 *  - 50% : performance sur le dernier mois (momentum)
 *  - 50% : position du cours dans sa fourchette des 52 dernières semaines
 *
 * Ce n'est pas un score de qualité fondamentale (pas de ratios financiers,
 * pas d'analyse comptable) — juste un indicateur technique rapide, affiché
 * de façon transparente comme tel.
 */
export function calculerScore(params: {
  prix: number | null;
  plusHaut52s: number | null;
  plusBas52s: number | null;
  historique: number[] | null;
}): ScoreTechnique | null {
  const { prix, plusHaut52s, plusBas52s, historique } = params;

  let momentum: number | null = null;
  if (historique && historique.length > 1) {
    const debut = historique[0];
    const fin = historique[historique.length - 1];
    if (debut > 0) momentum = ((fin - debut) / debut) * 100;
  }

  let position52: number | null = null;
  if (
    prix !== null &&
    plusHaut52s !== null &&
    plusBas52s !== null &&
    plusHaut52s > plusBas52s
  ) {
    position52 = ((prix - plusBas52s) / (plusHaut52s - plusBas52s)) * 100;
  }

  if (momentum === null && position52 === null) return null;

  const scoreMomentum =
    momentum !== null ? ((clamp(momentum, -20, 20) + 20) / 40) * 100 : null;
  const scorePosition = position52 !== null ? clamp(position52, 0, 100) : null;

  let valeur: number;
  if (scoreMomentum !== null && scorePosition !== null) {
    valeur = 0.5 * scoreMomentum + 0.5 * scorePosition;
  } else {
    valeur = (scoreMomentum ?? scorePosition) as number;
  }
  valeur = Math.round(clamp(valeur, 0, 100));

  let lettre: Lettre;
  if (valeur >= 90) lettre = "S";
  else if (valeur >= 75) lettre = "A";
  else if (valeur >= 60) lettre = "B";
  else if (valeur >= 45) lettre = "C";
  else if (valeur >= 30) lettre = "D";
  else lettre = "F";

  return { lettre, valeur, momentum, position52 };
}

export const COULEURS_LETTRE: Record<Lettre, { texte: string; fond: string; bordure: string }> = {
  S: { texte: "#F5D98A", fond: "rgba(201,161,90,0.18)", bordure: "rgba(201,161,90,0.5)" },
  A: { texte: "#7FE0BC", fond: "rgba(63,182,139,0.18)", bordure: "rgba(63,182,139,0.5)" },
  B: { texte: "#8FD1D6", fond: "rgba(90,180,190,0.16)", bordure: "rgba(90,180,190,0.45)" },
  C: { texte: "#E7D98A", fond: "rgba(210,190,90,0.16)", bordure: "rgba(210,190,90,0.4)" },
  D: { texte: "#E8AD7A", fond: "rgba(220,150,90,0.16)", bordure: "rgba(220,150,90,0.4)" },
  F: { texte: "#EF9088", fond: "rgba(226,87,76,0.16)", bordure: "rgba(226,87,76,0.45)" },
};
