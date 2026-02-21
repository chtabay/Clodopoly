import { describe, it, expect } from "vitest";
import { SeededDiceRoller } from "../../src/engine/dice";
import { createInitialState, computePC, updatePlayerInState } from "../../src/engine/state";
import {
  resolvePetitBoulot,
  resolveMarketBuy,
  resolveShower,
  resolveClinic,
  resolveEventCard,
  resolveScavengeCard,
  resolveWorkplace,
  resolveHire,
  resolveTaxIncome,
  resolveTaxLuxury,
  resolveNight,
  resolveMaintenance,
  resolveEndTurn,
  advanceToNextPlayer,
  resolveDraftPick,
  resolveDraftValidate,
} from "../../src/engine/resolver";
import {
  GamePhase,
  GameConfig,
  NightAction,
  PlayerStatus,
  JobType,
  JournalEntryType,
  CellType,
} from "../../src/engine/types";
import {
  PETIT_BOULOT_PAY,
  CLINIC_COST,
  FOOD_COST_BASE,
  WORKPLACE_CELL,
  SHELTER_CELL,
  MAX_PC,
  MAX_PV,
  TAX_LUXURY_AMOUNT,
} from "../../src/engine/constants";
import { BOARD } from "../../src/engine/board";

function makeDice(seq: number[] = [3, 4, 2, 5, 1, 6, 3, 2, 4, 1, 5, 6]): SeededDiceRoller {
  return new SeededDiceRoller(seq);
}

function makeConfig(count = 3): GameConfig {
  return {
    lang: "fr",
    theme: "poitiers",
    playerNames: ["Alice", "Bob", "Charlie"].slice(0, count),
    playerColors: ["#e94560", "#4e9ff5", "#4ecca3"].slice(0, count),
  };
}

function gameReady(playerCount = 3) {
  const state = createInitialState(makeConfig(playerCount), makeDice());
  return { ...state, phase: GamePhase.ACTION };
}

// ==================== LOT 1.5: CASE ACTIONS ====================

describe("resolvePetitBoulot", () => {
  it("gives money when cell is petit boulot and empty", () => {
    let state = gameReady();
    const pbCell = BOARD.findIndex(c => c.type === CellType.PETIT_BOULOT);
    state.players[0].position = pbCell;
    state = resolvePetitBoulot(state, "player_0");
    expect(state.players[0].money).toBe(800 + PETIT_BOULOT_PAY);
  });

  it("does not give money if another player is on the cell", () => {
    let state = gameReady();
    const pbCell = BOARD.findIndex(c => c.type === CellType.PETIT_BOULOT);
    state.players[0].position = pbCell;
    state.players[1].position = pbCell;
    state = resolvePetitBoulot(state, "player_0");
    expect(state.players[0].money).toBe(800);
  });
});

describe("resolveShower", () => {
  it("gives +1 PC", () => {
    let state = gameReady();
    const showerCell = BOARD.findIndex(c => c.type === CellType.SHOWER);
    state.players[0].position = showerCell;
    state.players[0].pc = 5;
    state = resolveShower(state, "player_0");
    expect(state.players[0].pc).toBe(6);
  });

  it("does not exceed MAX_PC", () => {
    let state = gameReady();
    state.players[0].pc = MAX_PC;
    state = resolveShower(state, "player_0");
    expect(state.players[0].pc).toBe(MAX_PC);
  });
});

describe("resolveClinic", () => {
  it("gives +1 PV for 50€", () => {
    let state = gameReady();
    state.players[0].pv = 3;
    state.players[0].money = 100;
    state = resolveClinic(state, "player_0");
    expect(state.players[0].pv).toBe(4);
    expect(state.players[0].money).toBe(100 - CLINIC_COST);
  });

  it("does nothing if PV is max", () => {
    let state = gameReady();
    state.players[0].pv = MAX_PV;
    state = resolveClinic(state, "player_0");
    expect(state.players[0].pv).toBe(MAX_PV);
    expect(state.players[0].money).toBe(800);
  });

  it("does nothing if cannot afford", () => {
    let state = gameReady();
    state.players[0].pv = 3;
    state.players[0].money = 10;
    state = resolveClinic(state, "player_0");
    expect(state.players[0].pv).toBe(3);
  });
});

describe("resolveEventCard", () => {
  it("draws a card and applies its effect", () => {
    let state = gameReady();
    state.players[0].pc = 5;
    const originalDeckSize = state.eventDeck.length;
    state = resolveEventCard(state, "player_0", makeDice());
    expect(state.eventDeck.length).toBe(originalDeckSize - 1);
    expect(state.eventDiscard.length).toBeGreaterThan(0);
  });

  it("recycles discard when deck is empty", () => {
    let state = gameReady();
    state.eventDiscard = [...state.eventDeck];
    state.eventDeck = [];
    state = resolveEventCard(state, "player_0", makeDice());
    expect(state.eventDeck.length).toBeGreaterThan(0);
  });
});

describe("resolveScavengeCard", () => {
  it("draws a card from scavenge deck", () => {
    let state = gameReady();
    const originalDeckSize = state.scavengeDeck.length;
    state = resolveScavengeCard(state, "player_0", makeDice());
    expect(state.scavengeDeck.length).toBe(originalDeckSize - 1);
  });
});

describe("resolveWorkplace", () => {
  it("marks hasWorkedSinceLastPay and resets late counter", () => {
    let state = gameReady();
    state.players[0].position = WORKPLACE_CELL;
    state.players[0].lateCounter = 1;
    state.players[0].hasWorkedSinceLastPay = false;
    state = resolveWorkplace(state, "player_0");
    expect(state.players[0].hasWorkedSinceLastPay).toBe(true);
    expect(state.players[0].lateCounter).toBe(0);
  });

  it("does nothing if unemployed", () => {
    let state = gameReady();
    state.players[0].position = WORKPLACE_CELL;
    state.players[0].job = null;
    state = resolveWorkplace(state, "player_0");
    expect(state.players[0].hasWorkedSinceLastPay).toBe(false);
  });
});

describe("resolveHire", () => {
  it("hires player with sufficient PC", () => {
    let state = gameReady();
    state.players[0].position = WORKPLACE_CELL;
    state.players[0].job = null;
    state.players[0].pc = 5;
    state.availableJobs = [JobType.EMPLOYE];
    state = resolveHire(state, "player_0", JobType.EMPLOYE);
    expect(state.players[0].job).toBe(JobType.EMPLOYE);
    expect(state.availableJobs).not.toContain(JobType.EMPLOYE);
  });

  it("rejects if PC too low", () => {
    let state = gameReady();
    state.players[0].position = WORKPLACE_CELL;
    state.players[0].job = null;
    state.players[0].pc = 1;
    state.availableJobs = [JobType.EMPLOYE];
    state = resolveHire(state, "player_0", JobType.EMPLOYE);
    expect(state.players[0].job).toBeNull();
  });

  it("rejects if already employed", () => {
    let state = gameReady();
    state.players[0].position = WORKPLACE_CELL;
    state.players[0].job = JobType.PRECAIRE;
    state.players[0].pc = 8;
    state.availableJobs = [JobType.CADRE];
    state = resolveHire(state, "player_0", JobType.CADRE);
    expect(state.players[0].job).toBe(JobType.PRECAIRE);
  });

  it("rejects if job not available", () => {
    let state = gameReady();
    state.players[0].position = WORKPLACE_CELL;
    state.players[0].job = null;
    state.players[0].pc = 8;
    state.availableJobs = [JobType.PRECAIRE];
    state = resolveHire(state, "player_0", JobType.CADRE);
    expect(state.players[0].job).toBeNull();
  });
});

describe("resolveTaxIncome", () => {
  it("deducts 10% of money (min 20€)", () => {
    let state = gameReady();
    state.players[0].money = 500;
    state = resolveTaxIncome(state, "player_0");
    expect(state.players[0].money).toBe(450);
  });

  it("applies minimum 20€", () => {
    let state = gameReady();
    state.players[0].money = 100;
    state = resolveTaxIncome(state, "player_0");
    expect(state.players[0].money).toBe(80);
  });

  it("loses 1 PC if cannot afford", () => {
    let state = gameReady();
    state.players[0].money = 0;
    state.players[0].pc = 5;
    state = resolveTaxIncome(state, "player_0");
    expect(state.players[0].pc).toBe(4);
    expect(state.players[0].money).toBe(0);
  });
});

describe("resolveTaxLuxury", () => {
  it("deducts 75€", () => {
    let state = gameReady();
    state.players[0].money = 200;
    state = resolveTaxLuxury(state, "player_0");
    expect(state.players[0].money).toBe(200 - TAX_LUXURY_AMOUNT);
  });

  it("loses 1 PC if cannot afford", () => {
    let state = gameReady();
    state.players[0].money = 50;
    state.players[0].pc = 5;
    state = resolveTaxLuxury(state, "player_0");
    expect(state.players[0].pc).toBe(4);
    expect(state.players[0].money).toBe(50);
  });
});

// ==================== LOT 1.6: NIGHT PHASE ====================

describe("resolveNight", () => {
  function nightState(positions: number[], choices: NightAction[]) {
    let state = gameReady(positions.length);
    state.phase = GamePhase.NIGHT;
    for (let i = 0; i < positions.length; i++) {
      state.players[i].position = positions[i];
      state.players[i].inventory = ["obj_costume_" + i, "obj_hat_" + i];
      state.players[i].pc = 5;
      state.nightChoices.set(`player_${i}`, choices[i]);
    }
    return state;
  }

  it("SLEEP+SLEEP: peaceful camp, +1 PC each", () => {
    let state = nightState([13, 13], [NightAction.SLEEP, NightAction.SLEEP]);
    state.buildings.set(13, "house");
    state = resolveNight(state, makeDice());
    expect(state.players[0].pc).toBe(6);
    expect(state.players[1].pc).toBe(6);
  });

  it("SLEEP+WATCH: no incident, sleeper +1 PC, watcher +0 PC", () => {
    let state = nightState([13, 13], [NightAction.SLEEP, NightAction.WATCH]);
    state.buildings.set(13, "house");
    state = resolveNight(state, makeDice());
    expect(state.players[0].pc).toBe(6);
    expect(state.players[1].pc).toBe(5);
  });

  it("SLEEP+TAKE: taker steals a card from sleeper", () => {
    let state = nightState([13, 13], [NightAction.SLEEP, NightAction.TAKE]);
    state.buildings.set(13, "house");
    const beforeInvA = state.players[0].inventory.length;
    const beforeInvB = state.players[1].inventory.length;
    state = resolveNight(state, makeDice());
    expect(state.players[0].inventory.length).toBe(beforeInvA - 1);
    expect(state.players[1].inventory.length).toBe(beforeInvB + 1);
    const theftEntry = state.journal.find(e => e.type === JournalEntryType.NIGHT_THEFT);
    expect(theftEntry).toBeDefined();
  });

  it("WATCH+TAKE: taker caught, -1 PC", () => {
    let state = nightState([13, 13], [NightAction.WATCH, NightAction.TAKE]);
    state.buildings.set(13, "house");
    const beforeInvA = state.players[0].inventory.length;
    state = resolveNight(state, makeDice());
    expect(state.players[0].inventory.length).toBe(beforeInvA);
    expect(state.players[1].pc).toBe(4);
    const caughtEntry = state.journal.find(e => e.type === JournalEntryType.NIGHT_CAUGHT);
    expect(caughtEntry).toBeDefined();
  });

  it("TAKE+TAKE: confrontation, loser -1 PV, both -1 PC", () => {
    let state = nightState([13, 13], [NightAction.TAKE, NightAction.TAKE]);
    state.buildings.set(13, "house");
    state = resolveNight(state, makeDice());
    const totalPV = state.players[0].pv + state.players[1].pv;
    expect(totalPV).toBe(9);
    expect(state.players[0].pc).toBeLessThanOrEqual(5);
    expect(state.players[1].pc).toBeLessThanOrEqual(5);
    const confrontEntry = state.journal.find(e => e.type === JournalEntryType.NIGHT_CONFRONTATION);
    expect(confrontEntry).toBeDefined();
  });

  it("SLEEP+SCAVENGE: scavenger draws a card", () => {
    let state = nightState([13, 13], [NightAction.SLEEP, NightAction.SCAVENGE]);
    state.buildings.set(13, "house");
    const deckBefore = state.scavengeDeck.length;
    state = resolveNight(state, makeDice());
    expect(state.scavengeDeck.length).toBeLessThan(deckBefore);
  });

  it("WATCH+WATCH: no incident, no PC bonus", () => {
    let state = nightState([13, 13], [NightAction.WATCH, NightAction.WATCH]);
    state.buildings.set(13, "house");
    state = resolveNight(state, makeDice());
    expect(state.players[0].pc).toBe(5);
    expect(state.players[1].pc).toBe(5);
  });

  it("player alone without building sleeps outside (-1 PV, -1 PC)", () => {
    let state = nightState([13, 8, 22], [NightAction.SLEEP, NightAction.SLEEP, NightAction.SLEEP]);
    state.buildings.clear();
    state = resolveNight(state, makeDice());
    expect(state.players[2].pv).toBe(4);
    expect(state.players[2].pc).toBe(4);
  });

  it("player alone with building pays and keeps PV/PC", () => {
    let state = nightState([13, 8, 6], [NightAction.SLEEP, NightAction.SLEEP, NightAction.SLEEP]);
    state.buildings.set(6, "house");
    const moneyBefore = state.players[2].money;
    state = resolveNight(state, makeDice());
    expect(state.players[2].pv).toBe(5);
    expect(state.players[2].money).toBeLessThan(moneyBefore);
  });

  it("3 players: watcher blocks all takers", () => {
    let state = nightState([13, 13, 13], [NightAction.WATCH, NightAction.TAKE, NightAction.TAKE]);
    state.buildings.set(13, "house");
    state = resolveNight(state, makeDice());
    expect(state.players[1].pc).toBe(4);
    expect(state.players[2].pc).toBe(4);
    expect(state.players[0].inventory.length).toBe(2);
  });

  it("transitions to MAINTENANCE phase", () => {
    let state = nightState([13, 8], [NightAction.SLEEP, NightAction.SLEEP]);
    state.buildings.set(13, "house");
    state = resolveNight(state, makeDice());
    expect(state.phase).toBe(GamePhase.MAINTENANCE);
  });
});

// ==================== LOT 1.7: MAINTENANCE + GAME LOOP ====================

describe("resolveMaintenance", () => {
  it("deducts food cost from each player", () => {
    let state = gameReady(2);
    state.phase = GamePhase.MAINTENANCE;
    state.players[0].money = 100;
    state.players[1].money = 100;
    state.players[0].position = 5;
    state.players[1].position = 15;
    state = resolveMaintenance(state);
    expect(state.players[0].money).toBe(100 - FOOD_COST_BASE);
    expect(state.players[1].money).toBe(100 - FOOD_COST_BASE);
  });

  it("player who cannot afford food loses 1 PV", () => {
    let state = gameReady(2);
    state.phase = GamePhase.MAINTENANCE;
    state.players[0].money = 5;
    state.players[0].position = 5;
    state = resolveMaintenance(state);
    expect(state.players[0].pv).toBe(4);
    expect(state.players[0].money).toBe(5);
  });

  it("fires player with PC below keepMinPc", () => {
    let state = gameReady();
    state.phase = GamePhase.MAINTENANCE;
    state.players[0].job = JobType.EMPLOYE;
    state.players[0].pc = 2;
    state.players[0].position = 5;
    state = resolveMaintenance(state);
    expect(state.players[0].job).toBeNull();
    expect(state.availableJobs).toContain(JobType.EMPLOYE);
  });

  it("fires player with too many late turns", () => {
    let state = gameReady();
    state.phase = GamePhase.MAINTENANCE;
    state.players[0].job = JobType.EMPLOYE;
    state.players[0].pc = 5;
    state.players[0].lateCounter = 2;
    state.players[0].position = 5;
    state = resolveMaintenance(state);
    expect(state.players[0].job).toBeNull();
  });

  it("eliminates player at 0 PV", () => {
    let state = gameReady(2);
    state.phase = GamePhase.MAINTENANCE;
    state.players[0].pv = 0;
    state.players[0].position = 5;
    state = resolveMaintenance(state);
    expect(state.players[0].status).toBe(PlayerStatus.ELIMINATED);
  });

  it("transitions to END_TURN phase", () => {
    let state = gameReady(2);
    state.phase = GamePhase.MAINTENANCE;
    state.players[0].position = 5;
    state.players[1].position = 10;
    state = resolveMaintenance(state);
    expect(state.phase).toBe(GamePhase.END_TURN);
  });
});

describe("resolveEndTurn", () => {
  it("resets bus/car disabled flags", () => {
    let state = gameReady(2);
    state.phase = GamePhase.END_TURN;
    state.players[0].busDisabled = true;
    state.players[1].carDisabled = true;
    state = resolveEndTurn(state);
    expect(state.players[0].busDisabled).toBe(false);
    expect(state.players[1].carDisabled).toBe(false);
  });

  it("increments turn number", () => {
    let state = gameReady(2);
    state.phase = GamePhase.END_TURN;
    state.turn = 3;
    state = resolveEndTurn(state);
    expect(state.turn).toBe(4);
  });

  it("detects victory when only 1 player alive", () => {
    let state = gameReady(2);
    state.phase = GamePhase.END_TURN;
    state.players[1].status = PlayerStatus.ELIMINATED;
    state = resolveEndTurn(state);
    expect(state.phase).toBe(GamePhase.GAME_OVER);
  });

  it("continues to MOVEMENT when multiple players alive", () => {
    let state = gameReady(3);
    state.phase = GamePhase.END_TURN;
    state = resolveEndTurn(state);
    expect(state.phase).toBe(GamePhase.MOVEMENT);
  });
});

describe("advanceToNextPlayer", () => {
  it("advances to next alive player", () => {
    let state = gameReady(3);
    state.currentPlayerIndex = 0;
    state = advanceToNextPlayer(state);
    expect(state.currentPlayerIndex).toBe(1);
    expect(state.phase).toBe(GamePhase.MOVEMENT);
  });

  it("skips eliminated players", () => {
    let state = gameReady(3);
    state.currentPlayerIndex = 0;
    state.players[1].status = PlayerStatus.ELIMINATED;
    state = advanceToNextPlayer(state);
    expect(state.currentPlayerIndex).toBe(2);
  });

  it("transitions to NIGHT when all players have played", () => {
    let state = gameReady(3);
    state.currentPlayerIndex = 2;
    state = advanceToNextPlayer(state);
    expect(state.phase).toBe(GamePhase.NIGHT);
  });
});

// ==================== LOT 1.8: DRAFT ====================

describe("resolveDraftPick", () => {
  it("adds card to player inventory", () => {
    let state = createInitialState(makeConfig(2), makeDice());
    state = resolveDraftPick(state, "player_0", "obj_car_0");
    expect(state.players[0].inventory).toContain("obj_car_0");
    expect(state.players[0].pc).toBe(3);
  });

  it("rejects if would exceed 8 PC", () => {
    let state = createInitialState(makeConfig(2), makeDice());
    state.players[0].inventory = ["obj_car_0", "obj_costume_0", "obj_phone_0"];
    state.players[0].pc = 7;
    state = resolveDraftPick(state, "player_0", "obj_costume_1");
    expect(state.players[0].inventory).not.toContain("obj_costume_1");
  });
});

describe("resolveDraftValidate", () => {
  it("advances to next player when PC = 8 and has car", () => {
    let state = createInitialState(makeConfig(2), makeDice());
    state.players[0].inventory = ["obj_car_0", "obj_costume_0", "obj_hat_0", "obj_shoes_0", "obj_hair_0"];
    state.players[0].pc = 8;
    state = resolveDraftValidate(state, "player_0");
    expect(state.currentPlayerIndex).toBe(1);
  });

  it("rejects if PC != 8", () => {
    let state = createInitialState(makeConfig(2), makeDice());
    state.players[0].inventory = ["obj_car_0"];
    state.players[0].pc = 3;
    state = resolveDraftValidate(state, "player_0");
    expect(state.currentPlayerIndex).toBe(0);
  });

  it("rejects if no car", () => {
    let state = createInitialState(makeConfig(2), makeDice());
    state.players[0].inventory = ["obj_costume_0", "obj_costume_1", "obj_costume_2", "obj_costume_3"];
    state.players[0].pc = 8;
    state = resolveDraftValidate(state, "player_0");
    expect(state.currentPlayerIndex).toBe(0);
  });

  it("transitions to MOVEMENT after last player validates", () => {
    let state = createInitialState(makeConfig(2), makeDice());
    state.currentPlayerIndex = 1;
    state.players[1].inventory = ["obj_car_1", "obj_costume_1", "obj_hat_1", "obj_shoes_1", "obj_hair_1"];
    state.players[1].pc = 8;
    state = resolveDraftValidate(state, "player_1");
    expect(state.phase).toBe(GamePhase.MOVEMENT);
    expect(state.currentPlayerIndex).toBe(0);
  });
});

// ==================== INTEGRATION: FULL TURN ====================

describe("full turn flow", () => {
  it("draft → movement → action → night → maintenance → end_turn → next turn", () => {
    let state = createInitialState(makeConfig(2), makeDice());

    // Draft player 0
    state = resolveDraftPick(state, "player_0", "obj_car_0");
    state = resolveDraftPick(state, "player_0", "obj_costume_0");
    state = resolveDraftPick(state, "player_0", "obj_hat_0");
    state = resolveDraftPick(state, "player_0", "obj_shoes_0");
    state = resolveDraftPick(state, "player_0", "obj_hair_0");
    expect(state.players[0].pc).toBe(8);
    state = resolveDraftValidate(state, "player_0");
    expect(state.currentPlayerIndex).toBe(1);

    // Draft player 1
    state = resolveDraftPick(state, "player_1", "obj_car_1");
    state = resolveDraftPick(state, "player_1", "obj_phone_0");
    state = resolveDraftPick(state, "player_1", "obj_watch_0");
    state = resolveDraftPick(state, "player_1", "obj_bag_0");
    expect(state.players[1].pc).toBe(7);
    state = resolveDraftPick(state, "player_1", "obj_hat_1");
    expect(state.players[1].pc).toBe(8);
    state = resolveDraftValidate(state, "player_1");
    expect(state.phase).toBe(GamePhase.MOVEMENT);

    // Simulate: both players on the same cell, do night
    state.players[0].position = 13;
    state.players[1].position = 13;
    state.buildings.set(13, "house");
    state.phase = GamePhase.NIGHT;
    state.nightChoices.set("player_0", NightAction.SLEEP);
    state.nightChoices.set("player_1", NightAction.SLEEP);

    state = resolveNight(state, makeDice());
    expect(state.phase).toBe(GamePhase.MAINTENANCE);

    state = resolveMaintenance(state);
    expect(state.phase).toBe(GamePhase.END_TURN);

    state = resolveEndTurn(state);
    expect(state.phase).toBe(GamePhase.MOVEMENT);
    expect(state.turn).toBe(2);
  });
});
