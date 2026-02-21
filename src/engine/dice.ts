import { DiceRoller } from "./types";

export class RandomDiceRoller implements DiceRoller {
  rollOne(): number {
    return Math.floor(Math.random() * 6) + 1;
  }

  roll(count: number): number {
    let sum = 0;
    for (let i = 0; i < count; i++) {
      sum += this.rollOne();
    }
    return sum;
  }
}

export class SeededDiceRoller implements DiceRoller {
  private sequence: number[];
  private index = 0;

  constructor(sequence: number[]) {
    if (sequence.length === 0) throw new Error("Dice sequence cannot be empty");
    if (sequence.some(v => v < 1 || v > 6)) throw new Error("Dice values must be 1-6");
    this.sequence = sequence;
  }

  rollOne(): number {
    const value = this.sequence[this.index % this.sequence.length];
    this.index++;
    return value;
  }

  roll(count: number): number {
    let sum = 0;
    for (let i = 0; i < count; i++) {
      sum += this.rollOne();
    }
    return sum;
  }

  reset(): void {
    this.index = 0;
  }
}
