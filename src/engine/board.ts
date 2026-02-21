import { CellDefinition, CellType, PropertyColor } from "./types";

export const BOARD: readonly CellDefinition[] = [
  // Bottom row (index 0-10)
  { index: 0,  type: CellType.PAYDAY },
  { index: 1,  type: CellType.PROPERTY,     color: PropertyColor.BROWN,      nightCost: 30, hotelCost: 50 },
  { index: 2,  type: CellType.SCAVENGE },
  { index: 3,  type: CellType.PROPERTY,     color: PropertyColor.BROWN,      nightCost: 30, hotelCost: 50 },
  { index: 4,  type: CellType.TAX_INCOME },
  { index: 5,  type: CellType.PETIT_BOULOT },
  { index: 6,  type: CellType.PROPERTY,     color: PropertyColor.LIGHT_BLUE, nightCost: 30, hotelCost: 50 },
  { index: 7,  type: CellType.EVENT },
  { index: 8,  type: CellType.PROPERTY,     color: PropertyColor.LIGHT_BLUE, nightCost: 30, hotelCost: 50 },
  { index: 9,  type: CellType.PROPERTY,     color: PropertyColor.LIGHT_BLUE, nightCost: 30, hotelCost: 50 },
  { index: 10, type: CellType.SHELTER },

  // Left column (index 11-20)
  { index: 11, type: CellType.PROPERTY,     color: PropertyColor.PINK,       nightCost: 60, hotelCost: 100 },
  { index: 12, type: CellType.SHOWER },
  { index: 13, type: CellType.PROPERTY,     color: PropertyColor.PINK,       nightCost: 60, hotelCost: 100 },
  { index: 14, type: CellType.PROPERTY,     color: PropertyColor.PINK,       nightCost: 60, hotelCost: 100 },
  { index: 15, type: CellType.MARKET },
  { index: 16, type: CellType.PROPERTY,     color: PropertyColor.ORANGE,     nightCost: 60, hotelCost: 100 },
  { index: 17, type: CellType.SCAVENGE },
  { index: 18, type: CellType.PROPERTY,     color: PropertyColor.ORANGE,     nightCost: 60, hotelCost: 100 },
  { index: 19, type: CellType.PROPERTY,     color: PropertyColor.ORANGE,     nightCost: 60, hotelCost: 100 },
  { index: 20, type: CellType.WORKPLACE },

  // Top row (index 21-30)
  { index: 21, type: CellType.PROPERTY,     color: PropertyColor.RED,        nightCost: 90, hotelCost: 150 },
  { index: 22, type: CellType.EVENT },
  { index: 23, type: CellType.PROPERTY,     color: PropertyColor.RED,        nightCost: 90, hotelCost: 150 },
  { index: 24, type: CellType.PROPERTY,     color: PropertyColor.RED,        nightCost: 90, hotelCost: 150 },
  { index: 25, type: CellType.PETIT_BOULOT },
  { index: 26, type: CellType.CLINIC },
  { index: 27, type: CellType.PROPERTY,     color: PropertyColor.YELLOW,     nightCost: 90, hotelCost: 150 },
  { index: 28, type: CellType.PROPERTY,     color: PropertyColor.YELLOW,     nightCost: 90, hotelCost: 150 },
  { index: 29, type: CellType.MARKET },
  { index: 30, type: CellType.PROPERTY,     color: PropertyColor.YELLOW,     nightCost: 90, hotelCost: 150 },

  // Right column (index 31-39)
  { index: 31, type: CellType.ROUNDUP },
  { index: 32, type: CellType.PROPERTY,     color: PropertyColor.GREEN,      nightCost: 120, hotelCost: 200 },
  { index: 33, type: CellType.PROPERTY,     color: PropertyColor.GREEN,      nightCost: 120, hotelCost: 200 },
  { index: 34, type: CellType.SCAVENGE },
  { index: 35, type: CellType.PROPERTY,     color: PropertyColor.DARK_BLUE,  nightCost: 120, hotelCost: 200 },
  { index: 36, type: CellType.EVENT },
  { index: 37, type: CellType.PROPERTY,     color: PropertyColor.GREEN,      nightCost: 120, hotelCost: 200 },
  { index: 38, type: CellType.TAX_LUXURY },
  { index: 39, type: CellType.PROPERTY,     color: PropertyColor.DARK_BLUE,  nightCost: 120, hotelCost: 200 },
] as const;

export function getPropertiesByColor(color: PropertyColor): CellDefinition[] {
  return BOARD.filter(c => c.color === color);
}

export function getStations(): CellDefinition[] {
  return BOARD.filter(
    c => c.type === CellType.PETIT_BOULOT || c.type === CellType.MARKET,
  );
}

export function getCellsByType(type: CellType): CellDefinition[] {
  return BOARD.filter(c => c.type === type);
}
