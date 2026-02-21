import {
  GameState,
  GamePhase,
  PlayerState,
  PlayerStatus,
  CellType,
  CellIndex,
  PlayerId,
  NightAction,
  JobType,
  DiceRoller,
  JournalEntryType,
  CardId,
} from "./types";
import { BOARD } from "./board";
import { getCardDef } from "./cards";
import {
  updatePlayerInState,
  addJournalEntry,
  computePC,
  canAfford,
  clampPV,
  clampPC,
  clampMoney,
  identifyCamps,
  shuffle,
} from "./state";
import {
  PETIT_BOULOT_PAY,
  CLINIC_COST,
  TAX_LUXURY_AMOUNT,
  TAX_INCOME_RATE,
  TAX_INCOME_MIN,
  CAMP_PC_BONUS,
  NIGHT_CAUGHT_PC,
  CONFRONTATION_LOSER_PV,
  CONFRONTATION_BOTH_PC,
  SLEEP_OUTSIDE_PV,
  SLEEP_OUTSIDE_PC,
  NO_FOOD_PV,
  FOOD_CAMP_RATIO,
  MAX_PC,
  MAX_PV,
  JOB_STATS,
  SHELTER_CELL,
  WORKPLACE_CELL,
} from "./constants";

// ==================== CASE ACTIONS ====================

export function resolvePetitBoulot(state: GameState, playerId: PlayerId): GameState {
  const cell = BOARD[state.players.find(p => p.id === playerId)!.position];
  if (cell.type !== CellType.PETIT_BOULOT) return state;

  const othersOnCell = state.players.filter(
    p => p.id !== playerId && p.position === cell.index && p.status !== PlayerStatus.ELIMINATED,
  );
  const occupied = othersOnCell.length > 0;
  if (occupied) return state;

  let s = updatePlayerInState(state, playerId, p => ({
    ...p,
    money: p.money + PETIT_BOULOT_PAY,
  }));
  return addJournalEntry(s, {
    type: JournalEntryType.CASE_ACTION,
    playerId,
    message: "petitBoulot",
    data: { amount: PETIT_BOULOT_PAY },
  });
}

export function resolveMarketBuy(state: GameState, playerId: PlayerId, marketIndex: number, slotIndex: number): GameState {
  if (marketIndex < 0 || marketIndex >= state.marketCards.length) return state;
  if (slotIndex < 0 || slotIndex > 1) return state;

  const cardId = state.marketCards[marketIndex][slotIndex];
  if (!cardId) return state;

  const def = getCardDef(cardId);
  if (!def || !def.price) return state;

  const player = state.players.find(p => p.id === playerId)!;
  if (!canAfford(player, def.price)) return state;

  let s = updatePlayerInState(state, playerId, p => ({
    ...p,
    money: clampMoney(p.money - def.price!),
    inventory: [...p.inventory, cardId],
    pc: clampPC(computePC({ ...p, inventory: [...p.inventory, cardId] } as PlayerState)),
  }));

  const newMarketCards = s.marketCards.map((pair, i) => {
    if (i !== marketIndex) return pair;
    const newPair = [...pair] as [CardId | null, CardId | null];
    const replacement = s.objectDeck[0] ?? null;
    newPair[slotIndex] = replacement;
    return newPair;
  }) as [CardId | null, CardId | null][];

  const newObjectDeck = s.objectDeck.length > 0 ? s.objectDeck.slice(1) : [];

  s = { ...s, marketCards: newMarketCards, objectDeck: newObjectDeck };

  return addJournalEntry(s, {
    type: JournalEntryType.CASE_ACTION,
    playerId,
    message: "marketBuy",
    data: { cardId, amount: def.price },
  });
}

export function resolveShower(state: GameState, playerId: PlayerId): GameState {
  const player = state.players.find(p => p.id === playerId)!;
  if (player.pc >= MAX_PC) return state;

  let s = updatePlayerInState(state, playerId, p => ({
    ...p,
    pc: clampPC(p.pc + 1),
  }));
  return addJournalEntry(s, {
    type: JournalEntryType.CASE_ACTION,
    playerId,
    message: "shower",
  });
}

export function resolveClinic(state: GameState, playerId: PlayerId): GameState {
  const player = state.players.find(p => p.id === playerId)!;
  if (player.pv >= MAX_PV) return state;
  if (!canAfford(player, CLINIC_COST)) return state;

  let s = updatePlayerInState(state, playerId, p => ({
    ...p,
    money: clampMoney(p.money - CLINIC_COST),
    pv: clampPV(p.pv + 1),
  }));
  return addJournalEntry(s, {
    type: JournalEntryType.CASE_ACTION,
    playerId,
    message: "clinic",
    data: { amount: CLINIC_COST },
  });
}

export function resolveEventCard(state: GameState, playerId: PlayerId, dice: DiceRoller): GameState {
  let s = { ...state };
  let deck = [...s.eventDeck];
  let discard = [...s.eventDiscard];

  if (deck.length === 0) {
    deck = shuffle([...discard], dice);
    discard = [];
  }

  if (deck.length === 0) return state;

  const cardId = deck.shift()!;
  const def = getCardDef(cardId);
  if (!def || !def.effect) {
    discard.push(cardId);
    return { ...s, eventDeck: deck, eventDiscard: discard };
  }

  s = { ...s, eventDeck: deck, eventDiscard: [...discard, cardId] };

  if (def.effect.moneyDelta) {
    s = updatePlayerInState(s, playerId, p => ({
      ...p,
      money: clampMoney(p.money + def.effect!.moneyDelta!),
    }));
  }
  if (def.effect.pvDelta) {
    s = updatePlayerInState(s, playerId, p => ({
      ...p,
      pv: clampPV(p.pv + def.effect!.pvDelta!),
    }));
  }
  if (def.effect.pcDelta) {
    s = updatePlayerInState(s, playerId, p => ({
      ...p,
      pc: clampPC(p.pc + def.effect!.pcDelta!),
    }));
  }
  if (def.effect.disableBus) {
    s = updatePlayerInState(s, playerId, p => ({ ...p, busDisabled: true }));
  }
  if (def.effect.disableCar) {
    s = updatePlayerInState(s, playerId, p => ({ ...p, carDisabled: true }));
  }
  if (def.effect.loseObject) {
    s = applyLoseObject(s, playerId, def.effect.loseObject);
  }
  if (def.effect.destroyCartons) {
    s = updatePlayerInState(s, playerId, p => ({
      ...p,
      specialCards: p.specialCards.filter(c => !c.startsWith("scv_cardboard")),
    }));
  }

  return addJournalEntry(s, {
    type: JournalEntryType.EVENT_CARD,
    playerId,
    message: "eventCard",
    data: { cardId },
  });
}

function applyLoseObject(state: GameState, playerId: PlayerId, mode: string): GameState {
  const player = state.players.find(p => p.id === playerId)!;
  if (player.inventory.length === 0) return state;

  let cardToLose: string;
  if (mode === "most_expensive") {
    let best = player.inventory[0];
    let bestVal = getCardDef(best)?.pcValue ?? 0;
    for (const c of player.inventory) {
      const v = getCardDef(c)?.pcValue ?? 0;
      if (v > bestVal) { best = c; bestVal = v; }
    }
    cardToLose = best;
  } else {
    cardToLose = player.inventory[0];
  }

  return updatePlayerInState(state, playerId, p => ({
    ...p,
    inventory: p.inventory.filter(c => c !== cardToLose),
    pc: computePC({ ...p, inventory: p.inventory.filter(c => c !== cardToLose) } as PlayerState),
  }));
}

export function resolveScavengeCard(state: GameState, playerId: PlayerId, dice: DiceRoller): GameState {
  let s = { ...state };
  let deck = [...s.scavengeDeck];
  let discard = [...s.scavengeDiscard];

  if (deck.length === 0) {
    deck = shuffle([...discard], dice);
    discard = [];
  }
  if (deck.length === 0) return state;

  const cardId = deck.shift()!;
  const def = getCardDef(cardId);
  s = { ...s, scavengeDeck: deck, scavengeDiscard: discard };

  if (def?.keepable) {
    if (def.pcValue) {
      s = updatePlayerInState(s, playerId, p => ({
        ...p,
        specialCards: [...p.specialCards, cardId],
        pc: clampPC(computePC({ ...p, specialCards: [...p.specialCards, cardId] } as PlayerState)),
      }));
    } else {
      s = updatePlayerInState(s, playerId, p => ({
        ...p,
        specialCards: [...p.specialCards, cardId],
      }));
    }
  } else {
    s = { ...s, scavengeDiscard: [...s.scavengeDiscard, cardId] };
    if (def?.effect?.moneyDelta) {
      s = updatePlayerInState(s, playerId, p => ({
        ...p,
        money: clampMoney(p.money + def.effect!.moneyDelta!),
      }));
    }
    if (def?.effect?.pvDelta) {
      s = updatePlayerInState(s, playerId, p => ({
        ...p,
        pv: clampPV(p.pv + def.effect!.pvDelta!),
      }));
    }
  }

  return addJournalEntry(s, {
    type: JournalEntryType.SCAVENGE_CARD,
    playerId,
    message: "scavengeCard",
    data: { cardId },
  });
}

export function resolveWorkplace(state: GameState, playerId: PlayerId): GameState {
  const player = state.players.find(p => p.id === playerId)!;

  if (player.job) {
    let s = updatePlayerInState(state, playerId, p => ({
      ...p,
      hasWorkedSinceLastPay: true,
      lateCounter: 0,
    }));
    return addJournalEntry(s, {
      type: JournalEntryType.CASE_ACTION,
      playerId,
      message: "workedAtJob",
    });
  }

  return state;
}

export function resolveHire(state: GameState, playerId: PlayerId, jobType: JobType): GameState {
  const player = state.players.find(p => p.id === playerId)!;
  if (player.job) return state;
  if (player.position !== WORKPLACE_CELL) return state;
  if (!state.availableJobs.includes(jobType)) return state;

  const stats = JOB_STATS[jobType];
  if (player.pc < stats.hireMinPc) return state;

  let s = updatePlayerInState(state, playerId, p => ({
    ...p,
    job: jobType,
    lateCounter: 0,
    hasWorkedSinceLastPay: true,
  }));
  s = { ...s, availableJobs: s.availableJobs.filter(j => j !== jobType) };

  return addJournalEntry(s, {
    type: JournalEntryType.HIRED,
    playerId,
    message: "hired",
    data: { job: jobType },
  });
}

export function resolveShelterEntry(state: GameState, playerId: PlayerId, dice: DiceRoller): GameState {
  const roll = dice.rollOne();
  const turns = roll <= 2 ? 1 : roll <= 4 ? 2 : 3;

  let s = updatePlayerInState(state, playerId, p => ({
    ...p,
    position: SHELTER_CELL,
    _shelterTurns: turns,
  } as PlayerState & { _shelterTurns: number }));

  return addJournalEntry(s, {
    type: JournalEntryType.CASE_ACTION,
    playerId,
    message: "shelterEntry",
    data: { turns },
  });
}

export function resolveRoundup(state: GameState, playerId: PlayerId, dice: DiceRoller): GameState {
  let s = updatePlayerInState(state, playerId, p => ({
    ...p,
    position: SHELTER_CELL,
  }));
  s = addJournalEntry(s, {
    type: JournalEntryType.CASE_ACTION,
    playerId,
    message: "roundup",
  });
  return resolveShelterEntry(s, playerId, dice);
}

export function resolveTaxIncome(state: GameState, playerId: PlayerId): GameState {
  const player = state.players.find(p => p.id === playerId)!;
  const amount = Math.max(TAX_INCOME_MIN, Math.floor(player.money * TAX_INCOME_RATE));

  if (canAfford(player, amount)) {
    let s = updatePlayerInState(state, playerId, p => ({
      ...p,
      money: clampMoney(p.money - amount),
    }));
    return addJournalEntry(s, {
      type: JournalEntryType.CASE_ACTION,
      playerId,
      message: "taxPaid",
      data: { amount },
    });
  }

  let s = updatePlayerInState(state, playerId, p => ({
    ...p,
    pc: clampPC(p.pc - 1),
  }));
  return addJournalEntry(s, {
    type: JournalEntryType.CASE_ACTION,
    playerId,
    message: "taxFailed",
  });
}

export function resolveTaxLuxury(state: GameState, playerId: PlayerId): GameState {
  const player = state.players.find(p => p.id === playerId)!;

  if (canAfford(player, TAX_LUXURY_AMOUNT)) {
    let s = updatePlayerInState(state, playerId, p => ({
      ...p,
      money: clampMoney(p.money - TAX_LUXURY_AMOUNT),
    }));
    return addJournalEntry(s, {
      type: JournalEntryType.CASE_ACTION,
      playerId,
      message: "taxPaid",
      data: { amount: TAX_LUXURY_AMOUNT },
    });
  }

  let s = updatePlayerInState(state, playerId, p => ({
    ...p,
    pc: clampPC(p.pc - 1),
  }));
  return addJournalEntry(s, {
    type: JournalEntryType.CASE_ACTION,
    playerId,
    message: "taxFailed",
  });
}

// ==================== NIGHT RESOLUTION ====================

export function resolveNight(state: GameState, dice: DiceRoller): GameState {
  let s = { ...state };
  const camps = identifyCamps(s);

  for (const [cellIndex, playerIds] of camps) {
    s = resolveNightCamp(s, cellIndex, playerIds, dice);
  }

  const campsFlat = new Set<string>();
  for (const ids of camps.values()) ids.forEach(id => campsFlat.add(id));

  for (const player of s.players) {
    if (campsFlat.has(player.id)) continue;
    if (player.status === PlayerStatus.ELIMINATED) continue;
    if (player.position === SHELTER_CELL) continue;

    s = resolveNightAlone(s, player.id);
  }

  s = { ...s, nightChoices: new Map(), phase: GamePhase.MAINTENANCE };
  return s;
}

function resolveNightCamp(state: GameState, _cellIndex: CellIndex, playerIds: PlayerId[], dice: DiceRoller): GameState {
  let s = state;

  const choices = new Map<PlayerId, NightAction>();
  for (const id of playerIds) {
    choices.set(id, s.nightChoices.get(id) ?? NightAction.SLEEP);
  }

  const sleepers = playerIds.filter(id => choices.get(id) === NightAction.SLEEP);
  const watchers = playerIds.filter(id => choices.get(id) === NightAction.WATCH);
  const scavengers = playerIds.filter(id => choices.get(id) === NightAction.SCAVENGE);
  const takers = playerIds.filter(id => choices.get(id) === NightAction.TAKE);

  for (const id of scavengers) {
    s = resolveScavengeCard(s, id, dice);
    s = addJournalEntry(s, {
      type: JournalEntryType.NIGHT_CAMP,
      playerId: id,
      message: "nightScavenge",
    });
  }

  let campDissolved = false;

  if (watchers.length > 0 && takers.length > 0) {
    for (const takerId of takers) {
      s = updatePlayerInState(s, takerId, p => ({
        ...p,
        pc: clampPC(p.pc + NIGHT_CAUGHT_PC),
      }));
      s = addJournalEntry(s, {
        type: JournalEntryType.NIGHT_CAUGHT,
        playerId: takerId,
        targetId: watchers[0],
        message: "nightCaught",
      });
    }
    campDissolved = true;
  } else if (takers.length === 1 && watchers.length === 0) {
    const takerId = takers[0];
    const targets = [...sleepers, ...scavengers];
    if (targets.length > 0) {
      const targetId = targets[0];
      const targetPlayer = s.players.find(p => p.id === targetId)!;
      if (targetPlayer.inventory.length > 0) {
        const stolenCard = targetPlayer.inventory[0];
        s = updatePlayerInState(s, targetId, p => ({
          ...p,
          inventory: p.inventory.filter(c => c !== stolenCard),
          pc: computePC({ ...p, inventory: p.inventory.filter(c => c !== stolenCard) } as PlayerState),
        }));
        s = updatePlayerInState(s, takerId, p => ({
          ...p,
          inventory: [...p.inventory, stolenCard],
          pc: computePC({ ...p, inventory: [...p.inventory, stolenCard] } as PlayerState),
        }));
        s = addJournalEntry(s, {
          type: JournalEntryType.NIGHT_THEFT,
          playerId: takerId,
          targetId,
          message: "nightTheft",
          data: { cardId: stolenCard },
        });
      }
    }
  } else if (takers.length >= 2 && watchers.length === 0) {
    const [a, b] = takers;
    const playerA = s.players.find(p => p.id === a)!;
    const playerB = s.players.find(p => p.id === b)!;
    const rollA = dice.rollOne() + playerA.inventory.length;
    const rollB = dice.rollOne() + playerB.inventory.length;

    const winnerId = rollA >= rollB ? a : b;
    const loserId = winnerId === a ? b : a;

    const loserPlayer = s.players.find(p => p.id === loserId)!;
    if (loserPlayer.inventory.length > 0) {
      const stolenCard = loserPlayer.inventory[0];
      s = updatePlayerInState(s, loserId, p => ({
        ...p,
        inventory: p.inventory.filter(c => c !== stolenCard),
        pc: computePC({ ...p, inventory: p.inventory.filter(c => c !== stolenCard) } as PlayerState),
      }));
      s = updatePlayerInState(s, winnerId, p => ({
        ...p,
        inventory: [...p.inventory, stolenCard],
        pc: computePC({ ...p, inventory: [...p.inventory, stolenCard] } as PlayerState),
      }));
    }

    s = updatePlayerInState(s, loserId, p => ({
      ...p,
      pv: clampPV(p.pv + CONFRONTATION_LOSER_PV),
    }));

    for (const id of [a, b]) {
      s = updatePlayerInState(s, id, p => ({
        ...p,
        pc: clampPC(p.pc + CONFRONTATION_BOTH_PC),
      }));
    }

    s = addJournalEntry(s, {
      type: JournalEntryType.NIGHT_CONFRONTATION,
      playerId: winnerId,
      targetId: loserId,
      message: "nightConfrontation",
      data: { rollA, rollB },
    });
    campDissolved = true;
  }

  if (!campDissolved) {
    for (const id of sleepers) {
      s = updatePlayerInState(s, id, p => ({
        ...p,
        pc: clampPC(p.pc + CAMP_PC_BONUS),
      }));
    }

    if (sleepers.length >= 2) {
      s = addJournalEntry(s, {
        type: JournalEntryType.NIGHT_CAMP,
        message: "nightCampPeaceful",
        data: { playerIds: sleepers },
      });
    }
  }

  return s;
}

function resolveNightAlone(state: GameState, playerId: PlayerId): GameState {
  let s = state;
  const player = s.players.find(p => p.id === playerId)!;
  const cell = BOARD[player.position];

  if (cell.type === CellType.PROPERTY) {
    const building = s.buildings.get(player.position);
    if (building && canAfford(player, cell.nightCost ?? 0)) {
      s = updatePlayerInState(s, playerId, p => ({
        ...p,
        money: clampMoney(p.money - (cell.nightCost ?? 0)),
      }));
      s = addJournalEntry(s, {
        type: JournalEntryType.MAINTENANCE,
        playerId,
        message: "sleepsInside",
        data: { amount: cell.nightCost, cellIndex: player.position },
      });
      return s;
    }
  }

  s = updatePlayerInState(s, playerId, p => ({
    ...p,
    pv: clampPV(p.pv + SLEEP_OUTSIDE_PV),
    pc: clampPC(p.pc + SLEEP_OUTSIDE_PC),
  }));
  s = addJournalEntry(s, {
    type: JournalEntryType.MAINTENANCE,
    playerId,
    message: "sleepsOutside",
  });
  return s;
}

// ==================== MAINTENANCE ====================

export function resolveMaintenance(state: GameState): GameState {
  let s = { ...state };
  const camps = identifyCamps(s);
  const inCamp = new Set<string>();
  for (const ids of camps.values()) ids.forEach(id => inCamp.add(id));

  for (const player of s.players) {
    if (player.status === PlayerStatus.ELIMINATED) continue;
    if (player.position === SHELTER_CELL) continue;

    const isInCamp = inCamp.has(player.id);

    const foodCost = isInCamp
      ? Math.ceil(s.foodCost * FOOD_CAMP_RATIO)
      : s.foodCost;

    if (canAfford(player, foodCost)) {
      s = updatePlayerInState(s, player.id, p => ({
        ...p,
        money: clampMoney(p.money - foodCost),
      }));
      s = addJournalEntry(s, {
        type: JournalEntryType.MAINTENANCE,
        playerId: player.id,
        message: "food",
        data: { amount: foodCost },
      });
    } else {
      s = updatePlayerInState(s, player.id, p => ({
        ...p,
        pv: clampPV(p.pv + NO_FOOD_PV),
      }));
      s = addJournalEntry(s, {
        type: JournalEntryType.MAINTENANCE,
        playerId: player.id,
        message: "noFood",
      });
    }
  }

  for (const player of s.players) {
    if (player.status === PlayerStatus.ELIMINATED) continue;
    if (player.status === PlayerStatus.GHOST) {
      s = updatePlayerInState(s, player.id, p => {
        const remaining = p.ghostTurnsLeft - 1;
        return {
          ...p,
          ghostTurnsLeft: remaining,
          status: remaining <= 0 ? PlayerStatus.ELIMINATED : PlayerStatus.GHOST,
        };
      });
      continue;
    }

    if (player.pv <= 0) {
      s = updatePlayerInState(s, player.id, p => ({
        ...p,
        status: PlayerStatus.ELIMINATED,
      }));
      s = addJournalEntry(s, {
        type: JournalEntryType.ELIMINATED,
        playerId: player.id,
        message: "eliminated",
      });
      continue;
    }

    if (player.job) {
      const stats = JOB_STATS[player.job];
      if (player.pc < stats.keepMinPc) {
        s = updatePlayerInState(s, player.id, p => ({ ...p, job: null, lateCounter: 0 }));
        s = { ...s, availableJobs: [...s.availableJobs, player.job!] };
        s = addJournalEntry(s, {
          type: JournalEntryType.FIRED,
          playerId: player.id,
          message: "fired",
          data: { reason: "pc" },
        });
      } else if (player.lateCounter > stats.maxLate) {
        s = updatePlayerInState(s, player.id, p => ({ ...p, job: null, lateCounter: 0 }));
        s = { ...s, availableJobs: [...s.availableJobs, player.job!] };
        s = addJournalEntry(s, {
          type: JournalEntryType.FIRED,
          playerId: player.id,
          message: "fired",
          data: { reason: "late" },
        });
      }
    }
  }

  for (const player of s.players) {
    if (player.status !== PlayerStatus.ELIMINATED) continue;
    // already logged above
  }

  s = { ...s, phase: GamePhase.END_TURN };
  return s;
}

// ==================== END TURN ====================

export function resolveEndTurn(state: GameState): GameState {
  let s = { ...state };

  for (const player of s.players) {
    s = updatePlayerInState(s, player.id, p => ({
      ...p,
      busDisabled: false,
      carDisabled: false,
      nightAction: null,
    }));
  }

  const aliveCount = s.players.filter(p => p.status === PlayerStatus.ALIVE).length;
  if (aliveCount <= 1) {
    const winner = s.players.find(p => p.status === PlayerStatus.ALIVE);
    if (winner) {
      s = addJournalEntry(s, {
        type: JournalEntryType.GAME_OVER,
        playerId: winner.id,
        message: "gameOver",
      });
    }
    return { ...s, phase: GamePhase.GAME_OVER };
  }

  s = { ...s, turn: s.turn + 1, currentPlayerIndex: 0 };

  const firstAlive = s.players.findIndex(
    p => p.status === PlayerStatus.ALIVE || p.status === PlayerStatus.GHOST,
  );
  s = { ...s, currentPlayerIndex: firstAlive >= 0 ? firstAlive : 0 };

  s = { ...s, phase: GamePhase.MOVEMENT };
  return s;
}

// ==================== NEXT PLAYER ====================

export function advanceToNextPlayer(state: GameState): GameState {
  let s = { ...state };
  let nextIdx = s.currentPlayerIndex + 1;

  while (nextIdx < s.players.length && s.players[nextIdx].status === PlayerStatus.ELIMINATED) {
    nextIdx++;
  }

  if (nextIdx >= s.players.length) {
    return { ...s, phase: GamePhase.NIGHT };
  }

  return { ...s, currentPlayerIndex: nextIdx, phase: GamePhase.MOVEMENT };
}

// ==================== DRAFT ====================

export function resolveDraftPick(state: GameState, playerId: PlayerId, cardId: CardId): GameState {
  const player = state.players.find(p => p.id === playerId)!;
  const def = getCardDef(cardId);
  if (!def) return state;

  const currentPC = computePC(player);
  const newPC = currentPC + (def.pcValue ?? 0);
  if (newPC > 8) return state;

  return updatePlayerInState(state, playerId, p => ({
    ...p,
    inventory: [...p.inventory, cardId],
    pc: newPC,
  }));
}

export function resolveDraftValidate(state: GameState, playerId: PlayerId): GameState {
  const player = state.players.find(p => p.id === playerId)!;
  const pc = computePC(player);
  if (pc !== 8) return state;

  const hasCar = player.inventory.some(c => c.startsWith("obj_car"));
  if (!hasCar) return state;

  let s = { ...state };

  s = {
    ...s,
    objectDeck: s.objectDeck.filter(c => !player.inventory.includes(c)),
  };

  let nextIdx = s.currentPlayerIndex + 1;
  while (nextIdx < s.players.length && s.players[nextIdx].status === PlayerStatus.ELIMINATED) {
    nextIdx++;
  }

  if (nextIdx >= s.players.length) {
    return { ...s, phase: GamePhase.MOVEMENT, currentPlayerIndex: 0 };
  }

  return { ...s, currentPlayerIndex: nextIdx };
}
