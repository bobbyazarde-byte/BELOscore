import { DEFINITIONS_CATEGORIES, ScoreCategoriel } from "@/lib/scoreCategoriel";
import PalierBadge, { formatMetrique } from "@/components/PalierBadge";

interface Serie {
  ticker: string;
  nom: string;
  couleur: string;
  score: ScoreCategoriel | null;
}

export default function ComparaisonCategories({ series }: { series: Serie[] }) {
  return (
    <div className="space-y-4">
      {DEFINITIONS_CATEGORIES.map((cat) => (
        <div key={cat.cle} className="rounded-lg border border-bourse-ligne bg-bourse-panel/60 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg italic text-bourse-texte">{cat.label}</h3>
            <div className="flex flex-wrap gap-3">
              {series.map((s) => {
                const points = s.score?.categories.find((c) => c.cle === cat.cle)?.points ?? null;
                return (
                  <span
                    key={s.ticker}
                    className="inline-flex items-center gap-1.5 font-mono text-xs tabular"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.couleur }} />
                    <span className="text-bourse-brumeclair">{s.nom}</span>
                    <span
                      className={
                        points === null
                          ? "text-bourse-brume"
                          : points >= 20
                          ? "text-bourse-hausse"
                          : points >= 12.5
                          ? "text-bourse-orclair"
                          : "text-bourse-baisse"
                      }
                    >
                      {points !== null ? points.toFixed(2) : "—"}/25
                    </span>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="cac-scroll overflow-x-auto rounded-md border border-bourse-ligne/70">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-bourse-ligne/70 bg-bourse-nuit/40 text-left text-[11px] uppercase tracking-wider text-bourse-brumeclair">
                  <th className="px-3 py-2 font-medium">Métrique</th>
                  {series.map((s) => (
                    <th key={s.ticker} className="px-3 py-2 text-right font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.couleur }} />
                        {s.nom}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cat.metriques.map((met) => (
                  <tr key={met.cle} className="border-b border-bourse-ligne/40 last:border-0 odd:bg-bourse-nuit/20">
                    <td className="px-3 py-2 text-bourse-texte">{met.label}</td>
                    {series.map((s) => {
                      const m = s.score?.categories
                        .find((c) => c.cle === cat.cle)
                        ?.metriques.find((x) => x.cle === met.cle);
                      return (
                        <td key={s.ticker} className="px-3 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-mono tabular text-bourse-brumeclair">
                              {m ? formatMetrique(m) : "—"}
                            </span>
                            <PalierBadge palier={m?.palier} />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
