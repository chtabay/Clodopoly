import {
  GameState,
  GamePhase,
  GameConfig,
  PlayerState,
  PlayerStatus,
  JobType,
  CardId,
  CellIndex,
  CellType,
  DiceRoller,
} from "./types";
import { BOARD } from "./board";
import {
  OBJECT_CARDS,
  EVENT_CARDS,
  SCAVENGE_CARDS,
  instantiateCards,
  getCardDef,
} from "./cards";
import {
  STARTING_MONEY,
  STARTING_PV,
  STARTING_JOB,
  FOOD_COST_BASE,
  INITIAL_HOUSES,
  INITIAL_HOTELS,
  MAX_PC,
  MAX_PV,
  JOB_STATS,
  PC_BONUS_THRESHOLD,
  PAYDAY_CELL,
} from "./constants";

const PLAYER_COLORS_DEFAULT = ["#e94560", "#4e9ff5", "#4ecca3", "#f5a623", "#c06ef0"];

export function createPlayer(
  index: number,
  name: string,
  color: string,
): PlayerState {
  return {
    id: `player_${index}`,
    name,
    color,
    money: STARTING_MONEY,
    pv: STARTING_PV,
    pc: 0,
    position: PAYDAY_CELL,
    status: PlayerStatus.ALIVE,
    ghostTurnsLeft: 0,
    job: STARTING_JOB,
    lateCounter: 0,
    hasWorkedSinceLastPay: false,
    inventory: [],
    specialCards: [],
    hasCarFuelDebt: 0,
    nightAction: null,
    busDisabled: false,
    carDisabled: false,
  };
}

export function createInitialState(config: GameConfig, dice: DiceRoller): GameState {
  const players = config.playerNames.map((name, i) =>
    createPlayer(i, name, config.playerColors[i] ?? PLAYER_COLORS_DEFAULT[i]),
  );

  const turnOrder = players.map(p => p.id);

  const buildings = placeBuildings(dice);

  const eventInstances = instantiateCards(EVENT_CARDS);
  const scavengeInstances = instantiateCards(SCAVENGE_CARDS);
  const objectInstances = instantiateCards(OBJECT_CARDS);

  const eventDeck = shuffle(eventInstances.map(c => c.instanceId), dice);
  const scavengeDeck = shuffle(scavengeInstances.map(c => c.instanceId), dice);
  const objectDeck = shuffle(objectInstances.map(c => c.instanceId), dice);

  const marketCards: [CardId | null, CardId | null][] = [];
  const marketCells = BOARD.filter(
    c => c.type === CellType.MARKET,
  );
  for (let i = 0; i < marketCells.length; i++) {
    const card1 = objectDeck.shift() ?? null;
    const card2 = objectDeck.shift() ?? null;
    marketCards.push([card1, card2]);
  }

  return {
    phase: GamePhase.DRAFT,
    turn: 1,
    currentPlayerIndex: 0,
    turnOrder,
    players,
    buildings,
    marketCards,
    eventDeck,
    eventDiscard: [],
    scavengeDeck,
    scavengeDiscard: [],
    objectDeck,
    availableJobs: [JobType.CADRE, JobType.PRECAIRE],
    foodCost: FOOD_COST_BASE,
    buildingsRemaining: INITIAL_HOUSES + INITIAL_HOTELS,
    journal: [],
    lastDiceRoll: null,
    nightChoices: new Map(),
  };
}

function placeBuildings(dice: DiceRoller): Map<CellIndex, "house" | "hotel"> {
  const properties = BOARD.filter(c => c.type === CellType.PROPERTY);
  const shuffled = shuffle([...properties], dice);

  const buildings = new Map<CellIndex, "house" | "hotel">();

  for (let i = 0; i < INITIAL_HOTELS && i < shuffled.length; i++) {
    buildings.set(shuffled[i].index, "hotel");
  }

  for (let i = INITIAL_HOTELS; i < INITIAL_HOTELS + INITIAL_HOUSES && i < shuffled.length; i++) {
    buildings.set(shuffled[i].index, "house");
  }

  return buildings;
}

export function shuffle<T>(array: T[], dice: DiceRoller): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = (dice.rollOne() + dice.rollOne() * 6) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getPlayer(state: GameState, playerId: string): PlayerState | undefined {
  return state.players.find(p => p.id === playerId);
}

export function getCurrentPlayer(state: GameState): PlayerState {
  return state.players[state.currentPlayerIndex];
}

export function computePC(player: PlayerState): number {
  let pc = 0;
  for (const cardId of player.inventory) {
    const def = getCardDef(cardId);
    if (def?.pcValue) pc += def.pcValue;
  }
  for (const cardId of player.specialCards) {
    const def = getCardDef(cardId);
    if (def?.pcValue) pc += def.pcValue;
  }
  return Math.min(pc, MAX_PC);
}

export function computeSalary(player: PlayerState): number {
  if (!player.job) return 0;
  const stats = JOB_STATS[player.job];
  const pc = player.pc;
  if (pc >= PC_BONUS_THRESHOLD) return stats.bonusSalary;
  return stats.salary;
}

export function canAfford(player: PlayerState, cost: number): boolean {
  return player.money >= cost;
}

export function hasCarInInventory(player: PlayerState): boolean {
  return player.inventory.some(id => id.startsWith("obj_car_"));
}

export function getAlivePlayersCount(state: GameState): number {
  return state.players.filter(
    p => p.status === PlayerStatus.ALIVE,
  ).length;
}

export function getActivePlayers(state: GameState): PlayerState[] {
  return state.players.filter(
    p => p.status === PlayerStatus.ALIVE || p.status === PlayerStatus.GHOST,
  );
}

export function identifyCamps(state: GameState): Map<CellIndex, string[]> {
  const camps = new Map<CellIndex, string[]>();
  const active = getActivePlayers(state);

  for (const player of active) {
    const pos = player.position;
    const existing = camps.get(pos) ?? [];
    existing.push(player.id);
    camps.set(pos, existing);
  }

  for (const [pos, players] of camps) {
    if (players.length < 2) camps.delete(pos);
  }

  return camps;
}

export function updatePlayerInState(
  state: GameState,
  playerId: string,
  updater: (player: PlayerState) => PlayerState,
): GameState {
  return {
    ...state,
    players: state.players.map(p =>
      p.id === playerId ? updater(p) : p,
    ),
  };
}

export function addJournalEntry(
  state: GameState,
  entry: Omit<GameState["journal"][number], "turn" | "phase">,
): GameState {
  return {
    ...state,
    journal: [
      ...state.journal,
      {
        ...entry,
        turn: state.turn,
        phase: state.phase,
      },
    ],
  };
}

export function clampPV(pv: number): number {
  return Math.max(0, Math.min(MAX_PV, pv));
}

export function clampPC(pc: number): number {
  return Math.max(0, Math.min(MAX_PC, pc));
}

export function clampMoney(money: number): number {
  return Math.max(0, money);
}
