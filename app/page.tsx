"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UNIVERSS, CodeUnivers, UNIVERS_PAR_DEFAUT, secteursPour, Secteur } from "@/lib/tickers";
import { Cotation } from "@/app/api/quotes/route";
import TickerTape from "@/components/TickerTape";
import Sparkline from "@/components/Sparkline";
import ScoreBadge from "@/components/ScoreBadge";
import { useFavoris } from "@/lib/useFavoris";
import { formatPrix, formatVolume } from "@/lib/format";

const MAX_COMPARATEUR = 3;
const CLE_UNIVERS = "beloscore-univers";
const PREFIXE_CACHE_COTATIONS = "beloscore-quotes-";

interface DonneesCache {
  cotations: Record<string, Cotation>;
  indice: Cotation | null;
  misAJour: string;
}

function lireCacheCotations(univers: CodeUnivers): DonneesCache | null {
  try {
    const brut = window.sessionStorage.getItem(PREFIXE_CACHE_COTATIONS + univers);
    return brut ? (JSON.parse(brut) as DonneesCache) : null;
  } catch {
    return null;
  }
}

function ecrireCacheCotations(univers: CodeUnivers, data: DonneesCache) {
  try {
    window.sessionStorage.setItem(PREFIXE_CACHE_COTATIONS + univers, JSON.stringify(data));
  } catch {
    // sessionStorage indisponible ou plein : on continue simplement sans
    // cache, le prochain chargement referea un appel réseau normal.
  }
}

type Colonne =
  | "nom"
  | "secteur"
  | "prix"
  | "variationPct"
  | "score"
  | "volume"
  | "plusHautJour"
  | "plusBasJour";

interface Ligne {
  nom: string;
  ticker: string;
  mnemo: string;
  secteur: Secteur;
  cotation?: Cotation;
}

const ETATS: Record<string, string> = {
  REGULAR: "Séance en cours",
  PRE: "Avant-bourse",
  POST: "Après-bourse",
  CLOSED: "Clôturé",
};

const LIEU_PAR_UNIVERS: Record<CodeUnivers, string> = {
  sbf120: "Place de Paris · Euronext",
  sp500: "Wall Street · NYSE / Nasdaq",
};

export default function Page() {
  const [univers, setUnivers] = useState<CodeUnivers>(UNIVERS_PAR_DEFAUT);
  const [universPret, setUniversPret] = useState(false);
  const [cotations, setCotations] = useState<Record<string, Cotation>>({});
  const [indice, setIndice] = useState<Cotation | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [misAJourLe, setMisAJourLe] = useState<Date | null>(null);

  const [recherche, setRecherche] = useState("");
  const [secteur, setSecteur] = useState<Secteur | "Tous">("Tous");
  const [tri, setTri] = useState<{ colonne: Colonne; sens: 1 | -1 }>({
    colonne: "nom",
    sens: 1,
  });
  const [comparateur, setComparateur] = useState<string[]>([]);
  const [favorisUniquement, setFavorisUniquement] = useState(false);
  const { estFavori, basculer: basculerFavori, pret: favorisPrets } = useFavoris();

  // Charge le choix d'univers précédemment enregistré (une fois, au montage).
  useEffect(() => {
    try {
      const enregistre = window.localStorage.getItem(CLE_UNIVERS);
      if (enregistre === "sbf120" || enregistre === "sp500") {
        setUnivers(enregistre);
      }
    } catch {
      // localStorage indisponible : on reste sur l'univers par défaut.
    } finally {
      setUniversPret(true);
    }
  }, []);

  const changerUnivers = (code: CodeUnivers) => {
    setUnivers(code);
    setSecteur("Tous");
    setComparateur([]);
    try {
      window.localStorage.setItem(CLE_UNIVERS, code);
    } catch {
      // silencieux
    }
  };

  const basculerComparateur = (ticker: string) => {
    setComparateur((prev) => {
      if (prev.includes(ticker)) return prev.filter((t) => t !== ticker);
      if (prev.length >= MAX_COMPARATEUR) return prev;
      return [...prev, ticker];
    });
  };

  const charger = useCallback(async () => {
    setChargement(true);
    setErreurGlobale(null);
    try {
      const res = await fetch(`/api/quotes?univers=${univers}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Réponse API invalide");
      const data = await res.json();
      const map: Record<string, Cotation> = {};
      for (const q of data.quotes as Cotation[]) map[q.ticker] = q;
      setCotations(map);
      setIndice(data.index ?? null);
      setMisAJourLe(new Date(data.updatedAt));
      ecrireCacheCotations(univers, {
        cotations: map,
        indice: data.index ?? null,
        misAJour: data.updatedAt,
      });
    } catch (e) {
      setErreurGlobale(
        "Impossible de récupérer les cours pour le moment. Réessayez dans quelques instants."
      );
    } finally {
      setChargement(false);
    }
  }, [univers]);

  useEffect(() => {
    if (!universPret) return;
    // On ne recharge automatiquement que s'il n'existe aucune donnée en
    // cache pour cet univers dans cette session de navigation — sinon on
    // affiche instantanément les dernières données connues (avec leur
    // horodatage) plutôt que de refaire tout le tableau à chaque retour
    // sur la page. Le chargement des cours ne se déclenche donc qu'au
    // tout premier affichage d'un univers, ou via le bouton "Actualiser".
    const cache = lireCacheCotations(univers);
    if (cache) {
      setCotations(cache.cotations);
      setIndice(cache.indice);
      setMisAJourLe(new Date(cache.misAJour));
      setChargement(false);
    } else {
      charger();
    }
  }, [univers, universPret, charger]);

  const valeursUnivers = UNIVERSS[univers].valeurs;
  const secteurs = useMemo(() => secteursPour(univers), [univers]);

  const lignes: Ligne[] = useMemo(
    () =>
      valeursUnivers.map((v) => ({
        nom: v.nom,
        ticker: v.ticker,
        mnemo: v.mnemo,
        secteur: v.secteur,
        cotation: cotations[v.ticker],
      })),
    [valeursUnivers, cotations]
  );

  const lignesFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    let res = lignes.filter((l) => {
      const matchTexte =
        q.length === 0 ||
        l.nom.toLowerCase().includes(q) ||
        l.mnemo.toLowerCase().includes(q) ||
        l.ticker.toLowerCase().includes(q);
      const matchSecteur = secteur === "Tous" || l.secteur === secteur;
      const matchFavori = !favorisUniquement || estFavori(l.ticker);
      return matchTexte && matchSecteur && matchFavori;
    });

    res = res.sort((a, b) => {
      const { colonne, sens } = tri;
      if (colonne === "nom" || colonne === "secteur") {
        return sens * a[colonne].localeCompare(b[colonne], "fr");
      }
      if (colonne === "score") {
        const va = a.cotation?.score?.valeur ?? null;
        const vb = b.cotation?.score?.valeur ?? null;
        if (va === null && vb === null) return 0;
        if (va === null) return 1;
        if (vb === null) return -1;
        return sens * (va - vb);
      }
      const va = a.cotation?.[colonne] ?? null;
      const vb = b.cotation?.[colonne] ?? null;
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      return sens * (va - vb);
    });

    return res;
  }, [lignes, recherche, secteur, favorisUniquement, estFavori, tri]);

  const basculerTri = (colonne: Colonne) => {
    setTri((prev) =>
      prev.colonne === colonne
        ? { colonne, sens: prev.sens === 1 ? -1 : 1 }
        : { colonne, sens: 1 }
    );
  };

  const enTeteTri = (colonne: Colonne, label: string, alignRight = false) => {
    const actif = tri.colonne === colonne;
    return (
      <th
        onClick={() => basculerTri(colonne)}
        className={`cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-xs font-medium uppercase tracking-wider text-bourse-brumeclair transition hover:text-bourse-or ${
          alignRight ? "text-right" : "text-left"
        }`}
      >
        <span className={`inline-flex items-center gap-1 ${alignRight ? "flex-row-reverse" : ""}`}>
          {label}
          <span className={`text-[10px] ${actif ? "text-bourse-or" : "text-bourse-ligne"}`}>
            {actif ? (tri.sens === 1 ? "▲" : "▼") : "▲"}
          </span>
        </span>
      </th>
    );
  };

  const hausseIndice = (indice?.variationPct ?? 0) >= 0;

  return (
    <main className="min-h-screen pb-16">
      {/* Bandeau défilant */}
      <TickerTape quotes={Object.values(cotations)} valeurs={valeursUnivers} />

      <div className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
        {/* En-tête */}
        <header className="mb-6 flex flex-col gap-6 border-b border-bourse-ligne pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-bourse-or">
              <span className="h-1.5 w-1.5 animate-blink-slow rounded-full bg-bourse-hausse" />
              {LIEU_PAR_UNIVERS[univers]}
            </div>
            <h1 className="font-display text-4xl font-medium italic text-bourse-texte sm:text-5xl">
              BELOSCORE
            </h1>
            <p className="mt-2 max-w-md text-sm text-bourse-brumeclair">
              Screener de l&rsquo;indice {UNIVERSS[univers].nom}, cours en
              temps différé fournis par Yahoo Finance.
            </p>
          </div>

          <div className="flex flex-col items-start gap-1 sm:items-end">
            <span className="text-xs uppercase tracking-widest text-bourse-brumeclair">
              {UNIVERSS[univers].indiceNom}
            </span>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl tabular text-bourse-texte">
                {indice?.prix !== null && indice?.prix !== undefined
                  ? indice.prix.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "—"}
              </span>
              {indice && indice.variationPct !== null && (
                <span
                  className={`font-mono text-sm tabular ${
                    hausseIndice ? "text-bourse-hausse" : "text-bourse-baisse"
                  }`}
                >
                  {hausseIndice ? "▲" : "▼"} {indice.variation?.toFixed(2)} (
                  {hausseIndice ? "+" : ""}
                  {indice.variationPct.toFixed(2)}%)
                </span>
              )}
            </div>
            <span className="text-xs text-bourse-brume">
              {misAJourLe
                ? `Mis à jour à ${misAJourLe.toLocaleTimeString("fr-FR")}`
                : "Chargement…"}
              {indice?.etatMarche && ` · ${ETATS[indice.etatMarche] ?? indice.etatMarche}`}
            </span>
          </div>
        </header>

        {/* Sélecteur d'univers */}
        <div className="mb-6 flex gap-2">
          {(Object.keys(UNIVERSS) as CodeUnivers[]).map((code) => (
            <button
              key={code}
              onClick={() => changerUnivers(code)}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                univers === code
                  ? "border-bourse-or/50 bg-bourse-or/10 text-bourse-orclair"
                  : "border-bourse-ligne text-bourse-brumeclair hover:text-bourse-texte"
              }`}
            >
              {UNIVERSS[code].nom}
            </button>
          ))}
        </div>

        {/* Filtres */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une valeur, un code…"
              className="w-full max-w-xs rounded-md border border-bourse-ligne bg-bourse-panel px-3 py-2 text-sm text-bourse-texte placeholder:text-bourse-brume focus:border-bourse-or focus:outline-none focus:ring-1 focus:ring-bourse-or sm:w-64"
            />
            <select
              value={secteur}
              onChange={(e) => setSecteur(e.target.value as Secteur | "Tous")}
              className="w-full max-w-xs rounded-md border border-bourse-ligne bg-bourse-panel px-3 py-2 text-sm text-bourse-texte focus:border-bourse-or focus:outline-none focus:ring-1 focus:ring-bourse-or sm:w-64"
            >
              <option value="Tous">Tous les secteurs</option>
              {secteurs.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button
              onClick={() => setFavorisUniquement((v) => !v)}
              className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition ${
                favorisUniquement
                  ? "border-bourse-or/50 bg-bourse-or/10 text-bourse-orclair"
                  : "border-bourse-ligne text-bourse-brumeclair hover:text-bourse-texte"
              }`}
            >
              <span>{favorisUniquement ? "★" : "☆"}</span>
              Favoris
            </button>
          </div>

          <button
            onClick={charger}
            disabled={chargement}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-bourse-or/40 bg-bourse-or/10 px-4 py-2 text-sm font-medium text-bourse-orclair transition hover:bg-bourse-or/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {chargement ? "Actualisation…" : "Actualiser"}
          </button>
        </div>

        {erreurGlobale && (
          <div className="mb-5 rounded-md border border-bourse-baisse/40 bg-bourse-baisse/10 px-4 py-3 text-sm text-bourse-baisse">
            {erreurGlobale}
          </div>
        )}

        {/* Tableau */}
        <div className="cac-scroll overflow-x-auto rounded-lg border border-bourse-ligne bg-bourse-panel/60">
          <table className="w-full min-w-[1080px] border-collapse">
            <thead>
              <tr className="border-b border-bourse-ligne">
                <th className="w-9 px-3 py-2.5">
                  <span className="sr-only">Favori</span>
                </th>
                <th className="w-9 px-3 py-2.5">
                  <span className="sr-only">Comparer</span>
                </th>
                {enTeteTri("nom", "Valeur")}
                {enTeteTri("score", "Score", true)}
                {enTeteTri("secteur", "Secteur")}
                {enTeteTri("prix", "Cours", true)}
                {enTeteTri("variationPct", "Var. jour", true)}
                <th className="px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-bourse-brumeclair">
                  Tendance 1 mois
                </th>
                {enTeteTri("plusHautJour", "Plus haut", true)}
                {enTeteTri("plusBasJour", "Plus bas", true)}
                {enTeteTri("volume", "Volume", true)}
              </tr>
            </thead>
            <tbody>
              {chargement && lignesFiltrees.every((l) => !l.cotation) ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} className="border-b border-bourse-ligne/60">
                    <td colSpan={11} className="px-3 py-3">
                      <div className="h-4 w-full animate-pulse rounded bg-bourse-ligne/60" />
                    </td>
                  </tr>
                ))
              ) : lignesFiltrees.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-10 text-center text-sm text-bourse-brumeclair">
                    Aucune valeur ne correspond à votre recherche.
                  </td>
                </tr>
              ) : (
                lignesFiltrees.map((l) => {
                  const c = l.cotation;
                  const hausse = (c?.variationPct ?? 0) >= 0;
                  const selectionnee = comparateur.includes(l.ticker);
                  const comparateurPlein =
                    !selectionnee && comparateur.length >= MAX_COMPARATEUR;
                  return (
                    <tr
                      key={l.ticker}
                      className="border-b border-bourse-ligne/60 transition hover:bg-bourse-ligne/20"
                    >
                      <td className="px-3 py-3">
                        <button
                          onClick={() => basculerFavori(l.ticker)}
                          disabled={!favorisPrets}
                          aria-label={
                            estFavori(l.ticker)
                              ? `Retirer ${l.nom} des favoris`
                              : `Ajouter ${l.nom} aux favoris`
                          }
                          className={`text-base leading-none transition ${
                            estFavori(l.ticker)
                              ? "text-bourse-or"
                              : "text-bourse-ligne hover:text-bourse-brumeclair"
                          }`}
                        >
                          {estFavori(l.ticker) ? "★" : "☆"}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectionnee}
                          disabled={comparateurPlein}
                          onChange={() => basculerComparateur(l.ticker)}
                          title={
                            comparateurPlein
                              ? `Comparateur limité à ${MAX_COMPARATEUR} valeurs`
                              : "Ajouter au comparateur"
                          }
                          className="h-4 w-4 rounded border-bourse-ligne bg-bourse-panel accent-bourse-or disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/valeur/${encodeURIComponent(l.ticker)}`}
                          className="flex flex-col group"
                        >
                          <span className="text-sm font-medium text-bourse-texte group-hover:text-bourse-or group-hover:underline">
                            {l.nom}
                          </span>
                          <span className="font-mono text-[11px] text-bourse-brume">
                            {l.mnemo} · {l.ticker}
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end">
                          <ScoreBadge lettre={c?.score?.lettre ?? null} />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-bourse-brumeclair">
                        {l.secteur}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm tabular text-bourse-texte">
                        {c?.erreur ? "—" : formatPrix(c?.prix, c?.devise)}
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-mono text-sm tabular ${
                          c?.erreur
                            ? "text-bourse-brume"
                            : hausse
                            ? "text-bourse-hausse"
                            : "text-bourse-baisse"
                        }`}
                      >
                        {c?.erreur || c?.variationPct === null || c?.variationPct === undefined
                          ? "—"
                          : `${hausse ? "+" : ""}${c.variationPct.toFixed(2)}%`}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end">
                          <Sparkline valeurs={c?.historique ?? null} />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm tabular text-bourse-brumeclair">
                        {formatPrix(c?.plusHautJour, c?.devise)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm tabular text-bourse-brumeclair">
                        {formatPrix(c?.plusBasJour, c?.devise)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm tabular text-bourse-brumeclair">
                        {formatVolume(c?.volume)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-bourse-brume">
          {lignesFiltrees.length} valeur{lignesFiltrees.length > 1 ? "s" : ""}{" "}
          affichée{lignesFiltrees.length > 1 ? "s" : ""} sur {valeursUnivers.length}.
          Données fournies par Yahoo Finance, à titre informatif uniquement —
          ne constitue pas un conseil en investissement.
        </p>
        <p className="mt-1 text-xs text-bourse-brume">
          Le <span className="text-bourse-brumeclair">Score</span> (S à F) est réparti
          sur 100 points en 4 catégories de 25 points chacune : Rentabilité,
          Gestion, Croissance, Santé financière. Chaque métrique est notée
          sur 5 paliers (Très faible à Très bon) selon des seuils fixes
          définis par nos soins. Une catégorie n&rsquo;est notée que si au
          moins 2 de ses métriques sont disponibles. Détail complet des 18
          métriques sur la page de chaque valeur. Les favoris ★ sont
          enregistrés dans ce navigateur.
        </p>
      </div>

      {/* Barre flottante du comparateur */}
      {comparateur.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-bourse-ligne bg-bourse-nuit/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-bourse-brumeclair">
                Comparateur ({comparateur.length}/{MAX_COMPARATEUR})
              </span>
              {comparateur.map((t) => {
                const v = valeursUnivers.find((x) => x.ticker === t);
                return (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full border border-bourse-ligne bg-bourse-panel px-2.5 py-1 text-xs text-bourse-texte"
                  >
                    {v?.mnemo ?? t}
                    <button
                      onClick={() => basculerComparateur(t)}
                      aria-label={`Retirer ${v?.nom ?? t}`}
                      className="text-bourse-brume hover:text-bourse-baisse"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setComparateur([])}
                className="rounded-md px-3 py-2 text-sm text-bourse-brumeclair hover:text-bourse-texte"
              >
                Vider
              </button>
              <Link
                href={`/comparateur?t=${comparateur.map(encodeURIComponent).join(",")}`}
                className={`rounded-md border border-bourse-or/40 bg-bourse-or/10 px-4 py-2 text-sm font-medium text-bourse-orclair transition hover:bg-bourse-or/20 ${
                  comparateur.length < 2 ? "pointer-events-none opacity-40" : ""
                }`}
              >
                Comparer
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
