import { Fondamentaux } from "@/lib/fondamentaux";
import { Lettre, lettrePour } from "@/lib/score";

export type Palier = "Très bon" | "Bon" | "Moyen" | "Faible" | "Très faible";

export const COULEURS_PALIER: Record<Palier, { texte: string; fond: string }> = {
  "Très bon": { texte: "#3FB68B", fond: "rgba(63,182,139,0.16)" },
  Bon: { texte: "#7FCB9E", fond: "rgba(63,182,139,0.10)" },
  Moyen: { texte: "#E7D98A", fond: "rgba(210,190,90,0.14)" },
  Faible: { texte: "#E8AD7A", fond: "rgba(220,150,90,0.14)" },
  "Très faible": { texte: "#EF9088", fond: "rgba(226,87,76,0.16)" },
};

const PALIERS: Palier[] = ["Très faible", "Faible", "Moyen", "Bon", "Très bon"];

export interface MetriqueNotee {
  cle: string;
  label: string;
  valeur: number | null;
  unite: "%" | "x";
  palier: Palier | null;
  points: number | null; // 1 à 5
}

export interface CategorieNotee {
  cle: string;
  label: string;
  points: number | null; // 0 à 25
  metriques: MetriqueNotee[];
}

export interface ScoreCategoriel {
  lettre: Lettre;
  valeur: number; // pourcentage 0-100 (points obtenus / points possibles)
  points: number; // points bruts obtenus
  pointsMax: number; // points bruts possibles (25 × nombre de catégories calculables)
  categories: CategorieNotee[];
}

interface DefMetrique {
  cle: keyof Fondamentaux;
  label: string;
  unite: "%" | "x";
  // Seuils du plus haut palier ("Très bon") au plus bas ("Très faible"),
  // 4 bornes séparant les 5 paliers. sensPositif=true : une valeur plus
  // haute est meilleure (on descend les paliers). sensPositif=false :
  // une valeur plus basse est meilleure (ex : dette/EBITDA).
  seuils: [number, number, number, number];
  sensPositif: boolean;
}

// ⚠️ Seuils calibrés par nos soins à dire d'expert (pas de méthodologie
// propriétaire connue à répliquer) — pédagogiques, à ajuster si besoin.
// Ordonnés du meilleur palier au pire : [Très bon, Bon, Moyen, Faible]
// (en dessous de la 4e borne : Très faible).
const RENTABILITE: DefMetrique[] = [
  { cle: "margeBrute", label: "Marge brute", unite: "%", seuils: [70, 50, 30, 15], sensPositif: true },
  { cle: "margeOperationnelle", label: "Marge opérationnelle", unite: "%", seuils: [25, 15, 8, 2], sensPositif: true },
  { cle: "margeFCF", label: "Marge de FCF", unite: "%", seuils: [20, 12, 6, 0], sensPositif: true },
  { cle: "margeOCF", label: "Marge d'OCF", unite: "%", seuils: [20, 12, 6, 0], sensPositif: true },
  { cle: "conversionTresorerie", label: "Conversion de trésorerie", unite: "%", seuils: [100, 85, 70, 50], sensPositif: true },
];

const GESTION: DefMetrique[] = [
  { cle: "roic", label: "Retour sur capital investi (ROIC)", unite: "%", seuils: [20, 12, 7, 3], sensPositif: true },
  { cle: "roce", label: "Retour sur capitaux employés (ROCE)", unite: "%", seuils: [20, 12, 7, 3], sensPositif: true },
  { cle: "roe", label: "Retour sur capitaux propres (ROE)", unite: "%", seuils: [20, 12, 7, 3], sensPositif: true },
  { cle: "roa", label: "Retour sur actifs (ROA)", unite: "%", seuils: [12, 7, 4, 1], sensPositif: true },
];

const CROISSANCE: DefMetrique[] = [
  { cle: "croissanceCA", label: "Croissance du chiffre d'affaires", unite: "%", seuils: [15, 8, 3, 0], sensPositif: true },
  { cle: "croissanceResultatOperationnel", label: "Croissance du résultat opérationnel", unite: "%", seuils: [15, 8, 3, 0], sensPositif: true },
  { cle: "croissanceOCF", label: "Croissance de l'OCF", unite: "%", seuils: [15, 8, 3, 0], sensPositif: true },
  { cle: "croissanceFCF", label: "Croissance du FCF", unite: "%", seuils: [15, 8, 3, 0], sensPositif: true },
  { cle: "croissanceProfitBrut", label: "Croissance du profit brut", unite: "%", seuils: [15, 8, 3, 0], sensPositif: true },
];

const SANTE_FINANCIERE: DefMetrique[] = [
  { cle: "currentRatio", label: "Ratio de liquidité générale", unite: "x", seuils: [2, 1.5, 1.2, 1], sensPositif: true },
  { cle: "detteEbitda", label: "Dette / EBITDA", unite: "x", seuils: [1, 2, 3.5, 5], sensPositif: false },
  { cle: "cashSurPassifCourant", label: "Trésorerie / passif courant", unite: "%", seuils: [100, 60, 30, 10], sensPositif: true },
  { cle: "variationActions", label: "Variation du nombre d'actions", unite: "%", seuils: [-2, 0, 2, 5], sensPositif: false },
];

const CATEGORIES: { cle: string; label: string; metriques: DefMetrique[] }[] = [
  { cle: "rentabilite", label: "Rentabilité", metriques: RENTABILITE },
  { cle: "gestion", label: "Gestion", metriques: GESTION },
  { cle: "croissance", label: "Croissance", metriques: CROISSANCE },
  { cle: "santeFinanciere", label: "Santé financière", metriques: SANTE_FINANCIERE },
];

const POINTS_PAR_CATEGORIE = 25;
// Nombre minimum de métriques disponibles dans une catégorie pour lui
// attribuer une note — en dessous, la catégorie est exclue plutôt que
// notée sur une base trop mince.
const COUVERTURE_MIN = 2;

function palierPour(valeur: number, def: DefMetrique): Palier {
  const [tresBon, bon, moyen, faible] = def.seuils;
  if (def.sensPositif) {
    if (valeur >= tresBon) return "Très bon";
    if (valeur >= bon) return "Bon";
    if (valeur >= moyen) return "Moyen";
    if (valeur >= faible) return "Faible";
    return "Très faible";
  }
  if (valeur <= tresBon) return "Très bon";
  if (valeur <= bon) return "Bon";
  if (valeur <= moyen) return "Moyen";
  if (valeur <= faible) return "Faible";
  return "Très faible";
}

export function calculerScoreCategoriel(f: Fondamentaux | null): ScoreCategoriel | null {
  if (!f || f.erreur) return null;

  const categoriesNotees: CategorieNotee[] = CATEGORIES.map((cat) => {
    const metriques: MetriqueNotee[] = cat.metriques.map((def) => {
      const valeurBrute = f[def.cle] as number | null;
      if (valeurBrute === null) {
        return { cle: def.cle, label: def.label, valeur: null, unite: def.unite, palier: null, points: null };
      }
      const palier = palierPour(valeurBrute, def);
      const points = PALIERS.indexOf(palier) + 1; // 1 à 5
      return { cle: def.cle, label: def.label, valeur: valeurBrute, unite: def.unite, palier, points };
    });

    const pointsDisponibles = metriques.map((m) => m.points).filter((p): p is number => p !== null);
    const points =
      pointsDisponibles.length >= COUVERTURE_MIN
        ? (pointsDisponibles.reduce((a, b) => a + b, 0) / pointsDisponibles.length / 5) * POINTS_PAR_CATEGORIE
        : null;

    return { cle: cat.cle, label: cat.label, points, metriques };
  });

  const categoriesValides = categoriesNotees.filter((c) => c.points !== null);
  if (categoriesValides.length === 0) return null;

  const pointsTotal = categoriesValides.reduce((a, c) => a + (c.points as number), 0);
  const pointsMax = categoriesValides.length * POINTS_PAR_CATEGORIE;
  const pourcentage = (pointsTotal / pointsMax) * 100;

  return {
    lettre: lettrePour(pourcentage),
    valeur: Math.round(pourcentage),
    points: Math.round(pointsTotal * 100) / 100,
    pointsMax,
    categories: categoriesNotees,
  };
}
