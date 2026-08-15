import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BELOSCORE — Screener SBF 120 / S&P 500",
  description:
    "Screener des valeurs du SBF 120 et du S&P 500 avec score en 4 catégories (Rentabilité, Gestion, Croissance, Santé financière), cours en temps différé, filtrable par secteur.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-bourse-void bg-grain font-body text-bourse-texte antialiased">
        {children}
      </body>
    </html>
  );
}
