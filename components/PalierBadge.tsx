import { Palier, COULEURS_PALIER, MetriqueNotee } from "@/lib/scoreCategoriel";

export function formatMetrique(m: { valeur: number | null; unite: "%" | "x" }) {
  if (m.valeur === null) return "—";
  return m.unite === "%" ? `${m.valeur.toFixed(2)}%` : `${m.valeur.toFixed(2)}x`;
}

export default function PalierBadge({ palier }: { palier: Palier | null | undefined }) {
  if (!palier) {
    return (
      <span className="rounded-md border border-bourse-ligne px-2 py-1 text-xs text-bourse-brume">
        —
      </span>
    );
  }
  const c = COULEURS_PALIER[palier];
  return (
    <span
      className="whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium"
      style={{ color: c.texte, backgroundColor: c.fond }}
    >
      {palier}
    </span>
  );
}

export type { MetriqueNotee };
