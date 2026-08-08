import { NextRequest, NextResponse } from "next/server";
import { fetchYahooChart } from "@/lib/yahooChart";
import { PLAGES_AUTORISEES, intervalPour } from "@/lib/plages";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 20;

export interface PointHistorique {
  date: string; // ISO
  cloture: number;
}

export interface DetailValeur {
  ticker: string;
  nom: string | null;
  devise: string | null;
  points: PointHistorique[];
  erreur: boolean;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker: tickerParam } = await params;
  const ticker = decodeURIComponent(tickerParam);
  const rangeParam = req.nextUrl.searchParams.get("range") ?? "6mo";
  const range = PLAGES_AUTORISEES.has(rangeParam) ? rangeParam : "1y";
  const interval = intervalPour(range);

  const data = await fetchYahooChart(ticker, range, interval);

  if (!data?.meta) {
    const vide: DetailValeur = { ticker, nom: null, devise: null, points: [], erreur: true };
    return NextResponse.json(vide);
  }

  const meta = data.meta;
  const timestamps = data.timestamp ?? [];
  const closes = data.indicators?.quote?.[0]?.close ?? [];

  const points: PointHistorique[] = timestamps
    .map((t, i) => ({ t, c: closes[i] }))
    .filter((p): p is { t: number; c: number } => typeof p.c === "number")
    .map((p) => ({
      date: new Date(p.t * 1000).toISOString(),
      cloture: p.c,
    }));

  const detail: DetailValeur = {
    ticker,
    nom: meta.longName ?? meta.shortName ?? null,
    devise: meta.currency ?? null,
    points,
    erreur: points.length === 0,
  };

  return NextResponse.json(detail);
}
