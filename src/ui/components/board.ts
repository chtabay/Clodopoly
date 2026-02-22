import type { App } from "../app";
import type { GameState, CellIndex } from "../../engine/types";
import { CellType, GamePhase, PlayerStatus } from "../../engine/types";
import { BOARD } from "../../engine/board";
import { getCellDisplayName, getEstablishment } from "../../locale/i18n";

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

export interface BoardComponent {
  el: HTMLElement;
  actionArea: HTMLElement;
  update(state: GameState): void;
}

export function createBoard(app: App): BoardComponent {
  const grid = document.createElement("div");
  grid.className = "board-grid";

  const center = document.createElement("div");
  center.className = "board-center";
  center.style.gridColumn = "2 / 11";
  center.style.gridRow = "2 / 11";

  const centerHeader = document.createElement("div");
  centerHeader.className = "center-header";

  const phaseTag = document.createElement("span");
  phaseTag.className = "center-phase-tag";

  const playerTag = document.createElement("span");
  playerTag.className = "center-player-tag";

  centerHeader.appendChild(playerTag);
  centerHeader.appendChild(phaseTag);

  const actionArea = document.createElement("div");
  actionArea.className = "center-action-area";

  const focusArea = document.createElement("div");
  focusArea.className = "center-focus-area";

  center.appendChild(centerHeader);
  center.appendChild(actionArea);
  center.appendChild(focusArea);
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

    const cellDisplayName = getCellDisplayName(def.index, app.lang, app.theme);
    const establishment = getEstablishment(def.index, app.theme);

    const name = document.createElement("span");
    name.className = "cell-name";
    name.textContent = cellDisplayName;
    el.appendChild(name);

    if (establishment && establishment.name) {
      const estabSpan = document.createElement("span");
      estabSpan.className = establishment.services.length > 0
        ? "cell-establishment"
        : "cell-establishment symbolic";
      estabSpan.textContent = establishment.name;
      el.appendChild(estabSpan);
    }

    if (def.type === CellType.PROPERTY) {
      const costTag = document.createElement("span");
      costTag.className = "cell-cost";
      el.appendChild(costTag);
    }

    let tooltip = cellDisplayName;
    if (establishment?.name) tooltip += `\n${establishment.name}`;
    if (def.nightCost) tooltip += `\nNuit : ${def.nightCost}€`;
    el.title = tooltip;

    el.addEventListener("click", () => {
      if (!app.state) return;
      if (
        app.state.phase === GamePhase.MOVEMENT &&
        app.getReachable().includes(def.index)
      ) {
        app.chooseCell(def.index);
        return;
      }
      showCellFocus(def.index, app.state);
    });

    cells.set(def.index, el);
    grid.appendChild(el);
  }

  function showCellFocus(cellIndex: CellIndex, state: GameState): void {
    const def = BOARD[cellIndex];
    const cellName = getCellDisplayName(cellIndex, app.lang, app.theme);
    focusArea.innerHTML = "";
    focusArea.style.display = "block";

    const title = document.createElement("div");
    title.className = "focus-title";
    title.textContent = `${CELL_ICONS[def.type]} ${cellName}`;
    focusArea.appendChild(title);

    const establishment = getEstablishment(cellIndex, app.theme);
    if (establishment?.name) {
      const estabEl = document.createElement("div");
      estabEl.className = "focus-establishment";
      estabEl.textContent = establishment.name;
      focusArea.appendChild(estabEl);
    }
    if (def.type === CellType.PROPERTY) {
      const building = state.buildings.get(cellIndex);
      const info = document.createElement("div");
      info.className = "focus-detail";
      if (building === "hotel") {
        info.textContent = `🏨 Hôtel · Nuit : ${def.hotelCost}€`;
      } else if (building === "house") {
        info.textContent = `🏠 Maison · Nuit : ${def.nightCost}€`;
      } else {
        info.textContent = `❌ Pas d'abri`;
        info.style.color = "var(--text-muted)";
      }
      focusArea.appendChild(info);
    }

    const playersHere = state.players.filter(
      p => p.position === cellIndex && p.status !== PlayerStatus.ELIMINATED,
    );
    if (playersHere.length > 0) {
      const pl = document.createElement("div");
      pl.className = "focus-players";
      pl.textContent = `👥 ${playersHere.map(p => p.name).join(", ")}`;
      focusArea.appendChild(pl);
    }
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

    const player = state.players[state.currentPlayerIndex];
    const labels: Record<string, string> = {
      [GamePhase.MOVEMENT]: app.lang.ui.movement ?? "Déplacement",
      [GamePhase.ACTION]: "Action",
      [GamePhase.NIGHT]: app.lang.ui.nightPhase ?? "Nuit",
      [GamePhase.NIGHT_RESOLUTION]: app.lang.ui.nightResolution ?? "Résolution",
      [GamePhase.MAINTENANCE]: app.lang.ui.maintenance ?? "Maintenance",
      [GamePhase.END_TURN]: "Fin du tour",
      [GamePhase.GAME_OVER]: app.lang.ui.gameOver ?? "Fin de partie",
    };

    phaseTag.textContent = `${labels[state.phase] ?? state.phase} · Tour ${state.turn}`;

    playerTag.innerHTML = "";
    if (player) {
      const dot = document.createElement("span");
      dot.className = "center-player-dot";
      dot.style.backgroundColor = player.color;
      playerTag.appendChild(dot);
      playerTag.appendChild(document.createTextNode(player.name));
    }

    focusArea.style.display = "none";
  }

  return { el: grid, actionArea, update };
}
