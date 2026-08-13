/**
 * Exécute `tache` pour chaque élément de `items`, avec au maximum `limite`
 * exécutions en parallèle. Contrairement à Promise.all (tout en même
 * temps) ou à une boucle séquentielle (un par un, trop lent), ceci évite
 * d'envoyer des centaines de requêtes Yahoo Finance en une seule rafale
 * (risque de blocage) tout en restant raisonnablement rapide.
 */
export async function mapAvecLimite<T, R>(
  items: T[],
  limite: number,
  tache: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const resultats: R[] = new Array(items.length);
  let curseur = 0;

  async function travailleur() {
    while (curseur < items.length) {
      const index = curseur++;
      resultats[index] = await tache(items[index], index);
    }
  }

  const travailleurs = Array.from({ length: Math.min(limite, items.length) }, () =>
    travailleur()
  );
  await Promise.all(travailleurs);

  return resultats;
}
