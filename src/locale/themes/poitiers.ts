import { PropertyColor } from "../../engine/types";
import { LocationTheme } from "../types";

export const THEME_POITIERS: LocationTheme = {
  id: "poitiers",
  label: "Poitiers",

  propertyNames: {
    [PropertyColor.BROWN]:      ["Rue de la Cueille", "Rue du Pont Neuf"],
    [PropertyColor.LIGHT_BLUE]: ["Rue de la Tranchée", "Rue du Fbg du Pont-Neuf", "Rue Saint-Cyprien"],
    [PropertyColor.PINK]:       ["Rue Arsène Orillard", "Rue Carnot", "Rue de la Chaîne"],
    [PropertyColor.ORANGE]:     ["Rue de la Regratterie", "Rue des Grandes-Écoles", "Rue Boncenne"],
    [PropertyColor.RED]:        ["Rue Gambetta", "Rue de la Grand'Maison", "Place Charles de Gaulle"],
    [PropertyColor.YELLOW]:     ["Rue des Cordeliers", "Place du Mal-Leclerc", "Rue Henri Oudin"],
    [PropertyColor.GREEN]:      ["Bvd de Verdun", "Rue Jean Jaurès", "Bvd du Grand Cerf"],
    [PropertyColor.DARK_BLUE]:  ["Parc de Blossac", "Place d'Armes"],
  },

  stationNames: [
    "Marché des Couronneries",
    "Marché Notre-Dame",
    "Grand Leclerc",
    "Ilot des Cordeliers",
  ],

  establishmentsByCellIndex: {
    // Stations (marchés) — index 5, 15, 25, 29
    5:  { name: "Marché des Couronneries", services: ["buy", "sell"] },
    15: { name: "Marché Notre-Dame", services: ["buy", "sell"] },
    25: { name: "Grand Leclerc", services: ["buy", "sell"] },
    29: { name: "Ilot des Cordeliers", services: ["buy", "sell"] },
    // Index 11 — Rue Arsène Orillard : pas d'établissement (non défini)
    // Index 30 — Rue Henri Oudin : Agence immobilière, logement garanti
    30: {
      name: "Agence immobilière",
      services: ["sleep"],
      guaranteedLodgingCost: 80,
    },
    // Index 32 — Bvd de Verdun : Monument aux morts (symbolique, sans service)
    32: {
      name: "Monument aux morts",
      services: [],
    },
  },
};
