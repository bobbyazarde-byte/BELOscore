import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Criée — Screener CAC 40",
  description:
    "Screener en temps différé des 40 valeurs du CAC 40 : cours, variation, volume et plus, filtrable par secteur.",
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
