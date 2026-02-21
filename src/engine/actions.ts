import {
  GameState,
  GamePhase,
  TransportMode,
  CellIndex,
  PlayerId,
  NightAction,
  DiceRoller,
  CellType,
  PlayerStatus,
  JobType,
} from "./types";
import { BOARD } from "./board";
import {
  getCurrentPlayer,
  hasCarInInventory,
  canAfford,
  updatePlayerInState,
  addJournalEntry,
  computeSalary,
  clampMoney,
} from "./state";
import {
  BOARD_SIZE,
  CAR_FUEL_COST,
  BUS_TICKET_COST,
  PAYDAY_CELL,
  ROAD_FINE,
} from "./constants";
import { JournalEntryType } from "./types";

export type GameAction =
  | { type: "CHOOSE_TRANSPORT"; playerId: PlayerId; mode: TransportMode }
  | { type: "ROLL_DICE"; playerId: PlayerId }
  | { type: "CHOOSE_CELL"; playerId: PlayerId; cellIndex: CellIndex }
  | { type: "SKIP_ACTION"; playerId: PlayerId }
  | { type: "CHOOSE_NIGHT_ACTION"; playerId: PlayerId; action: NightAction }
  | { type: "RESOLVE_NIGHT" }
  | { type: "NIGHT_CHOOSE_TARGET"; playerId: PlayerId; targetCardId: string }
  | { type: "RESOLVE_MAINTENANCE" }
  | { type: "USE_PROTECTION"; playerId: PlayerId; cardId: string; use: boolean }
  | { type: "END_TURN" }
  | { type: "DRAFT_PICK"; playerId: PlayerId; cardId: string }
  | { type: "DRAFT_VALIDATE"; playerId: PlayerId }
  | { type: "CASE_ACTION"; playerId: PlayerId; actionType: string; params?: Record<string, unknown> };

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateChooseTransport(state: GameState, playerId: PlayerId, mode: TransportMode): ValidationResult {
  if (state.phase !== GamePhase.MOVEMENT) return { valid: false, error: "Not in movement phase" };
  const player = getCurrentPlayer(state);
  if (player.id !== playerId) return { valid: false, error: "Not your turn" };
  if (player.status !== PlayerStatus.ALIVE && player.status !== PlayerStatus.GHOST) {
    return { valid: false, error: "Player is eliminated" };
  }

  if (mode === TransportMode.CAR) {
    if (!hasCarInInventory(player)) return { valid: false, error: "No car in inventory" };
    if (player.carDisabled) return { valid: false, error: "Car is disabled this turn" };
    if (!canAfford(player, CAR_FUEL_COST)) return { valid: false, error: "Cannot afford fuel" };
  }

  if (mode === TransportMode.BUS) {
    if (player.busDisabled) return { valid: false, error: "Bus is disabled this turn" };
    if (!canAfford(player, BUS_TICKET_COST)) return { valid: false, error: "Cannot afford bus ticket" };
  }

  return { valid: true };
}

export function getDiceCount(mode: TransportMode): number {
  switch (mode) {
    case TransportMode.CAR: return 2;
    case TransportMode.BUS: return 1;
    case TransportMode.FOOT: return 1;
  }
}

export function getDiceBonus(mode: TransportMode): number {
  return mode === TransportMode.BUS ? 2 : 0;
}

export function getReachableCells(
  position: CellIndex,
  roll: number,
  direction: "forward" | "both",
): CellIndex[] {
  const cells: CellIndex[] = [];

  for (let i = 1; i <= roll; i++) {
    const forward = (position + i) % BOARD_SIZE;
    cells.push(forward);
  }

  if (direction === "both") {
    for (let i = 1; i <= roll; i++) {
      const backward = (position - i + BOARD_SIZE) % BOARD_SIZE;
      if (!cells.includes(backward)) {
        cells.push(backward);
      }
    }
  }

  return cells;
}

export function getDirection(mode: TransportMode): "forward" | "both" {
  return mode === TransportMode.FOOT ? "both" : "forward";
}

export function passesCell(from: CellIndex, to: CellIndex, target: CellIndex, direction: "forward"): boolean {
  if (from === target || to === target) return to === target;
  if (from < to) {
    return target > from && target < to;
  }
  return target > from || target < to;
}

export function applyChooseTransport(state: GameState, mode: TransportMode): GameState {
  return {
    ...state,
    lastDiceRoll: null,
    _selectedTransport: mode,
  } as GameState & { _selectedTransport: TransportMode };
}

export function applyRollDice(state: GameState, dice: DiceRoller): GameState {
  const transport = (state as GameState & { _selectedTransport?: TransportMode })._selectedTransport;
  if (!transport) return state;

  const count = getDiceCount(transport);
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(dice.rollOne());
  }
  const bonus = getDiceBonus(transport);
  const total = rolls.reduce((a, b) => a + b, 0) + bonus;

  return {
    ...state,
    lastDiceRoll: rolls,
    _diceTotal: total,
  } as GameState & { _diceTotal: number };
}

export function validateChooseCell(state: GameState, playerId: PlayerId, cellIndex: CellIndex): ValidationResult {
  const player = getCurrentPlayer(state);
  if (player.id !== playerId) return { valid: false, error: "Not your turn" };

  const extended = state as GameState & { _selectedTransport?: TransportMode; _diceTotal?: number };
  const transport = extended._selectedTransport;
  const total = extended._diceTotal;

  if (!transport || total === undefined) return { valid: false, error: "Must roll dice first" };

  const direction = getDirection(transport);
  const reachable = getReachableCells(player.position, total, direction);

  if (!reachable.includes(cellIndex)) {
    return { valid: false, error: "Cell not reachable" };
  }

  return { valid: true };
}

export function applyChooseCell(state: GameState, playerId: PlayerId, cellIndex: CellIndex): GameState {
  const player = getCurrentPlayer(state);
  const extended = state as GameState & { _selectedTransport?: TransportMode; _diceTotal?: number };
  const transport = extended._selectedTransport!;
  let newState = { ...state };

  if (transport === TransportMode.CAR) {
    newState = updatePlayerInState(newState, playerId, p => ({
      ...p,
      money: clampMoney(p.money - CAR_FUEL_COST),
      hasCarFuelDebt: 0,
    }));
  } else if (transport === TransportMode.BUS) {
    newState = updatePlayerInState(newState, playerId, p => ({
      ...p,
      money: clampMoney(p.money - BUS_TICKET_COST),
    }));
  }

  const forwardDist = (cellIndex - player.position + BOARD_SIZE) % BOARD_SIZE;
  const backwardDist = (player.position - cellIndex + BOARD_SIZE) % BOARD_SIZE;
  const isForwardMove = forwardDist <= backwardDist;
  if (isForwardMove && passesCell(player.position, cellIndex, PAYDAY_CELL, "forward") && player.position !== PAYDAY_CELL) {
    const salary = computeSalary(player);
    if (salary > 0 && player.hasWorkedSinceLastPay) {
      newState = updatePlayerInState(newState, playerId, p => ({
        ...p,
        money: p.money + salary,
        hasWorkedSinceLastPay: false,
      }));
      newState = addJournalEntry(newState, {
        type: JournalEntryType.SALARY,
        playerId,
        message: `salary`,
        data: { amount: salary },
      });
    }
  }

  newState = updatePlayerInState(newState, playerId, p => ({
    ...p,
    position: cellIndex,
  }));

  newState = addJournalEntry(newState, {
    type: JournalEntryType.MOVEMENT,
    playerId,
    message: `movement`,
    data: { from: player.position, to: cellIndex, transport },
  });

  newState = {
    ...newState,
    phase: GamePhase.ACTION,
  };

  delete (newState as Record<string, unknown>)["_selectedTransport"];
  delete (newState as Record<string, unknown>)["_diceTotal"];

  return newState;
}
