import { createInterface } from "node:readline";
import {
  GameState,
  GamePhase,
  TransportMode,
  NightAction,
  CellType,
  PlayerStatus,
} from "../engine/types";
import { BOARD } from "../engine/board";
import { createInitialState, computePC, getCurrentPlayer, identifyCamps, canAfford } from "../engine/state";
import { RandomDiceRoller } from "../engine/dice";
import { getCardDef } from "../engine/cards";
import {
  applyChooseTransport,
  applyRollDice,
  applyChooseCell,
  getReachableCells,
  getDirection,
  getDiceBonus,
  validateChooseTransport,
} from "../engine/actions";
import {
  resolvePetitBoulot,
  resolveShower,
  resolveClinic,
  resolveEventCard,
  resolveScavengeCard,
  resolveWorkplace,
  resolveHire,
  resolveTaxIncome,
  resolveTaxLuxury,
  resolveRoundup,
  resolveNight,
  resolveMaintenance,
  resolveEndTurn,
  advanceToNextPlayer,
  resolveDraftPick,
  resolveDraftValidate,
  resolveMarketBuy,
} from "../engine/resolver";
import { getCellDisplayName, getCardName } from "../locale/i18n";
import { LANG_FR } from "../locale/lang/fr";
import { THEME_POITIERS } from "../locale/themes/poitiers";
import { CAR_FUEL_COST, BUS_TICKET_COST, SHELTER_CELL } from "../engine/constants";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const dice = new RandomDiceRoller();
const lang = LANG_FR;
const theme = THEME_POITIERS;

function ask(question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve));
}

function cellName(idx: number): string {
  return getCellDisplayName(idx, lang, theme);
}

function printBar() {
  console.log("─".repeat(60));
}

function printState(state: GameState) {
  printBar();
  console.log(`  TOUR ${state.turn} | Phase: ${state.phase}`);
  printBar();
  for (const p of state.players) {
    if (p.status === PlayerStatus.ELIMINATED) {
      console.log(`  ☠  ${p.name} (éliminé)`);
      continue;
    }
    const jobDisplay = p.job ? lang.jobs[p.job]?.name ?? p.job : "Sans emploi";
    const ghost = p.status === PlayerStatus.GHOST ? " 👻" : "";
    console.log(`  ${p.name}${ghost} | ${p.money}€ | PV:${p.pv} | PC:${p.pc} | ${jobDisplay} | 📍${cellName(p.position)}`);
    if (p.inventory.length > 0) {
      console.log(`    Objets: ${p.inventory.map(c => getCardName(c, lang)).join(", ")}`);
    }
    if (p.specialCards.length > 0) {
      console.log(`    Spécial: ${p.specialCards.map(c => getCardName(c, lang)).join(", ")}`);
    }
  }
  printBar();
}

function printJournalLast(state: GameState, n = 5) {
  const entries = state.journal.slice(-n);
  if (entries.length === 0) return;
  console.log("  📜 Journal :");
  for (const e of entries) {
    const player = state.players.find(p => p.id === e.playerId);
    const pName = player?.name ?? "";
    console.log(`    T${e.turn} | ${pName ? pName + ": " : ""}${e.message} ${e.data ? JSON.stringify(e.data) : ""}`);
  }
}

async function draftPhase(state: GameState): Promise<GameState> {
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    s = { ...s, currentPlayerIndex: pi };
    const player = s.players[pi];
    console.log(`\n🎴 Draft — ${player.name} (PC: ${computePC(player)}/8)`);

    // Auto-pick car
    const carId = `obj_car_${pi}`;
    s = resolveDraftPick(s, player.id, carId);
    console.log(`  Auto: Voiture (3 PC)`);

    while (computePC(s.players[pi]) < 8) {
      const remaining = 8 - computePC(s.players[pi]);
      console.log(`  PC restants: ${remaining}`);
      const options = [
        { id: `obj_costume_${pi}`, name: "Costume", pc: 2, price: 150 },
        { id: `obj_phone_${pi}`, name: "Téléphone", pc: 2, price: 250 },
        { id: `obj_hat_${pi}`, name: "Chapeau", pc: 1, price: 40 },
        { id: `obj_shoes_${pi}`, name: "Chaussures", pc: 1, price: 80 },
        { id: `obj_hair_${pi}`, name: "Coiffure", pc: 1, price: 80 },
        { id: `obj_watch_${pi}`, name: "Montre", pc: 1, price: 120 },
        { id: `obj_bag_${pi}`, name: "Sac", pc: 1, price: 80 },
      ].filter(o => o.pc <= remaining && !s.players[pi].inventory.includes(o.id));

      if (options.length === 0) break;

      for (let i = 0; i < options.length; i++) {
        console.log(`  ${i + 1}. ${options[i].name} (${options[i].pc} PC, ${options[i].price}€)`);
      }

      const choice = await ask("  Choix > ");
      const idx = parseInt(choice) - 1;
      if (idx >= 0 && idx < options.length) {
        s = resolveDraftPick(s, player.id, options[idx].id);
        console.log(`  ✓ ${options[idx].name} ajouté`);
      }
    }

    console.log(`  ${player.name}: ${computePC(s.players[pi])} PC — ${s.players[pi].inventory.map(c => getCardName(c, lang)).join(", ")}`);
    s = resolveDraftValidate(s, player.id);
  }
  return s;
}

async function movementPhase(state: GameState): Promise<GameState> {
  let s = state;
  const player = getCurrentPlayer(s);

  if (player.position === SHELTER_CELL) {
    console.log(`  ${player.name} est au Foyer. Tour passé.`);
    return advanceToNextPlayer({ ...s, phase: GamePhase.ACTION });
  }

  console.log(`\n🚶 Déplacement — ${player.name} (📍${cellName(player.position)})`);

  const transports: { mode: TransportMode; label: string; cost: string }[] = [];
  if (validateChooseTransport(s, player.id, TransportMode.FOOT).valid) {
    transports.push({ mode: TransportMode.FOOT, label: "À pied (1d6, gratuit)", cost: "" });
  }
  if (validateChooseTransport(s, player.id, TransportMode.BUS).valid) {
    transports.push({ mode: TransportMode.BUS, label: `Bus (1d6+2, ${BUS_TICKET_COST}€)`, cost: `${BUS_TICKET_COST}€` });
  }
  if (validateChooseTransport(s, player.id, TransportMode.CAR).valid) {
    transports.push({ mode: TransportMode.CAR, label: `Voiture (2d6, ${CAR_FUEL_COST}€)`, cost: `${CAR_FUEL_COST}€` });
  }

  for (let i = 0; i < transports.length; i++) {
    console.log(`  ${i + 1}. ${transports[i].label}`);
  }

  const tChoice = await ask("  Transport > ");
  const tIdx = parseInt(tChoice) - 1;
  const transport = transports[tIdx]?.mode ?? TransportMode.FOOT;

  s = applyChooseTransport(s, transport);
  s = applyRollDice(s, dice);

  const total = s.lastDiceRoll!.reduce((a, b) => a + b, 0) + getDiceBonus(transport);
  console.log(`  🎲 Dés: [${s.lastDiceRoll!.join(", ")}]${getDiceBonus(transport) ? ` +${getDiceBonus(transport)}` : ""} = ${total}`);

  const direction = getDirection(transport);
  const reachable = getReachableCells(player.position, total, direction);

  console.log("  Cases accessibles:");
  for (let i = 0; i < reachable.length; i++) {
    const building = s.buildings.has(reachable[i]) ? ` [${s.buildings.get(reachable[i])}]` : "";
    const players = s.players.filter(p => p.position === reachable[i] && p.id !== player.id && p.status !== PlayerStatus.ELIMINATED);
    const pStr = players.length > 0 ? ` 👥${players.map(p => p.name).join(",")}` : "";
    console.log(`    ${i + 1}. ${cellName(reachable[i])}${building}${pStr}`);
  }

  const cChoice = await ask("  Case > ");
  const cIdx = parseInt(cChoice) - 1;
  const target = reachable[cIdx] ?? reachable[0];

  s = applyChooseCell(s, player.id, target);
  console.log(`  → ${player.name} arrive à ${cellName(target)}`);

  return s;
}

async function actionPhase(state: GameState): Promise<GameState> {
  let s = state;
  const player = getCurrentPlayer(s);
  const cell = BOARD[player.position];

  console.log(`\n⚡ Action — ${player.name} sur ${cellName(player.position)} (${cell.type})`);

  switch (cell.type) {
    case CellType.PETIT_BOULOT:
      s = resolvePetitBoulot(s, player.id);
      break;
    case CellType.SHOWER:
      s = resolveShower(s, player.id);
      break;
    case CellType.CLINIC:
      if (player.pv < 5 && canAfford(player, 50)) {
        const choice = await ask("  Se soigner ? (o/n) > ");
        if (choice.toLowerCase() === "o") s = resolveClinic(s, player.id);
      }
      break;
    case CellType.EVENT:
      s = resolveEventCard(s, player.id, dice);
      break;
    case CellType.SCAVENGE:
      s = resolveScavengeCard(s, player.id, dice);
      break;
    case CellType.WORKPLACE:
      s = resolveWorkplace(s, player.id);
      if (!s.players.find(p => p.id === player.id)!.job && s.availableJobs.length > 0) {
        const p = s.players.find(p2 => p2.id === player.id)!;
        console.log("  Offres d'emploi:");
        for (let i = 0; i < s.availableJobs.length; i++) {
          const j = s.availableJobs[i];
          const stats = { cadre: { pc: 8, salary: 500 }, employe: { pc: 5, salary: 350 }, precaire: { pc: 2, salary: 200 } }[j];
          const eligible = p.pc >= (stats?.pc ?? 99);
          console.log(`    ${i + 1}. ${lang.jobs[j]?.name} (${stats?.salary}€, PC min: ${stats?.pc}) ${eligible ? "✓" : "✗"}`);
        }
        const choice = await ask("  Postuler (numéro ou n) > ");
        const jIdx = parseInt(choice) - 1;
        if (jIdx >= 0 && jIdx < s.availableJobs.length) {
          s = resolveHire(s, player.id, s.availableJobs[jIdx]);
        }
      }
      break;
    case CellType.ROUNDUP:
      s = resolveRoundup(s, player.id, dice);
      break;
    case CellType.TAX_INCOME:
      s = resolveTaxIncome(s, player.id);
      break;
    case CellType.TAX_LUXURY:
      s = resolveTaxLuxury(s, player.id);
      break;
    case CellType.MARKET: {
      const markets = BOARD.filter(c2 => c2.type === CellType.MARKET).sort((a, b) => a.index - b.index);
      const mIdx = markets.findIndex(c2 => c2.index === cell.index);
      if (mIdx >= 0 && s.marketCards[mIdx]) {
        const slots = s.marketCards[mIdx];
        for (let si = 0; si < slots.length; si++) {
          if (slots[si]) {
            const def = getCardDef(slots[si]!);
            console.log(`    ${si + 1}. ${getCardName(slots[si]!, lang)} (${def?.pcValue} PC, ${def?.price}€)`);
          }
        }
        const choice = await ask("  Acheter (numéro ou n) > ");
        const sIdx = parseInt(choice) - 1;
        if (sIdx >= 0 && sIdx < 2) {
          s = resolveMarketBuy(s, player.id, mIdx, sIdx);
        }
      }
      break;
    }
    default:
      break;
  }

  return advanceToNextPlayer(s);
}

async function nightPhase(state: GameState): Promise<GameState> {
  let s = { ...state };
  const camps = identifyCamps(s);
  const inCamp = new Set<string>();
  for (const ids of camps.values()) ids.forEach(id => inCamp.add(id));

  console.log("\n🌙 Phase de nuit");

  for (const [cellIdx, playerIds] of camps) {
    console.log(`  Camp sur ${cellName(cellIdx)}: ${playerIds.map(id => s.players.find(p => p.id === id)!.name).join(", ")}`);
  }

  for (const player of s.players) {
    if (player.status === PlayerStatus.ELIMINATED) continue;
    if (player.position === SHELTER_CELL) continue;

    if (inCamp.has(player.id)) {
      printBar();
      console.log(`  🌙 ${player.name} — en Camp`);
      console.log("    1. Dormir   2. Veiller   3. Fouiller   4. Se servir");
      const choice = await ask(`  ${player.name} > `);
      const actions = [NightAction.SLEEP, NightAction.WATCH, NightAction.SCAVENGE, NightAction.TAKE];
      const action = actions[parseInt(choice) - 1] ?? NightAction.SLEEP;
      s.nightChoices.set(player.id, action);
    } else {
      s.nightChoices.set(player.id, NightAction.SLEEP);
    }
  }

  s = resolveNight(s, dice);
  printJournalLast(s, 6);
  return s;
}

async function mainLoop() {
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║          C L O D O P O L Y          ║");
  console.log("║   Les Billets Restent dans la Boîte  ║");
  console.log("╚══════════════════════════════════════╝\n");

  const countStr = await ask("Nombre de joueurs (2-5) > ");
  const count = Math.max(2, Math.min(5, parseInt(countStr) || 3));

  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    const name = await ask(`Nom du joueur ${i + 1} > `);
    names.push(name || `Joueur${i + 1}`);
  }

  const colors = ["#e94560", "#4e9ff5", "#4ecca3", "#f5a623", "#c06ef0"];
  let state = createInitialState(
    { lang: "fr", theme: "poitiers", playerNames: names, playerColors: colors.slice(0, count) },
    dice,
  );

  state = await draftPhase(state);
  printState(state);

  while (state.phase !== GamePhase.GAME_OVER) {
    const currentPlayer = getCurrentPlayer(state);
    console.log(`\n══ Tour ${state.turn} — ${currentPlayer.name} ══`);

    if (state.phase === GamePhase.MOVEMENT) {
      state = await movementPhase(state);
    }

    if (state.phase === GamePhase.ACTION) {
      state = await actionPhase(state);
    }

    if (state.phase === GamePhase.NIGHT) {
      state = await nightPhase(state);
    }

    if (state.phase === GamePhase.MAINTENANCE) {
      state = resolveMaintenance(state);
      console.log("\n🔧 Maintenance terminée");
      printJournalLast(state, 4);
    }

    if (state.phase === GamePhase.END_TURN) {
      state = resolveEndTurn(state);
    }

    printState(state);
  }

  console.log("\n🏆 FIN DE PARTIE !");
  const winner = state.players.find(p => p.status === PlayerStatus.ALIVE);
  if (winner) {
    console.log(`  ${winner.name} a survécu !`);
  }
  for (const p of state.players) {
    if (p.status === PlayerStatus.ELIMINATED) {
      console.log(`  ☠  ${p.name} — éliminé`);
    }
  }

  rl.close();
}

mainLoop().catch(console.error);
