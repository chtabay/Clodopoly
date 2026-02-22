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
import { getCellDisplayName, getCardName, getCardDescription, getJobName, getEstablishment } from "../../locale/i18n";
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


export function createGameScreen(app: App): ScreenRenderer {
  let root: HTMLElement | null = null;
  let topBar: HTMLElement | null = null;
  let sidePanel: HTMLElement | null = null;
  let nightOverlay: HTMLElement | null = null;
  let board: ReturnType<typeof createBoard> | null = null;

  let nightPlayerShowing: PlayerId | null = null;
  let nightShowTransition = true;
  let actionDoneThisPhase = false;
  let pendingResultDisplay: (() => void) | null = null;
  let prevJournalLength = 0;
  

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

  function addDescription(container: HTMLElement, text: string): void {
    const p = document.createElement("p");
    p.className = "action-desc";
    p.textContent = text;
    container.appendChild(p);
  }

  function buildRecentJournalBlock(container: HTMLElement, state: GameState, since: number): void {
    const newEntries = state.journal.slice(since);
    if (newEntries.length === 0) return;

    const block = document.createElement("div");
    block.className = "journal-summary-block";

    for (const entry of newEntries) {
      const row = document.createElement("div");
      row.className = "journal-summary-row";

      const player = entry.playerId
        ? state.players.find(p => p.id === entry.playerId)
        : null;

      const text = formatJournalEntry(entry, state);

      if (player) {
        const dot = document.createElement("span");
        dot.className = "center-player-dot";
        dot.style.backgroundColor = player.color;
        dot.style.width = "8px";
        dot.style.height = "8px";
        dot.style.flexShrink = "0";
        row.appendChild(dot);
      }

      const msg = document.createElement("span");
      msg.textContent = text;
      row.appendChild(msg);
      block.appendChild(row);
    }
    container.appendChild(block);
  }

  function formatJournalEntry(entry: GameState["journal"][number], state: GameState): string {
    const player = entry.playerId ? state.players.find(p => p.id === entry.playerId) : null;
    const target = entry.targetId ? state.players.find(p => p.id === entry.targetId) : null;
    const pName = player?.name ?? "";
    const tName = target?.name ?? "";
    const data = entry.data ?? {};

    const templates: Record<string, string> = {
      salary: `${pName} touche son salaire : +${data.amount}€`,
      petitBoulot: `${pName} travaille : +${data.amount}€`,
      marketBuy: `${pName} achète au Marché : -${data.amount}€`,
      shower: `${pName} prend une douche : +1 PC`,
      clinic: `${pName} se soigne : +1 PV (-${data.amount}€)`,
      eventCard: `${pName} tire un Événement`,
      scavengeCard: `${pName} fouille et trouve quelque chose`,
      workedAtJob: `${pName} pointe au travail`,
      hired: `${pName} est embauché`,
      shelterEntry: `${pName} entre au Foyer (${data.turns} tour(s))`,
      roundup: `${pName} → Rafle → Foyer`,
      taxPaid: `${pName} paie une taxe : -${data.amount}€`,
      taxFailed: `${pName} ne peut pas payer la taxe : -1 PC`,
      nightCampPeaceful: `Nuit paisible. Coûts partagés, +1 PC.`,
      nightTheft: `${pName} prend un objet de ${tName}`,
      nightCaught: `${pName} pris sur le fait par ${tName} ! -1 PC`,
      nightConfrontation: `Confrontation : ${pName} vs ${tName}`,
      nightScavenge: `${pName} fouille la nuit`,
      sleepsOutside: `${pName} dort dehors : -1 PV, -1 PC`,
      sleepsInside: `${pName} dort à l'abri : -${data.amount}€`,
      noFood: `${pName} ne mange pas : -1 PV`,
      food: `${pName} mange : -${data.amount}€`,
      fired: `${pName} est licencié !`,
      eliminated: `💀 ${pName} est éliminé !`,
      gameOver: `🏆 ${pName} a survécu !`,
      movement: `${pName} se déplace`,
      sell: `${pName} vend un objet : +${data.amount}€`,
      guaranteedLodging: `${pName} loue un logement garanti : -${data.amount}€`,
      sleepsGuaranteedLodging: `${pName} dort dans son logement loué`,
    };

    return templates[entry.message] ?? entry.message;
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

    nightOverlay = document.createElement("div");
    nightOverlay.className = "night-overlay";
    nightOverlay.style.display = "none";

    root.appendChild(topBar);
    root.appendChild(layout);
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

    const player = getCurrentPlayer(state);

    const leftGroup = document.createElement("div");
    leftGroup.className = "top-bar-left";

    const playerBanner = document.createElement("span");
    playerBanner.className = "current-player-banner";
    playerBanner.appendChild(colorDot(player.color));
    const nameStrong = document.createElement("strong");
    nameStrong.textContent = player.name;
    playerBanner.appendChild(nameStrong);

    const turnSpan = document.createElement("span");
    turnSpan.textContent = `${app.lang.ui.turn ?? "Tour"} ${state.turn}`;

    const phaseSpan = document.createElement("span");
    phaseSpan.textContent = phaseLabels[state.phase] ?? state.phase;

    leftGroup.append(playerBanner, turnSpan, phaseSpan);

    const centerGroup = document.createElement("div");
    centerGroup.className = "top-bar-center";

    const dayClock = buildDayStepperHTML(state);
    centerGroup.appendChild(dayClock);

    const rightGroup = document.createElement("div");
    rightGroup.className = "top-bar-right";

    const foodSpan = document.createElement("span");
    foodSpan.title = "Coût de la nourriture par nuit";
    foodSpan.textContent = `🍽️ ${state.foodCost}€/nuit`;

    rightGroup.append(foodSpan);

    topBar.append(leftGroup, centerGroup, rightGroup);
  }

  // ── side panel ────────────────────────────────────────────────────

  function updateSidePanel(state: GameState): void {
    if (!sidePanel) return;
    sidePanel.innerHTML = "";

    const player = getCurrentPlayer(state);

    const playerCard = document.createElement("div");
    playerCard.className = "player-card active-player-card";
    playerCard.style.borderLeftColor = player.color;
    playerCard.style.borderLeftWidth = "5px";
    buildPlayerCard(playerCard, player, state);
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

  function buildPlayerCard(container: HTMLElement, player: PlayerState, state: GameState): void {
    const nameRow = document.createElement("div");
    nameRow.className = "player-name";
    nameRow.style.fontSize = "1.2rem";
    nameRow.appendChild(colorDot(player.color));
    const nameText = document.createElement("strong");
    nameText.textContent = player.name;
    nameRow.appendChild(nameText);
    container.appendChild(nameRow);

    const posRow = document.createElement("div");
    posRow.className = "stat-row";
    posRow.style.color = "var(--text-secondary)";
    posRow.style.fontSize = "var(--font-size-sm)";
    const cellName = getCellDisplayName(player.position, app.lang, app.theme);
    const cell = BOARD[player.position];
    const building = state.buildings.get(player.position);
    let posText = `📍 ${cellName}`;
    if (cell.type === CellType.PROPERTY) {
      if (building === "hotel") {
        posText += ` — 🏨 Hôtel (${cell.hotelCost ?? "?"}€/nuit)`;
      } else if (building === "house") {
        posText += ` — 🏠 Maison (${cell.nightCost ?? "?"}€/nuit)`;
      } else {
        posText += ` — ❌ Pas d'abri`;
      }
    }
    posRow.textContent = posText;
    container.appendChild(posRow);

    const statsGrid = document.createElement("div");
    statsGrid.className = "player-stats-grid";

    const moneyEl = document.createElement("div");
    moneyEl.className = "stat-box";
    moneyEl.innerHTML = `<span class="stat-label">💰 Argent</span><span class="stat-value money-display">${player.money}€</span>`;
    statsGrid.appendChild(moneyEl);

    const pvEl = document.createElement("div");
    pvEl.className = "stat-box";
    pvEl.innerHTML = `<span class="stat-label">❤️ Santé</span><span class="stat-value">${pvIcons(player.pv)}</span>`;
    statsGrid.appendChild(pvEl);

    container.appendChild(statsGrid);

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
    const salary = player.job
      ? (() => { const s = app.lang.jobs[player.job]; return s ? ` (${getJobSalaryDisplay(player)})` : ""; })()
      : "";
    jobEl.textContent = `💼 ${jobName}${salary}`;
    container.appendChild(jobEl);

    const details = document.createElement("details");
    details.className = "inventory-details";
    details.open = true;
    const summaryEl = document.createElement("summary");
    summaryEl.textContent = `${app.lang.ui.inventory ?? "Inventaire"} (${player.inventory.length + player.specialCards.length})`;
    details.appendChild(summaryEl);
    const invGrid = document.createElement("div");
    invGrid.className = "inventory-grid";
    for (const cardId of player.inventory) {
      const def = getCardDef(cardId);
      const item = document.createElement("span");
      item.className = "inventory-chip";
      item.textContent = `${def?.icon ?? "?"} ${getCardName(cardId, app.lang)}`;
      item.title = `${getCardName(cardId, app.lang)} — ${def?.pcValue ?? 0} PC`;
      invGrid.appendChild(item);
    }
    for (const cardId of player.specialCards) {
      const def = getCardDef(cardId);
      const item = document.createElement("span");
      item.className = "inventory-chip special";
      item.textContent = `${def?.icon ?? "?"} ${getCardName(cardId, app.lang)}`;
      invGrid.appendChild(item);
    }
    details.appendChild(invGrid);
    container.appendChild(details);
  }

  function getJobSalaryDisplay(player: PlayerState): string {
    if (!player.job) return "";
    const stats: Record<string, { salary: number; bonusSalary: number }> = {
      cadre: { salary: 500, bonusSalary: 550 },
      employe: { salary: 350, bonusSalary: 385 },
      precaire: { salary: 200, bonusSalary: 220 },
    };
    const s = stats[player.job];
    if (!s) return "";
    return player.pc >= 8 ? `${s.bonusSalary}€` : `${s.salary}€`;
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

  function getActionArea(): HTMLElement | null {
    return board?.actionArea ?? null;
  }

  const DAY_STEPS = ["🌞", "🌤️", "🌅", "🌙"];

  function buildDayStepperHTML(state: GameState): HTMLElement {
    const stepper = document.createElement("div");
    stepper.className = "day-stepper";

    const roundsInDay = state.roundsInDay ?? 0;
    const isNight = state.phase === GamePhase.NIGHT ||
      state.phase === GamePhase.NIGHT_RESOLUTION ||
      state.phase === GamePhase.MAINTENANCE;
    const activeIdx = isNight ? DAY_STEPS.length : roundsInDay;

    for (let i = 0; i < DAY_STEPS.length; i++) {
      if (i > 0) {
        const seg = document.createElement("div");
        seg.className = "day-stepper-seg" + (i <= activeIdx ? " done" : "");
        stepper.appendChild(seg);
      }
      const step = document.createElement("span");
      step.className = "day-stepper-step";
      if (i === activeIdx) step.classList.add("active");
      else if (i < activeIdx) step.classList.add("past");
      else step.classList.add("future");
      step.textContent = DAY_STEPS[i];
      stepper.appendChild(step);
    }

    if (isNight) {
      const seg = document.createElement("div");
      seg.className = "day-stepper-seg done";
      stepper.appendChild(seg);
      const nightStep = document.createElement("span");
      nightStep.className = "day-stepper-step active";
      nightStep.textContent = "💤";
      stepper.appendChild(nightStep);
    }

    return stepper;
  }

  function updateActionBar(state: GameState): void {
    const area = getActionArea();
    if (!area) return;
    area.innerHTML = "";

    const player = getCurrentPlayer(state);

    switch (state.phase) {
      case GamePhase.MOVEMENT:
        actionDoneThisPhase = false;
        buildMovementActions(state);
        break;

      case GamePhase.ACTION:
        buildCaseActions(state, player);
        break;

      case GamePhase.NIGHT:
        if (app.allNightChoicesMade()) {
          prevJournalLength = state.journal.length;
          addActionButton(area, "🌙 Résoudre la nuit", () => app.resolveNightPhase(), true);
          addDescription(area, "Les actions secrètes de chacun vont être révélées.");
        } else {
          addInfoText(area, "⏳ Choix de nuit en cours...");
        }
        break;

      case GamePhase.NIGHT_RESOLUTION:
        addActionButton(area, "🌙 Résolution", () => app.resolveNightPhase(), true);
        break;

      case GamePhase.MAINTENANCE: {
        const title = document.createElement("div");
        title.className = "center-case-header";
        title.textContent = "🌙 Résultats de la nuit";
        area.appendChild(title);

        buildRecentJournalBlock(area, state, prevJournalLength);
        prevJournalLength = state.journal.length;

        addActionButton(
          area,
          `🔧 Résoudre la maintenance`,
          () => app.resolveMaintenancePhase(),
          true,
        );
        addDescription(area, "Nourriture, logement, emploi — vérifier les seuils.");
        break;
      }

      case GamePhase.END_TURN: {
        const title = document.createElement("div");
        title.className = "center-case-header";
        title.textContent = "🔧 Résultats maintenance";
        area.appendChild(title);

        buildRecentJournalBlock(area, state, prevJournalLength);

        addActionButton(area, "⏭️ Tour suivant", () => app.resolveEndTurnPhase(), true);
        break;
      }
    }
  }

  function buildMovementActions(state: GameState): void {
    const area = getActionArea();
    if (!area) return;

    if (!app.hasTransportSelected()) {
      addInfoText(area, "Choisissez votre transport");

      const player = getCurrentPlayer(state);
      const hasCar = player.inventory.some(c => c.startsWith("obj_car"));
      const canAffordCar = player.money >= 30;
      const busDisabled = player.busDisabled;
      const canAffordBus = player.money >= 10;

      const makeTransportBtn = (
        label: string,
        desc: string,
        mode: TransportMode,
        enabled: boolean,
      ) => {
        const wrapper = document.createElement("div");
        wrapper.className = "transport-option";
        const btn = document.createElement("button");
        btn.className = "action-btn";
        btn.disabled = !enabled;
        btn.textContent = label;
        btn.addEventListener("click", () => app.chooseTransport(mode));
        const sub = document.createElement("small");
        sub.className = "transport-desc";
        sub.textContent = desc;
        wrapper.appendChild(btn);
        wrapper.appendChild(sub);
        return wrapper;
      };

      const btnRow = document.createElement("div");
      btnRow.className = "center-btn-row transport-row";
      btnRow.appendChild(makeTransportBtn(
        `🚗 Voiture`, `2d6 cases · 30€ · Avant seul.`,
        TransportMode.CAR, hasCar && canAffordCar && !player.carDisabled,
      ));
      btnRow.appendChild(makeTransportBtn(
        `🚌 Bus`, `1d6+2 cases · 10€ · Avant seul.`,
        TransportMode.BUS, !busDisabled && canAffordBus,
      ));
      btnRow.appendChild(makeTransportBtn(
        `🚶 À pied`, `1d6 cases · Gratuit · Avant ou arrière.`,
        TransportMode.FOOT, true,
      ));
      area.appendChild(btnRow);
      return;
    }

    if (!app.hasDiceRolled()) {
      addActionButton(
        area,
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

      const diceDisplay = document.createElement("div");
      diceDisplay.className = "dice-result-display";
      diceDisplay.innerHTML = `<span class="dice-result">${total}</span><span class="dice-detail">${parts}</span>`;
      area.appendChild(diceDisplay);
    }
    addInfoText(area, "👆 Cliquez une case dorée sur le plateau");
  }

  function doActionThenSkip(actionType: string, params?: Record<string, unknown>): void {
    app.caseAction(actionType, params);
    actionDoneThisPhase = true;
    setTimeout(() => app.skipAction(), 300);
  }

  function doActionThenShowResult(actionType: string, buildResult: () => void): void {
    app.caseAction(actionType);
    actionDoneThisPhase = true;
    pendingResultDisplay = () => {
      const area = getActionArea();
      if (!area) return;
      area.innerHTML = "";
      buildResult();
      addActionButton(area, `⏭️ ${app.lang.ui.continue ?? "Continuer"}`, () => {
        pendingResultDisplay = null;
        app.skipAction();
      }, true);
    };
    pendingResultDisplay();
  }

  function buildCaseActions(state: GameState, player: PlayerState): void {
    const area = getActionArea();
    if (!area) return;
    const cell = BOARD[player.position];
    const cellName = getCellDisplayName(player.position, app.lang, app.theme);

    if (actionDoneThisPhase) {
      if (pendingResultDisplay) {
        pendingResultDisplay();
        return;
      }
      addInfoText(area, "✅ Action effectuée");
      return;
    }

    const headerText = document.createElement("div");
    headerText.className = "center-case-header";
    headerText.textContent = `${CELL_ICONS_GAME[cell.type] ?? "📍"} ${cellName}`;
    area.appendChild(headerText);

    switch (cell.type) {
      case CellType.PROPERTY: {
        const establishment = getEstablishment(player.position, app.theme);
        const building = state.buildings.get(player.position);
        const info = document.createElement("div");
        info.className = "center-case-detail";
        if (building === "hotel") {
          info.textContent = `🏨 Hôtel — Nuit : ${cell.hotelCost ?? "?"}€`;
          addDescription(area, `Vous dormirez ici ce soir. Coût déduit automatiquement.`);
        } else if (building === "house") {
          info.textContent = `🏠 Maison — Nuit : ${cell.nightCost ?? "?"}€`;
          addDescription(area, `Vous dormirez ici ce soir. Coût déduit automatiquement.`);
        } else if (establishment?.guaranteedLodgingCost && establishment.services.includes("sleep")) {
          const cost = establishment.guaranteedLodgingCost;
          const canAfford = player.money >= cost;
          info.textContent = `🏠 ${establishment.name} — Logement garanti : ${cost}€`;
          if (canAfford) {
            addActionButton(area, `🏠 Louer logement garanti (${cost}€)`, () =>
              doActionThenSkip("guaranteedLodging"), true,
            );
            addDescription(area, `Évite de dormir dehors (-1 PV, -1 PC). Coût déduit immédiatement.`);
          } else {
            addDescription(area, `Pas assez d'argent (${cost}€ requis, vous avez ${player.money}€).`);
          }
        } else {
          info.textContent = `❌ Pas d'abri — Dormir dehors (-1 PV, -1 PC)`;
          info.style.color = "var(--accent)";
          addDescription(area, `Aucun bâtiment ici. Vous perdrez 1 PV et 1 PC cette nuit.`);
        }
        area.insertBefore(info, area.children[1] ?? null);
        break;
      }

      case CellType.PETIT_BOULOT: {
        addActionButton(area, "💼 Travailler (+80€)", () =>
          doActionThenSkip("petitBoulot"), true,
        );
        addDescription(area, "Gagner 80€ immédiatement. Un seul travailleur par tour.");
        const estabPb = getEstablishment(player.position, app.theme);
        if (estabPb?.services.includes("sell") && player.inventory.length > 0) {
          const sellables = player.inventory.filter(cid => getCardDef(cid)?.price);
          for (const cardId of sellables) {
            const def = getCardDef(cardId)!;
            const sellPrice = Math.floor(def.price! * 0.5);
            const btn = document.createElement("button");
            btn.className = "action-btn";
            btn.textContent = `💰 Vendre ${getCardName(cardId, app.lang)} → ${sellPrice}€`;
            btn.addEventListener("click", () => doActionThenSkip("sell", { cardId }));
            area.appendChild(btn);
          }
          addDescription(area, "Revente à 50 % du prix d'achat.");
        }
        break;
      }

      case CellType.MARKET: {
        const marketCells = BOARD.filter(c => c.type === CellType.MARKET);
        const marketIndex = marketCells.findIndex(c => c.index === player.position);
        addDescription(area, `Acheter des objets. Chaque objet augmente vos PC (crédibilité). Solde : ${player.money}€`);
        if (marketIndex >= 0 && state.marketCards[marketIndex]) {
          const slots = state.marketCards[marketIndex];
          for (let si = 0; si < slots.length; si++) {
            const cardId = slots[si];
            if (!cardId) continue;
            const def = getCardDef(cardId);
            const name = getCardName(cardId, app.lang);
            const slotIndex = si;
            const canBuy = player.money >= (def?.price ?? Infinity);
            const btn = document.createElement("button");
            btn.className = canBuy ? "action-btn" : "action-btn";
            btn.disabled = !canBuy;
            btn.textContent = `🛒 ${name} (+${def?.pcValue ?? "?"}PC) — ${def?.price ?? "?"}€`;
            btn.addEventListener("click", () =>
              app.caseAction("marketBuy", { marketIndex, slotIndex }),
            );
            area.appendChild(btn);
          }
        }
        const estab = getEstablishment(player.position, app.theme);
        if (estab?.services.includes("sell") && player.inventory.length > 0) {
          const sellables = player.inventory.filter(cid => getCardDef(cid)?.price);
          for (const cardId of sellables) {
            const def = getCardDef(cardId)!;
            const sellPrice = Math.floor(def.price! * 0.5);
            const btn = document.createElement("button");
            btn.className = "action-btn";
            btn.textContent = `💰 Vendre ${getCardName(cardId, app.lang)} → ${sellPrice}€`;
            btn.addEventListener("click", () => doActionThenSkip("sell", { cardId }));
            area.appendChild(btn);
          }
          addDescription(area, "Revente à 50 % du prix d'achat.");
        }
        break;
      }

      case CellType.SHOWER:
        if (player.pc >= 10) {
          addInfoText(area, "PC au maximum (10). Rien à faire.");
        } else {
          addActionButton(area, "🚿 Se doucher (+1 PC)", () =>
            doActionThenSkip("shower"), true,
          );
          addDescription(area, "Gratuit. +1 point de crédibilité.");
        }
        break;

      case CellType.CLINIC:
        if (player.pv >= 5) {
          addInfoText(area, "PV au maximum (5). Rien à faire.");
        } else if (player.money < 50) {
          addInfoText(area, `🏥 Soins disponibles mais pas assez d'argent (50€ requis, vous avez ${player.money}€).`);
        } else {
          addActionButton(area, "🏥 Se soigner (+1 PV, -50€)", () =>
            doActionThenSkip("clinic"), true,
          );
          addDescription(area, `Coûte 50€. Vous avez ${player.money}€. Santé actuelle : ${player.pv}/5 PV.`);
        }
        break;

      case CellType.WORKPLACE:
        if (player.job) {
          addActionButton(area, "🏢 Pointer au travail", () =>
            doActionThenSkip("workplace"), true,
          );
          addDescription(area, "Valide votre cycle de travail. Prochain passage à la Paie → salaire versé.");
        } else {
          addDescription(area, `Vous êtes sans emploi. PC : ${player.pc}/10. Postulez si votre PC est suffisant.`);
          for (const jobType of state.availableJobs) {
            const name = getJobName(jobType, app.lang);
            const stats: Record<string, { hire: number; sal: number }> = {
              cadre: { hire: 8, sal: 500 },
              employe: { hire: 5, sal: 350 },
              precaire: { hire: 2, sal: 200 },
            };
            const s = stats[jobType];
            const canHire = s ? player.pc >= s.hire : false;
            const btn = document.createElement("button");
            btn.className = "action-btn";
            btn.disabled = !canHire;
            btn.textContent = `📋 ${name} (${s?.sal}€/cycle, min ${s?.hire} PC)`;
            btn.addEventListener("click", () => doActionThenSkip("hire", { jobType }));
            area.appendChild(btn);
          }
        }
        break;

      case CellType.SHELTER:
        addDescription(area, "Logement et repas gratuits. Impossible de travailler pendant le séjour.");
        break;

      case CellType.PAYDAY:
        addDescription(area, "Le salaire est versé au passage, si vous avez pointé au travail depuis le dernier salaire.");
        break;

      case CellType.EVENT: {
        addDescription(area, "Un événement aléatoire va se produire. Bonne ou mauvaise surprise...");
        addActionButton(area, "❓ Tirer une carte Événement", () => {
          const journalBefore = app.state?.journal.length ?? 0;
          doActionThenShowResult("event", () => {
            const area = getActionArea();
            if (!area) return;
            const newEntries = (app.state?.journal ?? []).slice(journalBefore);
            const eventEntry = newEntries.find(e => e.message === "eventCard");
            const cardId = eventEntry?.data?.cardId as string | undefined;
            if (cardId) {
              const def = getCardDef(cardId);
              const cardName = getCardName(cardId, app.lang);
              const cardDesc = getCardDescription(cardId, app.lang);
              const reveal = document.createElement("div");
              reveal.className = "card-reveal";
              reveal.innerHTML = `
                <span class="card-reveal-icon">${def?.icon ?? "❓"}</span>
                <span class="card-reveal-name">${cardName}</span>
                <span class="card-reveal-desc">${cardDesc}</span>
              `;
              area.appendChild(reveal);
            } else {
              addInfoText(area, "Événement résolu.");
            }
          });
        }, true);
        break;
      }

      case CellType.SCAVENGE: {
        addDescription(area, "Fouillez les environs. Vous pourriez trouver un objet utile... ou rien.");
        addActionButton(area, "🔍 Fouiller", () => {
          const journalBefore = app.state?.journal.length ?? 0;
          doActionThenShowResult("scavenge", () => {
            const area = getActionArea();
            if (!area) return;
            const newEntries = (app.state?.journal ?? []).slice(journalBefore);
            const scvEntry = newEntries.find(e => e.message === "scavengeCard");
            const cardId = scvEntry?.data?.cardId as string | undefined;
            if (cardId) {
              const def = getCardDef(cardId);
              const cardName = getCardName(cardId, app.lang);
              const cardDesc = getCardDescription(cardId, app.lang);
              const reveal = document.createElement("div");
              reveal.className = "card-reveal";
              reveal.innerHTML = `
                <span class="card-reveal-icon">${def?.icon ?? "🔍"}</span>
                <span class="card-reveal-name">${cardName}</span>
                <span class="card-reveal-desc">${cardDesc}</span>
              `;
              area.appendChild(reveal);
            } else {
              addInfoText(area, "Vous n'avez rien trouvé.");
            }
          });
        }, true);
        break;
      }

      case CellType.TAX_INCOME: {
        const taxAmount = Math.max(20, Math.floor(player.money * 0.1));
        const canPay = player.money >= taxAmount;
        addDescription(area,
          canPay
            ? `Impôts sur le revenu : 10 % de votre capital (min 20€). Vous devez ${taxAmount}€. Solde : ${player.money}€.`
            : `Impôts sur le revenu : vous ne pouvez pas payer. Vous perdrez 1 PC.`,
        );
        addActionButton(area, canPay ? `📈 Payer ${taxAmount}€` : "📈 Subir la pénalité (-1 PC)", () => {
          doActionThenShowResult("taxIncome", () => {
            const area = getActionArea();
            if (!area) return;
            const reveal = document.createElement("div");
            reveal.className = "card-reveal";
            if (canPay) {
              reveal.innerHTML = `
                <span class="card-reveal-icon">📈</span>
                <span class="card-reveal-name">Impôts payés</span>
                <span class="card-reveal-desc">-${taxAmount}€ de votre capital.</span>
              `;
            } else {
              reveal.innerHTML = `
                <span class="card-reveal-icon">📈</span>
                <span class="card-reveal-name">Impôts impayés</span>
                <span class="card-reveal-desc">-1 PC. Votre crédibilité en prend un coup.</span>
              `;
            }
            area.appendChild(reveal);
          });
        }, true);
        break;
      }

      case CellType.TAX_LUXURY: {
        const canPay = player.money >= 75;
        addDescription(area,
          canPay
            ? `Amende de luxe : 75€. Solde : ${player.money}€.`
            : `Amende de luxe : vous ne pouvez pas payer 75€. Vous perdrez 1 PC.`,
        );
        addActionButton(area, canPay ? "💸 Payer 75€" : "💸 Subir la pénalité (-1 PC)", () => {
          doActionThenShowResult("taxLuxury", () => {
            const area = getActionArea();
            if (!area) return;
            const reveal = document.createElement("div");
            reveal.className = "card-reveal";
            if (canPay) {
              reveal.innerHTML = `
                <span class="card-reveal-icon">💸</span>
                <span class="card-reveal-name">Amende payée</span>
                <span class="card-reveal-desc">-75€.</span>
              `;
            } else {
              reveal.innerHTML = `
                <span class="card-reveal-icon">💸</span>
                <span class="card-reveal-name">Amende impayée</span>
                <span class="card-reveal-desc">-1 PC. Votre crédibilité en prend un coup.</span>
              `;
            }
            area.appendChild(reveal);
          });
        }, true);
        break;
      }

      case CellType.ROUNDUP: {
        addDescription(area, "Rafle ! Les autorités vous interpellent. Direction le Foyer d'urgence.");
        addActionButton(area, "🚨 Subir la rafle", () => {
          doActionThenShowResult("roundup", () => {
            const area = getActionArea();
            if (!area) return;
            const newEntries = (app.state?.journal ?? []).slice(-3);
            const shelterEntry = newEntries.find(e => e.message === "shelterEntry");
            const turns = (shelterEntry?.data?.turns as number) ?? "?";
            const reveal = document.createElement("div");
            reveal.className = "card-reveal";
            reveal.innerHTML = `
              <span class="card-reveal-icon">🚨</span>
              <span class="card-reveal-name">Envoyé au Foyer</span>
              <span class="card-reveal-desc">Vous y resterez ${turns} tour(s). Logement et repas gratuits, mais impossible de travailler.</span>
            `;
            area.appendChild(reveal);
          });
        }, true);
        break;
      }

      default:
        break;
    }

    addActionButton(
      area,
      `⏭️ ${app.lang.ui.skip ?? "Passer"}`,
      () => app.skipAction(),
    );
  }

  const CELL_ICONS_GAME: Record<string, string> = {
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
    nightOverlay = null;
    board = null;
    nightPlayerShowing = null;
    pendingResultDisplay = null;
  }

  return { mount, update, unmount };
}
