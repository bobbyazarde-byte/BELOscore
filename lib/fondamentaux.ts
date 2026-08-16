import { obtenirSession, USER_AGENT } from "@/lib/yahooAuth";
import { fetchAvecDelai } from "@/lib/http";

export interface Fondamentaux {
  ticker: string;
  peRatio: number | null; // x — cours / bénéfice par action (PER)
  // Rentabilité
  margeBrute: number | null; // %
  margeOperationnelle: number | null; // %
  margeFCF: number | null; // %
  margeOCF: number | null; // %
  conversionTresorerie: number | null; // % — OCF / résultat net
  // Gestion (rentabilité du capital)
  roic: number | null; // % — retour sur capital investi
  roce: number | null; // % — retour sur capitaux employés
  roe: number | null; // % — retour sur capitaux propres
  roa: number | null; // % — retour sur actifs
  // Croissance (TCAC jusqu'à 3 ans)
  croissanceCA: number | null; // %
  croissanceResultatOperationnel: number | null; // %
  croissanceOCF: number | null; // %
  croissanceFCF: number | null; // %
  croissanceProfitBrut: number | null; // %
  // Santé financière
  currentRatio: number | null; // x — liquidité générale
  detteEbitda: number | null; // x — dette brute / EBITDA
  cashSurPassifCourant: number | null; // % — trésorerie / passif courant
  variationActions: number | null; // % — négatif = rachat net d'actions (bon signe)
  marketCap: number | null;
  erreur: boolean;
}

// Les données fondamentales (bilan, marges, ratios) ne changent qu'au
// rythme des publications trimestrielles — inutile de les redemander à
// Yahoo à chaque chargement de page. Mise en cache 6h via le cache de
// données Next.js/Vercel : la première requête pour une valeur alimente
// le cache, les suivantes (tous utilisateurs confondus) sont servies
// depuis le cache tant qu'il est valide. Gain direct sur la vitesse ET
// sur la fiabilité (moins de requêtes réelles envoyées à Yahoo = moins
// de risque de blocage).
const DUREE_CACHE_SECONDES = 6 * 60 * 60;

function vide(ticker: string): Fondamentaux {
  return {
    ticker,
    peRatio: null,
    margeBrute: null,
    margeOperationnelle: null,
    margeFCF: null,
    margeOCF: null,
    conversionTresorerie: null,
    roic: null,
    roce: null,
    roe: null,
    roa: null,
    croissanceCA: null,
    croissanceResultatOperationnel: null,
    croissanceOCF: null,
    croissanceFCF: null,
    croissanceProfitBrut: null,
    currentRatio: null,
    detteEbitda: null,
    cashSurPassifCourant: null,
    variationActions: null,
    marketCap: null,
    erreur: true,
  };
}

function brut(champ: unknown): number | null {
  if (champ && typeof champ === "object" && "raw" in (champ as Record<string, unknown>)) {
    const v = (champ as { raw?: unknown }).raw;
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  }
  return typeof champ === "number" && Number.isFinite(champ) ? champ : null;
}

// Écarte les valeurs hors d'une plage plausible : Yahoo Finance renvoie
// parfois des champs corrompus ou mal calibrés (ex. un PER de 3x pour une
// entreprise qui n'a historiquement jamais coté sous 8x). Les bornes sont
// volontairement larges pour ne pas écarter des cas réels mais extrêmes
// (hypercroissance, redressement, forte dette) — seul le PER a une borne
// vraiment serrée, car c'est le cas de corruption de données identifié.
function borne(v: number | null, min: number, max: number): number | null {
  if (v === null) return null;
  return v >= min && v <= max ? v : null;
}

interface EntreeCompteResultat {
  totalRevenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  ebit: number | null;
  incomeBeforeTax: number | null;
  incomeTaxExpense: number | null;
}

function parseCompteResultat(entries: unknown): EntreeCompteResultat[] {
  if (!Array.isArray(entries)) return [];
  return entries.map((e) => {
    const r = e as Record<string, unknown>;
    return {
      totalRevenue: brut(r.totalRevenue),
      grossProfit: brut(r.grossProfit),
      operatingIncome: brut(r.operatingIncome),
      ebit: brut(r.ebit) ?? brut(r.operatingIncome),
      incomeBeforeTax: brut(r.incomeBeforeTax),
      incomeTaxExpense: brut(r.incomeTaxExpense),
    };
  });
}

// TCAC (taux de croissance annuel composé), à partir d'une série annuelle
// la plus récente en premier. Essaie d'abord sur 3 ans, puis 2, puis 1 si
// le point le plus ancien n'est pas exploitable (négatif, nul ou absent)
// — utile pour une entreprise qui vient de passer de pertes à bénéfices
// (ex. Palantir) : plutôt que d'abandonner tout calcul parce que
// l'exercice d'il y a 3 ans était négatif, on retombe sur une fenêtre plus
// courte mais valide.
function tcac(valeurs: (number | null)[]): number | null {
  const fin = valeurs[0];
  if (fin === null || fin <= 0) return null;

  for (let n = Math.min(3, valeurs.length - 1); n >= 1; n--) {
    const debut = valeurs[n];
    if (debut === null || debut <= 0) continue;
    const taux = (Math.pow(fin / debut, 1 / n) - 1) * 100;
    if (Number.isFinite(taux)) return taux;
  }
  return null;
}

const MODULES = [
  "financialData",
  "defaultKeyStatistics",
  "summaryDetail",
  "incomeStatementHistory",
  "balanceSheetHistory",
  "cashflowStatementHistory",
  // Modules trimestriels utilisés en repli quand l'historique annuel est
  // absent (plus systématiquement peuplés par Yahoo pour beaucoup de
  // valeurs, y compris américaines).
  "balanceSheetHistoryQuarterly",
  "cashflowStatementHistoryQuarterly",
].join(",");

async function requeterQuoteSummary(
  ticker: string,
  session: { cookie: string; crumb: string }
) {
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
    ticker
  )}?modules=${MODULES}&crumb=${encodeURIComponent(session.crumb)}`;

  const res = await fetchAvecDelai(
    url,
    {
      headers: {
        "User-Agent": USER_AGENT,
        Cookie: session.cookie,
        Accept: "application/json",
      },
      next: { revalidate: DUREE_CACHE_SECONDES },
    },
    6000
  );
  if (!res || !res.ok) return null;
  const json = await res.json();
  return json?.quoteSummary?.result?.[0] ?? null;
}

export async function fetchFondamentaux(ticker: string): Promise<Fondamentaux | null> {
  let session = await obtenirSession();
  if (!session) return vide(ticker);

  let result = await requeterQuoteSummary(ticker, session);

  // Si la première tentative échoue, le jeton de session est peut-être
  // périmé ou invalide malgré le cache — on force une nouvelle session et
  // on retente une fois avant d'abandonner. Coûte une requête de plus
  // seulement dans le cas d'échec, jamais dans le cas normal.
  if (!result) {
    session = await obtenirSession(true);
    if (!session) return vide(ticker);
    result = await requeterQuoteSummary(ticker, session);
  }

  if (!result) return vide(ticker);

  try {
    const fin = result.financialData ?? {};
    const stats = result.defaultKeyStatistics ?? {};
    const summary = result.summaryDetail ?? {};
    const compteResultat = parseCompteResultat(
      result.incomeStatementHistory?.incomeStatementHistory
    );

    const bilansAnnuels = (result.balanceSheetHistory?.balanceSheetStatements ?? []) as Record<
      string,
      unknown
    >[];
    const bilansTrimestriels = (result.balanceSheetHistoryQuarterly?.balanceSheetStatements ??
      []) as Record<string, unknown>[];
    const bilans = bilansAnnuels.length > 0 ? bilansAnnuels : bilansTrimestriels;

    const fluxAnnuels = (result.cashflowStatementHistory?.cashflowStatements ?? []) as Record<
      string,
      unknown
    >[];
    const fluxTrimestriels = (result.cashflowStatementHistoryQuarterly?.cashflowStatements ??
      []) as Record<string, unknown>[];
    // Pour le TCAC on veut des séries annuelles (comparer des exercices
    // complets) ; le trimestriel ne sert qu'en repli pour la dernière
    // valeur connue (ex. rachats d'actions récents).
    const flux = fluxAnnuels;
    const fluxRecent = fluxAnnuels[0] ?? fluxTrimestriels[0] ?? {};

    const marketCap = brut(summary.marketCap) ?? brut(stats.enterpriseValue);
    const peRatio = borne(brut(summary.trailingPE) ?? brut(stats.trailingPE), 0.1, 500);
    const totalDebt = brut(fin.totalDebt);
    const totalCash = brut(fin.totalCash);
    const ebitda = brut(fin.ebitda);
    const operatingCashflow = brut(fin.operatingCashflow);
    const freeCashflow = brut(fin.freeCashflow);
    const totalRevenueRecent = brut(fin.totalRevenue) ?? compteResultat[0]?.totalRevenue ?? null;
    const grossMargins = borne(brut(fin.grossMargins), -3, 1);
    const operatingMargins = borne(brut(fin.operatingMargins), -5, 1);
    const profitMargins = borne(brut(fin.profitMargins), -5, 1); // marge nette
    const returnOnEquity = borne(brut(fin.returnOnEquity), -5, 5);
    const returnOnAssets = borne(brut(fin.returnOnAssets), -2, 2);
    const currentRatio = borne(brut(fin.currentRatio), 0, 50);

    // --- Rentabilité ---
    const margeFCF =
      freeCashflow !== null && totalRevenueRecent ? (freeCashflow / totalRevenueRecent) * 100 : null;
    const margeOCF =
      operatingCashflow !== null && totalRevenueRecent
        ? (operatingCashflow / totalRevenueRecent) * 100
        : null;
    const netIncomeApprox =
      profitMargins !== null && totalRevenueRecent ? profitMargins * totalRevenueRecent : null;
    const conversionTresorerie =
      operatingCashflow !== null && netIncomeApprox && netIncomeApprox > 0
        ? (operatingCashflow / netIncomeApprox) * 100
        : null;

    // --- Gestion : ROIC / ROCE (nécessitent bilan + taux d'imposition effectif) ---
    const dernierBilan = bilans[0] ?? {};
    const totalAssets = brut(dernierBilan.totalAssets);
    const totalCurrentLiabilities = brut(dernierBilan.totalCurrentLiabilities);
    // Repli si le bilan (annuel ou trimestriel) est totalement absent :
    // capitaux propres approximés via valeur comptable par action ×
    // nombre d'actions, deux champs bien plus systématiquement peuplés
    // par Yahoo que l'historique de bilan complet.
    const equiteApprox = (() => {
      const direct = brut(dernierBilan.totalStockholderEquity);
      if (direct !== null) return direct;
      const bookValue = brut(stats.bookValue);
      const sharesOutstanding = brut(stats.sharesOutstanding);
      return bookValue !== null && sharesOutstanding !== null
        ? bookValue * sharesOutstanding
        : null;
    })();

    const cr0 = compteResultat[0];
    // L'EBIT du dernier exercice annuel publié peut être décalé par
    // rapport à la rentabilité actuelle pour une entreprise en forte
    // progression (ex. Palantir, qui n'était pas encore rentable il y a
    // seulement quelques exercices) : on préfère un EBIT calculé sur 12
    // mois glissants (marge opérationnelle × chiffre d'affaires, tous
    // deux déjà disponibles en glissant annuel) quand c'est possible, et
    // on ne retombe sur l'exercice annuel qu'en dernier recours.
    const ebitGlissant =
      operatingMargins !== null && totalRevenueRecent
        ? operatingMargins * totalRevenueRecent
        : null;
    const ebit = ebitGlissant ?? cr0?.ebit ?? null;
    let tauxImposition: number | null = null;
    if (cr0?.incomeBeforeTax && cr0.incomeBeforeTax > 0 && cr0?.incomeTaxExpense !== null) {
      tauxImposition = borne((cr0.incomeTaxExpense as number) / cr0.incomeBeforeTax, 0, 0.6);
    }
    const nopat = ebit !== null ? ebit * (1 - (tauxImposition ?? 0.25)) : null;

    const capitalInvesti =
      totalDebt !== null && equiteApprox !== null && totalCash !== null
        ? totalDebt + equiteApprox - totalCash
        : null;
    const roic =
      nopat !== null && capitalInvesti !== null && capitalInvesti > 0
        ? (nopat / capitalInvesti) * 100
        : null;

    const capitalEmploye =
      totalAssets !== null && totalCurrentLiabilities !== null
        ? totalAssets - totalCurrentLiabilities
        : null;
    const roce =
      ebit !== null && capitalEmploye !== null && capitalEmploye > 0
        ? (ebit / capitalEmploye) * 100
        : null;

    // --- Croissance : TCAC jusqu'à 3 ans sur les historiques annuels disponibles ---
    const croissanceCA = tcac(compteResultat.map((c) => c.totalRevenue));
    const croissanceResultatOperationnel = tcac(compteResultat.map((c) => c.operatingIncome));
    const croissanceProfitBrut = tcac(compteResultat.map((c) => c.grossProfit));

    const ocfHistorique = flux.map((f) => brut(f.totalCashFromOperatingActivities));
    const capexHistorique = flux.map((f) => brut(f.capitalExpenditures));
    const fcfHistorique = ocfHistorique.map((ocf, i) => {
      const capex = capexHistorique[i];
      // capitalExpenditures est généralement négatif chez Yahoo (sortie de
      // cash), d'où l'addition plutôt qu'une soustraction.
      return ocf !== null && capex !== null ? ocf + capex : null;
    });
    const croissanceOCF = tcac(ocfHistorique);
    const croissanceFCF = tcac(fcfHistorique);

    // --- Santé financière ---
    const detteEbitda = ebitda && ebitda > 0 && totalDebt !== null ? totalDebt / ebitda : null;
    const cashSurPassifCourant =
      totalCash !== null && totalCurrentLiabilities && totalCurrentLiabilities > 0
        ? (totalCash / totalCurrentLiabilities) * 100
        : null;

    // Variation nette des actions : approximée par le flux net de
    // rachats/émissions d'actions rapporté à la capitalisation boursière
    // (négatif = rachat net = réduction du nombre d'actions = signal
    // positif), faute de série historique du nombre d'actions exposée par
    // Yahoo Finance sur cet endpoint. Repli sur le dernier trimestre si
    // l'annuel est absent.
    const rachatNet = brut(fluxRecent.salePurchaseOfStock) ?? brut(fluxRecent.repurchaseOfStock);
    const variationActions =
      rachatNet !== null && marketCap ? (rachatNet / marketCap) * 100 : null;

    return {
      ticker,
      peRatio,
      margeBrute: grossMargins !== null ? grossMargins * 100 : null,
      margeOperationnelle: operatingMargins !== null ? operatingMargins * 100 : null,
      margeFCF: borne(margeFCF, -300, 300),
      margeOCF: borne(margeOCF, -300, 300),
      conversionTresorerie: borne(conversionTresorerie, -500, 1000),
      roic: borne(roic, -200, 500),
      roce: borne(roce, -200, 500),
      roe: returnOnEquity !== null ? returnOnEquity * 100 : null,
      roa: returnOnAssets !== null ? returnOnAssets * 100 : null,
      croissanceCA: borne(croissanceCA, -95, 1000),
      croissanceResultatOperationnel: borne(croissanceResultatOperationnel, -95, 1000),
      croissanceOCF: borne(croissanceOCF, -95, 1000),
      croissanceFCF: borne(croissanceFCF, -95, 1000),
      croissanceProfitBrut: borne(croissanceProfitBrut, -95, 1000),
      currentRatio,
      detteEbitda: borne(detteEbitda, -20, 100),
      cashSurPassifCourant: borne(cashSurPassifCourant, 0, 2000),
      variationActions: borne(variationActions, -80, 80),
      marketCap,
      erreur: false,
    };
  } catch {
    return vide(ticker);
  }
}
