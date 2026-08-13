import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BELOSCORE — Screener PEA (SBF 120)",
  description:
    "Screener des valeurs du SBF 120 éligibles au PEA avec score Value/Qualité, cours en temps différé, filtrable par secteur.",
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
