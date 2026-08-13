export type Secteur =
  | "Aéronautique & Défense"
  | "Assurance"
  | "Automobile"
  | "Banque & Finance"
  | "BTP & Concessions"
  | "Consommation & Distribution"
  | "Énergie & Utilities"
  | "Immobilier"
  | "Industrie & Matériaux"
  | "Luxe & Cosmétiques"
  | "Médias & Communication"
  | "Santé"
  | "Services & Technologie"
  | "Transport & Logistique";

export interface Valeur {
  nom: string;
  ticker: string; // ticker Yahoo Finance (place de Paris, suffixe .PA)
  mnemo: string; // code mnémonique Euronext
  secteur: Secteur;
  siege: string; // pays du siège social
}

// Univers du screener : indice SBF 120 (les 40 valeurs du CAC 40 + les 80
// valeurs suivantes les plus liquides d'Euronext Paris), qui couvre la
// quasi-totalité des actions françaises éligibles au PEA couramment
// suivies par les particuliers.
//
// ⚠️ IMPORTANT — fiabilité des données : pour les 40 valeurs du CAC 40,
// les tickers ont été vérifiés individuellement. Pour les ~80 valeurs
// supplémentaires du SBF 120, la composition provient d'un relevé
// Wikipédia daté de décembre 2024 et les tickers Euronext sont une
// reconstitution du meilleur effort, non vérifiée valeur par valeur.
// Une bonne partie sera correcte, mais certains codes peuvent être
// erronés ou obsolètes (fusions, changements de code, sorties d'indice).
// Une valeur avec un ticker incorrect affichera simplement "—" dans le
// screener plutôt que de casser la page — repérez les lignes qui restent
// vides après plusieurs rafraîchissements et corrigez le ticker
// correspondant ci-dessous (le nom de la société sur Yahoo Finance donne
// généralement le bon code). Vivendi a été exclu de la liste : sa scission
// de décembre 2024 (Canal+, Havas, Louis Hachette Group) rend son ticker
// Euronext Paris incertain au moment de la rédaction.
export const UNIVERS: Valeur[] = [
  { nom: "Accor", ticker: "AC.PA", mnemo: "AC", secteur: "Consommation & Distribution", siege: "France" },
  { nom: "ADP (Aéroports de Paris)", ticker: "ADP.PA", mnemo: "ADP", secteur: "Transport & Logistique", siege: "France" },
  { nom: "Air France-KLM", ticker: "AF.PA", mnemo: "AF", secteur: "Transport & Logistique", siege: "France" },
  { nom: "Air Liquide", ticker: "AI.PA", mnemo: "AI", secteur: "Industrie & Matériaux", siege: "France" },
  { nom: "Airbus", ticker: "AIR.PA", mnemo: "AIR", secteur: "Aéronautique & Défense", siege: "Pays-Bas" },
  { nom: "Alstom", ticker: "ALO.PA", mnemo: "ALO", secteur: "Transport & Logistique", siege: "France" },
  { nom: "Alten", ticker: "ATE.PA", mnemo: "ATE", secteur: "Services & Technologie", siege: "France" },
  { nom: "Amundi", ticker: "AMUN.PA", mnemo: "AMUN", secteur: "Banque & Finance", siege: "France" },
  { nom: "Aperam", ticker: "APAM.PA", mnemo: "APAM", secteur: "Industrie & Matériaux", siege: "Luxembourg" },
  { nom: "ArcelorMittal", ticker: "MT.PA", mnemo: "MT", secteur: "Industrie & Matériaux", siege: "Luxembourg" },
  { nom: "Argan", ticker: "ARG.PA", mnemo: "ARG", secteur: "Immobilier", siege: "France" },
  { nom: "Arkema", ticker: "AKE.PA", mnemo: "AKE", secteur: "Industrie & Matériaux", siege: "France" },
  { nom: "Atos", ticker: "ATO.PA", mnemo: "ATO", secteur: "Services & Technologie", siege: "France" },
  { nom: "Axa", ticker: "CS.PA", mnemo: "CS", secteur: "Assurance", siege: "France" },
  { nom: "Ayvens", ticker: "AYV.PA", mnemo: "AYV", secteur: "Automobile", siege: "France" },
  { nom: "Bénéteau", ticker: "BEN.PA", mnemo: "BEN", secteur: "Industrie & Matériaux", siege: "France" },
  { nom: "Bic", ticker: "BB.PA", mnemo: "BB", secteur: "Consommation & Distribution", siege: "France" },
  { nom: "bioMérieux", ticker: "BIM.PA", mnemo: "BIM", secteur: "Santé", siege: "France" },
  { nom: "BNP Paribas", ticker: "BNP.PA", mnemo: "BNP", secteur: "Banque & Finance", siege: "France" },
  { nom: "Bolloré", ticker: "BOL.PA", mnemo: "BOL", secteur: "Transport & Logistique", siege: "France" },
  { nom: "Bouygues", ticker: "EN.PA", mnemo: "EN", secteur: "BTP & Concessions", siege: "France" },
  { nom: "Bureau Veritas", ticker: "BVI.PA", mnemo: "BVI", secteur: "Services & Technologie", siege: "France" },
  { nom: "Capgemini", ticker: "CAP.PA", mnemo: "CAP", secteur: "Services & Technologie", siege: "France" },
  { nom: "Carmila", ticker: "CARM.PA", mnemo: "CARM", secteur: "Immobilier", siege: "France" },
  { nom: "Carrefour", ticker: "CA.PA", mnemo: "CA", secteur: "Consommation & Distribution", siege: "France" },
  { nom: "Clariane", ticker: "CLARI.PA", mnemo: "CLARI", secteur: "Santé", siege: "France" },
  { nom: "Coface", ticker: "COFA.PA", mnemo: "COFA", secteur: "Assurance", siege: "France" },
  { nom: "Covivio", ticker: "COV.PA", mnemo: "COV", secteur: "Immobilier", siege: "France" },
  { nom: "Crédit Agricole", ticker: "ACA.PA", mnemo: "ACA", secteur: "Banque & Finance", siege: "France" },
  { nom: "Danone", ticker: "BN.PA", mnemo: "BN", secteur: "Consommation & Distribution", siege: "France" },
  { nom: "Dassault Aviation", ticker: "AM.PA", mnemo: "AM", secteur: "Aéronautique & Défense", siege: "France" },
  { nom: "Dassault Systèmes", ticker: "DSY.PA", mnemo: "DSY", secteur: "Services & Technologie", siege: "France" },
  { nom: "Derichebourg", ticker: "DBG.PA", mnemo: "DBG", secteur: "Industrie & Matériaux", siege: "France" },
  { nom: "Edenred", ticker: "EDEN.PA", mnemo: "EDEN", secteur: "Services & Technologie", siege: "France" },
  { nom: "Eiffage", ticker: "FGR.PA", mnemo: "FGR", secteur: "BTP & Concessions", siege: "France" },
  { nom: "Elior", ticker: "ELIOR.PA", mnemo: "ELIOR", secteur: "Consommation & Distribution", siege: "France" },
  { nom: "Elis", ticker: "ELIS.PA", mnemo: "ELIS", secteur: "Services & Technologie", siege: "France" },
  { nom: "Emeis", ticker: "EMEIS.PA", mnemo: "EMEIS", secteur: "Santé", siege: "France" },
  { nom: "Engie", ticker: "ENGI.PA", mnemo: "ENGI", secteur: "Énergie & Utilities", siege: "France" },
  { nom: "Eramet", ticker: "ERA.PA", mnemo: "ERA", secteur: "Industrie & Matériaux", siege: "France" },
  { nom: "EssilorLuxottica", ticker: "EL.PA", mnemo: "EL", secteur: "Luxe & Cosmétiques", siege: "France" },
  { nom: "Esso", ticker: "ES.PA", mnemo: "ES", secteur: "Énergie & Utilities", siege: "France" },
  { nom: "Eurazeo", ticker: "RF.PA", mnemo: "RF", secteur: "Banque & Finance", siege: "France" },
  { nom: "Eurofins Scientific", ticker: "ERF.PA", mnemo: "ERF", secteur: "Santé", siege: "Luxembourg" },
  { nom: "Euronext", ticker: "ENX.PA", mnemo: "ENX", secteur: "Banque & Finance", siege: "Pays-Bas" },
  { nom: "FDJ United", ticker: "FDJU.PA", mnemo: "FDJU", secteur: "Consommation & Distribution", siege: "France" },
  { nom: "Forvia", ticker: "FRVIA.PA", mnemo: "FRVIA", secteur: "Automobile", siege: "France" },
  { nom: "Gecina", ticker: "GFC.PA", mnemo: "GFC", secteur: "Immobilier", siege: "France" },
  { nom: "Getlink", ticker: "GET.PA", mnemo: "GET", secteur: "Transport & Logistique", siege: "France" },
  { nom: "GTT (Gaztransport & Technigaz)", ticker: "GTT.PA", mnemo: "GTT", secteur: "Industrie & Matériaux", siege: "France" },
  { nom: "Hermès International", ticker: "RMS.PA", mnemo: "RMS", secteur: "Luxe & Cosmétiques", siege: "France" },
  { nom: "Icade", ticker: "ICAD.PA", mnemo: "ICAD", secteur: "Immobilier", siege: "France" },
  { nom: "ID Logistics", ticker: "IDL.PA", mnemo: "IDL", secteur: "Transport & Logistique", siege: "France" },
  { nom: "Imerys", ticker: "NK.PA", mnemo: "NK", secteur: "Industrie & Matériaux", siege: "France" },
  { nom: "Interparfums", ticker: "ITP.PA", mnemo: "ITP", secteur: "Luxe & Cosmétiques", siege: "France" },
  { nom: "Ipsen", ticker: "IPN.PA", mnemo: "IPN", secteur: "Santé", siege: "France" },
  { nom: "Ipsos", ticker: "IPS.PA", mnemo: "IPS", secteur: "Services & Technologie", siege: "France" },
  { nom: "JCDecaux", ticker: "DEC.PA", mnemo: "DEC", secteur: "Médias & Communication", siege: "France" },
  { nom: "Kering", ticker: "KER.PA", mnemo: "KER", secteur: "Luxe & Cosmétiques", siege: "France" },
  { nom: "Klepierre", ticker: "LI.PA", mnemo: "LI", secteur: "Immobilier", siege: "France" },
  { nom: "L'Oréal", ticker: "OR.PA", mnemo: "OR", secteur: "Luxe & Cosmétiques", siege: "France" },
  { nom: "Legrand", ticker: "LR.PA", mnemo: "LR", secteur: "Industrie & Matériaux", siege: "France" },
  { nom: "LVMH", ticker: "MC.PA", mnemo: "MC", secteur: "Luxe & Cosmétiques", siege: "France" },
  { nom: "Maurel & Prom", ticker: "MAU.PA", mnemo: "MAU", secteur: "Énergie & Utilities", siege: "France" },
  { nom: "MedinCell", ticker: "MEDCL.PA", mnemo: "MEDCL", secteur: "Santé", siege: "France" },
  { nom: "Mercialys", ticker: "MERY.PA", mnemo: "MERY", secteur: "Immobilier", siege: "France" },
  { nom: "Mersen", ticker: "MRN.PA", mnemo: "MRN", secteur: "Industrie & Matériaux", siege: "France" },
  { nom: "M6 Métropole Télévision", ticker: "MMT.PA", mnemo: "MMT", secteur: "Médias & Communication", siege: "France" },
  { nom: "Michelin", ticker: "ML.PA", mnemo: "ML", secteur: "Automobile", siege: "France" },
  { nom: "Neoen", ticker: "NEOEN.PA", mnemo: "NEOEN", secteur: "Énergie & Utilities", siege: "France" },
  { nom: "Nexans", ticker: "NEX.PA", mnemo: "NEX", secteur: "Industrie & Matériaux", siege: "France" },
  { nom: "Nexity", ticker: "NXI.PA", mnemo: "NXI", secteur: "Immobilier", siege: "France" },
  { nom: "OPmobility", ticker: "OPM.PA", mnemo: "OPM", secteur: "Automobile", siege: "France" },
  { nom: "Orange", ticker: "ORA.PA", mnemo: "ORA", secteur: "Services & Technologie", siege: "France" },
  { nom: "Pernod Ricard", ticker: "RI.PA", mnemo: "RI", secteur: "Consommation & Distribution", siege: "France" },
  { nom: "Planisware", ticker: "PLNW.PA", mnemo: "PLNW", secteur: "Services & Technologie", siege: "France" },
  { nom: "Pluxee", ticker: "PLX.PA", mnemo: "PLX", secteur: "Services & Technologie", siege: "France" },
  { nom: "Publicis Groupe", ticker: "PUB.PA", mnemo: "PUB", secteur: "Médias & Communication", siege: "France" },
  { nom: "Rémy Cointreau", ticker: "RCO.PA", mnemo: "RCO", secteur: "Consommation & Distribution", siege: "France" },
  { nom: "Renault", ticker: "RNO.PA", mnemo: "RNO", secteur: "Automobile", siege: "France" },
  { nom: "Rexel", ticker: "RXL.PA", mnemo: "RXL", secteur: "Industrie & Matériaux", siege: "France" },
  { nom: "Robertet", ticker: "RBT.PA", mnemo: "RBT", secteur: "Luxe & Cosmétiques", siege: "France" },
  { nom: "Rubis", ticker: "RUI.PA", mnemo: "RUI", secteur: "Énergie & Utilities", siege: "France" },
  { nom: "SEB", ticker: "SK.PA", mnemo: "SK", secteur: "Industrie & Matériaux", siege: "France" },
  { nom: "Safran", ticker: "SAF.PA", mnemo: "SAF", secteur: "Aéronautique & Défense", siege: "France" },
  { nom: "Saint-Gobain", ticker: "SGO.PA", mnemo: "SGO", secteur: "Industrie & Matériaux", siege: "France" },
  { nom: "Sanofi", ticker: "SAN.PA", mnemo: "SAN", secteur: "Santé", siege: "France" },
  { nom: "Sartorius Stedim Biotech", ticker: "DIM.PA", mnemo: "DIM", secteur: "Santé", siege: "France" },
  { nom: "Schneider Electric", ticker: "SU.PA", mnemo: "SU", secteur: "Industrie & Matériaux", siege: "France" },
  { nom: "Scor", ticker: "SCR.PA", mnemo: "SCR", secteur: "Assurance", siege: "France" },
  { nom: "SES", ticker: "SESG.PA", mnemo: "SESG", secteur: "Services & Technologie", siege: "Luxembourg" },
  { nom: "Société Générale", ticker: "GLE.PA", mnemo: "GLE", secteur: "Banque & Finance", siege: "France" },
  { nom: "Sodexo", ticker: "SW.PA", mnemo: "SW", secteur: "Consommation & Distribution", siege: "France" },
  { nom: "Soitec", ticker: "SOI.PA", mnemo: "SOI", secteur: "Industrie & Matériaux", siege: "France" },
  { nom: "Solvay", ticker: "SOLB.PA", mnemo: "SOLB", secteur: "Industrie & Matériaux", siege: "Belgique" },
  { nom: "Sopra Steria", ticker: "SOP.PA", mnemo: "SOP", secteur: "Services & Technologie", siege: "France" },
  { nom: "Spie", ticker: "SPIE.PA", mnemo: "SPIE", secteur: "BTP & Concessions", siege: "France" },
  { nom: "Stellantis", ticker: "STLAP.PA", mnemo: "STLA", secteur: "Automobile", siege: "Pays-Bas" },
  { nom: "STMicroelectronics", ticker: "STM.PA", mnemo: "STM", secteur: "Services & Technologie", siege: "Pays-Bas" },
  { nom: "Technip Energies", ticker: "TE.PA", mnemo: "TE", secteur: "Énergie & Utilities", siege: "France" },
  { nom: "Teleperformance", ticker: "TEP.PA", mnemo: "TEP", secteur: "Services & Technologie", siege: "France" },
  { nom: "TF1", ticker: "TFI.PA", mnemo: "TFI", secteur: "Médias & Communication", siege: "France" },
  { nom: "Thales", ticker: "HO.PA", mnemo: "HO", secteur: "Aéronautique & Défense", siege: "France" },
  { nom: "TotalEnergies", ticker: "TTE.PA", mnemo: "TTE", secteur: "Énergie & Utilities", siege: "France" },
  { nom: "Trigano", ticker: "TRI.PA", mnemo: "TRI", secteur: "Consommation & Distribution", siege: "France" },
  { nom: "Ubisoft Entertainment", ticker: "UBI.PA", mnemo: "UBI", secteur: "Services & Technologie", siege: "France" },
  { nom: "Unibail-Rodamco-Westfield", ticker: "URW.PA", mnemo: "URW", secteur: "Immobilier", siege: "France" },
  { nom: "Valeo", ticker: "FR.PA", mnemo: "FR", secteur: "Automobile", siege: "France" },
  { nom: "Vallourec", ticker: "VK.PA", mnemo: "VK", secteur: "Industrie & Matériaux", siege: "France" },
  { nom: "Valneva", ticker: "VLA.PA", mnemo: "VLA", secteur: "Santé", siege: "France" },
  { nom: "Veolia Environnement", ticker: "VIE.PA", mnemo: "VIE", secteur: "Énergie & Utilities", siege: "France" },
  { nom: "Verallia", ticker: "VRLA.PA", mnemo: "VRLA", secteur: "Industrie & Matériaux", siege: "France" },
  { nom: "Vicat", ticker: "VCT.PA", mnemo: "VCT", secteur: "Industrie & Matériaux", siege: "France" },
  { nom: "Vinci", ticker: "DG.PA", mnemo: "DG", secteur: "BTP & Concessions", siege: "France" },
  { nom: "Virbac", ticker: "VIRP.PA", mnemo: "VIRP", secteur: "Santé", siege: "France" },
  { nom: "Viridien", ticker: "VIRI.PA", mnemo: "VIRI", secteur: "Services & Technologie", siege: "France" },
  { nom: "VusionGroup", ticker: "VU.PA", mnemo: "VU", secteur: "Services & Technologie", siege: "France" },
  { nom: "Wendel", ticker: "MF.PA", mnemo: "MF", secteur: "Banque & Finance", siege: "France" },
  { nom: "Worldline", ticker: "WLN.PA", mnemo: "WLN", secteur: "Services & Technologie", siege: "France" },
];

export const SECTEURS: Secteur[] = Array.from(
  new Set(UNIVERS.map((v) => v.secteur))
).sort() as Secteur[];

// Ticker Yahoo Finance de l'indice CAC 40 (utilisé pour le bandeau d'en-tête)
export const INDICE_TICKER = "^FCHI";
