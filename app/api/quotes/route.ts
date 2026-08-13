import { NextResponse } from "next/server";
import { UNIVERS, INDICE_TICKER } from "@/lib/tickers";
import { fetchYahooChart, construireCotation, CotationBase } from "@/lib/yahooChart";
import { fetchFondamentaux } from "@/lib/fondamentaux";
import { calculerScoreCategoriel } from "@/lib/scoreCategoriel";
import { ScoreCategoriel } from "@/lib/scoreCategoriel";
import { mapAvecLimite } from "@/lib/concurrency";

export const dynamic = "force-dynamic";
export const revalidate = 0;
// L'univers (SBF 120) combine jusqu'à ~240 requêtes Yahoo (cours +
// fondamentaux) : on autorise une durée d'exécution longue. Sur le plan
// Vercel Hobby, les fonctions serverless peuvent nécessiter le plan Pro
// pour dépasser 10s — voir le README si cette route échoue par timeout.
export const maxDuration = 300;

// Nombre de requêtes Yahoo envoyées en parallèle. Un nombre trop élevé
// risque de faire bloquer l'accès par Yahoo (rafale suspecte) ; un nombre
// trop bas rend le chargement très lent. 15 est un compromis raisonnable.
const CONCURRENCE = 15;

export interface Cotation extends CotationBase {
  score: ScoreCategoriel | null;
}

export async function GET() {
  const tickers = UNIVERS.map((v) => v.ticker);

  // Cours + fondamentaux sont interrogés en parallèle (avec une limite de
  // concurrence). Chaque appel est isolé : si une valeur échoue, elle est
  // simplement marquée en erreur sans faire échouer le reste du screener.
  const [indexData, chartResults, fondamentauxResults] = await Promise.all([
    fetchYahooChart(INDICE_TICKER, "1mo", "1d"),
    mapAvecLimite(tickers, CONCURRENCE, (t) => fetchYahooChart(t, "1mo", "1d")),
    mapAvecLimite(tickers, CONCURRENCE, (t) => fetchFondamentaux(t)),
  ]);

  const quotes: Cotation[] = tickers.map((t, i) => ({
    ...construireCotation(t, chartResults[i]),
    score: calculerScoreCategoriel(fondamentauxResults[i]),
  }));
  const index: Cotation = { ...construireCotation(INDICE_TICKER, indexData), score: null };

  const enErreur = quotes.filter((q) => q.erreur).length;
  const sansScore = quotes.filter((q) => q.score === null).length;

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    index,
    quotes,
    diagnostics: { total: quotes.length, enErreur, sansScore },
  });
}
