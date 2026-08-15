"use client";

import { Cotation } from "@/app/api/quotes/route";
import { Valeur } from "@/lib/tickers";

function formatPrix(n: number | null) {
  if (n === null) return "—";
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Secondes par valeur, calibré sur le rythme d'origine (45s pour 40
// valeurs). La durée de l'animation CSS est fixe par défaut : sans cet
// ajustement, un univers plus grand (120 ou 500 valeurs) doit parcourir
// une distance bien plus longue dans le même temps, donc défile beaucoup
// plus vite. On adapte la durée pour garder une vitesse de défilement
// à peu près constante quel que soit le nombre de valeurs.
const SECONDES_PAR_VALEUR = 45 / 40;
const DUREE_MIN = 30;
const DUREE_MAX = 240;

export default function TickerTape({ quotes, valeurs }: { quotes: Cotation[]; valeurs: Valeur[] }) {
  const items = quotes
    .filter((q) => !q.erreur)
    .map((q) => {
      const valeur = valeurs.find((v) => v.ticker === q.ticker);
      return { ...q, mnemo: valeur?.mnemo ?? q.ticker };
    });

  if (items.length === 0) return null;

  // On duplique la liste pour boucler l'animation sans coupure visible.
  const boucle = [...items, ...items];
  const duree = Math.min(
    DUREE_MAX,
    Math.max(DUREE_MIN, Math.round(items.length * SECONDES_PAR_VALEUR))
  );

  return (
    <div className="relative overflow-hidden border-y border-bourse-ligne bg-bourse-nuit/80">
      <div
        className="flex w-max animate-scroll-left py-2"
        style={{ animationDuration: `${duree}s` }}
      >
        {boucle.map((q, i) => {
          const hausse = (q.variationPct ?? 0) >= 0;
          return (
            <div
              key={`${q.ticker}-${i}`}
              className="flex shrink-0 items-baseline gap-2 border-r border-bourse-ligne/70 px-4 font-mono text-[13px]"
            >
              <span className="text-bourse-brumeclair">{q.mnemo}</span>
              <span className="tabular text-bourse-texte">{formatPrix(q.prix)}</span>
              <span
                className={`tabular ${hausse ? "text-bourse-hausse" : "text-bourse-baisse"}`}
              >
                {hausse ? "▲" : "▼"} {q.variationPct !== null ? `${q.variationPct >= 0 ? "+" : ""}${q.variationPct.toFixed(2)}%` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
