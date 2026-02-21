import { describe, it, expect } from "vitest";
import {
  GamePhase,
  TransportMode,
  NightAction,
  JobType,
  CellType,
  PropertyColor,
  PlayerStatus,
} from "../../src/engine/types";

describe("Types and enums", () => {
  it("GamePhase has all expected values", () => {
    expect(Object.values(GamePhase)).toHaveLength(9);
    expect(GamePhase.SETUP).toBe("setup");
    expect(GamePhase.GAME_OVER).toBe("game_over");
  });

  it("NightAction has 4 actions", () => {
    expect(Object.values(NightAction)).toHaveLength(4);
    expect(NightAction.SLEEP).toBe("sleep");
    expect(NightAction.WATCH).toBe("watch");
    expect(NightAction.SCAVENGE).toBe("scavenge");
    expect(NightAction.TAKE).toBe("take");
  });

  it("JobType has 3 jobs", () => {
    expect(Object.values(JobType)).toHaveLength(3);
  });

  it("CellType has 13 types", () => {
    expect(Object.values(CellType)).toHaveLength(13);
  });

  it("PropertyColor has 8 colors", () => {
    expect(Object.values(PropertyColor)).toHaveLength(8);
  });

  it("TransportMode has 3 modes", () => {
    expect(Object.values(TransportMode)).toHaveLength(3);
  });

  it("PlayerStatus has 3 statuses", () => {
    expect(Object.values(PlayerStatus)).toHaveLength(3);
  });
});
