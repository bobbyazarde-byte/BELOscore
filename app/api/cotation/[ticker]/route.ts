import { NextResponse } from "next/server";
import { fetchYahooChart, construireCotation } from "@/lib/yahooChart";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 20;

// Cotation "prix du jour" toujours calculée sur un historique journalier
// (range=1mo), indépendamment de la plage sélectionnée pour le graphique
// sur la page détail — évite qu'un utilisateur qui regarde un graphique
// sur 5 ans se retrouve avec une "variation du jour" calculée sur un
// intervalle hebdomadaire.
export async function GET(_req: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: tickerParam } = await params;
  const ticker = decodeURIComponent(tickerParam);
  const data = await fetchYahooChart(ticker, "1mo", "1d");
  const cotation = construireCotation(ticker, data);
  return NextResponse.json(cotation);
}
