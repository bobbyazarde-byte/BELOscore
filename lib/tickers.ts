export type Secteur =
  | "Aéronautique & Défense"
  | "Automobile"
  | "Banque & Finance"
  | "BTP & Concessions"
  | "Consommation & Distribution"
  | "Énergie & Utilities"
  | "Industrie & Matériaux"
  | "Luxe & Cosmétiques"
  | "Santé"
  | "Services & Technologie";

export interface Valeur {
  nom: string;
  ticker: string; // ticker Yahoo Finance (place de Paris, suffixe .PA)
  mnemo: string; // code mnémonique Euronext
  secteur: Secteur;
}

// Composition du CAC 40 — mise à jour du 22 décembre 2025 (entrée d'Eiffage,
// sortie d'Edenred). À vérifier périodiquement : la composition est revue
// chaque trimestre par le Conseil scientifique des indices d'Euronext.
export const CAC40: Valeur[] = [
  { nom: "Accor", ticker: "AC.PA", mnemo: "AC", secteur: "Consommation & Distribution" },
  { nom: "Air Liquide", ticker: "AI.PA", mnemo: "AI", secteur: "Industrie & Matériaux" },
  { nom: "Airbus", ticker: "AIR.PA", mnemo: "AIR", secteur: "Aéronautique & Défense" },
  { nom: "ArcelorMittal", ticker: "MT.PA", mnemo: "MT", secteur: "Industrie & Matériaux" },
  { nom: "Axa", ticker: "CS.PA", mnemo: "CS", secteur: "Banque & Finance" },
  { nom: "BNP Paribas", ticker: "BNP.PA", mnemo: "BNP", secteur: "Banque & Finance" },
  { nom: "Bouygues", ticker: "EN.PA", mnemo: "EN", secteur: "BTP & Concessions" },
  { nom: "Bureau Veritas", ticker: "BVI.PA", mnemo: "BVI", secteur: "Services & Technologie" },
  { nom: "Capgemini", ticker: "CAP.PA", mnemo: "CAP", secteur: "Services & Technologie" },
  { nom: "Carrefour", ticker: "CA.PA", mnemo: "CA", secteur: "Consommation & Distribution" },
  { nom: "Crédit Agricole", ticker: "ACA.PA", mnemo: "ACA", secteur: "Banque & Finance" },
  { nom: "Danone", ticker: "BN.PA", mnemo: "BN", secteur: "Consommation & Distribution" },
  { nom: "Dassault Systèmes", ticker: "DSY.PA", mnemo: "DSY", secteur: "Services & Technologie" },
  { nom: "Eiffage", ticker: "FGR.PA", mnemo: "FGR", secteur: "BTP & Concessions" },
  { nom: "Engie", ticker: "ENGI.PA", mnemo: "ENGI", secteur: "Énergie & Utilities" },
  { nom: "EssilorLuxottica", ticker: "EL.PA", mnemo: "EL", secteur: "Luxe & Cosmétiques" },
  { nom: "Eurofins Scientific", ticker: "ERF.PA", mnemo: "ERF", secteur: "Santé" },
  { nom: "Euronext", ticker: "ENX.PA", mnemo: "ENX", secteur: "Banque & Finance" },
  { nom: "Hermès International", ticker: "RMS.PA", mnemo: "RMS", secteur: "Luxe & Cosmétiques" },
  { nom: "Kering", ticker: "KER.PA", mnemo: "KER", secteur: "Luxe & Cosmétiques" },
  { nom: "L'Oréal", ticker: "OR.PA", mnemo: "OR", secteur: "Luxe & Cosmétiques" },
  { nom: "Legrand", ticker: "LR.PA", mnemo: "LR", secteur: "Industrie & Matériaux" },
  { nom: "LVMH", ticker: "MC.PA", mnemo: "MC", secteur: "Luxe & Cosmétiques" },
  { nom: "Michelin", ticker: "ML.PA", mnemo: "ML", secteur: "Automobile" },
  { nom: "Orange", ticker: "ORA.PA", mnemo: "ORA", secteur: "Services & Technologie" },
  { nom: "Pernod Ricard", ticker: "RI.PA", mnemo: "RI", secteur: "Consommation & Distribution" },
  { nom: "Publicis Groupe", ticker: "PUB.PA", mnemo: "PUB", secteur: "Services & Technologie" },
  { nom: "Renault", ticker: "RNO.PA", mnemo: "RNO", secteur: "Automobile" },
  { nom: "Safran", ticker: "SAF.PA", mnemo: "SAF", secteur: "Aéronautique & Défense" },
  { nom: "Saint-Gobain", ticker: "SGO.PA", mnemo: "SGO", secteur: "Industrie & Matériaux" },
  { nom: "Sanofi", ticker: "SAN.PA", mnemo: "SAN", secteur: "Santé" },
  { nom: "Schneider Electric", ticker: "SU.PA", mnemo: "SU", secteur: "Industrie & Matériaux" },
  { nom: "Société Générale", ticker: "GLE.PA", mnemo: "GLE", secteur: "Banque & Finance" },
  { nom: "Stellantis", ticker: "STLAP.PA", mnemo: "STLA", secteur: "Automobile" },
  { nom: "STMicroelectronics", ticker: "STM.PA", mnemo: "STM", secteur: "Services & Technologie" },
  { nom: "Thales", ticker: "HO.PA", mnemo: "HO", secteur: "Aéronautique & Défense" },
  { nom: "TotalEnergies", ticker: "TTE.PA", mnemo: "TTE", secteur: "Énergie & Utilities" },
  { nom: "Unibail-Rodamco-Westfield", ticker: "URW.PA", mnemo: "URW", secteur: "BTP & Concessions" },
  { nom: "Veolia Environnement", ticker: "VIE.PA", mnemo: "VIE", secteur: "Énergie & Utilities" },
  { nom: "Vinci", ticker: "DG.PA", mnemo: "DG", secteur: "BTP & Concessions" },
];

export const SECTEURS: Secteur[] = Array.from(
  new Set(CAC40.map((v) => v.secteur))
).sort() as Secteur[];

// Ticker Yahoo Finance de l'indice CAC 40 lui-même
export const INDICE_TICKER = "^FCHI";
