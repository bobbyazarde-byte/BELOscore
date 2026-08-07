"use client";

interface Serie {
  ticker: string;
  nom: string;
  couleur: string;
  points: { date: string; cloture: number }[];
}

// Superpose plusieurs valeurs en base 100 (performance relative depuis le
// début de la période) pour pouvoir les comparer malgré des cours très
// différents (ex : Hermès à 2000€ vs Renault à 8€).
export default function ComparisonChart({ series }: { series: Serie[] }) {
  const largeur = 720;
  const hauteur = 280;
  const marge = { haut: 16, bas: 28, gauche: 8, droite: 8 };

  const seriesValides = series.filter((s) => s.points.length > 1);
  if (seriesValides.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-bourse-brume">
        Historique indisponible.
      </div>
    );
  }

  const base100 = seriesValides.map((s) => {
    const depart = s.points[0].cloture;
    return {
      ...s,
      valeurs: s.points.map((p) => (p.cloture / depart) * 100),
    };
  });

  const tousMin = Math.min(...base100.flatMap((s) => s.valeurs));
  const tousMax = Math.max(...base100.flatMap((s) => s.valeurs));
  const largeurUtile = largeur - marge.gauche - marge.droite;
  const hauteurUtile = hauteur - marge.haut - marge.bas;

  const chemins = base100.map((s) => {
    const pas = largeurUtile / (s.valeurs.length - 1);
    const coords = s.valeurs.map((v, i) => {
      const x = marge.gauche + i * pas;
      const y =
        tousMax === tousMin
          ? marge.haut + hauteurUtile / 2
          : marge.haut + hauteurUtile - ((v - tousMin) / (tousMax - tousMin)) * hauteurUtile;
      return { x, y };
    });
    const d = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
    return { ticker: s.ticker, nom: s.nom, couleur: s.couleur, d, derniereValeur: s.valeurs[s.valeurs.length - 1] };
  });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

  const dates = seriesValides[0].points;

  return (
    <div>
      <svg viewBox={`0 0 ${largeur} ${hauteur}`} className="w-full">
        {/* ligne de référence base 100 */}
        {(() => {
          const y =
            tousMax === tousMin
              ? marge.haut + hauteurUtile / 2
              : marge.haut + hauteurUtile - ((100 - tousMin) / (tousMax - tousMin)) * hauteurUtile;
          return (
            <line
              x1={marge.gauche}
              x2={largeur - marge.droite}
              y1={y}
              y2={y}
              stroke="#1C2C48"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          );
        })()}

        {chemins.map((c) => (
          <path key={c.ticker} d={c.d} fill="none" stroke={c.couleur} strokeWidth={2} strokeLinejoin="round" />
        ))}
      </svg>

      <div className="mt-1 flex justify-between font-mono text-[11px] text-bourse-brume">
        <span>{formatDate(dates[0].date)}</span>
        <span>{formatDate(dates[dates.length - 1].date)}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        {chemins.map((c) => {
          const perf = c.derniereValeur - 100;
          return (
            <div key={c.ticker} className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.couleur }} />
              <span className="text-bourse-texte">{c.nom}</span>
              <span
                className={`font-mono tabular ${perf >= 0 ? "text-bourse-hausse" : "text-bourse-baisse"}`}
              >
                {perf >= 0 ? "+" : ""}
                {perf.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
