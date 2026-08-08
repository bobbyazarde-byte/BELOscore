"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CAC40 } from "@/lib/tickers";
import { PLAGES } from "@/lib/plages";
import LineChart from "@/components/LineChart";
import ScoreBadge from "@/components/ScoreBadge";
import { useFavoris } from "@/lib/useFavoris";
import { DetailValeur } from "@/app/api/historique/[ticker]/route";
import { CotationBase } from "@/lib/yahooChart";
import { ScoreVQ, Metrique } from "@/lib/score";

function formatPrix(n: number | null | undefined, devise?: string | null) {
  if (n === null || n === undefined) return "—";
  const val = n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return devise === "EUR" || !devise ? `${val} €` : `${val} ${devise}`;
}

function formatVolume(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} k`;
  return `${n}`;
}

function formatMetrique(m: Metrique) {
  if (m.valeur === null) return "—";
  return m.unite === "%" ? `${m.valeur.toFixed(2)}%` : `${m.valeur.toFixed(2)}x`;
}

function BlocMetriques({ titre, score, metriques }: { titre: string; score: number | null; metriques: Metrique[] }) {
  return (
    <div className="rounded-lg border border-bourse-ligne bg-bourse-panel/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg italic text-bourse-texte">{titre}</h3>
        <span className="font-mono text-sm tabular text-bourse-brumeclair">
          {score !== null ? `${score}/100` : "—"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {metriques.map((m) => (
          <div key={m.cle} className="rounded-md border border-bourse-ligne/70 bg-bourse-nuit/50 p-3">
            <div className="text-[11px] uppercase tracking-wider text-bourse-brumeclair">{m.label}</div>
            <div
              className={`mt-1 font-mono text-lg tabular ${
                m.favorable === null
                  ? "text-bourse-brume"
                  : m.favorable
                  ? "text-bourse-hausse"
                  : "text-bourse-baisse"
              }`}
            >
              {formatMetrique(m)}
            </div>
            <div className="mt-0.5 text-[11px] text-bourse-brume">{m.seuil}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PageValeur() {
  const params = useParams<{ ticker: string }>();
  const router = useRouter();
  const ticker = decodeURIComponent(params.ticker);
  const valeur = CAC40.find((v) => v.ticker === ticker);

  const [plage, setPlage] = useState("1y");
  const [points, setPoints] = useState<DetailValeur | null>(null);
  const [cotation, setCotation] = useState<CotationBase | null>(null);
  const [score, setScore] = useState<ScoreVQ | null>(null);
  const [chargementGraphique, setChargementGraphique] = useState(true);
  const [chargementFiche, setChargementFiche] = useState(true);
  const [erreur, setErreur] = useState(false);
  const { estFavori, basculer: basculerFavori, pret: favorisPrets } = useFavoris();

  const chargerGraphique = useCallback(async () => {
    setChargementGraphique(true);
    try {
      const res = await fetch(
        `/api/historique/${encodeURIComponent(ticker)}?range=${plage}`,
        { cache: "no-store" }
      );
      const data = (await res.json()) as DetailValeur;
      setPoints(data);
    } catch {
      setPoints(null);
    } finally {
      setChargementGraphique(false);
    }
  }, [ticker, plage]);

  useEffect(() => {
    chargerGraphique();
  }, [chargerGraphique]);

  useEffect(() => {
    let annule = false;
    setChargementFiche(true);
    setErreur(false);

    Promise.all([
      fetch(`/api/cotation/${encodeURIComponent(ticker)}`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/fondamentaux/${encodeURIComponent(ticker)}`, { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([cot, fond]) => {
        if (annule) return;
        setCotation(cot as CotationBase);
        setScore((fond?.score as ScoreVQ) ?? null);
        if (cot?.erreur) setErreur(true);
      })
      .catch(() => {
        if (!annule) setErreur(true);
      })
      .finally(() => {
        if (!annule) setChargementFiche(false);
      });

    return () => {
      annule = true;
    };
  }, [ticker]);

  const hausse = (cotation?.variationPct ?? 0) >= 0;

  const performancePeriode = (() => {
    const pts = points?.points;
    if (!pts || pts.length < 2) return null;
    const debut = pts[0].cloture;
    const fin = pts[pts.length - 1].cloture;
    if (!debut) return null;
    return ((fin - debut) / debut) * 100;
  })();

  return (
    <main className="min-h-screen pb-16">
      <div className="mx-auto max-w-4xl px-5 pt-10 sm:px-8">
        <button
          onClick={() => router.push("/")}
          className="mb-6 inline-flex items-center gap-1 text-sm text-bourse-brumeclair hover:text-bourse-or"
        >
          ← Retour au screener
        </button>

        <header className="mb-8 flex flex-col gap-3 border-b border-bourse-ligne pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-bourse-or">
              <button
                onClick={() => basculerFavori(ticker)}
                disabled={!favorisPrets}
                aria-label={estFavori(ticker) ? "Retirer des favoris" : "Ajouter aux favoris"}
                className={`text-sm leading-none ${
                  estFavori(ticker) ? "text-bourse-or" : "text-bourse-brume hover:text-bourse-brumeclair"
                }`}
              >
                {estFavori(ticker) ? "★" : "☆"}
              </button>
              {valeur?.secteur ?? "Valeur"} · {valeur?.mnemo ?? ticker}
            </div>
            <h1 className="font-display text-3xl font-medium italic text-bourse-texte sm:text-4xl">
              {valeur?.nom ?? cotation?.nom ?? ticker}
            </h1>
            <p className="mt-1 font-mono text-xs text-bourse-brume">{ticker}</p>
          </div>

          <div className="flex flex-col items-start gap-1 sm:items-end">
            <div className="flex items-center gap-2">
              <span className="font-mono text-3xl tabular text-bourse-texte">
                {chargementFiche ? "—" : formatPrix(cotation?.prix, cotation?.devise)}
              </span>
              <ScoreBadge lettre={score?.lettre ?? null} taille="lg" />
            </div>
            {cotation && cotation.variationPct !== null && (
              <span
                className={`font-mono text-sm tabular ${
                  hausse ? "text-bourse-hausse" : "text-bourse-baisse"
                }`}
              >
                {hausse ? "▲" : "▼"} {cotation.variation?.toFixed(2)} ({hausse ? "+" : ""}
                {cotation.variationPct.toFixed(2)}%)
              </span>
            )}
          </div>
        </header>

        {erreur && (
          <div className="mb-6 rounded-md border border-bourse-baisse/40 bg-bourse-baisse/10 px-4 py-3 text-sm text-bourse-baisse">
            Données indisponibles pour cette valeur pour le moment.
          </div>
        )}

        {/* Sélecteur de période + performance sur la période affichée */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {PLAGES.map((p) => (
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

          {!chargementGraphique && performancePeriode !== null && (
            <span
              className={`font-mono text-sm tabular ${
                performancePeriode >= 0 ? "text-bourse-hausse" : "text-bourse-baisse"
              }`}
            >
              {performancePeriode >= 0 ? "▲" : "▼"} {performancePeriode >= 0 ? "+" : ""}
              {performancePeriode.toFixed(2)}%{" "}
              <span className="text-bourse-brumeclair">
                sur {(PLAGES.find((p) => p.valeur === plage)?.label ?? "la période").toLowerCase()}
              </span>
            </span>
          )}
        </div>

        {/* Graphique */}
        <div className="mb-8 rounded-lg border border-bourse-ligne bg-bourse-panel/60 p-4">
          {chargementGraphique ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-bourse-brume">
              Chargement…
            </div>
          ) : (
            <LineChart points={points?.points ?? []} devise={points?.devise ?? cotation?.devise} />
          )}
        </div>

        {/* Statistiques */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Plus haut du jour", val: formatPrix(cotation?.plusHautJour, cotation?.devise) },
            { label: "Plus bas du jour", val: formatPrix(cotation?.plusBasJour, cotation?.devise) },
            { label: "Plus haut (52 sem.)", val: formatPrix(cotation?.plusHaut52s, cotation?.devise) },
            { label: "Plus bas (52 sem.)", val: formatPrix(cotation?.plusBas52s, cotation?.devise) },
            { label: "Volume", val: formatVolume(cotation?.volume) },
            { label: "Clôture veille", val: formatPrix(cotation?.clotureVeille, cotation?.devise) },
            { label: "Secteur", val: valeur?.secteur ?? "—" },
            { label: "Code Euronext", val: valeur?.mnemo ?? "—" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-bourse-ligne bg-bourse-panel/60 p-3"
            >
              <div className="text-[11px] uppercase tracking-wider text-bourse-brumeclair">
                {s.label}
              </div>
              <div className="mt-1 font-mono text-sm tabular text-bourse-texte">{s.val}</div>
            </div>
          ))}
        </div>

        {/* Détail du score Value/Qualité */}
        {score ? (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <BlocMetriques titre="Approche Value" score={score.value.valeur} metriques={score.value.metriques} />
            <BlocMetriques titre="Approche Qualité" score={score.quality.valeur} metriques={score.quality.metriques} />
          </div>
        ) : (
          !chargementFiche && (
            <div className="mb-8 rounded-lg border border-bourse-ligne bg-bourse-panel/60 p-4 text-sm text-bourse-brumeclair">
              Données fondamentales indisponibles pour cette valeur pour le moment — le score
              Value/Qualité ne peut pas être calculé.
            </div>
          )
        )}

        <p className="mb-8 text-xs text-bourse-brume">
          Score = 50% approche value (rendement des bénéfices, du cash-flow
          libre, VE/EBITDA, P/B) + 50% approche qualité (ROE, ROA, marge
          opérationnelle, dette nette/EBITDA, croissance du chiffre
          d&rsquo;affaires). Un score n&rsquo;est calculé que si au moins 2
          métriques sont disponibles par approche, pour éviter qu&rsquo;une
          seule donnée isolée fausse la note. Seuils indicatifs, à but
          pédagogique — ne constitue pas un conseil en investissement.
        </p>

        <div>
          <Link
            href={`/comparateur?t=${encodeURIComponent(ticker)}`}
            className="inline-flex items-center gap-2 rounded-md border border-bourse-or/40 bg-bourse-or/10 px-4 py-2 text-sm font-medium text-bourse-orclair transition hover:bg-bourse-or/20"
          >
            Comparer cette valeur à une autre
          </Link>
        </div>
      </div>
    </main>
  );
}
