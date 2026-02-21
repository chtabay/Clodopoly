import { describe, it, expect } from "vitest";
import {
  JOB_STATS,
  NIGHT_COST_BY_COLOR,
  HOTEL_COST_BY_COLOR,
  STARTING_MONEY,
  STARTING_PV,
  STARTING_PC_TARGET,
  MAX_PV,
  MAX_PC,
  FOOD_COST_BASE,
  BOARD_SIZE,
} from "../../src/engine/constants";
import { JobType, PropertyColor } from "../../src/engine/types";

describe("Constants", () => {
  it("starting values are consistent", () => {
    expect(STARTING_PV).toBe(MAX_PV);
    expect(STARTING_MONEY).toBe(800);
    expect(STARTING_PC_TARGET).toBe(8);
    expect(STARTING_PC_TARGET).toBeLessThanOrEqual(MAX_PC);
    expect(FOOD_COST_BASE).toBe(20);
    expect(BOARD_SIZE).toBe(40);
  });

  it("all job types have stats", () => {
    for (const job of Object.values(JobType)) {
      const stats = JOB_STATS[job];
      expect(stats).toBeDefined();
      expect(stats.salary).toBeGreaterThan(0);
      expect(stats.hireMinPc).toBeGreaterThan(0);
      expect(stats.keepMinPc).toBeGreaterThan(0);
      expect(stats.keepMinPc).toBeLessThanOrEqual(stats.hireMinPc);
      expect(stats.bonusSalary).toBeGreaterThan(stats.salary);
    }
  });

  it("job hierarchy is correct (cadre > employe > precaire)", () => {
    expect(JOB_STATS[JobType.CADRE].salary).toBeGreaterThan(
      JOB_STATS[JobType.EMPLOYE].salary,
    );
    expect(JOB_STATS[JobType.EMPLOYE].salary).toBeGreaterThan(
      JOB_STATS[JobType.PRECAIRE].salary,
    );
    expect(JOB_STATS[JobType.CADRE].hireMinPc).toBeGreaterThan(
      JOB_STATS[JobType.EMPLOYE].hireMinPc,
    );
  });

  it("all property colors have night costs", () => {
    for (const color of Object.values(PropertyColor)) {
      expect(NIGHT_COST_BY_COLOR[color]).toBeGreaterThan(0);
      expect(HOTEL_COST_BY_COLOR[color]).toBeGreaterThan(
        NIGHT_COST_BY_COLOR[color],
      );
    }
  });

  it("night costs increase with color tier", () => {
    expect(NIGHT_COST_BY_COLOR[PropertyColor.BROWN]).toBeLessThanOrEqual(
      NIGHT_COST_BY_COLOR[PropertyColor.PINK],
    );
    expect(NIGHT_COST_BY_COLOR[PropertyColor.PINK]).toBeLessThanOrEqual(
      NIGHT_COST_BY_COLOR[PropertyColor.RED],
    );
    expect(NIGHT_COST_BY_COLOR[PropertyColor.RED]).toBeLessThanOrEqual(
      NIGHT_COST_BY_COLOR[PropertyColor.GREEN],
    );
  });
});
