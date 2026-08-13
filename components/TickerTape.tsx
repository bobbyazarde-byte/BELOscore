"use client";

import { Cotation } from "@/app/api/quotes/route";
import { UNIVERS } from "@/lib/tickers";

function formatPrix(n: number | null) {
  if (n === null) return "—";
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TickerTape({ quotes }: { quotes: Cotation[] }) {
  const items = quotes
    .filter((q) => !q.erreur)
    .map((q) => {
      const valeur = UNIVERS.find((v) => v.ticker === q.ticker);
      return { ...q, mnemo: valeur?.mnemo ?? q.ticker };
    });

  if (items.length === 0) return null;

  // On duplique la liste pour boucler l'animation sans coupure visible.
  const boucle = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-bourse-ligne bg-bourse-nuit/80">
      <div className="flex w-max animate-scroll-left py-2">
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
