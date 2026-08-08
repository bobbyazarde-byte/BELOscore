import { fetchAvecDelai } from "@/lib/http";
import { USER_AGENT } from "@/lib/yahooAuth";

export interface YahooMeta {
  symbol?: string;
  currency?: string;
  exchangeName?: string;
  regularMarketPrice?: number;
  previousClose?: number;
  chartPreviousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  regularMarketTime?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  marketState?: string;
  longName?: string;
  shortName?: string;
}

export interface YahooChartResult {
  meta?: YahooMeta;
  timestamp?: number[];
  indicators?: {
    quote?: { close?: (number | null)[] }[];
  };
}

export interface CotationBase {
  ticker: string;
  nom: string | null;
  prix: number | null;
  clotureVeille: number | null;
  variation: number | null;
  variationPct: number | null;
  plusHautJour: number | null;
  plusBasJour: number | null;
  volume: number | null;
  plusHaut52s: number | null;
  plusBas52s: number | null;
  devise: string | null;
  etatMarche: string | null;
  heureCotation: number | null;
  historique: number[] | null;
  erreur: boolean;
}

export async function fetchYahooChart(
  ticker: string,
  range = "1mo",
  interval = "1d"
): Promise<YahooChartResult | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?interval=${interval}&range=${range}`;

  try {
    const res = await fetchAvecDelai(
      url,
      {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        cache: "no-store",
      },
      8000
    );
    if (!res || !res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    return result ?? null;
  } catch {
    return null;
  }
}

/**
 * Construit une cotation à partir d'une réponse Yahoo Finance en calculant
 * la clôture de la veille à partir des bougies journalières réelles plutôt
 * que du champ meta.previousClose (parfois absent, avec un repli sur
 * meta.chartPreviousClose qui correspond alors à une clôture vieille de
 * plusieurs semaines et fausse complètement la variation affichée).
 */
export function construireCotation(ticker: string, data: YahooChartResult | null): CotationBase {
  const meta = data?.meta ?? null;

  if (!meta) {
    return {
      ticker,
      nom: null,
      prix: null,
      clotureVeille: null,
      variation: null,
      variationPct: null,
      plusHautJour: null,
      plusBasJour: null,
      volume: null,
      plusHaut52s: null,
      plusBas52s: null,
      devise: null,
      etatMarche: null,
      heureCotation: null,
      historique: null,
      erreur: true,
    };
  }

  const prix = meta.regularMarketPrice ?? null;
  const closesBruts = data?.indicators?.quote?.[0]?.close ?? [];
  const historique = closesBruts.filter((v): v is number => typeof v === "number");

  let clotureVeille: number | null = null;
  if (historique.length >= 2) {
    clotureVeille = historique[historique.length - 2];
  } else {
    clotureVeille = meta.previousClose ?? meta.chartPreviousClose ?? null;
  }

  const variation = prix !== null && clotureVeille !== null ? prix - clotureVeille : null;
  const variationPct =
    variation !== null && clotureVeille ? (variation / clotureVeille) * 100 : null;

  return {
    ticker,
    nom: meta.longName ?? meta.shortName ?? null,
    prix,
    clotureVeille,
    variation,
    variationPct,
    plusHautJour: meta.regularMarketDayHigh ?? null,
    plusBasJour: meta.regularMarketDayLow ?? null,
    volume: meta.regularMarketVolume ?? null,
    plusHaut52s: meta.fiftyTwoWeekHigh ?? null,
    plusBas52s: meta.fiftyTwoWeekLow ?? null,
    devise: meta.currency ?? null,
    etatMarche: meta.marketState ?? null,
    heureCotation: meta.regularMarketTime ?? null,
    historique: historique.length > 1 ? historique : null,
    erreur: prix === null,
  };
}
