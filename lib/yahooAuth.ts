// L'endpoint "quoteSummary" (données fondamentales) de Yahoo Finance est
// plus restrictif que l'endpoint "chart" (cours) : il exige un cookie de
// session + un jeton "crumb" obtenus au préalable. On les met en cache à
// deux niveaux : en mémoire pour la durée de vie de l'instance serverless
// (rapide, mais perdu à chaque instance froide), et via le cache de
// données de Next.js/Vercel (persiste entre invocations et entre
// utilisateurs, ce qui évite de refaire cette poignée de main à chaque
// chargement de page).

import { fetchAvecDelai } from "@/lib/http";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

interface Session {
  cookie: string;
  crumb: string;
  expireLe: number;
}

let sessionEnCache: Session | null = null;

async function obtenirCookie(): Promise<string | null> {
  try {
    const res = await fetchAvecDelai(
      "https://fc.yahoo.com",
      {
        headers: { "User-Agent": USER_AGENT },
        redirect: "manual",
        next: { revalidate: 900 },
      },
      6000
    );
    if (!res) return null;
    const setCookie = res.headers.get("set-cookie");
    return setCookie ? setCookie.split(";")[0] : null;
  } catch {
    return null;
  }
}

export async function obtenirSession(forceNouvelle = false): Promise<Session | null> {
  if (!forceNouvelle && sessionEnCache && sessionEnCache.expireLe > Date.now()) {
    return sessionEnCache;
  }

  const cookie = await obtenirCookie();
  if (!cookie) return null;

  try {
    const res = await fetchAvecDelai(
      "https://query2.finance.yahoo.com/v1/test/getcrumb",
      {
        headers: { "User-Agent": USER_AGENT, Cookie: cookie },
        next: { revalidate: 900 },
      },
      6000
    );
    if (!res || !res.ok) return null;
    const crumb = (await res.text()).trim();
    if (!crumb || crumb.includes("<html")) return null;

    const session: Session = {
      cookie,
      crumb,
      // Session gardée 20 minutes en mémoire pour les invocations suivantes
      // de la même instance serverless.
      expireLe: Date.now() + 20 * 60 * 1000,
    };
    sessionEnCache = session;
    return session;
  } catch {
    return null;
  }
}

export { USER_AGENT };
