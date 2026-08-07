"use client";

import { useMemo, useState } from "react";

interface Point {
  date: string;
  cloture: number;
}

export default function LineChart({
  points,
  devise,
}: {
  points: Point[];
  devise?: string | null;
}) {
  const [survol, setSurvol] = useState<number | null>(null);

  const largeur = 720;
  const hauteur = 260;
  const marge = { haut: 16, bas: 28, gauche: 8, droite: 8 };

  const { chemin, aire, min, max, coords } = useMemo(() => {
    if (points.length < 2) {
      return { chemin: "", aire: "", min: 0, max: 0, coords: [] as { x: number; y: number }[] };
    }
    const valeurs = points.map((p) => p.cloture);
    const min = Math.min(...valeurs);
    const max = Math.max(...valeurs);
    const largeurUtile = largeur - marge.gauche - marge.droite;
    const hauteurUtile = hauteur - marge.haut - marge.bas;
    const pas = largeurUtile / (points.length - 1);

    const coords = points.map((p, i) => ({
      x: marge.gauche + i * pas,
      y:
        max === min
          ? marge.haut + hauteurUtile / 2
          : marge.haut + hauteurUtile - ((p.cloture - min) / (max - min)) * hauteurUtile,
    }));

    const chemin = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
    const aire = `${chemin} L${coords[coords.length - 1].x.toFixed(1)},${hauteur - marge.bas} L${coords[0].x.toFixed(1)},${hauteur - marge.bas} Z`;

    return { chemin, aire, min, max, coords };
  }, [points]);

  if (points.length < 2) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-bourse-brume">
        Historique indisponible.
      </div>
    );
  }

  const hausse = points[points.length - 1].cloture >= points[0].cloture;
  const couleur = hausse ? "#3FB68B" : "#E2574C";
  const point = survol !== null ? points[survol] : null;
  const coord = survol !== null ? coords[survol] : null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${largeur} ${hauteur}`}
        className="w-full"
        onMouseLeave={() => setSurvol(null)}
      >
        <defs>
          <linearGradient id="degradeAire" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={couleur} stopOpacity="0.25" />
            <stop offset="100%" stopColor={couleur} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* lignes de repère horizontales */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={marge.gauche}
            x2={largeur - marge.droite}
            y1={marge.haut + f * (hauteur - marge.haut - marge.bas)}
            y2={marge.haut + f * (hauteur - marge.haut - marge.bas)}
            stroke="#1C2C48"
            strokeWidth={1}
          />
        ))}

        <path d={aire} fill="url(#degradeAire)" />
        <path d={chemin} fill="none" stroke={couleur} strokeWidth={2} strokeLinejoin="round" />

        {/* zone interactive de survol */}
        <rect
          x={marge.gauche}
          y={0}
          width={largeur - marge.gauche - marge.droite}
          height={hauteur}
          fill="transparent"
          onMouseMove={(e) => {
            const rect = (e.target as SVGRectElement).getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            const idx = Math.round(ratio * (points.length - 1));
            setSurvol(Math.min(Math.max(idx, 0), points.length - 1));
          }}
        />

        {coord && (
          <>
            <line
              x1={coord.x}
              x2={coord.x}
              y1={marge.haut}
              y2={hauteur - marge.bas}
              stroke="#5C6C8A"
              strokeDasharray="3 3"
            />
            <circle cx={coord.x} cy={coord.y} r={3.5} fill={couleur} stroke="#080D17" strokeWidth={1.5} />
          </>
        )}
      </svg>

      <div className="mt-1 flex justify-between font-mono text-[11px] text-bourse-brume">
        <span>{formatDate(points[0].date)}</span>
        <span>{formatDate(points[points.length - 1].date)}</span>
      </div>

      <div className="pointer-events-none absolute right-2 top-2 text-right font-mono text-xs text-bourse-brumeclair">
        <div>Haut {max.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}</div>
        <div>Bas {min.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}</div>
      </div>

      {point && (
        <div className="pointer-events-none absolute left-2 top-2 rounded-md border border-bourse-ligne bg-bourse-nuit/90 px-2.5 py-1.5 font-mono text-xs text-bourse-texte">
          <div className="text-bourse-brumeclair">{formatDate(point.date)}</div>
          <div>
            {point.cloture.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
            {devise === "EUR" || !devise ? "€" : devise}
          </div>
        </div>
      )}
    </div>
  );
}
