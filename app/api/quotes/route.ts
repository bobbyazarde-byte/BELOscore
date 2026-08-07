import { NextResponse } from "next/server";
import { CAC40, INDICE_TICKER } from "@/lib/tickers";

// Cette route tourne côté serveur (Vercel Function), donc l'appel à Yahoo
// Finance ne subit pas les restrictions CORS d'un appel fait depuis le
// navigateur. On ne met jamais en cache : les cours doivent être rafraîchis
// à chaque appel.
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface YahooMeta {
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

interface YahooChartResult {
  meta?: YahooMeta;
  indicators?: {
    quote?: { close?: (number | null)[] }[];
  };
}

export interface Cotation {
  ticker: string;
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

async function fetchYahoo(ticker: string): Promise<YahooChartResult | null> {
  // range=1mo donne ~22 séances, suffisant pour une sparkline et léger à
  // transporter ; c'est aussi ce même appel qui fournit le cours courant.
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?interval=1d&range=1mo`;

  try {
    const res = await fetch(url, {
      headers: {
        // Un User-Agent de navigateur classique évite certains blocages
        // basiques côté Yahoo sur les requêtes serveur-à-serveur.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;
    return result as YahooChartResult;
  } catch {
    return null;
  }
}

function toCotation(ticker: string, data: YahooChartResult | null): Cotation {
  const meta = data?.meta ?? null;

  if (!meta) {
    return {
      ticker,
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
  const clotureVeille = meta.previousClose ?? meta.chartPreviousClose ?? null;
  const variation =
    prix !== null && clotureVeille !== null ? prix - clotureVeille : null;
  const variationPct =
    variation !== null && clotureVeille ? (variation / clotureVeille) * 100 : null;

  const closesBruts = data?.indicators?.quote?.[0]?.close ?? [];
  const historique = closesBruts.filter(
    (v): v is number => typeof v === "number"
  );

  return {
    ticker,
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

export async function GET() {
  const tickers = CAC40.map((v) => v.ticker);

  // On interroge les 40 valeurs + l'indice en parallèle. Chaque appel est
  // isolé : si une valeur échoue, elle est simplement marquée en erreur
  // sans faire échouer le reste du screener.
  const [indexData, ...datas] = await Promise.all([
    fetchYahoo(INDICE_TICKER),
    ...tickers.map((t) => fetchYahoo(t)),
  ]);

  const quotes = tickers.map((t, i) => toCotation(t, datas[i]));
  const index = toCotation(INDICE_TICKER, indexData);

  const enErreur = quotes.filter((q) => q.erreur).length;

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    index,
    quotes,
    diagnostics: { total: quotes.length, enErreur },
  });
}
