# La Criée — Screener CAC 40

Screener des 40 valeurs de l'indice CAC 40 : cours, variation du jour,
plus haut/bas, volume — filtrable par secteur et par recherche texte,
avec tri sur chaque colonne. Construit avec **Next.js 14** (App Router)
et **Tailwind CSS**, sans base de données ni clé d'API à configurer.

**Fonctionnalités :**
- Tableau triable/filtrable des 40 valeurs, avec bandeau défilant
- Mini-graphique (sparkline) de tendance sur 1 mois pour chaque valeur
- **Score technique (S/A/B/C/D/F)** inspiré des plateformes de notation
  boursière type MINA : combine performance 1 mois et position dans la
  fourchette 52 semaines. C'est un indicateur purement technique basé sur
  les cours (aucune donnée fondamentale/comptable disponible via l'API
  gratuite utilisée) — méthodologie affichée en toute transparence sur
  chaque page de détail.
- **Favoris ★** : marque des valeurs en favori (persistant dans le
  navigateur via localStorage) et filtre le tableau dessus
- Page détail par valeur (clic sur son nom) : graphique interactif
  (5 jours à 5 ans) avec survol, plus haut/bas jour et 52 semaines, volume
- Comparateur : sélectionne jusqu'à 3 valeurs dans le tableau (cases à
  cocher) pour les superposer en performance relative (base 100)

Les cours sont récupérés côté serveur (route API Next.js) depuis
Yahoo Finance, ce qui évite les blocages CORS que l'on aurait en
interrogeant Yahoo directement depuis le navigateur.

⚠️ Données à titre informatif uniquement, en temps différé — ce projet
ne constitue pas un conseil en investissement.

## Lancer le projet en local

Prérequis : [Node.js](https://nodejs.org) 18 ou plus récent.

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

Créez au préalable un dépôt vide sur GitHub (bouton **New repository**),
sans README ni .gitignore générés automatiquement, puis collez son URL
dans la commande `git remote add origin` ci-dessus.

## Déployer sur Vercel

1. Rendez-vous sur [vercel.com](https://vercel.com) et connectez-vous
   avec votre compte GitHub.
2. Cliquez sur **Add New → Project**.
3. Sélectionnez le dépôt GitHub que vous venez de créer.
4. Vercel détecte automatiquement qu'il s'agit d'un projet Next.js —
   laissez les réglages par défaut (build command `next build`,
   output `Next.js`).
5. Cliquez sur **Deploy**. Au bout de 1 à 2 minutes, votre screener est
   en ligne sur une URL du type `https://votre-projet.vercel.app`.

Chaque nouveau `git push` sur la branche `main` redéploiera
automatiquement le site.

## Structure du projet

```
app/
  api/quotes/route.ts             → cotations + historique 1 mois (sparklines)
  api/historique/[ticker]/route.ts → historique détaillé d'une valeur (5j à 5 ans)
  page.tsx                        → l'interface du screener (recherche, filtres, tableau)
  valeur/[ticker]/page.tsx        → page détail d'une valeur (graphique, stats)
  comparateur/page.tsx            → comparateur de 2-3 valeurs (base 100)
  layout.tsx                      → structure HTML globale + polices
  globals.css                     → styles globaux et palette
components/
  TickerTape.tsx        → bandeau défilant façon téléscripteur
  Sparkline.tsx          → mini-graphique de tendance dans le tableau
  LineChart.tsx           → graphique détaillé (page valeur)
  ComparisonChart.tsx      → graphique superposé (comparateur)
  ScoreBadge.tsx            → badge visuel du score technique (lettre)
lib/
  tickers.ts                → liste des 40 valeurs (nom, ticker, secteur)
  score.ts                    → calcul du score technique S/A/B/C/D/F
  useFavoris.ts                 → hook favoris (localStorage)
```

## Ajuster la composition du CAC 40

La composition de l'indice est révisée chaque trimestre par Euronext.
Pour mettre à jour la liste des valeurs, éditez simplement le tableau
`CAC40` dans `lib/tickers.ts` (nom, ticker Yahoo Finance au format
`XXX.PA`, secteur).

## Si les cours ne se chargent plus

L'endpoint public de Yahoo Finance utilisé ici (`query1.finance.yahoo.com`)
n'est pas une API officielle et peut occasionnellement changer de
comportement ou bloquer certaines requêtes serveur. Si le screener
n'affiche plus de données :

- Vérifiez dans les logs Vercel (onglet **Functions**) le code
  retourné par `/api/quotes`.
- En solution de repli, vous pouvez adapter `app/api/quotes/route.ts`
  pour utiliser un fournisseur avec clé d'API gratuite, par exemple
  [Twelve Data](https://twelvedata.com) ou
  [Financial Modeling Prep](https://financialmodelingprep.com),
  en stockant la clé dans une variable d'environnement Vercel
  (`Project Settings → Environment Variables`).

## Licence

Libre d'utilisation et de modification pour un usage personnel.
