export type PlayerId = string;
export type CardId = string;
export type CellIndex = number;

export enum GamePhase {
  SETUP = "setup",
  DRAFT = "draft",
  MOVEMENT = "movement",
  ACTION = "action",
  NIGHT = "night",
  NIGHT_RESOLUTION = "night_resolution",
  MAINTENANCE = "maintenance",
  END_TURN = "end_turn",
  GAME_OVER = "game_over",
}

export enum TransportMode {
  CAR = "car",
  BUS = "bus",
  FOOT = "foot",
}

export enum NightAction {
  SLEEP = "sleep",
  WATCH = "watch",
  SCAVENGE = "scavenge",
  TAKE = "take",
}

export enum JobType {
  CADRE = "cadre",
  EMPLOYE = "employe",
  PRECAIRE = "precaire",
}

export enum CellType {
  PROPERTY = "property",
  PETIT_BOULOT = "petit_boulot",
  MARKET = "market",
  SHOWER = "shower",
  CLINIC = "clinic",
  EVENT = "event",
  SCAVENGE = "scavenge",
  PAYDAY = "payday",
  WORKPLACE = "workplace",
  SHELTER = "shelter",
  ROUNDUP = "roundup",
  TAX_INCOME = "tax_income",
  TAX_LUXURY = "tax_luxury",
}

export enum PropertyColor {
  BROWN = "brown",
  LIGHT_BLUE = "light_blue",
  PINK = "pink",
  ORANGE = "orange",
  RED = "red",
  YELLOW = "yellow",
  GREEN = "green",
  DARK_BLUE = "dark_blue",
}

export enum PlayerStatus {
  ALIVE = "alive",
  GHOST = "ghost",
  ELIMINATED = "eliminated",
}

export interface CellDefinition {
  index: CellIndex;
  type: CellType;
  color?: PropertyColor;
  nightCost?: number;
  hotelCost?: number;
}

export interface CardEffect {
  moneyDelta?: number;
  pvDelta?: number;
  pcDelta?: number;
  loseObject?: "any" | "cheapest" | "most_expensive" | "left_player_choice";
  disableBus?: boolean;
  disableCar?: boolean;
  destroyCartons?: boolean;
  drawScavenge?: boolean;
}

export interface CardDefinition {
  id: string;
  type: "object" | "event" | "scavenge" | "job";
  icon: string;
  pcValue?: number;
  price?: number;
  effect?: CardEffect;
  salary?: number;
  hireMinPc?: number;
  keepMinPc?: number;
  maxLate?: number;
  copies: number;
  keepable: boolean;
}

export interface CardInstance {
  instanceId: CardId;
  templateId: string;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  color: string;
  money: number;
  pv: number;
  pc: number;
  position: CellIndex;
  status: PlayerStatus;
  ghostTurnsLeft: number;
  job: JobType | null;
  lateCounter: number;
  hasWorkedSinceLastPay: boolean;
  inventory: CardId[];
  specialCards: CardId[];
  hasCarFuelDebt: number;
  nightAction: NightAction | null;
  busDisabled: boolean;
  carDisabled: boolean;
}

export interface GameState {
  phase: GamePhase;
  turn: number;
  currentPlayerIndex: number;
  turnOrder: PlayerId[];
  players: PlayerState[];
  buildings: Map<CellIndex, "house" | "hotel">;
  marketCards: [CardId | null, CardId | null][];
  eventDeck: CardId[];
  eventDiscard: CardId[];
  scavengeDeck: CardId[];
  scavengeDiscard: CardId[];
  objectDeck: CardId[];
  availableJobs: JobType[];
  foodCost: number;
  buildingsRemaining: number;
  journal: JournalEntry[];
  lastDiceRoll: number[] | null;
  nightChoices: Map<PlayerId, NightAction>;
  /** Joueurs ayant réservé un logement garanti pour cette nuit */
  guaranteedLodgingForNight?: Set<PlayerId>;
  /** Manche en cours dans la journée (0 = première, 1 = deuxième, etc.) */
  roundsInDay?: number;
}

export enum JournalEntryType {
  MOVEMENT = "movement",
  SALARY = "salary",
  CASE_ACTION = "case_action",
  EVENT_CARD = "event_card",
  SCAVENGE_CARD = "scavenge_card",
  NIGHT_CAMP = "night_camp",
  NIGHT_THEFT = "night_theft",
  NIGHT_CAUGHT = "night_caught",
  NIGHT_CONFRONTATION = "night_confrontation",
  MAINTENANCE = "maintenance",
  FIRED = "fired",
  HIRED = "hired",
  ELIMINATED = "eliminated",
  INFLATION = "inflation",
  BUILDING_CONDEMNED = "building_condemned",
  GAME_OVER = "game_over",
}

export interface JournalEntry {
  turn: number;
  phase: GamePhase;
  type: JournalEntryType;
  playerId?: PlayerId;
  targetId?: PlayerId;
  message: string;
  data?: Record<string, unknown>;
}

export interface DiceRoller {
  roll(count: number): number;
  rollOne(): number;
}

export interface GameConfig {
  lang: string;
  theme: string;
  playerNames: string[];
  playerColors: string[];
}
