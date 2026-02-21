import { describe, it, expect } from "vitest";
import { SeededDiceRoller } from "../../src/engine/dice";
import { createInitialState } from "../../src/engine/state";
import {
  validateChooseTransport,
  validateChooseCell,
  applyChooseTransport,
  applyRollDice,
  applyChooseCell,
  getReachableCells,
  getDiceCount,
  getDiceBonus,
  getDirection,
  passesCell,
} from "../../src/engine/actions";
import {
  GamePhase,
  GameConfig,
  TransportMode,
  PlayerStatus,
  JournalEntryType,
} from "../../src/engine/types";
import {
  PAYDAY_CELL,
  BOARD_SIZE,
  CAR_FUEL_COST,
  BUS_TICKET_COST,
} from "../../src/engine/constants";

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

function gameInMovement(playerCount = 3): ReturnType<typeof createInitialState> {
  const state = createInitialState(makeConfig(playerCount), makeDice());
  return { ...state, phase: GamePhase.MOVEMENT };
}

describe("getDiceCount", () => {
  it("car = 2 dice", () => expect(getDiceCount(TransportMode.CAR)).toBe(2));
  it("bus = 1 die", () => expect(getDiceCount(TransportMode.BUS)).toBe(1));
  it("foot = 1 die", () => expect(getDiceCount(TransportMode.FOOT)).toBe(1));
});

describe("getDiceBonus", () => {
  it("bus has +2 bonus", () => expect(getDiceBonus(TransportMode.BUS)).toBe(2));
  it("car has no bonus", () => expect(getDiceBonus(TransportMode.CAR)).toBe(0));
  it("foot has no bonus", () => expect(getDiceBonus(TransportMode.FOOT)).toBe(0));
});

describe("getDirection", () => {
  it("foot is bidirectional", () => expect(getDirection(TransportMode.FOOT)).toBe("both"));
  it("car is forward", () => expect(getDirection(TransportMode.CAR)).toBe("forward"));
  it("bus is forward", () => expect(getDirection(TransportMode.BUS)).toBe("forward"));
});

describe("getReachableCells", () => {
  it("forward from position 0 with roll 5", () => {
    const cells = getReachableCells(0, 5, "forward");
    expect(cells).toEqual([1, 2, 3, 4, 5]);
  });

  it("wraps around the board", () => {
    const cells = getReachableCells(38, 4, "forward");
    expect(cells).toEqual([39, 0, 1, 2]);
  });

  it("bidirectional from position 5 with roll 3", () => {
    const cells = getReachableCells(5, 3, "both");
    expect(cells).toContain(6);
    expect(cells).toContain(7);
    expect(cells).toContain(8);
    expect(cells).toContain(4);
    expect(cells).toContain(3);
    expect(cells).toContain(2);
    expect(cells).toHaveLength(6);
  });

  it("bidirectional wraps backwards", () => {
    const cells = getReachableCells(1, 3, "both");
    expect(cells).toContain(2);
    expect(cells).toContain(3);
    expect(cells).toContain(4);
    expect(cells).toContain(0);
    expect(cells).toContain(39);
    expect(cells).toContain(38);
  });

  it("roll of 1 gives exactly 1 forward cell (or 2 bidirectional)", () => {
    const fwd = getReachableCells(10, 1, "forward");
    expect(fwd).toEqual([11]);
    const both = getReachableCells(10, 1, "both");
    expect(both).toContain(11);
    expect(both).toContain(9);
    expect(both).toHaveLength(2);
  });
});

describe("passesCell", () => {
  it("detects passing through a cell forward", () => {
    expect(passesCell(0, 5, 3, "forward")).toBe(true);
  });

  it("destination counts as passing", () => {
    expect(passesCell(0, 5, 5, "forward")).toBe(true);
  });

  it("origin does not count", () => {
    expect(passesCell(5, 10, 5, "forward")).toBe(false);
  });

  it("does not trigger for cells behind", () => {
    expect(passesCell(5, 10, 3, "forward")).toBe(false);
  });

  it("wraps around: from 38 to 2, passing 0", () => {
    expect(passesCell(38, 2, 0, "forward")).toBe(true);
    expect(passesCell(38, 2, 39, "forward")).toBe(true);
    expect(passesCell(38, 2, 1, "forward")).toBe(true);
  });

  it("wraps around: from 38 to 2, not passing 5", () => {
    expect(passesCell(38, 2, 5, "forward")).toBe(false);
  });
});

describe("validateChooseTransport", () => {
  it("accepts foot for any player", () => {
    const state = gameInMovement();
    const result = validateChooseTransport(state, "player_0", TransportMode.FOOT);
    expect(result.valid).toBe(true);
  });

  it("rejects car without car in inventory", () => {
    const state = gameInMovement();
    const result = validateChooseTransport(state, "player_0", TransportMode.CAR);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("No car");
  });

  it("accepts car with car in inventory", () => {
    const state = gameInMovement();
    state.players[0].inventory = ["obj_car_0"];
    const result = validateChooseTransport(state, "player_0", TransportMode.CAR);
    expect(result.valid).toBe(true);
  });

  it("rejects car if disabled", () => {
    const state = gameInMovement();
    state.players[0].inventory = ["obj_car_0"];
    state.players[0].carDisabled = true;
    const result = validateChooseTransport(state, "player_0", TransportMode.CAR);
    expect(result.valid).toBe(false);
  });

  it("rejects car if cannot afford fuel", () => {
    const state = gameInMovement();
    state.players[0].inventory = ["obj_car_0"];
    state.players[0].money = CAR_FUEL_COST - 1;
    const result = validateChooseTransport(state, "player_0", TransportMode.CAR);
    expect(result.valid).toBe(false);
  });

  it("rejects bus if disabled", () => {
    const state = gameInMovement();
    state.players[0].busDisabled = true;
    const result = validateChooseTransport(state, "player_0", TransportMode.BUS);
    expect(result.valid).toBe(false);
  });

  it("rejects bus if cannot afford ticket", () => {
    const state = gameInMovement();
    state.players[0].money = BUS_TICKET_COST - 1;
    const result = validateChooseTransport(state, "player_0", TransportMode.BUS);
    expect(result.valid).toBe(false);
  });

  it("rejects wrong player", () => {
    const state = gameInMovement();
    const result = validateChooseTransport(state, "player_1", TransportMode.FOOT);
    expect(result.valid).toBe(false);
  });

  it("rejects outside movement phase", () => {
    const state = gameInMovement();
    state.phase = GamePhase.ACTION;
    const result = validateChooseTransport(state, "player_0", TransportMode.FOOT);
    expect(result.valid).toBe(false);
  });

  it("rejects eliminated player", () => {
    const state = gameInMovement();
    state.players[0].status = PlayerStatus.ELIMINATED;
    const result = validateChooseTransport(state, "player_0", TransportMode.FOOT);
    expect(result.valid).toBe(false);
  });
});

describe("movement flow: transport → dice → cell", () => {
  it("foot: roll → choose cell → arrives in ACTION phase", () => {
    let state = gameInMovement();
    state.players[0].position = 5;
    const dice = new SeededDiceRoller([4]);

    state = applyChooseTransport(state, TransportMode.FOOT);
    state = applyRollDice(state, dice);

    expect(state.lastDiceRoll).toEqual([4]);

    const validation = validateChooseCell(state, "player_0", 9);
    expect(validation.valid).toBe(true);

    state = applyChooseCell(state, "player_0", 9);
    expect(state.players[0].position).toBe(9);
    expect(state.phase).toBe(GamePhase.ACTION);
  });

  it("foot: can go backwards", () => {
    let state = gameInMovement();
    state.players[0].position = 5;
    const dice = new SeededDiceRoller([3]);

    state = applyChooseTransport(state, TransportMode.FOOT);
    state = applyRollDice(state, dice);

    const validation = validateChooseCell(state, "player_0", 2);
    expect(validation.valid).toBe(true);

    state = applyChooseCell(state, "player_0", 2);
    expect(state.players[0].position).toBe(2);
  });

  it("car: deducts fuel cost", () => {
    let state = gameInMovement();
    state.players[0].position = 5;
    state.players[0].inventory = ["obj_car_0"];
    const startMoney = state.players[0].money;
    const dice = new SeededDiceRoller([3, 4]);

    state = applyChooseTransport(state, TransportMode.CAR);
    state = applyRollDice(state, dice);
    state = applyChooseCell(state, "player_0", 10);

    expect(state.players[0].money).toBe(startMoney - CAR_FUEL_COST);
  });

  it("bus: deducts ticket cost, adds +2 bonus", () => {
    let state = gameInMovement();
    state.players[0].position = 5;
    const startMoney = state.players[0].money;
    const dice = new SeededDiceRoller([4]);

    state = applyChooseTransport(state, TransportMode.BUS);
    state = applyRollDice(state, dice);

    // roll=4 + bonus=2 = 6, so cells 6-11 are reachable
    const v = validateChooseCell(state, "player_0", 11);
    expect(v.valid).toBe(true);

    state = applyChooseCell(state, "player_0", 11);
    expect(state.players[0].money).toBe(startMoney - BUS_TICKET_COST);
  });

  it("car: cannot go backwards", () => {
    let state = gameInMovement();
    state.players[0].position = 5;
    state.players[0].inventory = ["obj_car_0"];
    const dice = new SeededDiceRoller([2, 3]);

    state = applyChooseTransport(state, TransportMode.CAR);
    state = applyRollDice(state, dice);

    const v = validateChooseCell(state, "player_0", 3);
    expect(v.valid).toBe(false);
  });

  it("rejects cell outside reachable range", () => {
    let state = gameInMovement();
    state.players[0].position = 5;
    const dice = new SeededDiceRoller([2]);

    state = applyChooseTransport(state, TransportMode.FOOT);
    state = applyRollDice(state, dice);

    const v = validateChooseCell(state, "player_0", 10);
    expect(v.valid).toBe(false);
  });

  it("logs movement in journal", () => {
    let state = gameInMovement();
    state.players[0].position = 5;
    const dice = new SeededDiceRoller([3]);

    state = applyChooseTransport(state, TransportMode.FOOT);
    state = applyRollDice(state, dice);
    state = applyChooseCell(state, "player_0", 8);

    const moveEntry = state.journal.find(e => e.type === JournalEntryType.MOVEMENT);
    expect(moveEntry).toBeDefined();
    expect(moveEntry?.playerId).toBe("player_0");
  });
});

describe("salary on passing Paie", () => {
  it("pays salary when passing Paie forward with hasWorkedSinceLastPay", () => {
    let state = gameInMovement();
    state.players[0].position = 38;
    state.players[0].hasWorkedSinceLastPay = true;
    state.players[0].pc = 5;
    const startMoney = state.players[0].money;
    const dice = new SeededDiceRoller([4]);

    state = applyChooseTransport(state, TransportMode.FOOT);
    state = applyRollDice(state, dice);
    // position 38, roll 4, forward: reachable 39,0,1,2
    state = applyChooseCell(state, "player_0", 2);

    expect(state.players[0].money).toBe(startMoney + 350); // Employe salary
    expect(state.players[0].hasWorkedSinceLastPay).toBe(false);

    const salaryEntry = state.journal.find(e => e.type === JournalEntryType.SALARY);
    expect(salaryEntry).toBeDefined();
  });

  it("does NOT pay salary if hasWorkedSinceLastPay is false", () => {
    let state = gameInMovement();
    state.players[0].position = 38;
    state.players[0].hasWorkedSinceLastPay = false;
    const startMoney = state.players[0].money;
    const dice = new SeededDiceRoller([4]);

    state = applyChooseTransport(state, TransportMode.FOOT);
    state = applyRollDice(state, dice);
    state = applyChooseCell(state, "player_0", 2);

    expect(state.players[0].money).toBe(startMoney);
  });

  it("does NOT pay salary if unemployed", () => {
    let state = gameInMovement();
    state.players[0].position = 38;
    state.players[0].hasWorkedSinceLastPay = true;
    state.players[0].job = null;
    const startMoney = state.players[0].money;
    const dice = new SeededDiceRoller([4]);

    state = applyChooseTransport(state, TransportMode.FOOT);
    state = applyRollDice(state, dice);
    state = applyChooseCell(state, "player_0", 2);

    expect(state.players[0].money).toBe(startMoney);
  });

  it("does NOT pay salary when going backwards past Paie", () => {
    let state = gameInMovement();
    state.players[0].position = 2;
    state.players[0].hasWorkedSinceLastPay = true;
    const startMoney = state.players[0].money;
    const dice = new SeededDiceRoller([4]);

    state = applyChooseTransport(state, TransportMode.FOOT);
    state = applyRollDice(state, dice);
    // going backward: reachable includes 1, 0, 39, 38
    state = applyChooseCell(state, "player_0", 39);

    // Foot is bidirectional, but salary only paid on forward pass
    // The direction check in applyChooseCell only triggers for "forward" transport
    expect(state.players[0].money).toBe(startMoney);
  });

  it("pays salary when landing exactly on Paie", () => {
    let state = gameInMovement();
    state.players[0].position = 38;
    state.players[0].hasWorkedSinceLastPay = true;
    state.players[0].pc = 5;
    const startMoney = state.players[0].money;
    const dice = new SeededDiceRoller([2]);

    state = applyChooseTransport(state, TransportMode.FOOT);
    state = applyRollDice(state, dice);
    state = applyChooseCell(state, "player_0", 0);

    expect(state.players[0].money).toBe(startMoney + 350);
  });
});
