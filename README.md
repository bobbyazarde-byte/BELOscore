# BELOSCORE — Screener SBF 120 / S&P 500

Screener de deux univers au choix — le **SBF 120** (environ 120 valeurs
françaises, CAC 40 compris) et le **S&P 500** (500 grandes valeurs
américaines) — avec un score sur 100 réparti en 4 catégories
(Rentabilité, Gestion, Croissance, Santé financière), cours en temps
différé, filtrable par secteur, avec comparateur et page détail par
valeur. Construit avec **Next.js 16** (App Router, Turbopack) et
**Tailwind CSS**, sans base de données à gérer.

⚠️ Données à titre informatif uniquement — ce projet ne constitue pas un
conseil en investissement.

**Note sur les versions :** ce projet utilise Next.js 16.x, la branche
actuellement en support actif (« Active LTS »), plutôt que Next.js 14 dont
le support est terminé depuis le 26 octobre 2025. Gardez `next` à jour de
temps en temps avec `npm outdated` / `npm update`, et vérifiez
régulièrement avec `npm audit`.

## ⚠️ À lire avant de déployer : fiabilité des tickers et échelle du S&P 500

**SBF 120** — pour les 40 valeurs du CAC 40, chaque ticker a été vérifié
individuellement. Pour les ~80 valeurs supplémentaires, la composition
provient d'un relevé daté de décembre 2024 et les tickers Euronext Paris
sont une reconstitution de bonne foi, non vérifiée valeur par valeur.

**S&P 500** — la composition et les tickers proviennent d'un relevé
Wikipédia à jour (avril 2026), une source nettement plus fiable pour des
tickers américains très documentés. Deux ajustements techniques : les
tickers à plusieurs classes d'actions utilisent un tiret plutôt qu'un
point pour Yahoo Finance (`BRK.B` devient `BRK-B`), et les 11 secteurs
GICS sont traduits en français.

**Dans les deux cas :** une valeur avec un ticker incorrect n'affichera
jamais de données (cours et score restent à "—" en permanence) plutôt que
de casser la page.

**⚠️ Le S&P 500 est un changement d'échelle important.** 500 valeurs ×
2 requêtes (cours + fondamentaux) = jusqu'à ~1000 requêtes Yahoo Finance
par chargement de la page d'accueil, contre ~240 pour le SBF 120. C'est
nettement plus susceptible de :
- dépasser la durée d'exécution autorisée par votre plan Vercel,
- déclencher un blocage temporaire de l'accès par Yahoo Finance (rafale
  de requêtes suspecte),
- rendre le chargement du tableau très lent (potentiellement 30 secondes
  ou plus).

Le SBF 120 reste l'univers le plus rapide et fiable des deux. Si le S&P
500 échoue ou est trop lent en pratique, voir la section Performance
plus bas pour les options (réduire la concurrence, passer à un plan
Vercel Pro, ou migrer vers un fournisseur de données payant).

**Comment corriger une valeur cassée :**
1. Repérez les lignes qui restent vides ("—" partout) après plusieurs
   rafraîchissements.
2. Cherchez le nom de la société sur [Yahoo Finance](https://finance.yahoo.com)
   pour trouver son ticker exact.
3. Corrigez la ligne correspondante dans `lib/tickers.ts` (tableau
   `SBF120` ou `SP500` selon le cas).

## Fonctionnalités

- **Sélecteur d'univers** : bascule entre SBF 120 et S&P 500 en un clic,
  choix mémorisé dans le navigateur
- Tableau triable/filtrable, avec bandeau défilant
- Mini-graphique (sparkline) de tendance sur 1 mois pour chaque valeur
- **Score sur 100, réparti en 4 catégories de 25 points** : Rentabilité
  (marge brute, marge opérationnelle, marge de FCF, marge d'OCF,
  conversion de trésorerie), Gestion (ROIC, ROCE, ROE, ROA), Croissance
  (TCAC jusqu'à 3 ans du CA, résultat opérationnel, OCF, FCF, profit
  brut), Santé financière (liquidité générale, dette/EBITDA, trésorerie
  vs passif courant, variation du nombre d'actions). Chaque métrique est
  classée sur 5 paliers (Très faible à Très bon) selon des **seuils
  fixes** définis par nos soins — pédagogiques, pas issus d'une
  méthodologie propriétaire connue, et **non ajustés par secteur**. Une
  catégorie n'est notée que si au moins 2 de ses 18 métriques sont
  disponibles ; si une catégorie entière manque de données, le score est
  calculé sur les points restants plutôt que faussement ramené sur 100.
  Détail complet des 4 catégories sur chaque page valeur.
- **Favoris ★** : marque des valeurs en favori (persistant dans le
  navigateur via localStorage) et filtre le tableau dessus
- Page détail par valeur : graphique interactif sur 6 périodes (1 jour,
  5 jours, 1 mois, YTD, 1 an, 5 ans) avec performance affichée sur la
  période sélectionnée, statistiques (dont le PER) et fiche complète des
  4 catégories de métriques
- Comparateur : sélectionne jusqu'à 3 valeurs (cases à cocher) pour les
  superposer en performance relative (base 100) — fonctionne même en
  mélangeant une valeur française et une valeur américaine
- Formatage automatique de la devise (€, $, £...) selon la place de
  cotation de chaque valeur

## Sources de données

- **Cours** : endpoint public `v8/finance/chart` de Yahoo Finance (aucune
  clé requise). La variation du jour est calculée à partir des deux
  dernières séances de l'historique journalier plutôt que du champ
  `previousClose` de Yahoo, qui peut être absent pour certaines valeurs et
  fausser le calcul.
- **Données fondamentales** (pour le score) : endpoint
  `v10/finance/quoteSummary` de Yahoo Finance. Cet endpoint est plus
  restrictif que celui des cours et exige un jeton de session ("crumb")
  récupéré automatiquement par le serveur avant chaque lot de requêtes.
  Si Yahoo bloque ou modifie cet endpoint, le score affichera simplement
  "—" pour les valeurs concernées — le reste du site continue de
  fonctionner normalement.

## Performance et fiabilité à cette échelle

- **Cache des données fondamentales (6h)** : le plus gros levier. Les
  marges, ratios et bilans ne changent qu'au rythme des publications
  trimestrielles — inutile de les redemander à Yahoo à chaque
  chargement. Le cache de données Next.js/Vercel les garde 6h,
  **partagé entre tous les visiteurs** : la première personne qui charge
  une valeur alimente le cache, tout le monde en profite ensuite. Ça
  réduit à la fois le temps de chargement et le volume réel de requêtes
  envoyées à Yahoo (donc le risque de blocage).
- **Cache des cours (60s)** : évite de refaire la même requête si
  plusieurs visiteurs chargent la page à quelques secondes d'intervalle,
  sans donner l'impression de cours figés.
- **Nouvelle tentative automatique** : si une requête de données
  fondamentales échoue, le serveur force une nouvelle session
  (cookie + jeton) et retente une fois avant d'abandonner — récupère les
  échecs dus à une session périmée plutôt que d'afficher "—" à tort.
- **Repli sur les données trimestrielles** : si le bilan ou les flux de
  trésorerie annuels sont absents chez Yahoo pour une valeur, les
  versions trimestrielles (plus systématiquement peuplées) prennent le
  relais automatiquement.
- **Bornes de plausibilité élargies** : les seuils qui écartent les
  données corrompues (voir plus bas) ont été volontairement resserrés
  uniquement là où un cas de corruption réel a été identifié (le PER) et
  élargis partout ailleurs, pour ne plus écarter à tort des valeurs
  réelles mais extrêmes (hypercroissance, forte dette, redressement).
- Les requêtes sont envoyées avec une **limite de concurrence** (20 en
  parallèle, voir `lib/concurrency.ts`) plutôt que toutes en même temps,
  pour réduire le risque que Yahoo bloque l'accès comme trafic suspect.
- **Pas de rafraîchissement automatique** : les cours ne se rechargent
  que lors du tout premier affichage d'un univers, ou d'un clic explicite
  sur "Actualiser". Un cache navigateur (sessionStorage, par onglet) garde
  les dernières données affichées : revenir sur la page d'accueil depuis
  une page détail ne redéclenche pas un chargement complet — l'horodatage
  "Mis à jour à…" indique toujours l'ancienneté des données affichées.
- La route `/api/quotes` est configurée avec `maxDuration = 300` secondes.

**Si le chargement échoue ou est trop lent en pratique**, plusieurs
options, de la plus simple à la plus lourde :
1. Rester sur le SBF 120 pour un usage quotidien, et n'utiliser le S&P
   500 qu'occasionnellement — le cache 6h rend les visites suivantes
   nettement plus rapides que la toute première.
2. Réduire `CONCURRENCE` dans `app/api/quotes/route.ts` (moins de requêtes
   simultanées, plus lent mais plus discret).
3. Retirer des valeurs de `lib/tickers.ts` pour réduire l'univers S&P 500
   (par exemple ne garder que les 100-200 plus grosses capitalisations).
4. Passer au plan Vercel Pro si le plan Hobby impose un timeout trop court
   pour vos fonctions serverless.
5. Migrer vers un fournisseur de données payant avec clé d'API (voir
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
git commit -m "Screener SBF 120 / S&P 500"
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
  api/quotes/route.ts               → cours + score de l'univers choisi (?univers=sbf120|sp500)
  api/cotation/[ticker]/route.ts    → cours robuste d'une seule valeur
  api/fondamentaux/[ticker]/route.ts → données fondamentales + score d'une valeur
  api/historique/[ticker]/route.ts  → points du graphique pour une période donnée
  page.tsx                          → l'interface du screener (sélecteur d'univers, filtres, tableau)
  valeur/[ticker]/page.tsx          → page détail d'une valeur (graphique, métriques)
  comparateur/page.tsx              → comparateur de 2-3 valeurs (base 100)
  layout.tsx                        → structure HTML globale + polices
  globals.css                       → styles globaux et palette
components/
  TickerTape.tsx        → bandeau défilant façon téléscripteur
  Sparkline.tsx          → mini-graphique de tendance dans le tableau
  LineChart.tsx           → graphique détaillé (page valeur)
  ComparisonChart.tsx      → graphique superposé (comparateur)
  ComparaisonCategories.tsx → détail des 4 catégories côte à côte (comparateur)
  PalierBadge.tsx            → badge de palier réutilisable
  ScoreBadge.tsx               → badge visuel du score (lettre)
lib/
  tickers.ts                → les deux univers (SBF120, SP500) + registre UNIVERSS
  format.ts                   → formatage prix/volume, gère plusieurs devises
  plages.ts                     → périodes disponibles pour les graphiques
  score.ts                       → types et lettre du score (S/A/B/C/D/F)
  scoreCategoriel.ts               → calcul du score à 4 catégories, seuils fixes
  fondamentaux.ts                    → récupération des données fondamentales Yahoo
  yahooChart.ts                        → récupération et calcul des cours Yahoo
  yahooAuth.ts                          → authentification crumb/cookie Yahoo
  http.ts                                → fetch avec délai maximal
  concurrency.ts                          → limiteur de requêtes parallèles
  useFavoris.ts                             → hook favoris (localStorage)
```

## Ajuster les seuils de notation

Les seuils des 5 paliers (Très bon à Très faible) pour chacune des 18
métriques sont définis dans `lib/scoreCategoriel.ts` (constantes
`RENTABILITE`, `GESTION`, `CROISSANCE`, `SANTE_FINANCIERE`). Ils ont été
calibrés à dire d'expert, sans méthodologie propriétaire de référence à
reproduire, et sont **identiques pour le SBF 120 et le S&P 500** —
ajustez-les librement.

## Ajuster l'univers de valeurs

Éditez `lib/tickers.ts` : le tableau `SBF120` ou `SP500` (nom, ticker
Yahoo Finance, secteur, siège social) pour ajouter, retirer ou corriger
une valeur. Le registre `UNIVERSS` en bas de fichier regroupe les deux
univers avec leur indice de référence — inutile d'y toucher pour de
simples ajustements de liste.

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
- Si le S&P 500 échoue systématiquement alors que le SBF 120 fonctionne,
  c'est probablement un problème d'échelle (timeout ou blocage Yahoo) —
  voir la section Performance plus haut.
- En solution de repli pour les données fondamentales, vous pouvez adapter
  `lib/fondamentaux.ts` pour utiliser un fournisseur avec clé d'API
  gratuite, par exemple [Financial Modeling Prep](https://financialmodelingprep.com),
  en stockant la clé dans une variable d'environnement Vercel
  (`Project Settings → Environment Variables`).

## Licence

Libre d'utilisation et de modification pour un usage personnel.
