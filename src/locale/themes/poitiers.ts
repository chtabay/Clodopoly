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
    "Gare de Poitiers",
    "Marché Notre-Dame",
    "CHU de Poitiers",
    "Les Cordeliers",
  ],
};
