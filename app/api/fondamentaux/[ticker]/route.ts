import { NextResponse } from "next/server";
import { fetchFondamentaux } from "@/lib/fondamentaux";
import { calculerScoreVQ } from "@/lib/score";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 30;

export async function GET(_req: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: tickerParam } = await params;
  const ticker = decodeURIComponent(tickerParam);
  const fondamentaux = await fetchFondamentaux(ticker);
  const score = calculerScoreVQ(fondamentaux);

  return NextResponse.json({ ticker, fondamentaux, score });
}
