# BELOSCORE — Screener SBF 120

Screener d'environ 120 valeurs du SBF 120 (CAC 40 + 80 valeurs
supplémentaires liquides d'Euronext Paris), avec un **score Value/Qualité** (S à F) inspiré des plateformes de notation
boursière, cours en temps différé, filtrable par secteur, avec
comparateur et page détail par valeur. Construit avec **Next.js 16** (App
Router, Turbopack) et **Tailwind CSS**, sans base de données à gérer.

⚠️ Données à titre informatif uniquement — ce projet ne constitue pas un
conseil en investissement.

**Note sur les versions :** ce projet utilise Next.js 16.x, la branche
actuellement en support actif (« Active LTS »), plutôt que Next.js 14 dont
le support est terminé depuis le 26 octobre 2025. Gardez `next` à jour de
temps en temps avec `npm outdated` / `npm update`, et vérifiez
régulièrement avec `npm audit`.

## ⚠️ Fiabilité des tickers du SBF 120 — à lire avant de déployer

Pour les **40 valeurs du CAC 40**, chaque ticker a été vérifié
individuellement et est fiable.

Pour les **~80 valeurs supplémentaires du SBF 120**, la composition
provient d'un relevé daté de décembre 2024 et les tickers Euronext Paris
(codes `.PA`) sont une reconstitution de bonne foi, **non vérifiée valeur
par valeur**. Certains seront corrects, d'autres peuvent être erronés ou
obsolètes (fusions, changements de code, sorties d'indice depuis 2024).

**Ce que ça veut dire concrètement :** une valeur avec un ticker incorrect
n'affichera jamais de données (cours et score restent à "—" en
permanence) plutôt que de casser la page — le reste du screener continue
de fonctionner normalement.

**Comment corriger une valeur cassée :**
1. Repérez les lignes qui restent vides ("—" partout) après plusieurs
   rafraîchissements.
2. Cherchez le nom de la société sur [Yahoo Finance](https://finance.yahoo.com)
   pour trouver son ticker exact (format `XXX.PA` pour Euronext Paris).
3. Corrigez la ligne correspondante dans `lib/tickers.ts`.

## Fonctionnalités

- Tableau triable/filtrable des valeurs du SBF 120, avec bandeau défilant
- Mini-graphique (sparkline) de tendance sur 1 mois pour chaque valeur
- **Score sur 100, réparti en 4 catégories de 25 points** : Rentabilité
  (marge brute, marge opérationnelle, marge de FCF, marge d'OCF,
  conversion de trésorerie), Gestion (ROIC, ROCE, ROE, ROA), Croissance
  (TCAC jusqu'à 3 ans du CA, résultat opérationnel, OCF, FCF, profit
  brut), Santé financière (liquidité générale, dette/EBITDA, trésorerie
  vs passif courant, variation du nombre d'actions). Chaque métrique est
  classée sur 5 paliers (Très faible à Très bon) selon des **seuils
  fixes** définis par nos soins — pédagogiques, pas issus d'une
  méthodologie propriétaire connue, et **non ajustés par secteur** (un
  choix assumé : comparer chaque valeur au même référentiel plutôt qu'à
  ses seuls pairs). Une catégorie n'est notée que si au moins 2 de ses
  18 métriques au total sont disponibles ; si une catégorie entière
  manque de données, le score est calculé sur les points restants plutôt
  que faussement ramené sur 100. Détail complet des 4 catégories et de
  leurs métriques sur chaque page valeur.
- **Favoris ★** : marque des valeurs en favori (persistant dans le
  navigateur via localStorage) et filtre le tableau dessus
- Page détail par valeur (clic sur son nom) : graphique interactif sur
  6 périodes (1 jour, 5 jours, 1 mois, YTD, 1 an, 5 ans) avec performance
  affichée sur la période sélectionnée, fiche complète des 4 catégories
  de métriques
- Comparateur : sélectionne jusqu'à 3 valeurs dans le tableau (cases à
  cocher) pour les superposer en performance relative (base 100)

## Sources de données

- **Cours** : endpoint public `v8/finance/chart` de Yahoo Finance (aucune
  clé requise). La variation du jour est calculée à partir des deux
  dernières séances de l'historique journalier plutôt que du champ
  `previousClose` de Yahoo, qui peut être absent pour certaines valeurs et
  fausser le calcul.
- **Données fondamentales** (pour le score Value/Qualité) : endpoint
  `v10/finance/quoteSummary` de Yahoo Finance. Cet endpoint est plus
  restrictif que celui des cours et exige un jeton de session ("crumb")
  récupéré automatiquement par le serveur avant chaque lot de requêtes.
  Si Yahoo bloque ou modifie cet endpoint, le score affichera simplement
  "—" pour les valeurs concernées — le reste du site (cours, graphiques,
  comparateur) continue de fonctionner normalement.

## Performance et fiabilité à cette échelle

L'univers étant passé de 40 à ~120 valeurs, `/api/quotes` envoie jusqu'à
~240 requêtes vers Yahoo Finance (cours + fondamentaux) à chaque
chargement de la page d'accueil. Plusieurs mesures limitent le risque :

- Les requêtes sont envoyées avec une **limite de concurrence** (15 en
  parallèle, voir `lib/concurrency.ts`) plutôt que toutes en même temps,
  pour réduire le risque que Yahoo bloque l'accès comme trafic suspect.
- Le rafraîchissement automatique de la page d'accueil est espacé à
  **5 minutes** (au lieu de 90 secondes pour 40 valeurs) — le bouton
  "Actualiser" reste disponible pour un rafraîchissement manuel immédiat.
- La route `/api/quotes` est configurée avec `maxDuration = 300` secondes.

**Note :** le score étant désormais calculé par seuils fixes (plus de
comparaison aux pairs du secteur), ouvrir une page détail ou le
comparateur ne déclenche qu'un seul appel Yahoo par valeur pour les
données fondamentales — plus léger que la version précédente à
classement sectoriel. En contrepartie, le calcul du score s'appuie sur
davantage de modules Yahoo (bilan, compte de résultat et flux de
trésorerie sur plusieurs années), ce qui peut réduire la couverture par
rapport à une version plus simple — voir la section sur la fiabilité des
données plus haut.

**Si le chargement échoue ou est trop lent en pratique**, plusieurs
options, de la plus simple à la plus lourde :
1. Réduire `CONCURRENCE` dans `app/api/quotes/route.ts` (moins de requêtes
   simultanées, plus lent mais plus discret).
2. Retirer certaines valeurs de `lib/tickers.ts` pour réduire l'univers.
3. Passer au plan Vercel Pro si le plan Hobby impose un timeout trop court
   pour vos fonctions serverless.
4. Migrer vers un fournisseur de données payant avec clé d'API (voir
   plus bas) qui n'a pas les mêmes limites de fiabilité que le scraping
   Yahoo Finance.

## Lancer le projet en local

Prérequis : [Node.js](https://nodejs.org) 20.9 ou plus récent (requis par Next.js 16).

```bash
npm install
npm run dev
```

Ouvrez ensuite [http://localhost:3000](http://localhost:3000).

## Mettre le projet sur GitHub

```bash
cd cac40-screener
git init
git add .
git commit -m "Screener SBF 120"
git branch -M main
git remote add origin https://github.com/<votre-utilisateur>/<votre-repo>.git
git push -u origin main
```

## Déployer sur Vercel

1. Rendez-vous sur [vercel.com](https://vercel.com) et connectez-vous
   avec votre compte GitHub.
2. Cliquez sur **Add New → Project**.
3. Sélectionnez le dépôt GitHub que vous venez de créer.
4. Vercel détecte automatiquement qu'il s'agit d'un projet Next.js —
   laissez les réglages par défaut.
5. Cliquez sur **Deploy**.

Chaque nouveau `git push` sur la branche `main` redéploiera
automatiquement le site.

## Structure du projet

```
app/
  api/quotes/route.ts               → cours + score de l'univers (page d'accueil)
  api/cotation/[ticker]/route.ts    → cours robuste d'une seule valeur
  api/fondamentaux/[ticker]/route.ts → données fondamentales + score d'une valeur
  api/historique/[ticker]/route.ts  → points du graphique pour une période donnée
  page.tsx                          → l'interface du screener (recherche, filtres, tableau)
  valeur/[ticker]/page.tsx          → page détail d'une valeur (graphique, métriques)
  comparateur/page.tsx              → comparateur de 2-3 valeurs (base 100)
  layout.tsx                        → structure HTML globale + polices
  globals.css                       → styles globaux et palette
components/
  TickerTape.tsx        → bandeau défilant façon téléscripteur
  Sparkline.tsx          → mini-graphique de tendance dans le tableau
  LineChart.tsx           → graphique détaillé (page valeur)
  ComparisonChart.tsx      → graphique superposé (comparateur)
  ScoreBadge.tsx            → badge visuel du score (lettre)
lib/
  tickers.ts                → univers de valeurs (nom, ticker, secteur, siège)
  plages.ts                   → périodes disponibles pour les graphiques
  score.ts                     → types et lettre du score (S/A/B/C/D/F)
  scoreCategoriel.ts             → calcul du score à 4 catégories, seuils fixes
  fondamentaux.ts                → récupération des données fondamentales Yahoo
  yahooChart.ts                    → récupération et calcul des cours Yahoo
  yahooAuth.ts                      → authentification crumb/cookie Yahoo
  http.ts                            → fetch avec délai maximal
  concurrency.ts                      → limiteur de requêtes parallèles
  useFavoris.ts                         → hook favoris (localStorage)
```

## Ajuster les seuils de notation

Les seuils des 5 paliers (Très bon à Très faible) pour chacune des 18
métriques sont définis dans `lib/scoreCategoriel.ts` (constantes
`RENTABILITE`, `GESTION`, `CROISSANCE`, `SANTE_FINANCIERE`). Ils ont été
calibrés à dire d'expert, sans méthodologie propriétaire de référence à
reproduire — ajustez-les librement selon votre propre lecture de ce qui
constitue une bonne performance pour chaque indicateur.

## Ajuster l'univers de valeurs

Éditez le tableau `UNIVERS` dans `lib/tickers.ts` (nom, ticker Yahoo
Finance au format `XXX.PA`, secteur, siège social) pour
ajouter, retirer ou corriger une valeur.

## Si les cours ou le score ne se chargent plus

Les endpoints Yahoo Finance utilisés ici ne sont pas des API officielles
et peuvent occasionnellement changer de comportement.

- Vérifiez dans les logs Vercel (onglet **Functions**) le code retourné
  par `/api/quotes`, `/api/cotation/[ticker]` ou `/api/fondamentaux/[ticker]`.
- Si seul le **score** est indisponible (affiché "—" partout) mais que les
  cours fonctionnent, c'est probablement l'endpoint `quoteSummary` qui est
  bloqué — le reste du site continue de fonctionner.
- Si une valeur précise reste vide en permanence (cours et score), voir
  la section sur la fiabilité des tickers plus haut.
- En solution de repli pour les données fondamentales, vous pouvez adapter
  `lib/fondamentaux.ts` pour utiliser un fournisseur avec clé d'API
  gratuite, par exemple [Financial Modeling Prep](https://financialmodelingprep.com),
  en stockant la clé dans une variable d'environnement Vercel
  (`Project Settings → Environment Variables`).

## Licence

Libre d'utilisation et de modification pour un usage personnel.
