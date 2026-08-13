export type Lettre = "S" | "A" | "B" | "C" | "D" | "F";

export function lettrePour(pourcentage: number): Lettre {
  if (pourcentage >= 90) return "S";
  if (pourcentage >= 75) return "A";
  if (pourcentage >= 60) return "B";
  if (pourcentage >= 45) return "C";
  if (pourcentage >= 30) return "D";
  return "F";
}

export const COULEURS_LETTRE: Record<Lettre, { texte: string; fond: string; bordure: string }> = {
  S: { texte: "#F5D98A", fond: "rgba(201,161,90,0.18)", bordure: "rgba(201,161,90,0.5)" },
  A: { texte: "#7FE0BC", fond: "rgba(63,182,139,0.18)", bordure: "rgba(63,182,139,0.5)" },
  B: { texte: "#8FD1D6", fond: "rgba(90,180,190,0.16)", bordure: "rgba(90,180,190,0.45)" },
  C: { texte: "#E7D98A", fond: "rgba(210,190,90,0.16)", bordure: "rgba(210,190,90,0.4)" },
  D: { texte: "#E8AD7A", fond: "rgba(220,150,90,0.16)", bordure: "rgba(220,150,90,0.4)" },
  F: { texte: "#EF9088", fond: "rgba(226,87,76,0.16)", bordure: "rgba(226,87,76,0.45)" },
};
