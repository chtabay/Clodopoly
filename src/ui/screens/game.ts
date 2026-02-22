import type { App, ScreenRenderer } from "../app";
import type { GameState, PlayerId, PlayerState } from "../../engine/types";
import {
  GamePhase,
  CellType,
  TransportMode,
  NightAction,
  PlayerStatus,
} from "../../engine/types";
import { BOARD } from "../../engine/board";
import { getCellDisplayName, getCardName, getJobName } from "../../locale/i18n";
import { getCardDef } from "../../engine/cards";
import { getCurrentPlayer } from "../../engine/state";
import { createBoard } from "../components/board";


const MAX_PV = 5;

const NIGHT_ACTIONS_ORDER = [
  NightAction.SLEEP,
  NightAction.WATCH,
  NightAction.SCAVENGE,
  NightAction.TAKE,
] as const;

const AUTO_RESOLVE_TYPES = new Set([
  CellType.EVENT,
  CellType.SCAVENGE,
  CellType.ROUNDUP,
  CellType.TAX_INCOME,
  CellType.TAX_LUXURY,
]);

export function createGameScreen(app: App): ScreenRenderer {
  let root: HTMLElement | null = null;
  let topBar: HTMLElement | null = null;
  let sidePanel: HTMLElement | null = null;
  let actionBar: HTMLElement | null = null;
  let nightOverlay: HTMLElement | null = null;
  let board: ReturnType<typeof createBoard> | null = null;

  let nightPlayerShowing: PlayerId | null = null;
  let nightShowTransition = true;
  let autoActionKey = "";

  // ── helpers ───────────────────────────────────────────────────────

  function addActionButton(
    container: HTMLElement,
    text: string,
    onClick: () => void,
    primary = false,
  ): void {
    const btn = document.createElement("button");
    btn.className = primary ? "action-btn primary" : "action-btn";
    btn.textContent = text;
    btn.addEventListener("click", onClick);
    container.appendChild(btn);
  }

  function addInfoText(container: HTMLElement, text: string): void {
    const span = document.createElement("span");
    span.className = "action-info";
    span.textContent = text;
    container.appendChild(span);
  }

  function pvIcons(pv: number): string {
    let s = "";
    for (let i = 0; i < MAX_PV; i++) s += i < pv ? "❤️" : "🖤";
    return s;
  }

  function colorDot(color: string): HTMLSpanElement {
    const dot = document.createElement("span");
    dot.className = "color-dot";
    dot.style.display = "inline-block";
    dot.style.width = "12px";
    dot.style.height = "12px";
    dot.style.borderRadius = "50%";
    dot.style.backgroundColor = color;
    dot.style.marginRight = "8px";
    dot.style.verticalAlign = "middle";
    return dot;
  }

  // ── mount ─────────────────────────────────────────────────────────

  function mount(container: HTMLElement): void {
    root = document.createElement("div");
    root.className = "screen screen-game";

    topBar = document.createElement("div");
    topBar.className = "top-bar";

    const layout = document.createElement("div");
    layout.className = "game-layout";

    const boardContainer = document.createElement("div");
    boardContainer.className = "board-container";
    board = createBoard(app);
    boardContainer.appendChild(board.el);

    sidePanel = document.createElement("div");
    sidePanel.className = "side-panel";

    layout.appendChild(boardContainer);
    layout.appendChild(sidePanel);

    actionBar = document.createElement("div");
    actionBar.className = "action-bar";

    nightOverlay = document.createElement("div");
    nightOverlay.className = "night-overlay";
    nightOverlay.style.display = "none";

    root.appendChild(topBar);
    root.appendChild(layout);
    root.appendChild(actionBar);
    root.appendChild(nightOverlay);

    container.appendChild(root);
  }

  // ── update ────────────────────────────────────────────────────────

  function update(state: GameState): void {
    if (!root) return;

    updateTopBar(state);
    board?.update(state);
    updateSidePanel(state);
    updateActionBar(state);
    updateNightOverlay(state);

    if (state.phase === GamePhase.ACTION) {
      const player = getCurrentPlayer(state);
      const cell = BOARD[player.position];
      const key = `${state.turn}_${state.currentPlayerIndex}_${cell.index}`;
      if (AUTO_RESOLVE_TYPES.has(cell.type) && key !== autoActionKey) {
        autoActionKey = key;
        setTimeout(() => app.autoCaseAction(), 0);
      }
    }
  }

  // ── top bar ───────────────────────────────────────────────────────

  function updateTopBar(state: GameState): void {
    if (!topBar) return;
    topBar.innerHTML = "";

    const phaseLabels: Record<string, string> = {
      [GamePhase.MOVEMENT]: app.lang.ui.movement ?? "Déplacement",
      [GamePhase.ACTION]: "Action",
      [GamePhase.NIGHT]: app.lang.ui.nightPhase ?? "Nuit",
      [GamePhase.NIGHT_RESOLUTION]: app.lang.ui.nightResolution ?? "Résolution",
      [GamePhase.MAINTENANCE]: app.lang.ui.maintenance ?? "Maintenance",
      [GamePhase.END_TURN]: "Fin du tour",
      [GamePhase.GAME_OVER]: app.lang.ui.gameOver ?? "Fin",
    };

    const turnSpan = document.createElement("span");
    turnSpan.textContent = `${app.lang.ui.turn ?? "Tour"} ${state.turn}`;

    const sep1 = document.createTextNode(" | ");

    const phaseSpan = document.createElement("span");
    phaseSpan.textContent = phaseLabels[state.phase] ?? state.phase;

    const sep2 = document.createTextNode(" | ");

    const foodSpan = document.createElement("span");
    foodSpan.textContent = `${app.lang.ui.food ?? "Nourriture"}: ${state.foodCost}€`;

    topBar.append(turnSpan, sep1, phaseSpan, sep2, foodSpan);
  }

  // ── side panel ────────────────────────────────────────────────────

  function updateSidePanel(state: GameState): void {
    if (!sidePanel) return;
    sidePanel.innerHTML = "";

    const player = getCurrentPlayer(state);

    const playerCard = document.createElement("div");
    playerCard.className = "player-card";
    buildPlayerCard(playerCard, player);
    sidePanel.appendChild(playerCard);

    const summary = document.createElement("div");
    summary.className = "players-summary";
    const summaryTitle = document.createElement("h4");
    summaryTitle.textContent = app.lang.ui.allPlayers ?? "Tous les joueurs";
    summary.appendChild(summaryTitle);
    for (const p of state.players) {
      summary.appendChild(buildPlayerRow(p));
    }
    sidePanel.appendChild(summary);

    const journal = document.createElement("div");
    journal.className = "journal-panel";
    const journalTitle = document.createElement("h4");
    journalTitle.textContent = app.lang.ui.journal ?? "Journal";
    journal.appendChild(journalTitle);
    const entries = state.journal.slice(-5).reverse();
    for (const entry of entries) {
      const entryEl = document.createElement("div");
      entryEl.className = "journal-entry";
      const badge = document.createElement("span");
      badge.className = "turn-badge";
      badge.textContent = `T${entry.turn}`;
      const msg = document.createElement("span");
      msg.className = "entry-message";
      msg.textContent = entry.message;
      entryEl.appendChild(badge);
      entryEl.appendChild(msg);
      journal.appendChild(entryEl);
    }
    sidePanel.appendChild(journal);
  }

  function buildPlayerCard(container: HTMLElement, player: PlayerState): void {
    const nameRow = document.createElement("div");
    nameRow.className = "player-name";
    nameRow.appendChild(colorDot(player.color));
    nameRow.appendChild(document.createTextNode(player.name));
    container.appendChild(nameRow);

    const moneyEl = document.createElement("div");
    moneyEl.className = "stat-row";
    moneyEl.textContent = `💰 ${player.money}€`;
    container.appendChild(moneyEl);

    const pvEl = document.createElement("div");
    pvEl.className = "stat-row";
    pvEl.textContent = pvIcons(player.pv);
    container.appendChild(pvEl);

    const pcRow = document.createElement("div");
    pcRow.className = "stat-row pc-gauge";
    const pcLabel = document.createElement("span");
    pcLabel.textContent = `PC ${player.pc}/10`;
    const gaugeTrack = document.createElement("div");
    gaugeTrack.className = "gauge-track";
    const gaugeFill = document.createElement("div");
    gaugeFill.className = "gauge-fill";
    gaugeFill.style.width = `${player.pc * 10}%`;
    gaugeTrack.appendChild(gaugeFill);
    pcRow.appendChild(pcLabel);
    pcRow.appendChild(gaugeTrack);
    container.appendChild(pcRow);

    const jobEl = document.createElement("div");
    jobEl.className = "stat-row";
    const jobName = player.job
      ? getJobName(player.job, app.lang)
      : (app.lang.ui.noJob ?? "Sans emploi");
    jobEl.textContent = `💼 ${jobName}`;
    container.appendChild(jobEl);

    const details = document.createElement("details");
    details.className = "inventory-details";
    const summaryEl = document.createElement("summary");
    summaryEl.textContent = `${app.lang.ui.inventory ?? "Inventaire"} (${player.inventory.length})`;
    details.appendChild(summaryEl);
    for (const cardId of player.inventory) {
      const def = getCardDef(cardId);
      const item = document.createElement("div");
      item.className = "inventory-item";
      item.textContent = `${def?.icon ?? "?"} ${getCardName(cardId, app.lang)}`;
      details.appendChild(item);
    }
    container.appendChild(details);
  }

  function buildPlayerRow(player: PlayerState): HTMLElement {
    const row = document.createElement("div");
    row.className = "player-row";
    if (player.status === PlayerStatus.ELIMINATED) row.classList.add("eliminated");

    row.appendChild(colorDot(player.color));

    const name = document.createElement("span");
    name.className = "player-row-name";
    name.textContent = player.name;
    row.appendChild(name);

    const money = document.createElement("span");
    money.className = "player-row-money";
    money.textContent = `${player.money}€`;
    row.appendChild(money);

    const pv = document.createElement("span");
    pv.className = "player-row-pv";
    pv.textContent = pvIcons(player.pv);
    row.appendChild(pv);

    const pos = document.createElement("span");
    pos.className = "player-row-pos";
    pos.textContent = getCellDisplayName(player.position, app.lang, app.theme);
    row.appendChild(pos);

    if (player.status !== PlayerStatus.ALIVE) {
      const status = document.createElement("span");
      status.className = `status-${player.status}`;
      status.textContent =
        player.status === PlayerStatus.ELIMINATED
          ? (app.lang.ui.eliminated ?? "Éliminé")
          : "👻";
      row.appendChild(status);
    }

    return row;
  }

  // ── action bar ────────────────────────────────────────────────────

  function updateActionBar(state: GameState): void {
    if (!actionBar) return;
    actionBar.innerHTML = "";

    const player = getCurrentPlayer(state);

    switch (state.phase) {
      case GamePhase.MOVEMENT:
        buildMovementActions(state);
        break;

      case GamePhase.ACTION:
        buildCaseActions(state, player);
        break;

      case GamePhase.NIGHT:
        if (app.allNightChoicesMade()) {
          addActionButton(actionBar, "🌙 Résoudre la nuit", () => app.resolveNightPhase(), true);
        }
        break;

      case GamePhase.NIGHT_RESOLUTION:
        addActionButton(actionBar, "🌙 Résolution", () => app.resolveNightPhase(), true);
        break;

      case GamePhase.MAINTENANCE:
        addActionButton(
          actionBar,
          `🔧 ${app.lang.ui.maintenance ?? "Résoudre la maintenance"}`,
          () => app.resolveMaintenancePhase(),
          true,
        );
        break;

      case GamePhase.END_TURN:
        addActionButton(actionBar, "⏭️ Tour suivant", () => app.resolveEndTurnPhase(), true);
        break;
    }
  }

  function buildMovementActions(state: GameState): void {
    if (!actionBar) return;

    if (!app.hasTransportSelected()) {
      addActionButton(
        actionBar,
        `🚗 ${app.lang.transport.car.name}`,
        () => app.chooseTransport(TransportMode.CAR),
      );
      addActionButton(
        actionBar,
        `🚌 ${app.lang.transport.bus.name}`,
        () => app.chooseTransport(TransportMode.BUS),
      );
      addActionButton(
        actionBar,
        `🚶 ${app.lang.transport.foot.name}`,
        () => app.chooseTransport(TransportMode.FOOT),
      );
      return;
    }

    if (!app.hasDiceRolled()) {
      addActionButton(
        actionBar,
        `🎲 ${app.lang.ui.rollDice ?? "Lancer les dés"}`,
        () => app.rollDice(),
        true,
      );
      return;
    }

    const dice = state.lastDiceRoll;
    if (dice) {
      const sum = dice.reduce((a, b) => a + b, 0);
      const info = app.getDiceInfo();
      const bonus = info?.bonus ?? 0;
      const total = sum + bonus;
      const parts = dice.join(" + ") + (bonus ? ` + ${bonus}` : "");
      addInfoText(actionBar, `🎲 ${app.lang.ui.result ?? "Résultat"}: ${parts} = ${total}`);
    }
    addInfoText(actionBar, app.lang.ui.chooseCell ?? "Choisissez votre case");
  }

  function buildCaseActions(state: GameState, player: PlayerState): void {
    if (!actionBar) return;
    const cell = BOARD[player.position];

    switch (cell.type) {
      case CellType.PROPERTY: {
        const name = getCellDisplayName(player.position, app.lang, app.theme);
        addInfoText(actionBar, `🏘️ Quartier — ${name}`);
        break;
      }

      case CellType.PETIT_BOULOT:
        addActionButton(actionBar, "💼 Travailler (+80€)", () =>
          app.caseAction("petitBoulot"),
        );
        break;

      case CellType.MARKET: {
        const marketCells = BOARD.filter(c => c.type === CellType.MARKET);
        const marketIndex = marketCells.findIndex(c => c.index === player.position);
        if (marketIndex >= 0 && state.marketCards[marketIndex]) {
          const slots = state.marketCards[marketIndex];
          for (let si = 0; si < slots.length; si++) {
            const cardId = slots[si];
            if (!cardId) continue;
            const def = getCardDef(cardId);
            const name = getCardName(cardId, app.lang);
            const slotIndex = si;
            addActionButton(
              actionBar,
              `🛒 Acheter ${name} (${def?.price ?? "?"}€)`,
              () => app.caseAction("marketBuy", { marketIndex, slotIndex }),
            );
          }
        }
        break;
      }

      case CellType.SHOWER:
        addActionButton(actionBar, "🚿 Se doucher (+1 PC)", () =>
          app.caseAction("shower"),
        );
        break;

      case CellType.CLINIC:
        addActionButton(actionBar, "🏥 Se soigner (+1 PV, -50€)", () =>
          app.caseAction("clinic"),
        );
        break;

      case CellType.WORKPLACE:
        if (player.job) {
          addActionButton(actionBar, "🏢 Pointer", () =>
            app.caseAction("workplace"),
          );
        } else {
          for (const jobType of state.availableJobs) {
            const name = getJobName(jobType, app.lang);
            addActionButton(actionBar, `📋 Postuler: ${name}`, () =>
              app.caseAction("hire", { jobType }),
            );
          }
        }
        break;

      case CellType.SHELTER: {
        const name = getCellDisplayName(player.position, app.lang, app.theme);
        addInfoText(actionBar, `🏠 ${name}`);
        break;
      }

      case CellType.PAYDAY: {
        const name = getCellDisplayName(player.position, app.lang, app.theme);
        addInfoText(actionBar, `💰 ${name}`);
        break;
      }

      default:
        break;
    }

    addActionButton(
      actionBar,
      `⏭️ ${app.lang.ui.skip ?? "Passer"}`,
      () => app.skipAction(),
    );
  }

  // ── night overlay ─────────────────────────────────────────────────

  function updateNightOverlay(state: GameState): void {
    if (!nightOverlay) return;

    if (state.phase !== GamePhase.NIGHT) {
      nightOverlay.style.display = "none";
      nightPlayerShowing = null;
      return;
    }

    const remaining = app.getNightPlayersToChoose();

    if (remaining.length === 0) {
      nightOverlay.style.display = "none";
      return;
    }

    if (!nightPlayerShowing || !remaining.includes(nightPlayerShowing)) {
      nightPlayerShowing = remaining[0];
      nightShowTransition = true;
    }

    nightOverlay.style.display = "flex";
    nightOverlay.innerHTML = "";

    const player = state.players.find(p => p.id === nightPlayerShowing);
    if (!player) return;

    if (nightShowTransition) {
      buildNightTransition(player, state);
    } else {
      buildNightChoices(player, state);
    }
  }

  function buildNightTransition(player: PlayerState, state: GameState): void {
    if (!nightOverlay) return;

    const text = document.createElement("div");
    text.className = "transition-text";
    text.textContent =
      `${app.lang.ui.passDevice ?? "Passez l'appareil à"} ${player.name}`;

    const btn = document.createElement("button");
    btn.className = "action-btn primary";
    btn.textContent = app.lang.ui.ready ?? "Je suis prêt";
    btn.addEventListener("click", () => {
      nightShowTransition = false;
      updateNightOverlay(state);
    });

    nightOverlay.appendChild(text);
    nightOverlay.appendChild(btn);
  }

  function buildNightChoices(player: PlayerState, state: GameState): void {
    if (!nightOverlay) return;

    const title = document.createElement("h3");
    title.textContent = `${player.name} — ${app.lang.ui.nightChoice ?? "Votre choix"}`;
    nightOverlay.appendChild(title);

    const camps = app.getActiveCamps();
    for (const [, playerIds] of camps) {
      if (!playerIds.includes(player.id)) continue;
      const mates = playerIds
        .filter(id => id !== player.id)
        .map(id => state.players.find(p => p.id === id)?.name ?? id);
      if (mates.length > 0) {
        const campInfo = document.createElement("p");
        campInfo.className = "camp-info";
        campInfo.textContent =
          `${app.lang.ui.campWith ?? "Vous êtes en Camp avec"} ${mates.join(", ")}`;
        nightOverlay.appendChild(campInfo);
      }
      break;
    }

    const grid = document.createElement("div");
    grid.className = "night-actions-grid";

    for (const action of NIGHT_ACTIONS_ORDER) {
      const info = app.lang.nightActions[action];
      const btn = document.createElement("button");
      btn.className = "action-btn night-action-btn";

      const nameEl = document.createElement("strong");
      nameEl.textContent = info.name;
      const descEl = document.createElement("small");
      descEl.textContent = info.description;

      btn.appendChild(nameEl);
      btn.appendChild(document.createElement("br"));
      btn.appendChild(descEl);

      btn.addEventListener("click", () => {
        app.chooseNightAction(player.id, action);
        nightPlayerShowing = null;
      });

      grid.appendChild(btn);
    }

    nightOverlay.appendChild(grid);
  }

  // ── unmount ───────────────────────────────────────────────────────

  function unmount(): void {
    root = null;
    topBar = null;
    sidePanel = null;
    actionBar = null;
    nightOverlay = null;
    board = null;
    nightPlayerShowing = null;
    autoActionKey = "";
  }

  return { mount, update, unmount };
}
