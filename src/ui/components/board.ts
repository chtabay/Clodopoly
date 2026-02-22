import type { App } from "../app";
import type { GameState, CellIndex } from "../../engine/types";
import { CellType, GamePhase, PlayerStatus } from "../../engine/types";
import { BOARD } from "../../engine/board";
import { getCellDisplayName } from "../../locale/i18n";

const CELL_ICONS: Record<CellType, string> = {
  [CellType.PROPERTY]: "🏘️",
  [CellType.PETIT_BOULOT]: "💼",
  [CellType.MARKET]: "🛒",
  [CellType.SHOWER]: "🚿",
  [CellType.CLINIC]: "🏥",
  [CellType.EVENT]: "❓",
  [CellType.SCAVENGE]: "🔍",
  [CellType.PAYDAY]: "💰",
  [CellType.WORKPLACE]: "🏢",
  [CellType.SHELTER]: "🏠",
  [CellType.ROUNDUP]: "🚨",
  [CellType.TAX_INCOME]: "📈",
  [CellType.TAX_LUXURY]: "💸",
};

const CORNERS = new Set([0, 10, 20, 30]);

const PAWN_OFFSETS = [
  { left: 20, top: 50 },
  { left: 60, top: 50 },
  { left: 20, top: 75 },
  { left: 60, top: 75 },
  { left: 40, top: 62 },
];

function cellToGrid(index: number): { row: number; col: number } {
  if (index <= 10) return { row: 11, col: 11 - index };
  if (index <= 20) return { row: 21 - index, col: 1 };
  if (index <= 30) return { row: 1, col: index - 19 };
  return { row: index - 29, col: 11 };
}

export function createBoard(
  app: App,
): { el: HTMLElement; update(state: GameState): void } {
  const grid = document.createElement("div");
  grid.className = "board-grid";

  const center = document.createElement("div");
  center.className = "board-center";
  center.style.gridColumn = "2 / 11";
  center.style.gridRow = "2 / 11";

  const gameTitle = document.createElement("h2");
  gameTitle.className = "game-title";
  gameTitle.textContent = "Clodopoly";

  const phaseInfo = document.createElement("p");
  phaseInfo.className = "phase-info";

  center.appendChild(gameTitle);
  center.appendChild(phaseInfo);
  grid.appendChild(center);

  const cells = new Map<CellIndex, HTMLElement>();

  for (const def of BOARD) {
    const { row, col } = cellToGrid(def.index);
    const el = document.createElement("div");
    el.className = "board-cell";
    el.dataset.cellIndex = String(def.index);
    el.style.gridRow = String(row);
    el.style.gridColumn = String(col);

    if (CORNERS.has(def.index)) el.classList.add("corner");

    if (def.type === CellType.PROPERTY && def.color) {
      const bar = document.createElement("div");
      bar.className = `cell-color-bar color-${def.color}`;
      el.appendChild(bar);
    }

    const icon = document.createElement("span");
    icon.className = "cell-icon";
    icon.textContent = CELL_ICONS[def.type];
    el.appendChild(icon);

    const name = document.createElement("span");
    name.className = "cell-name";
    name.textContent = getCellDisplayName(def.index, app.lang, app.theme);
    el.appendChild(name);

    if (def.type === CellType.PROPERTY) {
      const costTag = document.createElement("span");
      costTag.className = "cell-cost";
      costTag.dataset.cellIndex = String(def.index);
      el.appendChild(costTag);
    }

    el.addEventListener("click", () => {
      if (!app.state) return;
      if (
        app.state.phase === GamePhase.MOVEMENT &&
        app.getReachable().includes(def.index)
      ) {
        app.chooseCell(def.index);
        return;
      }
      const cellName = getCellDisplayName(def.index, app.lang, app.theme);
      let details = `${CELL_ICONS[def.type]} ${cellName}`;
      if (def.type === CellType.PROPERTY) {
        const building = app.state.buildings.get(def.index);
        if (building === "hotel") {
          details += `\n🏨 Hôtel · Nuit : ${def.hotelCost}€`;
        } else if (building === "house") {
          details += `\n🏠 Maison · Nuit : ${def.nightCost}€`;
        } else {
          details += `\n❌ Pas d'abri`;
        }
      }
      const playersHere = app.state.players.filter(
        p => p.position === def.index && p.status !== PlayerStatus.ELIMINATED,
      );
      if (playersHere.length > 0) {
        details += `\n👥 ${playersHere.map(p => p.name).join(", ")}`;
      }
      phaseInfo.style.whiteSpace = "pre-line";
      phaseInfo.textContent = details;
    });

    cells.set(def.index, el);
    grid.appendChild(el);
  }

  function update(state: GameState): void {
    for (const el of cells.values()) {
      el.querySelectorAll(".pawn").forEach(n => n.remove());
    }

    const grouped = new Map<CellIndex, GameState["players"]>();
    for (const p of state.players) {
      if (p.status === PlayerStatus.ELIMINATED) continue;
      const arr = grouped.get(p.position) ?? [];
      arr.push(p);
      grouped.set(p.position, arr);
    }

    for (const [pos, players] of grouped) {
      const el = cells.get(pos);
      if (!el) continue;
      players.forEach((p, i) => {
        const pawn = document.createElement("div");
        pawn.className = "pawn";
        if (p.status === PlayerStatus.GHOST) pawn.classList.add("ghost");
        pawn.style.backgroundColor = p.color;
        const off = PAWN_OFFSETS[i % PAWN_OFFSETS.length];
        pawn.style.left = `${off.left}%`;
        pawn.style.top = `${off.top}%`;
        el.appendChild(pawn);
      });
    }

    for (const el of cells.values()) {
      el.querySelectorAll(".building-icon").forEach(n => n.remove());
    }
    for (const [pos, kind] of state.buildings) {
      const el = cells.get(pos);
      if (!el) continue;
      const b = document.createElement("span");
      b.className = "building-icon";
      b.textContent = kind === "hotel" ? "🏨" : "🏠";
      el.appendChild(b);
    }

    for (const def of BOARD) {
      if (def.type !== CellType.PROPERTY) continue;
      const el = cells.get(def.index);
      if (!el) continue;
      const costTag = el.querySelector(".cell-cost") as HTMLElement | null;
      if (!costTag) continue;
      const building = state.buildings.get(def.index);
      if (building === "hotel") {
        costTag.textContent = `${def.hotelCost}€`;
        costTag.className = "cell-cost has-building";
      } else if (building === "house") {
        costTag.textContent = `${def.nightCost}€`;
        costTag.className = "cell-cost has-building";
      } else {
        costTag.textContent = "—";
        costTag.className = "cell-cost no-building";
      }
    }

    const reachable = new Set(app.getReachable());
    for (const [idx, el] of cells) {
      el.classList.toggle("highlight", reachable.has(idx));
    }

    const labels: Record<string, string> = {
      [GamePhase.MOVEMENT]: app.lang.ui.movement ?? "Déplacement",
      [GamePhase.ACTION]: "Action",
      [GamePhase.NIGHT]: app.lang.ui.nightPhase ?? "Nuit",
      [GamePhase.NIGHT_RESOLUTION]: app.lang.ui.nightResolution ?? "Résolution",
      [GamePhase.MAINTENANCE]: app.lang.ui.maintenance ?? "Maintenance",
      [GamePhase.END_TURN]: "Fin du tour",
      [GamePhase.GAME_OVER]: app.lang.ui.gameOver ?? "Fin de partie",
    };
    phaseInfo.textContent =
      `${labels[state.phase] ?? state.phase} — ${app.lang.ui.turn ?? "Tour"} ${state.turn}`;
  }

  return { el: grid, update };
}
