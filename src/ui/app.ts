import {
  GameState,
  GamePhase,
  PlayerId,
  NightAction,
  TransportMode,
  CellIndex,
  JobType,
  DiceRoller,
  PlayerStatus,
} from "../engine/types";
import { RandomDiceRoller } from "../engine/dice";
import { createInitialState, getCurrentPlayer, identifyCamps, computePC } from "../engine/state";
import {
  validateChooseTransport,
  applyChooseTransport,
  applyRollDice,
  validateChooseCell,
  applyChooseCell,
  getReachableCells,
  getDirection,
  getDiceCount,
  getDiceBonus,
} from "../engine/actions";
import {
  resolvePetitBoulot,
  resolveMarketBuy,
  resolveShower,
  resolveClinic,
  resolveEventCard,
  resolveScavengeCard,
  resolveWorkplace,
  resolveHire,
  resolveShelterEntry,
  resolveRoundup,
  resolveTaxIncome,
  resolveTaxLuxury,
  resolveSell,
  resolveGuaranteedLodging,
  resolveNight,
  resolveMaintenance,
  resolveEndTurn,
  advanceToNextPlayer,
  resolveDraftPick,
  resolveDraftValidate,
} from "../engine/resolver";
import { BOARD } from "../engine/board";
import { CellType } from "../engine/types";
import { LANG_FR } from "../locale/lang/fr";
import { THEME_POITIERS } from "../locale/themes/poitiers";
import { LangData, LocationTheme } from "../locale/types";
import { showNotification } from "./components/notification";

export type Screen = "home" | "setup" | "draft" | "game" | "endgame";

export type ScreenRenderer = {
  mount(container: HTMLElement): void;
  update(state: GameState): void;
  unmount(): void;
};

export class App {
  state: GameState | null = null;
  screen: Screen = "home";
  dice: DiceRoller = new RandomDiceRoller();
  lang: LangData = LANG_FR;
  theme: LocationTheme = THEME_POITIERS;

  private container: HTMLElement;
  private currentRenderer: ScreenRenderer | null = null;
  private renderers = new Map<Screen, () => ScreenRenderer>();

  constructor(container: HTMLElement) {
    this.container = container;
  }

  registerScreen(name: Screen, factory: () => ScreenRenderer): void {
    this.renderers.set(name, factory);
  }

  navigate(screen: Screen): void {
    if (this.currentRenderer) {
      this.currentRenderer.unmount();
    }
    this.screen = screen;
    this.container.innerHTML = "";
    const factory = this.renderers.get(screen);
    if (factory) {
      this.currentRenderer = factory();
      this.currentRenderer.mount(this.container);
      if (this.state) {
        this.currentRenderer.update(this.state);
      }
    }
  }

  startGame(playerNames: string[], playerColors: string[]): void {
    this.state = createInitialState(
      { lang: "fr", theme: "poitiers", playerNames, playerColors },
      this.dice,
    );
    this.navigate("draft");
  }

  updateUI(): void {
    if (this.state && this.currentRenderer) {
      this.currentRenderer.update(this.state);
    }
  }

  draftPick(playerId: PlayerId, cardId: string): void {
    if (!this.state) return;
    this.state = resolveDraftPick(this.state, playerId, cardId);
    this.updateUI();
  }

  draftUnpick(playerId: PlayerId, cardId: string): void {
    if (!this.state) return;
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;
    const newInventory = player.inventory.filter(c => c !== cardId);
    const tempPlayer = { ...player, inventory: newInventory };
    this.state = {
      ...this.state,
      players: this.state.players.map(p =>
        p.id === playerId
          ? { ...p, inventory: newInventory, pc: computePC(tempPlayer) }
          : p,
      ),
    };
    this.updateUI();
  }

  draftValidate(playerId: PlayerId): void {
    if (!this.state) return;
    const prev = this.state.phase;
    this.state = resolveDraftValidate(this.state, playerId);
    if (this.state.phase === GamePhase.MOVEMENT && prev === GamePhase.DRAFT) {
      this.navigate("game");
    }
    this.updateUI();
  }

  chooseTransport(mode: TransportMode): void {
    if (!this.state) return;
    const player = getCurrentPlayer(this.state);
    const v = validateChooseTransport(this.state, player.id, mode);
    if (!v.valid) {
      showNotification(v.error ?? "Action invalide", "error");
      return;
    }
    this.state = applyChooseTransport(this.state, mode);
    this.updateUI();
  }

  rollDice(): void {
    if (!this.state) return;
    this.state = applyRollDice(this.state, this.dice);
    this.updateUI();
  }

  chooseCell(cellIndex: CellIndex): void {
    if (!this.state) return;
    const player = getCurrentPlayer(this.state);
    const v = validateChooseCell(this.state, player.id, cellIndex);
    if (!v.valid) return;
    this.state = applyChooseCell(this.state, player.id, cellIndex);
    this.updateUI();
  }

  caseAction(actionType: string, params?: Record<string, unknown>): void {
    if (!this.state) return;
    const player = getCurrentPlayer(this.state);

    switch (actionType) {
      case "petitBoulot":
        this.state = resolvePetitBoulot(this.state, player.id);
        break;
      case "marketBuy":
        this.state = resolveMarketBuy(
          this.state,
          player.id,
          params?.marketIndex as number ?? 0,
          params?.slotIndex as number ?? 0,
        );
        break;
      case "shower":
        this.state = resolveShower(this.state, player.id);
        break;
      case "clinic":
        this.state = resolveClinic(this.state, player.id);
        break;
      case "event":
        this.state = resolveEventCard(this.state, player.id, this.dice);
        break;
      case "scavenge":
        this.state = resolveScavengeCard(this.state, player.id, this.dice);
        break;
      case "workplace":
        this.state = resolveWorkplace(this.state, player.id);
        break;
      case "hire":
        if (params?.jobType) {
          this.state = resolveHire(this.state, player.id, params.jobType as JobType);
        }
        break;
      case "shelter":
        this.state = resolveShelterEntry(this.state, player.id, this.dice);
        break;
      case "roundup":
        this.state = resolveRoundup(this.state, player.id, this.dice);
        break;
      case "taxIncome":
        this.state = resolveTaxIncome(this.state, player.id);
        break;
      case "taxLuxury":
        this.state = resolveTaxLuxury(this.state, player.id);
        break;
      case "sell":
        if (params?.cardId) {
          this.state = resolveSell(this.state, player.id, params.cardId as string);
        }
        break;
      case "guaranteedLodging":
        this.state = resolveGuaranteedLodging(this.state, player.id);
        break;
    }
    this.updateUI();
  }

  skipAction(): void {
    if (!this.state) return;
    this.state = advanceToNextPlayer(this.state);
    this.updateUI();
  }

  chooseNightAction(playerId: PlayerId, action: NightAction): void {
    if (!this.state) return;
    const newChoices = new Map(this.state.nightChoices);
    newChoices.set(playerId, action);
    this.state = { ...this.state, nightChoices: newChoices };
    this.updateUI();
  }

  resolveNightPhase(): void {
    if (!this.state) return;
    this.state = resolveNight(this.state, this.dice);
    this.updateUI();
  }

  resolveMaintenancePhase(): void {
    if (!this.state) return;
    this.state = resolveMaintenance(this.state);
    this.updateUI();
  }

  resolveEndTurnPhase(): void {
    if (!this.state) return;
    this.state = resolveEndTurn(this.state);
    if (this.state.phase === GamePhase.GAME_OVER) {
      this.navigate("endgame");
    }
    this.updateUI();
  }

  getReachable(): CellIndex[] {
    if (!this.state) return [];
    const ext = this.state as GameState & { _selectedTransport?: TransportMode; _diceTotal?: number };
    if (!ext._selectedTransport || ext._diceTotal === undefined) return [];
    const player = getCurrentPlayer(this.state);
    const direction = getDirection(ext._selectedTransport);
    return getReachableCells(player.position, ext._diceTotal, direction);
  }

  getDiceInfo(): { count: number; bonus: number } | null {
    if (!this.state) return null;
    const ext = this.state as GameState & { _selectedTransport?: TransportMode };
    if (!ext._selectedTransport) return null;
    return {
      count: getDiceCount(ext._selectedTransport),
      bonus: getDiceBonus(ext._selectedTransport),
    };
  }

  hasTransportSelected(): boolean {
    const ext = this.state as GameState & { _selectedTransport?: TransportMode } | null;
    return !!ext?._selectedTransport;
  }

  hasDiceRolled(): boolean {
    const ext = this.state as GameState & { _diceTotal?: number } | null;
    return ext?._diceTotal !== undefined;
  }

  getActiveCamps(): Map<CellIndex, string[]> {
    if (!this.state) return new Map();
    return identifyCamps(this.state);
  }

  getNightPlayersToChoose(): PlayerId[] {
    if (!this.state) return [];
    const camps = identifyCamps(this.state);
    const inCamp = new Set<string>();
    for (const ids of camps.values()) ids.forEach(id => inCamp.add(id));

    return this.state.players
      .filter(p => inCamp.has(p.id) && !this.state!.nightChoices.has(p.id))
      .filter(p => p.status !== PlayerStatus.ELIMINATED)
      .map(p => p.id);
  }

  allNightChoicesMade(): boolean {
    if (!this.state) return false;
    const camps = identifyCamps(this.state);
    const inCamp = new Set<string>();
    for (const ids of camps.values()) ids.forEach(id => inCamp.add(id));

    for (const id of inCamp) {
      if (!this.state.nightChoices.has(id)) return false;
    }
    return true;
  }

  autoCaseAction(): void {
    if (!this.state) return;
    const player = getCurrentPlayer(this.state);
    const cell = BOARD[player.position];

    switch (cell.type) {
      case CellType.EVENT:
        this.caseAction("event");
        break;
      case CellType.SCAVENGE:
        this.caseAction("scavenge");
        break;
      case CellType.ROUNDUP:
        this.caseAction("roundup");
        break;
      case CellType.TAX_INCOME:
        this.caseAction("taxIncome");
        break;
      case CellType.TAX_LUXURY:
        this.caseAction("taxLuxury");
        break;
      default:
        break;
    }
  }
}

let appInstance: App | null = null;

export function getApp(): App {
  if (!appInstance) throw new Error("App not initialized");
  return appInstance;
}

export function initApp(container: HTMLElement): App {
  appInstance = new App(container);
  return appInstance;
}
