"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CAC40 } from "@/lib/tickers";
import LineChart from "@/components/LineChart";
import { DetailValeur } from "@/app/api/historique/[ticker]/route";

const PLAGES: { valeur: string; label: string }[] = [
  { valeur: "5d", label: "5 jours" },
  { valeur: "1mo", label: "1 mois" },
  { valeur: "6mo", label: "6 mois" },
  { valeur: "1y", label: "1 an" },
  { valeur: "5y", label: "5 ans" },
];

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

export default function PageValeur() {
  const params = useParams<{ ticker: string }>();
  const router = useRouter();
  const ticker = decodeURIComponent(params.ticker);
  const valeur = CAC40.find((v) => v.ticker === ticker);

  const [plage, setPlage] = useState("6mo");
  const [detail, setDetail] = useState<DetailValeur | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(false);
    try {
      const res = await fetch(
        `/api/historique/${encodeURIComponent(ticker)}?range=${plage}`,
        { cache: "no-store" }
      );
      const data = (await res.json()) as DetailValeur;
      setDetail(data);
      if (data.erreur) setErreur(true);
    } catch {
      setErreur(true);
    } finally {
      setChargement(false);
    }
  }, [ticker, plage]);

  useEffect(() => {
    charger();
  }, [charger]);

  const hausse = (detail?.variationPct ?? 0) >= 0;

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
            <div className="mb-1 text-xs uppercase tracking-[0.2em] text-bourse-or">
              {valeur?.secteur ?? "Valeur"} · {valeur?.mnemo ?? ticker}
            </div>
            <h1 className="font-display text-3xl font-medium italic text-bourse-texte sm:text-4xl">
              {valeur?.nom ?? detail?.nom ?? ticker}
            </h1>
            <p className="mt-1 font-mono text-xs text-bourse-brume">{ticker}</p>
          </div>

          <div className="flex flex-col items-start gap-1 sm:items-end">
            <span className="font-mono text-3xl tabular text-bourse-texte">
              {chargement ? "—" : formatPrix(detail?.prix, detail?.devise)}
            </span>
            {detail && detail.variationPct !== null && (
              <span
                className={`font-mono text-sm tabular ${
                  hausse ? "text-bourse-hausse" : "text-bourse-baisse"
                }`}
              >
                {hausse ? "▲" : "▼"} {detail.variation?.toFixed(2)} ({hausse ? "+" : ""}
                {detail.variationPct.toFixed(2)}%)
              </span>
            )}
          </div>
        </header>

        {erreur && (
          <div className="mb-6 rounded-md border border-bourse-baisse/40 bg-bourse-baisse/10 px-4 py-3 text-sm text-bourse-baisse">
            Données indisponibles pour cette valeur pour le moment.
          </div>
        )}

        {/* Sélecteur de période */}
        <div className="mb-4 flex flex-wrap gap-2">
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

        {/* Graphique */}
        <div className="mb-8 rounded-lg border border-bourse-ligne bg-bourse-panel/60 p-4">
          {chargement ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-bourse-brume">
              Chargement…
            </div>
          ) : (
            <LineChart points={detail?.points ?? []} devise={detail?.devise} />
          )}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Plus haut du jour", val: formatPrix(detail?.plusHautJour, detail?.devise) },
            { label: "Plus bas du jour", val: formatPrix(detail?.plusBasJour, detail?.devise) },
            { label: "Plus haut (52 sem.)", val: formatPrix(detail?.plusHaut52s, detail?.devise) },
            { label: "Plus bas (52 sem.)", val: formatPrix(detail?.plusBas52s, detail?.devise) },
            { label: "Volume", val: formatVolume(detail?.volume) },
            { label: "Clôture veille", val: formatPrix(detail?.clotureVeille, detail?.devise) },
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

        <div className="mt-8">
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
