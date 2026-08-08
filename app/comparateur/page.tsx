"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CAC40 } from "@/lib/tickers";
import { PLAGES } from "@/lib/plages";
import ComparisonChart from "@/components/ComparisonChart";
import ScoreBadge from "@/components/ScoreBadge";
import { DetailValeur } from "@/app/api/historique/[ticker]/route";
import { CotationBase } from "@/lib/yahooChart";
import { ScoreVQ } from "@/lib/score";

const MAX = 3;
const COULEURS = ["#C9A15A", "#3FB68B", "#7C9CE2"];

function formatPrix(n: number | null | undefined, devise?: string | null) {
  if (n === null || n === undefined) return "—";
  const val = n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return devise === "EUR" || !devise ? `${val} €` : `${val} ${devise}`;
}

function ComparateurContenu() {
  const params = useSearchParams();
  const router = useRouter();

  const [tickers, setTickers] = useState<string[]>([]);
  const [recherche, setRecherche] = useState("");
  const [plage, setPlage] = useState("1y");
  const [points, setPoints] = useState<Record<string, DetailValeur>>({});
  const [cotations, setCotations] = useState<Record<string, CotationBase>>({});
  const [scores, setScores] = useState<Record<string, ScoreVQ | null>>({});
  const [chargement, setChargement] = useState(false);

  // Initialise la sélection depuis l'URL (?t=TICK1,TICK2)
  useEffect(() => {
    const t = params.get("t");
    if (t) {
      setTickers(t.split(",").map(decodeURIComponent).slice(0, MAX));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mettreAJourUrl = useCallback(
    (liste: string[]) => {
      const query = liste.length > 0 ? `?t=${liste.map(encodeURIComponent).join(",")}` : "";
      router.replace(`/comparateur${query}`);
    },
    [router]
  );

  const ajouter = (ticker: string) => {
    setTickers((prev) => {
      if (prev.includes(ticker) || prev.length >= MAX) return prev;
      const next = [...prev, ticker];
      mettreAJourUrl(next);
      return next;
    });
    setRecherche("");
  };

  const retirer = (ticker: string) => {
    setTickers((prev) => {
      const next = prev.filter((t) => t !== ticker);
      mettreAJourUrl(next);
      return next;
    });
  };

  // Points du graphique : dépendent de la période choisie.
  useEffect(() => {
    if (tickers.length === 0) return;
    setChargement(true);
    Promise.all(
      tickers.map(async (t) => {
        const res = await fetch(
          `/api/historique/${encodeURIComponent(t)}?range=${plage}`,
          { cache: "no-store" }
        );
        return (await res.json()) as DetailValeur;
      })
    )
      .then((results) => {
        const map: Record<string, DetailValeur> = {};
        results.forEach((r) => (map[r.ticker] = r));
        setPoints(map);
      })
      .finally(() => setChargement(false));
  }, [tickers, plage]);

  // Cotation + score : indépendants de la période du graphique.
  useEffect(() => {
    if (tickers.length === 0) return;
    Promise.all(
      tickers.map(async (t) => {
        const [cot, fond] = await Promise.all([
          fetch(`/api/cotation/${encodeURIComponent(t)}`, { cache: "no-store" }).then((r) => r.json()),
          fetch(`/api/fondamentaux/${encodeURIComponent(t)}`, { cache: "no-store" }).then((r) => r.json()),
        ]);
        return { ticker: t, cot: cot as CotationBase, score: (fond?.score as ScoreVQ) ?? null };
      })
    ).then((results) => {
      const mapCot: Record<string, CotationBase> = {};
      const mapScore: Record<string, ScoreVQ | null> = {};
      results.forEach((r) => {
        mapCot[r.ticker] = r.cot;
        mapScore[r.ticker] = r.score;
      });
      setCotations(mapCot);
      setScores(mapScore);
    });
  }, [tickers]);

  const suggestions = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (q.length === 0) return [];
    return CAC40.filter(
      (v) =>
        !tickers.includes(v.ticker) &&
        (v.nom.toLowerCase().includes(q) || v.mnemo.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [recherche, tickers]);

  const series = tickers.map((t, i) => {
    const v = CAC40.find((x) => x.ticker === t);
    const d = points[t];
    return {
      ticker: t,
      nom: v?.nom ?? t,
      couleur: COULEURS[i % COULEURS.length],
      points: d?.points ?? [],
    };
  });

  return (
    <main className="min-h-screen pb-16">
      <div className="mx-auto max-w-5xl px-5 pt-10 sm:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-bourse-brumeclair hover:text-bourse-or"
        >
          ← Retour au screener
        </Link>

        <header className="mb-8 border-b border-bourse-ligne pb-6">
          <div className="mb-1 text-xs uppercase tracking-[0.2em] text-bourse-or">
            Comparateur
          </div>
          <h1 className="font-display text-3xl font-medium italic text-bourse-texte sm:text-4xl">
            Comparer des valeurs
          </h1>
          <p className="mt-2 max-w-lg text-sm text-bourse-brumeclair">
            Jusqu&rsquo;à {MAX} valeurs, performance ramenée en base 100 pour
            comparer des titres à des cours très différents.
          </p>
        </header>

        {/* Sélection */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {tickers.map((t, i) => {
            const v = CAC40.find((x) => x.ticker === t);
            return (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm text-bourse-texte"
                style={{ borderColor: COULEURS[i % COULEURS.length] + "80" }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: COULEURS[i % COULEURS.length] }}
                />
                {v?.nom ?? t}
                <button
                  onClick={() => retirer(t)}
                  aria-label={`Retirer ${v?.nom ?? t}`}
                  className="text-bourse-brume hover:text-bourse-baisse"
                >
                  ×
                </button>
              </span>
            );
          })}

          {tickers.length < MAX && (
            <div className="relative">
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Ajouter une valeur…"
                className="w-52 rounded-md border border-bourse-ligne bg-bourse-panel px-3 py-1.5 text-sm text-bourse-texte placeholder:text-bourse-brume focus:border-bourse-or focus:outline-none focus:ring-1 focus:ring-bourse-or"
              />
              {suggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-64 overflow-hidden rounded-md border border-bourse-ligne bg-bourse-nuit shadow-lg">
                  {suggestions.map((s) => (
                    <button
                      key={s.ticker}
                      onClick={() => ajouter(s.ticker)}
                      className="block w-full px-3 py-2 text-left text-sm text-bourse-texte hover:bg-bourse-ligne/40"
                    >
                      {s.nom}{" "}
                      <span className="font-mono text-[11px] text-bourse-brume">
                        {s.mnemo}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {tickers.length === 0 ? (
          <div className="rounded-lg border border-bourse-ligne bg-bourse-panel/60 p-10 text-center text-sm text-bourse-brumeclair">
            Ajoute au moins deux valeurs pour lancer une comparaison.
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {PLAGES.filter((p) => p.valeur !== "1d").map((p) => (
                <button
                  key={p.valeur}
                  onClick={() => setPlage(p.valeur)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                    plage === p.valeur
                      ? "border-bourse-or/50 bg-bourse-or/10 text-bourse-orclair"
                      : "border-bourse-ligne text-bourse-brumeclair hover:text-bourse-texte"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="mb-8 rounded-lg border border-bourse-ligne bg-bourse-panel/60 p-4">
              {chargement ? (
                <div className="flex h-[280px] items-center justify-center text-sm text-bourse-brume">
                  Chargement…
                </div>
              ) : (
                <ComparisonChart series={series} />
              )}
            </div>

            {/* Tableau comparatif */}
            <div className="cac-scroll overflow-x-auto rounded-lg border border-bourse-ligne bg-bourse-panel/60">
              <table className="w-full min-w-[480px] border-collapse">
                <tbody>
                  <tr className="border-b border-bourse-ligne/60">
                    <td className="px-4 py-3 text-xs uppercase tracking-wider text-bourse-brumeclair">
                      Score
                    </td>
                    {tickers.map((t) => (
                      <td key={t} className="px-4 py-3 text-right">
                        <div className="flex justify-end">
                          <ScoreBadge lettre={scores[t]?.lettre ?? null} />
                        </div>
                      </td>
                    ))}
                  </tr>
                  {[
                    { label: "Cours", get: (d?: CotationBase) => formatPrix(d?.prix, d?.devise) },
                    {
                      label: "Variation jour",
                      get: (d?: CotationBase) =>
                        d && d.variationPct !== null
                          ? `${d.variationPct >= 0 ? "+" : ""}${d.variationPct.toFixed(2)}%`
                          : "—",
                    },
                    { label: "Plus haut 52 sem.", get: (d?: CotationBase) => formatPrix(d?.plusHaut52s, d?.devise) },
                    { label: "Plus bas 52 sem.", get: (d?: CotationBase) => formatPrix(d?.plusBas52s, d?.devise) },
                  ].map((ligne) => (
                    <tr key={ligne.label} className="border-b border-bourse-ligne/60">
                      <td className="px-4 py-3 text-xs uppercase tracking-wider text-bourse-brumeclair">
                        {ligne.label}
                      </td>
                      {tickers.map((t) => (
                        <td
                          key={t}
                          className="px-4 py-3 text-right font-mono text-sm tabular text-bourse-texte"
                        >
                          {ligne.get(cotations[t])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function PageComparateur() {
  return (
    <Suspense fallback={null}>
      <ComparateurContenu />
    </Suspense>
  );
}
