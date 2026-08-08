import { obtenirSession, USER_AGENT } from "@/lib/yahooAuth";
import { fetchAvecDelai } from "@/lib/http";

export interface Fondamentaux {
  ticker: string;
  // Approche value
  earningsYield: number | null; // % — inverse du PER
  fcfYield: number | null; // % — FCF / capitalisation
  evEbitda: number | null; // ratio — plus bas = mieux
  priceToBook: number | null; // ratio — plus bas = mieux
  // Approche qualité
  roe: number | null; // % — rentabilité des capitaux propres
  roa: number | null; // % — rentabilité des actifs
  margeOperationnelle: number | null; // %
  detteNetteEbitda: number | null; // ratio — plus bas = mieux
  croissanceCA: number | null; // % — croissance du chiffre d'affaires
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

export async function fetchFondamentaux(ticker: string): Promise<Fondamentaux | null> {
  const session = await obtenirSession();

  const vide: Fondamentaux = {
    ticker,
    earningsYield: null,
    fcfYield: null,
    evEbitda: null,
    priceToBook: null,
    roe: null,
    roa: null,
    margeOperationnelle: null,
    detteNetteEbitda: null,
    croissanceCA: null,
    marketCap: null,
    erreur: true,
  };

  if (!session) return vide;

  const modules = "financialData,defaultKeyStatistics,summaryDetail";
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

    const marketCap = brut(summary.marketCap) ?? brut(stats.enterpriseValue);
    const trailingPE = brut(summary.trailingPE) ?? brut(stats.trailingPE);
    const freeCashflow = brut(fin.freeCashflow);
    const totalDebt = brut(fin.totalDebt);
    const totalCash = brut(fin.totalCash);
    const ebitda = brut(fin.ebitda);
    const revenueGrowth = brut(fin.revenueGrowth);
    const returnOnEquity = brut(fin.returnOnEquity);
    const returnOnAssets = brut(fin.returnOnAssets);
    const operatingMargins = brut(fin.operatingMargins);
    const priceToBook = brut(stats.priceToBook);
    const enterpriseToEbitda = brut(stats.enterpriseToEbitda);

    return {
      ticker,
      earningsYield: trailingPE && trailingPE > 0 ? (1 / trailingPE) * 100 : null,
      fcfYield: freeCashflow !== null && marketCap ? (freeCashflow / marketCap) * 100 : null,
      evEbitda: enterpriseToEbitda,
      priceToBook,
      roe: returnOnEquity !== null ? returnOnEquity * 100 : null,
      roa: returnOnAssets !== null ? returnOnAssets * 100 : null,
      margeOperationnelle: operatingMargins !== null ? operatingMargins * 100 : null,
      detteNetteEbitda:
        totalDebt !== null && totalCash !== null && ebitda
          ? (totalDebt - totalCash) / ebitda
          : null,
      croissanceCA: revenueGrowth !== null ? revenueGrowth * 100 : null,
      marketCap,
      erreur: false,
    };
  } catch {
    return vide;
  }
}
