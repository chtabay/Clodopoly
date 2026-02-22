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
    [PropertyColor.RED]:        ["Rue Gambetta", "Rue Jean Coll", "Place du Pilori"],
    [PropertyColor.YELLOW]:     ["Rue des Cordeliers", "Pierre Levée", "Rue de la Marne"],
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
    // Stations (marchés) — pas d'etablissement affiche, le nom de station suffit
    5:  { name: "", services: ["buy", "sell"] },
    15: { name: "", services: ["buy", "sell"] },
    25: { name: "", services: ["buy", "sell"] },
    29: { name: "", services: ["buy", "sell"] },
    // LIGHT_BLUE
    6:  { name: "Le Yakido", services: ["work"] },
    8:  { name: "Le Longchamps", services: ["work"] },
    9:  { name: "Ilot de Tison", services: ["work", "sleep"] },
    // PINK
    14: { name: "Tante May Tattoo", services: ["work"] },
    // RED
    24: { name: "Statue de la Liberté", services: [] },
    // YELLOW
    30: { name: "Agence immobilière", services: ["sleep"], guaranteedLodgingCost: 80 },
    // GREEN
    32: { name: "Monument aux morts", services: [] },
    33: { name: "Espace Mendès France", services: [] },
    // DARK_BLUE
    39: { name: "Hôtel de Ville", services: ["work"] },
  },
};
