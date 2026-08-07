export default function Sparkline({
  valeurs,
  largeur = 88,
  hauteur = 28,
}: {
  valeurs: number[] | null;
  largeur?: number;
  hauteur?: number;
}) {
  if (!valeurs || valeurs.length < 2) {
    return <span className="text-xs text-bourse-brume">—</span>;
  }

  const min = Math.min(...valeurs);
  const max = Math.max(...valeurs);
  const marge = 3;
  const echelle = (v: number) =>
    max === min
      ? hauteur / 2
      : hauteur - marge - ((v - min) / (max - min)) * (hauteur - marge * 2);

  const pas = largeur / (valeurs.length - 1);
  const points = valeurs
    .map((v, i) => `${(i * pas).toFixed(1)},${echelle(v).toFixed(1)}`)
    .join(" ");

  const hausse = valeurs[valeurs.length - 1] >= valeurs[0];
  const couleur = hausse ? "#3FB68B" : "#E2574C";

  return (
    <svg
      width={largeur}
      height={hauteur}
      viewBox={`0 0 ${largeur} ${hauteur}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={couleur}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
