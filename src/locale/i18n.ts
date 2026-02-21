import { CellDefinition, CellType, PropertyColor } from "../engine/types";
import { BOARD } from "../engine/board";
import { LangData, LocationTheme } from "./types";

export function getCellDisplayName(
  cellIndex: number,
  lang: LangData,
  theme: LocationTheme,
): string {
  const cell = BOARD[cellIndex];
  if (!cell) return "???";

  if (cell.type === CellType.PROPERTY && cell.color) {
    const colorGroup = BOARD
      .filter((c): c is CellDefinition & { color: PropertyColor } =>
        c.type === CellType.PROPERTY && c.color === cell.color,
      )
      .sort((a, b) => a.index - b.index);
    const posInGroup = colorGroup.findIndex(c => c.index === cell.index);
    const names = theme.propertyNames[cell.color];
    return names?.[posInGroup] ?? `Propriété ${cellIndex}`;
  }

  if (cell.type === CellType.PETIT_BOULOT || cell.type === CellType.MARKET) {
    const stations = BOARD
      .filter(c => c.type === CellType.PETIT_BOULOT || c.type === CellType.MARKET)
      .sort((a, b) => a.index - b.index);
    const posInStations = stations.findIndex(c => c.index === cell.index);
    return theme.stationNames[posInStations] ?? `Station ${cellIndex}`;
  }

  const typeToKey: Partial<Record<CellType, keyof LangData["cells"]>> = {
    [CellType.PAYDAY]: "payday",
    [CellType.SHELTER]: "shelter",
    [CellType.WORKPLACE]: "workplace",
    [CellType.ROUNDUP]: "roundup",
    [CellType.EVENT]: "event",
    [CellType.SCAVENGE]: "scavenge",
    [CellType.SHOWER]: "shower",
    [CellType.CLINIC]: "clinic",
    [CellType.TAX_INCOME]: "taxIncome",
    [CellType.TAX_LUXURY]: "taxLuxury",
  };

  const key = typeToKey[cell.type];
  if (key) return lang.cells[key];

  return `Case ${cellIndex}`;
}

export function getCardName(cardId: string, lang: LangData): string {
  const templateId = cardId.replace(/_\d+$/, "");
  return lang.cards[templateId]?.name ?? templateId;
}

export function getCardDescription(cardId: string, lang: LangData): string {
  const templateId = cardId.replace(/_\d+$/, "");
  return lang.cards[templateId]?.description ?? "";
}

export function getJobName(jobType: string, lang: LangData): string {
  return lang.jobs[jobType]?.name ?? jobType;
}

export function formatJournal(
  templateKey: string,
  lang: LangData,
  params: Record<string, string> = {},
): string {
  let template = lang.journal[templateKey] ?? templateKey;
  for (const [key, value] of Object.entries(params)) {
    template = template.replaceAll(`{${key}}`, value);
  }
  return template;
}
