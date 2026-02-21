import {
  GameState, GamePhase, TransportMode, NightAction,
  CellType, PlayerStatus, JobType,
} from "./engine/types";
import { BOARD } from "./engine/board";
import { createInitialState, computePC, getCurrentPlayer, identifyCamps, canAfford } from "./engine/state";
import { RandomDiceRoller } from "./engine/dice";
import { getCardDef } from "./engine/cards";
import {
  applyChooseTransport, applyRollDice, applyChooseCell,
  getReachableCells, getDirection, getDiceBonus, validateChooseTransport,
} from "./engine/actions";
import {
  resolvePetitBoulot, resolveShower, resolveClinic,
  resolveEventCard, resolveScavengeCard, resolveWorkplace,
  resolveHire, resolveTaxIncome, resolveTaxLuxury, resolveRoundup,
  resolveNight, resolveMaintenance, resolveEndTurn, advanceToNextPlayer,
  resolveDraftPick, resolveDraftValidate, resolveMarketBuy,
} from "./engine/resolver";
import { getCellDisplayName, getCardName } from "./locale/i18n";
import { LANG_FR } from "./locale/lang/fr";
import { THEME_POITIERS } from "./locale/themes/poitiers";
import { CAR_FUEL_COST, BUS_TICKET_COST, SHELTER_CELL } from "./engine/constants";

const dice = new RandomDiceRoller();
const lang = LANG_FR;
const theme = THEME_POITIERS;
const COLORS = ["#e94560","#4e9ff5","#4ecca3","#f5a623","#c06ef0"];

let state: GameState;
let draftPlayerIdx = 0;
let reachableCells: number[] = [];
let selectedTransport: TransportMode | null = null;

const $ = (s: string) => document.querySelector(s) as HTMLElement;
const $$ = (s: string) => document.querySelectorAll(s);

function cn(idx: number) { return getCellDisplayName(idx, lang, theme); }
function cardName(id: string) { return getCardName(id, lang); }

function render() {
  const app = $("#app");
  if (!app) return;

  if (!state) { renderSetup(app); return; }

  switch (state.phase) {
    case GamePhase.DRAFT: renderDraft(app); break;
    case GamePhase.MOVEMENT: renderGame(app, "movement"); break;
    case GamePhase.ACTION: renderGame(app, "action"); break;
    case GamePhase.NIGHT: renderGame(app, "night"); break;
    case GamePhase.NIGHT_RESOLUTION: renderGame(app, "night"); break;
    case GamePhase.MAINTENANCE: renderGame(app, "maintenance"); break;
    case GamePhase.END_TURN: renderGame(app, "endturn"); break;
    case GamePhase.GAME_OVER: renderGameOver(app); break;
    default: renderGame(app, "movement");
  }
}

// === SETUP ===
function renderSetup(app: HTMLElement) {
  app.innerHTML = `
<div class="screen setup">
  <h1 class="title">CLODOPOLY</h1>
  <p class="subtitle">Les Billets Restent dans la Boîte</p>
  <div class="box">
    <label>Nombre de joueurs</label>
    <div class="btn-row" id="pcount">
      ${[2,3,4,5].map(n => `<button class="btn ${n===3?"active":""}" data-n="${n}">${n}</button>`).join("")}
    </div>
    <div id="pnames"></div>
    <button class="btn primary full" id="start-btn">Commencer</button>
  </div>
</div>`;
  let count = 3;
  const updateNames = () => {
    const div = $("#pnames")!;
    div.innerHTML = Array.from({length: count}, (_, i) =>
      `<input class="input" placeholder="Joueur ${i+1}" value="${["Alice","Bob","Charlie","Diana","Eve"][i]}" data-i="${i}">`
    ).join("");
  };
  updateNames();
  $$('#pcount button').forEach(b => b.addEventListener('click', () => {
    count = parseInt((b as HTMLElement).dataset.n!);
    $$('#pcount button').forEach(x => (x as HTMLElement).classList.remove('active'));
    (b as HTMLElement).classList.add('active');
    updateNames();
  }));
  $('#start-btn')!.addEventListener('click', () => {
    const names = Array.from($$('#pnames input')).map((el) => (el as HTMLInputElement).value || `Joueur${parseInt((el as HTMLElement).dataset.i!)+1}`);
    state = createInitialState({ lang: "fr", theme: "poitiers", playerNames: names, playerColors: COLORS.slice(0, count) }, dice);
    draftPlayerIdx = 0;
    render();
  });
}

// === DRAFT ===
function renderDraft(app: HTMLElement) {
  const player = state.players[draftPlayerIdx];
  const pc = computePC(player);
  const remaining = 8 - pc;
  const hasCar = player.inventory.some(c => c.startsWith("obj_car"));
  const cards = [
    { id: "obj_car", name: "Voiture", pc: 3, icon: "🚗" },
    { id: "obj_costume", name: "Costume", pc: 2, icon: "👔" },
    { id: "obj_phone", name: "Téléphone", pc: 2, icon: "📱" },
    { id: "obj_hat", name: "Chapeau", pc: 1, icon: "🎩" },
    { id: "obj_shoes", name: "Chaussures", pc: 1, icon: "👞" },
    { id: "obj_hair", name: "Coiffure", pc: 1, icon: "💇" },
    { id: "obj_watch", name: "Montre", pc: 1, icon: "⌚" },
    { id: "obj_bag", name: "Sac", pc: 1, icon: "💼" },
  ];

  app.innerHTML = `
<div class="screen draft">
  <h2>Draft — <span style="color:${player.color}">${player.name}</span></h2>
  <div class="pc-bar">PC: <strong>${pc}</strong> / 8 ${pc===8?'✓':''}</div>
  <div class="card-grid" id="draft-cards">
    ${cards.map(c => {
      const instId = `${c.id}_${draftPlayerIdx}`;
      const owned = player.inventory.includes(instId);
      const disabled = !owned && c.pc > remaining;
      return `<button class="draft-card ${owned?'selected':''} ${disabled?'disabled':''}" data-id="${instId}" ${disabled?'disabled':''}>
        <span class="ic">${c.icon}</span><span class="nm">${c.name}</span><span class="pv">${c.pc} PC</span>
      </button>`;
    }).join("")}
  </div>
  <div class="inv">Sélection: ${player.inventory.map(c => cardName(c)).join(", ") || "—"}</div>
  <button class="btn primary full" id="draft-ok" ${pc!==8||!hasCar?'disabled':''}>Valider (${pc}/8)</button>
</div>`;

  $$('.draft-card:not(.disabled)').forEach(b => b.addEventListener('click', () => {
    const id = (b as HTMLElement).dataset.id!;
    const p = state.players[draftPlayerIdx];
    if (p.inventory.includes(id)) {
      state = { ...state, players: state.players.map((pl, i) => i !== draftPlayerIdx ? pl : {
        ...pl, inventory: pl.inventory.filter(c => c !== id), pc: computePC({ ...pl, inventory: pl.inventory.filter(c => c !== id) } as any)
      })};
    } else {
      state = resolveDraftPick(state, p.id, id);
    }
    render();
  }));

  $('#draft-ok')?.addEventListener('click', () => {
    state = resolveDraftValidate(state, state.players[draftPlayerIdx].id);
    draftPlayerIdx++;
    if (draftPlayerIdx >= state.players.length) {
      state = { ...state, phase: GamePhase.MOVEMENT, currentPlayerIndex: 0 };
      draftPlayerIdx = 0;
    }
    reachableCells = [];
    selectedTransport = null;
    render();
  });
}

// === GAME ===
function renderGame(app: HTMLElement, mode: string) {
  const cur = getCurrentPlayer(state);

  app.innerHTML = `
<div class="screen game">
  <div class="topbar">
    <span>Tour ${state.turn}</span>
    <span class="phase-label">${phaseLabel(mode, cur.name)}</span>
  </div>
  <div class="game-body">
    <div class="board-wrap" id="board-wrap">${renderBoard()}</div>
    <div class="panel">
      ${renderPlayerPanel(cur)}
      ${renderAllPlayers()}
      ${renderActions(mode, cur)}
      ${renderJournal()}
    </div>
  </div>
</div>`;

  bindActions(mode, cur);
}

function phaseLabel(mode: string, name: string) {
  if (mode === "movement") return `🚶 ${name} — Déplacement`;
  if (mode === "action") return `⚡ ${name} — Action`;
  if (mode === "night") return `🌙 Phase de nuit`;
  if (mode === "maintenance") return `🔧 Maintenance`;
  if (mode === "endturn") return `⏭ Fin de tour`;
  return name;
}

function renderBoard() {
  const cells = BOARD.map((cell, idx) => {
    const isReach = reachableCells.includes(idx);
    const pawns = state.players.filter(p => p.position === idx && p.status !== PlayerStatus.ELIMINATED);
    const building = state.buildings.get(idx);
    const colorBar = cell.color ? `<div class="cbar" style="background:${colorHex(cell.color)}"></div>` : '';
    const bld = building ? (building === "hotel" ? "🏨" : "🏠") : "";

    return `<div class="cell ${isReach?'reach':''}" data-idx="${idx}" title="${cn(idx)}">
      ${colorBar}
      <span class="cname">${cn(idx).substring(0,8)}</span>
      <span class="cbld">${bld}</span>
      <div class="pawns">${pawns.map(p => `<div class="pawn" style="background:${p.color}" title="${p.name}"></div>`).join("")}</div>
    </div>`;
  });

  const grid: string[] = [];
  // Bottom: 0-10 (right to left in display)
  for (let c = 10; c >= 0; c--) grid.push(cells[c]);
  // Left: 11-19, Top: 20-30, Right: 31-39 handled by CSS grid
  return `<div class="board-grid">${grid.join("")}${cells.slice(11, 20).join("")}<div class="bcenter">CLODOPOLY</div>${cells.slice(20, 31).join("")}${cells.slice(31).join("")}</div>`;
}

function colorHex(c: string) {
  const map: Record<string,string> = { brown:"#8B6914", light_blue:"#6DCEF5", pink:"#EE5BA0", orange:"#F6921E", red:"#EC1C24", yellow:"#FFCA05", green:"#A5CD39", dark_blue:"#008ED3" };
  return map[c] ?? "#888";
}

function renderPlayerPanel(p: typeof state.players[0]) {
  const jobName = p.job ? lang.jobs[p.job]?.name ?? p.job : "Sans emploi";
  return `<div class="pcard">
    <div class="phead"><div class="dot" style="background:${p.color}"></div><strong>${p.name}</strong><span class="pjob">${jobName}</span></div>
    <div class="pstats">
      <div class="st"><span class="sv gold">${p.money}€</span><span class="sl">Argent</span></div>
      <div class="st"><span class="sv green">PV ${p.pv}/5</span><span class="sl">Santé</span></div>
      <div class="st"><span class="sv blue">PC ${p.pc}</span><span class="sl">Créd.</span></div>
    </div>
    <div class="pinv">${p.inventory.map(c => `<span class="chip">${getCardDef(c)?.icon??""} ${cardName(c)}</span>`).join("")}</div>
    ${p.specialCards.length ? `<div class="pinv">${p.specialCards.map(c => `<span class="chip sp">${getCardDef(c)?.icon??""} ${cardName(c)}</span>`).join("")}</div>` : ""}
  </div>`;
}

function renderAllPlayers() {
  return `<div class="sec"><div class="sec-title">Joueurs</div>${state.players.map(p => {
    const ghost = p.status === PlayerStatus.GHOST ? " 👻" : "";
    const dead = p.status === PlayerStatus.ELIMINATED ? " ☠" : "";
    return `<div class="prow${p.status===PlayerStatus.ELIMINATED?' dead':''}"><div class="dot" style="background:${p.color}"></div><span>${p.name}${ghost}${dead}</span><span class="gold">${p.money}€</span><span class="green">♥${p.pv}</span><span class="blue">★${p.pc}</span></div>`;
  }).join("")}</div>`;
}

function renderActions(mode: string, cur: typeof state.players[0]) {
  if (mode === "movement" && !selectedTransport) {
    const transports: { mode: TransportMode; label: string; cost: string; icon: string }[] = [];
    if (validateChooseTransport(state, cur.id, TransportMode.FOOT).valid) transports.push({ mode: TransportMode.FOOT, label: "À pied", cost: "gratuit", icon: "🚶" });
    if (validateChooseTransport(state, cur.id, TransportMode.BUS).valid) transports.push({ mode: TransportMode.BUS, label: `Bus`, cost: `${BUS_TICKET_COST}€`, icon: "🚌" });
    if (validateChooseTransport(state, cur.id, TransportMode.CAR).valid) transports.push({ mode: TransportMode.CAR, label: `Voiture`, cost: `${CAR_FUEL_COST}€`, icon: "🚗" });

    if (cur.position === SHELTER_CELL) {
      return `<div class="sec"><div class="sec-title">Au Foyer</div><button class="btn primary full" id="act-skip">Passer le tour</button></div>`;
    }

    return `<div class="sec"><div class="sec-title">Transport</div>
      ${transports.map(t => `<button class="btn full transport-btn" data-mode="${t.mode}">${t.icon} ${t.label} <span class="cost">${t.cost}</span></button>`).join("")}
    </div>`;
  }

  if (mode === "movement" && selectedTransport && reachableCells.length > 0) {
    return `<div class="sec"><div class="sec-title">🎲 ${state.lastDiceRoll?.join("+")}${getDiceBonus(selectedTransport)?`+${getDiceBonus(selectedTransport)}`:""}  — Choisissez une case</div>
      <div class="cell-list">${reachableCells.map(idx => {
        const bld = state.buildings.has(idx) ? ` ${state.buildings.get(idx)==="hotel"?"🏨":"🏠"}` : "";
        const ppl = state.players.filter(p => p.position === idx && p.id !== cur.id && p.status !== PlayerStatus.ELIMINATED);
        const pp = ppl.length ? ` 👥${ppl.map(p=>p.name).join(",")}` : "";
        return `<button class="btn full cell-btn" data-idx="${idx}">${cn(idx)}${bld}${pp}</button>`;
      }).join("")}</div>
    </div>`;
  }

  if (mode === "action") {
    return `<div class="sec"><div class="sec-title">Action</div>${renderCaseAction(cur)}</div>`;
  }

  if (mode === "night") {
    return renderNightUI();
  }

  if (mode === "maintenance") {
    return `<div class="sec"><div class="sec-title">Maintenance</div><button class="btn primary full" id="act-maint">Résoudre</button></div>`;
  }

  if (mode === "endturn") {
    return `<div class="sec"><div class="sec-title">Fin du tour ${state.turn}</div><button class="btn primary full" id="act-endturn">Tour suivant</button></div>`;
  }

  return "";
}

function renderCaseAction(cur: typeof state.players[0]) {
  const cell = BOARD[cur.position];
  let html = `<p class="case-info">📍 ${cn(cur.position)}</p>`;

  switch (cell.type) {
    case CellType.PETIT_BOULOT: html += `<button class="btn primary full" id="act-petitboulot">Travailler (+80€)</button>`; break;
    case CellType.SHOWER: html += `<button class="btn primary full" id="act-shower">Se doucher (+1 PC)</button>`; break;
    case CellType.CLINIC: html += `<button class="btn primary full" id="act-clinic" ${!canAfford(cur,50)||cur.pv>=5?'disabled':''}>Se soigner (+1 PV, -50€)</button>`; break;
    case CellType.EVENT: html += `<button class="btn primary full" id="act-event">Tirer une carte Événement</button>`; break;
    case CellType.SCAVENGE: html += `<button class="btn primary full" id="act-scavenge">Fouiller</button>`; break;
    case CellType.WORKPLACE:
      html += `<button class="btn primary full" id="act-work">${cur.job ? "Pointer au travail" : "Chercher un emploi"}</button>`;
      break;
    case CellType.TAX_INCOME: html += `<button class="btn primary full" id="act-taxinc">Payer la taxe</button>`; break;
    case CellType.TAX_LUXURY: html += `<button class="btn primary full" id="act-taxlux">Payer l'amende</button>`; break;
    case CellType.ROUNDUP: html += `<button class="btn primary full" id="act-roundup">Rafle !</button>`; break;
    case CellType.MARKET: {
      const markets = BOARD.filter(c => c.type === CellType.MARKET).sort((a,b) => a.index - b.index);
      const mIdx = markets.findIndex(c => c.index === cell.index);
      if (mIdx >= 0) {
        const slots = state.marketCards[mIdx] ?? [null, null];
        slots.forEach((cardId, si) => {
          if (cardId) {
            const def = getCardDef(cardId);
            html += `<button class="btn full market-btn" data-mi="${mIdx}" data-si="${si}" ${!canAfford(cur, def?.price??999)?'disabled':''}>${def?.icon} ${cardName(cardId)} (${def?.pcValue}PC, ${def?.price}€)</button>`;
          }
        });
      }
      break;
    }
    default: break;
  }

  html += `<button class="btn full" id="act-skip">Passer</button>`;
  return html;
}

function renderNightUI() {
  const camps = identifyCamps(state);
  const inCamp = new Set<string>();
  for (const ids of camps.values()) ids.forEach(id => inCamp.add(id));

  const playersToChoose = state.players.filter(p =>
    p.status !== PlayerStatus.ELIMINATED && p.position !== SHELTER_CELL && inCamp.has(p.id) && !state.nightChoices.has(p.id)
  );

  if (playersToChoose.length === 0) {
    return `<div class="sec"><div class="sec-title">🌙 Résolution de la nuit</div><button class="btn primary full" id="act-night-resolve">Résoudre</button></div>`;
  }

  const p = playersToChoose[0];
  const campMates = state.players.filter(pl => pl.position === p.position && pl.id !== p.id && pl.status !== PlayerStatus.ELIMINATED);

  return `<div class="sec"><div class="sec-title">🌙 ${p.name} — en Camp avec ${campMates.map(m=>m.name).join(", ")}</div>
    <div class="night-grid">
      <button class="btn full night-btn" data-act="sleep">😴 Dormir</button>
      <button class="btn full night-btn" data-act="watch">👁️ Veiller</button>
      <button class="btn full night-btn" data-act="scavenge">🔦 Fouiller</button>
      <button class="btn full night-btn" data-act="take">🤚 Se servir</button>
    </div>
  </div>`;
}

function renderJournal() {
  const entries = state.journal.slice(-5);
  if (!entries.length) return "";
  return `<div class="sec"><div class="sec-title">Journal</div>${entries.map(e => {
    const p = state.players.find(pl => pl.id === e.playerId);
    return `<div class="jentry">${p?`<span style="color:${p.color}">${p.name}</span>: `:""}${e.message} ${e.data?JSON.stringify(e.data):""}</div>`;
  }).join("")}</div>`;
}

function bindActions(mode: string, cur: typeof state.players[0]) {
  if (mode === "movement" && !selectedTransport) {
    $$('.transport-btn').forEach(b => b.addEventListener('click', () => {
      selectedTransport = (b as HTMLElement).dataset.mode as TransportMode;
      state = applyChooseTransport(state, selectedTransport);
      state = applyRollDice(state, dice);
      const total = state.lastDiceRoll!.reduce((a,b2) => a+b2, 0) + getDiceBonus(selectedTransport);
      reachableCells = getReachableCells(cur.position, total, getDirection(selectedTransport));
      render();
    }));
    $('#act-skip')?.addEventListener('click', () => {
      state = advanceToNextPlayer({ ...state, phase: GamePhase.ACTION });
      selectedTransport = null; reachableCells = [];
      render();
    });
  }

  if (mode === "movement" && selectedTransport) {
    $$('.cell-btn').forEach(b => b.addEventListener('click', () => {
      const idx = parseInt((b as HTMLElement).dataset.idx!);
      state = applyChooseCell(state, cur.id, idx);
      selectedTransport = null; reachableCells = [];
      render();
    }));
  }

  if (mode === "action") {
    $('#act-petitboulot')?.addEventListener('click', () => { state = resolvePetitBoulot(state, cur.id); state = advanceToNextPlayer(state); selectedTransport = null; render(); });
    $('#act-shower')?.addEventListener('click', () => { state = resolveShower(state, cur.id); state = advanceToNextPlayer(state); selectedTransport = null; render(); });
    $('#act-clinic')?.addEventListener('click', () => { state = resolveClinic(state, cur.id); state = advanceToNextPlayer(state); selectedTransport = null; render(); });
    $('#act-event')?.addEventListener('click', () => { state = resolveEventCard(state, cur.id, dice); state = advanceToNextPlayer(state); selectedTransport = null; render(); });
    $('#act-scavenge')?.addEventListener('click', () => { state = resolveScavengeCard(state, cur.id, dice); state = advanceToNextPlayer(state); selectedTransport = null; render(); });
    $('#act-work')?.addEventListener('click', () => {
      if (cur.job) { state = resolveWorkplace(state, cur.id); }
      else if (state.availableJobs.length > 0) {
        const j = state.availableJobs.find(jt => cur.pc >= (jt === JobType.CADRE ? 8 : jt === JobType.EMPLOYE ? 5 : 2));
        if (j) state = resolveHire(state, cur.id, j);
      }
      state = advanceToNextPlayer(state); selectedTransport = null; render();
    });
    $('#act-taxinc')?.addEventListener('click', () => { state = resolveTaxIncome(state, cur.id); state = advanceToNextPlayer(state); selectedTransport = null; render(); });
    $('#act-taxlux')?.addEventListener('click', () => { state = resolveTaxLuxury(state, cur.id); state = advanceToNextPlayer(state); selectedTransport = null; render(); });
    $('#act-roundup')?.addEventListener('click', () => { state = resolveRoundup(state, cur.id, dice); state = advanceToNextPlayer(state); selectedTransport = null; render(); });
    $$('.market-btn').forEach(b => b.addEventListener('click', () => {
      const mi = parseInt((b as HTMLElement).dataset.mi!);
      const si = parseInt((b as HTMLElement).dataset.si!);
      state = resolveMarketBuy(state, cur.id, mi, si);
      render();
    }));
    $('#act-skip')?.addEventListener('click', () => { state = advanceToNextPlayer(state); selectedTransport = null; render(); });
  }

  if (mode === "night") {
    $$('.night-btn').forEach(b => b.addEventListener('click', () => {
      const actMap: Record<string,NightAction> = { sleep: NightAction.SLEEP, watch: NightAction.WATCH, scavenge: NightAction.SCAVENGE, take: NightAction.TAKE };
      const act = actMap[(b as HTMLElement).dataset.act!] ?? NightAction.SLEEP;
      const camps2 = identifyCamps(state);
      const inCamp2 = new Set<string>();
      for (const ids of camps2.values()) ids.forEach(id => inCamp2.add(id));
      const toChoose = state.players.filter(p => p.status !== PlayerStatus.ELIMINATED && p.position !== SHELTER_CELL && inCamp2.has(p.id) && !state.nightChoices.has(p.id));
      if (toChoose.length > 0) {
        state.nightChoices.set(toChoose[0].id, act);
      }
      render();
    }));
    $('#act-night-resolve')?.addEventListener('click', () => {
      state = resolveNight(state, dice);
      render();
    });
  }

  if (mode === "maintenance") {
    $('#act-maint')?.addEventListener('click', () => { state = resolveMaintenance(state); render(); });
  }

  if (mode === "endturn") {
    $('#act-endturn')?.addEventListener('click', () => { state = resolveEndTurn(state); selectedTransport = null; reachableCells = []; render(); });
  }
}

// === GAME OVER ===
function renderGameOver(app: HTMLElement) {
  const winner = state.players.find(p => p.status === PlayerStatus.ALIVE);
  app.innerHTML = `
<div class="screen gameover">
  <div class="trophy">🏆</div>
  <h1>${winner ? `<span style="color:${winner.color}">${winner.name}</span> a survécu !` : "Personne n'a survécu"}</h1>
  <p>Après ${state.turn} tours</p>
  <div class="box">
    <h3>Classement</h3>
    ${state.players.map(p => `<div class="prow"><span style="color:${p.color}">${p.name}</span><span>${p.status===PlayerStatus.ALIVE?"Survivant":"Éliminé"}</span></div>`).join("")}
  </div>
  <button class="btn primary" id="restart">Nouvelle partie</button>
</div>`;
  $('#restart')?.addEventListener('click', () => { state = undefined as any; render(); });
}

// === STYLES ===
const style = document.createElement("style");
style.textContent = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#1a1a2e;color:#e8e8e8;overflow-x:hidden}
.screen{min-height:100vh;display:flex;flex-direction:column;align-items:center}
.setup,.gameover{justify-content:center;gap:1.5rem;padding:2rem}
.title{font-size:3rem;font-weight:800;background:linear-gradient(135deg,#e94560,#f0c040);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.subtitle{color:#8899aa;font-style:italic}
.box{background:#16213e;border:1px solid #2a3a5e;border-radius:12px;padding:1.5rem;width:100%;max-width:420px}
.box label{font-size:.8rem;color:#8899aa;text-transform:uppercase;letter-spacing:1px}
.btn-row{display:flex;gap:.5rem;margin:.5rem 0 1rem}
.btn{padding:.6rem 1.2rem;border:1px solid #2a3a5e;border-radius:8px;background:#0f3460;color:#e8e8e8;font-size:.9rem;cursor:pointer;transition:all .15s}
.btn:hover{background:#1a3a6e;border-color:#8899aa}
.btn.active,.btn.primary{background:#e94560;border-color:#e94560}
.btn.primary:hover{background:#c23152}
.btn:disabled{opacity:.35;pointer-events:none}
.btn.full{width:100%;margin:.3rem 0;text-align:left}
.input{width:100%;padding:.5rem .75rem;background:#1a1a2e;border:1px solid #2a3a5e;border-radius:8px;color:#e8e8e8;font-size:.9rem;margin:.25rem 0}
.input:focus{outline:none;border-color:#e94560}
.draft{padding:1rem;gap:.75rem}
.pc-bar{background:#0f3460;padding:.4rem 1rem;border-radius:20px;font-size:.9rem}
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:.5rem;width:100%;max-width:600px}
.draft-card{background:#16213e;border:2px solid #2a3a5e;border-radius:8px;padding:.75rem .5rem;text-align:center;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:.25rem;transition:all .15s}
.draft-card:hover{border-color:#f0c040}
.draft-card.selected{border-color:#f0c040;background:rgba(240,192,64,.1)}
.draft-card.disabled{opacity:.3;pointer-events:none}
.draft-card .ic{font-size:1.5rem}
.draft-card .nm{font-size:.75rem;font-weight:600}
.draft-card .pv{font-size:.7rem;color:#f0c040}
.inv{font-size:.8rem;color:#8899aa}
.game{padding:0}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:.5rem 1rem;background:#16213e;border-bottom:1px solid #2a3a5e;width:100%;font-size:.85rem}
.phase-label{font-weight:600}
.game-body{display:flex;flex:1;width:100%;min-height:0}
.board-wrap{flex:1;overflow:auto;padding:.5rem;display:flex;align-items:flex-start;justify-content:center}
.board-grid{display:grid;grid-template-columns:repeat(11,1fr);gap:1px;background:#2a3a5e;border:2px solid #2a3a5e;border-radius:6px;width:100%;max-width:660px;aspect-ratio:1}
.cell{background:#16213e;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px;position:relative;cursor:pointer;min-height:0;overflow:hidden;font-size:.5rem;transition:background .15s}
.cell:hover{background:#1a3a6e}
.cell.reach{background:rgba(78,159,245,.15);box-shadow:inset 0 0 0 2px #4e9ff5}
.cbar{position:absolute;top:0;left:0;right:0;height:4px}
.cname{font-size:.4rem;color:#8899aa;text-align:center;line-height:1.1;max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.cbld{font-size:.5rem;position:absolute;bottom:1px;right:1px}
.pawns{display:flex;gap:1px;position:absolute;bottom:1px;left:1px}
.pawn{width:7px;height:7px;border-radius:50%;border:1px solid rgba(255,255,255,.5)}
.bcenter{grid-column:2/11;grid-row:2/11;background:#1a1a2e;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:800;background:linear-gradient(135deg,#e94560,#f0c040);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.panel{width:300px;background:#16213e;border-left:1px solid #2a3a5e;overflow-y:auto;flex-shrink:0}
.pcard{padding:.75rem}
.phead{display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem}
.pjob{margin-left:auto;font-size:.75rem;color:#8899aa}
.dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.pstats{display:flex;gap:.4rem;margin-bottom:.4rem}
.st{text-align:center;background:#1a1a2e;border-radius:6px;padding:.3rem .5rem;flex:1}
.sv{font-size:.9rem;font-weight:700;display:block}
.sl{font-size:.55rem;color:#8899aa;text-transform:uppercase}
.gold{color:#f0c040}.green{color:#4ecca3}.blue{color:#4e9ff5}
.pinv{display:flex;flex-wrap:wrap;gap:.25rem;margin-top:.3rem}
.chip{background:#1a1a2e;padding:.15rem .4rem;border-radius:4px;font-size:.65rem}
.chip.sp{border:1px solid #4ecca3}
.sec{padding:.5rem .75rem;border-top:1px solid #2a3a5e}
.sec-title{font-size:.65rem;text-transform:uppercase;letter-spacing:1px;color:#8899aa;margin-bottom:.4rem}
.prow{display:flex;align-items:center;gap:.4rem;padding:.2rem 0;font-size:.8rem}
.prow.dead{opacity:.4}
.prow span:last-child{margin-left:auto}
.cost{color:#f0c040;font-size:.75rem;margin-left:.5rem}
.case-info{font-size:.85rem;margin-bottom:.5rem;color:#8899aa}
.night-grid{display:grid;grid-template-columns:1fr 1fr;gap:.4rem}
.jentry{font-size:.7rem;padding:.2rem .4rem;background:#1a1a2e;border-radius:4px;margin-bottom:.2rem;border-left:3px solid #2a3a5e;line-height:1.3}
.cell-list{max-height:200px;overflow-y:auto}
.trophy{font-size:4rem}
.gameover h1{font-size:1.8rem}
.gameover h3{margin-bottom:.5rem;font-size:1rem}
@media(max-width:768px){
  .game-body{flex-direction:column}
  .panel{width:100%;border-left:none;border-top:1px solid #2a3a5e}
  .board-wrap{max-height:50vh}
  .cname{font-size:.35rem}
}
`;
document.head.appendChild(style);

render();
