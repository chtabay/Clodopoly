import { PropertyColor } from "../../engine/types";
import { LocationTheme } from "../types";

export const THEME_MONOPOLY_US: LocationTheme = {
  id: "monopoly_us",
  label: "Monopoly US",

  propertyNames: {
    [PropertyColor.BROWN]:      ["Mediterranean Ave", "Baltic Ave"],
    [PropertyColor.LIGHT_BLUE]: ["Oriental Ave", "Vermont Ave", "Connecticut Ave"],
    [PropertyColor.PINK]:       ["St. Charles Place", "States Ave", "Virginia Ave"],
    [PropertyColor.ORANGE]:     ["St. James Place", "Tennessee Ave", "New York Ave"],
    [PropertyColor.RED]:        ["Kentucky Ave", "Indiana Ave", "Illinois Ave"],
    [PropertyColor.YELLOW]:     ["Atlantic Ave", "Ventnor Ave", "Marvin Gardens"],
    [PropertyColor.GREEN]:      ["Pacific Ave", "North Carolina Ave", "Pennsylvania Ave"],
    [PropertyColor.DARK_BLUE]:  ["Park Place", "Boardwalk"],
  },

  stationNames: [
    "Reading Railroad",
    "Pennsylvania Railroad",
    "B. & O. Railroad",
    "Short Line",
  ],
};
