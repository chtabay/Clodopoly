import { describe, it, expect } from "vitest";
import { SeededDiceRoller } from "../../src/engine/dice";
import {
  createInitialState,
  createPlayer,
  computePC,
  computeSalary,
  canAfford,
  hasCarInInventory,
  identifyCamps,
  updatePlayerInState,
  addJournalEntry,
  shuffle,
  clampPV,
  clampPC,
  clampMoney,
} from "../../src/engine/state";
import {
  STARTING_MONEY,
  STARTING_PV,
  FOOD_COST_BASE,
  INITIAL_HOUSES,
  INITIAL_HOTELS,
  PAYDAY_CELL,
} from "../../src/engine/constants";
import {
  GamePhase,
  GameConfig,
  JobType,
  PlayerStatus,
  JournalEntryType,
} from "../../src/engine/types";

function makeDice(seq: number[] = [3, 4, 2, 5, 1, 6, 3, 2, 4, 1, 5, 6]): SeededDiceRoller {
  return new SeededDiceRoller(seq);
}

function makeConfig(count = 3): GameConfig {
  return {
    lang: "fr",
    theme: "poitiers",
    playerNames: ["Alice", "Bob", "Charlie", "Diana", "Eve"].slice(0, count),
    playerColors: ["#e94560", "#4e9ff5", "#4ecca3", "#f5a623", "#c06ef0"].slice(0, count),
  };
}

describe("createPlayer", () => {
  it("creates a player with correct defaults", () => {
    const p = createPlayer(0, "Alice", "#e94560");
    expect(p.id).toBe("player_0");
    expect(p.name).toBe("Alice");
    expect(p.money).toBe(STARTING_MONEY);
    expect(p.pv).toBe(STARTING_PV);
    expect(p.position).toBe(PAYDAY_CELL);
    expect(p.status).toBe(PlayerStatus.ALIVE);
    expect(p.job).toBe(JobType.EMPLOYE);
    expect(p.inventory).toEqual([]);
    expect(p.specialCards).toEqual([]);
    expect(p.ghostTurnsLeft).toBe(0);
    expect(p.lateCounter).toBe(0);
    expect(p.hasWorkedSinceLastPay).toBe(false);
  });
});

describe("createInitialState", () => {
  it("creates a valid game state for 3 players", () => {
    const state = createInitialState(makeConfig(3), makeDice());
    expect(state.players).toHaveLength(3);
    expect(state.phase).toBe(GamePhase.DRAFT);
    expect(state.turn).toBe(1);
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.turnOrder).toHaveLength(3);
    expect(state.foodCost).toBe(FOOD_COST_BASE);
  });

  it("places correct number of buildings", () => {
    const state = createInitialState(makeConfig(3), makeDice());
    expect(state.buildings.size).toBe(INITIAL_HOUSES + INITIAL_HOTELS);

    let houses = 0;
    let hotels = 0;
    for (const type of state.buildings.values()) {
      if (type === "house") houses++;
      if (type === "hotel") hotels++;
    }
    expect(houses).toBe(INITIAL_HOUSES);
    expect(hotels).toBe(INITIAL_HOTELS);
  });

  it("initializes pioches with correct sizes", () => {
    const state = createInitialState(makeConfig(3), makeDice());
    expect(state.eventDeck.length).toBe(16);
    expect(state.scavengeDeck.length).toBe(16);
    expect(state.eventDiscard).toEqual([]);
    expect(state.scavengeDiscard).toEqual([]);
  });

  it("places market cards and reduces object deck", () => {
    const state = createInitialState(makeConfig(3), makeDice());
    const totalMarketCards = state.marketCards.flat().filter(c => c !== null).length;
    expect(totalMarketCards).toBeGreaterThan(0);
    expect(state.objectDeck.length + totalMarketCards).toBe(32);
  });

  it("leaves Cadre and Precaire as available jobs (Employe taken by all players)", () => {
    const state = createInitialState(makeConfig(3), makeDice());
    expect(state.availableJobs).toContain(JobType.CADRE);
    expect(state.availableJobs).toContain(JobType.PRECAIRE);
    expect(state.availableJobs).not.toContain(JobType.EMPLOYE);
  });

  it("works with 2 to 5 players", () => {
    for (let n = 2; n <= 5; n++) {
      const state = createInitialState(makeConfig(n), makeDice());
      expect(state.players).toHaveLength(n);
    }
  });
});

describe("computePC", () => {
  it("returns 0 for empty inventory", () => {
    const p = createPlayer(0, "Test", "#000");
    expect(computePC(p)).toBe(0);
  });

  it("sums PC from inventory cards", () => {
    const p = createPlayer(0, "Test", "#000");
    p.inventory = ["obj_costume_0", "obj_car_0", "obj_hat_0"];
    expect(computePC(p)).toBe(6); // 2 + 3 + 1
  });

  it("includes special cards", () => {
    const p = createPlayer(0, "Test", "#000");
    p.inventory = ["obj_car_0"]; // 3 PC
    p.specialCards = ["scv_costume_0"]; // 1 PC
    expect(computePC(p)).toBe(4);
  });

  it("caps at MAX_PC (10)", () => {
    const p = createPlayer(0, "Test", "#000");
    p.inventory = [
      "obj_car_0", "obj_car_1", "obj_car_2", "obj_car_3", // 12 PC
    ];
    expect(computePC(p)).toBe(10);
  });
});

describe("computeSalary", () => {
  it("returns 0 for unemployed player", () => {
    const p = createPlayer(0, "Test", "#000");
    p.job = null;
    expect(computeSalary(p)).toBe(0);
  });

  it("returns normal salary for Employe", () => {
    const p = createPlayer(0, "Test", "#000");
    p.job = JobType.EMPLOYE;
    p.pc = 5;
    expect(computeSalary(p)).toBe(350);
  });

  it("returns bonus salary when PC >= 8", () => {
    const p = createPlayer(0, "Test", "#000");
    p.job = JobType.EMPLOYE;
    p.pc = 8;
    expect(computeSalary(p)).toBe(385);
  });

  it("returns correct salary for each job type", () => {
    const p = createPlayer(0, "Test", "#000");
    p.pc = 5;

    p.job = JobType.CADRE;
    expect(computeSalary(p)).toBe(500);

    p.job = JobType.PRECAIRE;
    expect(computeSalary(p)).toBe(200);
  });
});

describe("canAfford", () => {
  it("returns true when player has enough money", () => {
    const p = createPlayer(0, "Test", "#000");
    p.money = 100;
    expect(canAfford(p, 100)).toBe(true);
    expect(canAfford(p, 50)).toBe(true);
  });

  it("returns false when player cannot afford", () => {
    const p = createPlayer(0, "Test", "#000");
    p.money = 30;
    expect(canAfford(p, 50)).toBe(false);
  });
});

describe("hasCarInInventory", () => {
  it("returns true when player has a car", () => {
    const p = createPlayer(0, "Test", "#000");
    p.inventory = ["obj_car_0", "obj_hat_1"];
    expect(hasCarInInventory(p)).toBe(true);
  });

  it("returns false when player has no car", () => {
    const p = createPlayer(0, "Test", "#000");
    p.inventory = ["obj_hat_0", "obj_shoes_0"];
    expect(hasCarInInventory(p)).toBe(false);
  });
});

describe("identifyCamps", () => {
  it("identifies camps when 2+ players share a cell", () => {
    const state = createInitialState(makeConfig(3), makeDice());
    state.players[0].position = 13;
    state.players[1].position = 13;
    state.players[2].position = 8;

    const camps = identifyCamps(state);
    expect(camps.size).toBe(1);
    expect(camps.get(13)).toEqual(["player_0", "player_1"]);
  });

  it("returns empty map when all players are on different cells", () => {
    const state = createInitialState(makeConfig(3), makeDice());
    state.players[0].position = 5;
    state.players[1].position = 10;
    state.players[2].position = 20;

    const camps = identifyCamps(state);
    expect(camps.size).toBe(0);
  });

  it("excludes eliminated players", () => {
    const state = createInitialState(makeConfig(3), makeDice());
    state.players[0].position = 13;
    state.players[1].position = 13;
    state.players[1].status = PlayerStatus.ELIMINATED;

    const camps = identifyCamps(state);
    expect(camps.size).toBe(0);
  });

  it("includes ghost players", () => {
    const state = createInitialState(makeConfig(3), makeDice());
    state.players[0].position = 13;
    state.players[1].position = 13;
    state.players[1].status = PlayerStatus.GHOST;
    state.players[1].ghostTurnsLeft = 2;

    const camps = identifyCamps(state);
    expect(camps.size).toBe(1);
  });
});

describe("updatePlayerInState", () => {
  it("updates the targeted player without mutating the original", () => {
    const state = createInitialState(makeConfig(2), makeDice());
    const original = state.players[0].money;
    const newState = updatePlayerInState(state, "player_0", p => ({
      ...p,
      money: p.money - 50,
    }));
    expect(newState.players[0].money).toBe(original - 50);
    expect(state.players[0].money).toBe(original);
  });

  it("does not modify other players", () => {
    const state = createInitialState(makeConfig(2), makeDice());
    const newState = updatePlayerInState(state, "player_0", p => ({
      ...p,
      money: 0,
    }));
    expect(newState.players[1].money).toBe(state.players[1].money);
  });
});

describe("addJournalEntry", () => {
  it("appends an entry with correct turn and phase", () => {
    let state = createInitialState(makeConfig(2), makeDice());
    state = { ...state, turn: 5, phase: GamePhase.ACTION };
    state = addJournalEntry(state, {
      type: JournalEntryType.CASE_ACTION,
      playerId: "player_0",
      message: "Test entry",
    });
    expect(state.journal).toHaveLength(1);
    expect(state.journal[0].turn).toBe(5);
    expect(state.journal[0].phase).toBe(GamePhase.ACTION);
    expect(state.journal[0].message).toBe("Test entry");
  });
});

describe("shuffle", () => {
  it("returns an array of the same length", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr, makeDice());
    expect(result).toHaveLength(5);
  });

  it("contains all original elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr, makeDice());
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("does not mutate the original array", () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    shuffle(arr, makeDice());
    expect(arr).toEqual(copy);
  });
});

describe("clamp helpers", () => {
  it("clampPV clamps between 0 and MAX_PV", () => {
    expect(clampPV(-1)).toBe(0);
    expect(clampPV(3)).toBe(3);
    expect(clampPV(10)).toBe(5);
  });

  it("clampPC clamps between 0 and MAX_PC", () => {
    expect(clampPC(-2)).toBe(0);
    expect(clampPC(7)).toBe(7);
    expect(clampPC(15)).toBe(10);
  });

  it("clampMoney clamps to minimum 0", () => {
    expect(clampMoney(-50)).toBe(0);
    expect(clampMoney(100)).toBe(100);
  });
});
