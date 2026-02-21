import { describe, it, expect } from "vitest";
import { RandomDiceRoller, SeededDiceRoller } from "../../src/engine/dice";

describe("RandomDiceRoller", () => {
  it("rollOne returns values between 1 and 6", () => {
    const roller = new RandomDiceRoller();
    for (let i = 0; i < 100; i++) {
      const val = roller.rollOne();
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
    }
  });

  it("roll sums multiple dice", () => {
    const roller = new RandomDiceRoller();
    for (let i = 0; i < 50; i++) {
      const val = roller.roll(2);
      expect(val).toBeGreaterThanOrEqual(2);
      expect(val).toBeLessThanOrEqual(12);
    }
  });

  it("roll(1) behaves like rollOne", () => {
    const roller = new RandomDiceRoller();
    const val = roller.roll(1);
    expect(val).toBeGreaterThanOrEqual(1);
    expect(val).toBeLessThanOrEqual(6);
  });
});

describe("SeededDiceRoller", () => {
  it("returns values in sequence", () => {
    const roller = new SeededDiceRoller([3, 5, 1]);
    expect(roller.rollOne()).toBe(3);
    expect(roller.rollOne()).toBe(5);
    expect(roller.rollOne()).toBe(1);
  });

  it("loops back to the start of the sequence", () => {
    const roller = new SeededDiceRoller([2, 4]);
    expect(roller.rollOne()).toBe(2);
    expect(roller.rollOne()).toBe(4);
    expect(roller.rollOne()).toBe(2);
    expect(roller.rollOne()).toBe(4);
  });

  it("roll sums consecutive values", () => {
    const roller = new SeededDiceRoller([1, 2, 3, 4]);
    expect(roller.roll(2)).toBe(3); // 1+2
    expect(roller.roll(2)).toBe(7); // 3+4
  });

  it("reset restarts the sequence", () => {
    const roller = new SeededDiceRoller([6, 1]);
    expect(roller.rollOne()).toBe(6);
    expect(roller.rollOne()).toBe(1);
    roller.reset();
    expect(roller.rollOne()).toBe(6);
  });

  it("throws on empty sequence", () => {
    expect(() => new SeededDiceRoller([])).toThrow();
  });

  it("throws on invalid values", () => {
    expect(() => new SeededDiceRoller([0, 3])).toThrow();
    expect(() => new SeededDiceRoller([1, 7])).toThrow();
  });
});
