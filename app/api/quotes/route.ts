import { NextResponse } from "next/server";
import { CAC40, INDICE_TICKER } from "@/lib/tickers";
import { fetchYahooChart, construireCotation, CotationBase } from "@/lib/yahooChart";
import { fetchFondamentaux } from "@/lib/fondamentaux";
import { calculerScoreVQ, ScoreVQ } from "@/lib/score";

// Cette route tourne côté serveur (Vercel Function), donc l'appel à Yahoo
// Finance ne subit pas les restrictions CORS d'un appel fait depuis le
// navigateur. On ne met jamais en cache : les cours doivent être rafraîchis
// à chaque appel.
export const dynamic = "force-dynamic";
export const revalidate = 0;
// Le lot combine jusqu'à 80 requêtes Yahoo (cours + fondamentaux) : on
// autorise une durée d'exécution plus longue que le défaut.
export const maxDuration = 60;

export interface Cotation extends CotationBase {
  score: ScoreVQ | null;
}

export async function GET() {
  const tickers = CAC40.map((v) => v.ticker);

  // Cours + fondamentaux sont interrogés en parallèle. Chaque appel est
  // isolé : si une valeur échoue, elle est simplement marquée en erreur
  // sans faire échouer le reste du screener.
  const [indexData, chartResults, fondamentauxResults] = await Promise.all([
    fetchYahooChart(INDICE_TICKER, "1mo", "1d"),
    Promise.all(tickers.map((t) => fetchYahooChart(t, "1mo", "1d"))),
    Promise.all(tickers.map((t) => fetchFondamentaux(t))),
  ]);

  const quotes: Cotation[] = tickers.map((t, i) => ({
    ...construireCotation(t, chartResults[i]),
    score: calculerScoreVQ(fondamentauxResults[i]),
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
