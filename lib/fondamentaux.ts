import { obtenirSession, USER_AGENT } from "@/lib/yahooAuth";
import { fetchAvecDelai } from "@/lib/http";

export interface Fondamentaux {
  ticker: string;
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

function brut(champ: unknown): number | null {
  if (champ && typeof champ === "object" && "raw" in (champ as Record<string, unknown>)) {
    const v = (champ as { raw?: unknown }).raw;
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  }
  return typeof champ === "number" && Number.isFinite(champ) ? champ : null;
}

// Écarte les valeurs hors d'une plage plausible : Yahoo Finance renvoie
// parfois, pour certaines valeurs (notamment hors marché américain), des
// champs corrompus ou mal calibrés. Mieux vaut afficher "non disponible"
// qu'une donnée fausse utilisée dans un score.
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

// TCAC (taux de croissance annuel composé) sur jusqu'à 3 ans, à partir
// d'une série annuelle la plus récente en premier. Plus robuste qu'une
// variation sur un seul exercice.
function tcac(valeurs: (number | null)[]): number | null {
  const valides = valeurs.filter((v): v is number => v !== null && v > 0);
  if (valides.length < 2) return null;
  const nbAnnees = Math.min(valides.length - 1, 3);
  const fin = valides[0];
  const debut = valides[nbAnnees];
  if (debut <= 0) return null;
  const taux = (Math.pow(fin / debut, 1 / nbAnnees) - 1) * 100;
  return Number.isFinite(taux) ? taux : null;
}

export async function fetchFondamentaux(ticker: string): Promise<Fondamentaux | null> {
  const session = await obtenirSession();

  const vide: Fondamentaux = {
    ticker,
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

  if (!session) return vide;

  const modules =
    "financialData,defaultKeyStatistics,summaryDetail,incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory";
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
    ticker
  )}?modules=${modules}&crumb=${encodeURIComponent(session.crumb)}`;

  try {
    const res = await fetchAvecDelai(
      url,
      {
        headers: {
          "User-Agent": USER_AGENT,
          Cookie: session.cookie,
          Accept: "application/json",
        },
        cache: "no-store",
      },
      8000
    );
    if (!res || !res.ok) return vide;

    const json = await res.json();
    const result = json?.quoteSummary?.result?.[0];
    if (!result) return vide;

    const fin = result.financialData ?? {};
    const stats = result.defaultKeyStatistics ?? {};
    const summary = result.summaryDetail ?? {};
    const compteResultat = parseCompteResultat(
      result.incomeStatementHistory?.incomeStatementHistory
    );
    const bilans = (result.balanceSheetHistory?.balanceSheetStatements ?? []) as Record<
      string,
      unknown
    >[];
    const flux = (result.cashflowStatementHistory?.cashflowStatements ?? []) as Record<
      string,
      unknown
    >[];

    const marketCap = brut(summary.marketCap) ?? brut(stats.enterpriseValue);
    const totalDebt = brut(fin.totalDebt);
    const totalCash = brut(fin.totalCash);
    const ebitda = brut(fin.ebitda);
    const operatingCashflow = brut(fin.operatingCashflow);
    const freeCashflow = brut(fin.freeCashflow);
    const totalRevenueRecent = brut(fin.totalRevenue) ?? compteResultat[0]?.totalRevenue ?? null;
    const grossMargins = borne(brut(fin.grossMargins), -1, 1);
    const operatingMargins = borne(brut(fin.operatingMargins), -1, 1);
    const profitMargins = borne(brut(fin.profitMargins), -1, 1); // marge nette
    const returnOnEquity = borne(brut(fin.returnOnEquity), -1, 1);
    const returnOnAssets = borne(brut(fin.returnOnAssets), -0.5, 0.5);
    const currentRatio = borne(brut(fin.currentRatio), 0, 30);

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
    const totalStockholderEquity = brut(dernierBilan.totalStockholderEquity);

    const cr0 = compteResultat[0];
    const ebit = cr0?.ebit ?? null;
    let tauxImposition: number | null = null;
    if (cr0?.incomeBeforeTax && cr0.incomeBeforeTax > 0 && cr0?.incomeTaxExpense !== null) {
      tauxImposition = borne((cr0.incomeTaxExpense as number) / cr0.incomeBeforeTax, 0, 0.6);
    }
    const nopat = ebit !== null ? ebit * (1 - (tauxImposition ?? 0.25)) : null;

    const capitalInvesti =
      totalDebt !== null && totalStockholderEquity !== null && totalCash !== null
        ? totalDebt + totalStockholderEquity - totalCash
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

    // --- Croissance : TCAC jusqu'à 3 ans sur les historiques disponibles ---
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
    // Yahoo Finance sur cet endpoint.
    const f0 = flux[0] ?? {};
    const rachatNet = brut(f0.salePurchaseOfStock) ?? brut(f0.repurchaseOfStock);
    const variationActions =
      rachatNet !== null && marketCap ? (rachatNet / marketCap) * 100 : null;

    return {
      ticker,
      margeBrute: grossMargins !== null ? grossMargins * 100 : null,
      margeOperationnelle: operatingMargins !== null ? operatingMargins * 100 : null,
      margeFCF: borne(margeFCF, -100, 100),
      margeOCF: borne(margeOCF, -100, 100),
      conversionTresorerie: borne(conversionTresorerie, -200, 300),
      roic: borne(roic, -100, 200),
      roce: borne(roce, -100, 200),
      roe: returnOnEquity !== null ? returnOnEquity * 100 : null,
      roa: returnOnAssets !== null ? returnOnAssets * 100 : null,
      croissanceCA: borne(croissanceCA, -80, 200),
      croissanceResultatOperationnel: borne(croissanceResultatOperationnel, -80, 300),
      croissanceOCF: borne(croissanceOCF, -80, 300),
      croissanceFCF: borne(croissanceFCF, -80, 300),
      croissanceProfitBrut: borne(croissanceProfitBrut, -80, 200),
      currentRatio,
      detteEbitda: borne(detteEbitda, -5, 30),
      cashSurPassifCourant: borne(cashSurPassifCourant, 0, 1000),
      variationActions: borne(variationActions, -50, 50),
      marketCap,
      erreur: false,
    };
  } catch {
    return vide;
  }
}
