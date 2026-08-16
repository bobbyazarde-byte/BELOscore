import { NextRequest, NextResponse } from "next/server";
import { UNIVERSS, CodeUnivers } from "@/lib/tickers";
import { fetchYahooChart, construireCotation, CotationBase } from "@/lib/yahooChart";
import { fetchFondamentaux } from "@/lib/fondamentaux";
import { calculerScoreCategoriel } from "@/lib/scoreCategoriel";
import { ScoreCategoriel } from "@/lib/scoreCategoriel";
import { mapAvecLimite } from "@/lib/concurrency";

export const dynamic = "force-dynamic";
export const revalidate = 0;
// Le S&P 500 combine jusqu'à ~1000 requêtes Yahoo (cours + fondamentaux) :
// on autorise une durée d'exécution longue. Sur le plan Vercel Hobby, les
// fonctions serverless peuvent nécessiter le plan Pro pour dépasser 10s —
// voir le README si cette route échoue par timeout.
export const maxDuration = 300;

// Nombre de requêtes Yahoo envoyées en parallèle. Un nombre trop élevé
// risque de faire bloquer l'accès par Yahoo (rafale suspecte) ; un nombre
// trop bas rend le chargement très lent. Les données fondamentales étant
// désormais mises en cache 6h (voir lib/fondamentaux.ts), l'essentiel du
// volume de requêtes ne se produit qu'une fois par valeur toutes les 6h
// (tous utilisateurs confondus) plutôt qu'à chaque chargement — on peut
// se permettre une concurrence un peu plus généreuse.
const CONCURRENCE = 20;

export interface Cotation extends CotationBase {
  score: ScoreCategoriel | null;
}

export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("univers") ?? "sbf120") as CodeUnivers;
  const definition = UNIVERSS[code] ?? UNIVERSS.sbf120;
  const tickers = definition.valeurs.map((v) => v.ticker);

  // Cours + fondamentaux sont interrogés en parallèle (avec une limite de
  // concurrence). Chaque appel est isolé : si une valeur échoue, elle est
  // simplement marquée en erreur sans faire échouer le reste du screener.
  const [indexData, chartResults, fondamentauxResults] = await Promise.all([
    fetchYahooChart(definition.indiceTicker, "1mo", "1d"),
    mapAvecLimite(tickers, CONCURRENCE, (t) => fetchYahooChart(t, "1mo", "1d")),
    mapAvecLimite(tickers, CONCURRENCE, (t) => fetchFondamentaux(t)),
  ]);

  const quotes: Cotation[] = tickers.map((t, i) => ({
    ...construireCotation(t, chartResults[i]),
    score: calculerScoreCategoriel(fondamentauxResults[i]),
  }));
  const index: Cotation = {
    ...construireCotation(definition.indiceTicker, indexData),
    score: null,
  };

  const enErreur = quotes.filter((q) => q.erreur).length;
  const sansScore = quotes.filter((q) => q.score === null).length;

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    univers: code,
    index,
    quotes,
    diagnostics: { total: quotes.length, enErreur, sansScore },
  });
}
