import { NextResponse } from "next/server";
import { fetchFondamentaux } from "@/lib/fondamentaux";
import { calculerScoreCategoriel } from "@/lib/scoreCategoriel";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 20;

// Le score étant désormais calculé par seuils fixes (pas de comparaison
// aux pairs du secteur), cette route n'a plus besoin de récupérer les
// données fondamentales d'autres valeurs — un seul appel Yahoo suffit.
export async function GET(_req: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: tickerParam } = await params;
  const ticker = decodeURIComponent(tickerParam);

  const fondamentaux = await fetchFondamentaux(ticker);
  const score = calculerScoreCategoriel(fondamentaux);

  return NextResponse.json({ ticker, fondamentaux, score });
}
