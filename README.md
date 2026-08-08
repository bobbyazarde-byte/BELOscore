# BELOSCORE — Screener CAC 40

Screener des 40 valeurs de l'indice CAC 40 avec un **score Value/Qualité**
(S à F) inspiré des plateformes de notation boursière, cours en temps
différé, filtrable par secteur, avec comparateur et page détail par valeur.
Construit avec **Next.js 15** (App Router) et **Tailwind CSS**, sans base de
données à gérer.

⚠️ Données à titre informatif uniquement — ce projet ne constitue pas un
conseil en investissement.

**Note sur les versions :** ce projet utilise Next.js 15.x (branche
activement corrigée jusqu'en octobre 2026) plutôt que Next.js 14, dont le
support est terminé depuis le 26 octobre 2025 (plus aucun correctif de
sécurité, même pour des failles découvertes après cette date). Gardez
`next` à jour avec `npm outdated` / `npm update` de temps en temps.

## Fonctionnalités

- Tableau triable/filtrable des 40 valeurs, avec bandeau défilant
- Mini-graphique (sparkline) de tendance sur 1 mois pour chaque valeur
- **Score Value/Qualité (S à F)** : 50% approche value (rendement des
  bénéfices, rendement du cash-flow libre, VE/EBITDA, P/B) + 50% approche
  qualité (ROE, ROA, marge opérationnelle, dette nette/EBITDA, croissance
  du chiffre d'affaires) — détail complet des métriques sur chaque page
  valeur
- **Favoris ★** : marque des valeurs en favori (persistant dans le
  navigateur via localStorage) et filtre le tableau dessus
- Page détail par valeur (clic sur son nom) : graphique interactif sur
  6 périodes (1 jour, 5 jours, 1 mois, YTD, 1 an, 5 ans), fiche complète
  des métriques value et qualité
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

## Lancer le projet en local

Prérequis : [Node.js](https://nodejs.org) 18.18 ou plus récent (20+ recommandé).

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
git commit -m "Screener CAC 40"
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

**Note sur le plan Vercel :** la route `/api/quotes` combine jusqu'à 80
requêtes réseau (cours + fondamentaux des 40 valeurs) et peut prendre
quelques secondes. Le plan Hobby de Vercel autorise généralement des
fonctions serverless jusqu'à 60 secondes ; si vous rencontrez des timeouts,
réduisez la fréquence de rafraîchissement automatique dans `app/page.tsx`
ou passez au plan Pro.

## Structure du projet

```
app/
  api/quotes/route.ts               → cours + score des 40 valeurs (page d'accueil)
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
  tickers.ts                → liste des 40 valeurs (nom, ticker, secteur)
  plages.ts                   → périodes disponibles pour les graphiques
  score.ts                     → calcul du score Value/Qualité S/A/B/C/D/F
  fondamentaux.ts                → récupération des données fondamentales Yahoo
  yahooChart.ts                    → récupération et calcul des cours Yahoo
  yahooAuth.ts                      → authentification crumb/cookie Yahoo
  http.ts                            → fetch avec délai maximal
  useFavoris.ts                       → hook favoris (localStorage)
```

## Ajuster la composition du CAC 40

La composition de l'indice est révisée chaque trimestre par Euronext.
Pour mettre à jour la liste des valeurs, éditez le tableau `CAC40` dans
`lib/tickers.ts` (nom, ticker Yahoo Finance au format `XXX.PA`, secteur).

## Si les cours ou le score ne se chargent plus

Les endpoints Yahoo Finance utilisés ici ne sont pas des API officielles
et peuvent occasionnellement changer de comportement.

- Vérifiez dans les logs Vercel (onglet **Functions**) le code retourné
  par `/api/quotes`, `/api/cotation/[ticker]` ou `/api/fondamentaux/[ticker]`.
- Si seul le **score** est indisponible (affiché "—" partout) mais que les
  cours fonctionnent, c'est probablement l'endpoint `quoteSummary` qui est
  bloqué — le reste du site continue de fonctionner.
- En solution de repli pour les données fondamentales, vous pouvez adapter
  `lib/fondamentaux.ts` pour utiliser un fournisseur avec clé d'API
  gratuite, par exemple [Financial Modeling Prep](https://financialmodelingprep.com),
  en stockant la clé dans une variable d'environnement Vercel
  (`Project Settings → Environment Variables`).

## Licence

Libre d'utilisation et de modification pour un usage personnel.
