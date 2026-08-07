import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PLAGES_AUTORISEES = new Set([
  "5d",
  "1mo",
  "6mo",
  "1y",
  "5y",
]);

export interface PointHistorique {
  date: string; // ISO
  cloture: number;
}

export interface DetailValeur {
  ticker: string;
  nom: string | null;
  devise: string | null;
  prix: number | null;
  clotureVeille: number | null;
  variation: number | null;
  variationPct: number | null;
  plusHautJour: number | null;
  plusBasJour: number | null;
  plusHaut52s: number | null;
  plusBas52s: number | null;
  volume: number | null;
  etatMarche: string | null;
  points: PointHistorique[];
  erreur: boolean;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = decodeURIComponent(params.ticker);
  const rangeParam = req.nextUrl.searchParams.get("range") ?? "6mo";
  const range = PLAGES_AUTORISEES.has(rangeParam) ? rangeParam : "6mo";
  const interval = range === "5d" ? "15m" : "1d";

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?interval=${interval}&range=${range}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Réponse Yahoo Finance invalide");

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error("Aucune donnée");

    const meta = result.meta ?? {};
    const timestamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

    const points: PointHistorique[] = timestamps
      .map((t, i) => ({ t, c: closes[i] }))
      .filter((p): p is { t: number; c: number } => typeof p.c === "number")
      .map((p) => ({
        date: new Date(p.t * 1000).toISOString(),
        cloture: p.c,
      }));

    const prix = meta.regularMarketPrice ?? null;
    const clotureVeille = meta.previousClose ?? meta.chartPreviousClose ?? null;
    const variation =
      prix !== null && clotureVeille !== null ? prix - clotureVeille : null;
    const variationPct =
      variation !== null && clotureVeille ? (variation / clotureVeille) * 100 : null;

    const detail: DetailValeur = {
      ticker,
      nom: meta.longName ?? meta.shortName ?? null,
      devise: meta.currency ?? null,
      prix,
      clotureVeille,
      variation,
      variationPct,
      plusHautJour: meta.regularMarketDayHigh ?? null,
      plusBasJour: meta.regularMarketDayLow ?? null,
      plusHaut52s: meta.fiftyTwoWeekHigh ?? null,
      plusBas52s: meta.fiftyTwoWeekLow ?? null,
      volume: meta.regularMarketVolume ?? null,
      etatMarche: meta.marketState ?? null,
      points,
      erreur: prix === null,
    };

    return NextResponse.json(detail);
  } catch {
    const vide: DetailValeur = {
      ticker,
      nom: null,
      devise: null,
      prix: null,
      clotureVeille: null,
      variation: null,
      variationPct: null,
      plusHautJour: null,
      plusBasJour: null,
      plusHaut52s: null,
      plusBas52s: null,
      volume: null,
      etatMarche: null,
      points: [],
      erreur: true,
    };
    return NextResponse.json(vide, { status: 200 });
  }
}
