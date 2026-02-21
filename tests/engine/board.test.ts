import { describe, it, expect } from "vitest";
import { BOARD, getPropertiesByColor, getStations, getCellsByType } from "../../src/engine/board";
import { CellType, PropertyColor } from "../../src/engine/types";
import { BOARD_SIZE, PAYDAY_CELL, SHELTER_CELL, WORKPLACE_CELL, ROUNDUP_CELL } from "../../src/engine/constants";

describe("Board", () => {
  it("has exactly 40 cells", () => {
    expect(BOARD).toHaveLength(BOARD_SIZE);
  });

  it("cells have sequential indices 0-39", () => {
    for (let i = 0; i < BOARD_SIZE; i++) {
      expect(BOARD[i].index).toBe(i);
    }
  });

  it("special cells are at correct positions", () => {
    expect(BOARD[PAYDAY_CELL].type).toBe(CellType.PAYDAY);
    expect(BOARD[SHELTER_CELL].type).toBe(CellType.SHELTER);
    expect(BOARD[WORKPLACE_CELL].type).toBe(CellType.WORKPLACE);
    expect(BOARD[ROUNDUP_CELL].type).toBe(CellType.ROUNDUP);
  });

  it("has 22 property cells", () => {
    const properties = BOARD.filter(c => c.type === CellType.PROPERTY);
    expect(properties).toHaveLength(22);
  });

  it("all properties have a color, nightCost, and hotelCost", () => {
    for (const cell of BOARD) {
      if (cell.type === CellType.PROPERTY) {
        expect(cell.color).toBeDefined();
        expect(cell.nightCost).toBeGreaterThan(0);
        expect(cell.hotelCost).toBeGreaterThan(cell.nightCost!);
      }
    }
  });

  it("has correct number of properties per color", () => {
    expect(getPropertiesByColor(PropertyColor.BROWN)).toHaveLength(2);
    expect(getPropertiesByColor(PropertyColor.LIGHT_BLUE)).toHaveLength(3);
    expect(getPropertiesByColor(PropertyColor.PINK)).toHaveLength(3);
    expect(getPropertiesByColor(PropertyColor.ORANGE)).toHaveLength(3);
    expect(getPropertiesByColor(PropertyColor.RED)).toHaveLength(3);
    expect(getPropertiesByColor(PropertyColor.YELLOW)).toHaveLength(3);
    expect(getPropertiesByColor(PropertyColor.GREEN)).toHaveLength(3);
    expect(getPropertiesByColor(PropertyColor.DARK_BLUE)).toHaveLength(2);
  });

  it("has 4 stations (2 petit boulot + 2 market)", () => {
    const stations = getStations();
    expect(stations).toHaveLength(4);
    const petitBoulots = getCellsByType(CellType.PETIT_BOULOT);
    const markets = getCellsByType(CellType.MARKET);
    expect(petitBoulots).toHaveLength(2);
    expect(markets).toHaveLength(2);
  });

  it("has 3 event cells, 3 scavenge cells", () => {
    expect(getCellsByType(CellType.EVENT)).toHaveLength(3);
    expect(getCellsByType(CellType.SCAVENGE)).toHaveLength(3);
  });

  it("has 1 shower, 1 clinic", () => {
    expect(getCellsByType(CellType.SHOWER)).toHaveLength(1);
    expect(getCellsByType(CellType.CLINIC)).toHaveLength(1);
  });

  it("non-property cells have no color/cost", () => {
    for (const cell of BOARD) {
      if (cell.type !== CellType.PROPERTY) {
        expect(cell.color).toBeUndefined();
        expect(cell.nightCost).toBeUndefined();
      }
    }
  });
});
