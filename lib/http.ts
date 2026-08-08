export async function fetchAvecDelai(
  url: string,
  options: RequestInit = {},
  delaiMs = 8000
): Promise<Response | null> {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), delaiMs);
  try {
    const res = await fetch(url, { ...options, signal: controleur.signal });
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(minuteur);
  }
}
