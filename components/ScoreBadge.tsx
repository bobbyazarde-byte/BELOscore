import { Lettre, COULEURS_LETTRE } from "@/lib/score";

export default function ScoreBadge({
  lettre,
  taille = "sm",
}: {
  lettre: Lettre | null;
  taille?: "sm" | "lg";
}) {
  if (!lettre) {
    return <span className="text-xs text-bourse-brume">—</span>;
  }

  const c = COULEURS_LETTRE[lettre];
  const classesTaille =
    taille === "lg"
      ? "h-10 w-10 text-lg"
      : "h-6 w-6 text-[11px]";

  return (
    <span
      className={`inline-flex ${classesTaille} items-center justify-center rounded-md border font-display font-semibold italic`}
      style={{ color: c.texte, backgroundColor: c.fond, borderColor: c.bordure }}
      title="Score technique (voir méthodologie)"
    >
      {lettre}
    </span>
  );
}
