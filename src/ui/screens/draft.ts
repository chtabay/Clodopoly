import type { App, ScreenRenderer } from "../app";
import type { GameState } from "../../engine/types";
import { GamePhase } from "../../engine/types";
import { getCardDef } from "../../engine/cards";
import { getCardName } from "../../locale/i18n";
import { getCurrentPlayer, computePC } from "../../engine/state";

const DRAFT_PC_TARGET = 8;

export function createDraftScreen(app: App): ScreenRenderer {
  let root: HTMLElement | null = null;
  let transitionOverlay: HTMLElement | null = null;
  let draftContent: HTMLElement | null = null;
  let draftGrid: HTMLElement | null = null;
  let playerProfile: HTMLElement | null = null;
  let draftBar: HTMLElement | null = null;
  let validateBtn: HTMLButtonElement | null = null;

  let lastShownPlayerIndex = -1;

  function getAllDeckCards(state: { objectDeck: string[] }): string[] {
    return [...state.objectDeck];
  }

  function hasCar(inventory: string[]): boolean {
    return inventory.some((id) => id.startsWith("obj_car"));
  }

  function buildTransitionOverlay(): HTMLElement {
    const overlay = document.createElement("div");
    overlay.className = "transition-screen";

    const text = document.createElement("div");
    text.className = "transition-text";

    const btn = document.createElement("button");
    btn.className = "action-btn primary";
    btn.textContent = app.lang.ui.ready ?? "Je suis prêt";
    btn.addEventListener("click", () => {
      if (transitionOverlay) transitionOverlay.style.display = "none";
      if (draftContent) draftContent.style.display = "flex";
    });

    overlay.appendChild(text);
    overlay.appendChild(btn);
    return overlay;
  }

  function buildDraftContent(): HTMLElement {
    const content = document.createElement("div");
    content.className = "draft-content";
    content.style.display = "none";

    const header = document.createElement("header");
    header.className = "draft-header";

    const zones = document.createElement("div");
    zones.className = "draft-zones";

    const leftZone = document.createElement("div");
    leftZone.className = "draft-left";
    const grid = document.createElement("div");
    grid.className = "draft-grid";
    leftZone.appendChild(grid);

    const rightZone = document.createElement("div");
    rightZone.className = "draft-right";
    const profile = document.createElement("div");
    profile.className = "player-profile";
    rightZone.appendChild(profile);

    zones.appendChild(leftZone);
    zones.appendChild(rightZone);

    const bar = document.createElement("div");
    bar.className = "draft-bar";
    const pcCounter = document.createElement("span");
    pcCounter.className = "pc-counter";
    const validate = document.createElement("button");
    validate.className = "action-btn primary validate-btn";
    validate.textContent = app.lang.ui.validate ?? "Valider";
    bar.appendChild(pcCounter);
    bar.appendChild(validate);

    content.appendChild(header);
    content.appendChild(zones);
    content.appendChild(bar);

    draftGrid = grid;
    playerProfile = profile;
    draftBar = bar;
    validateBtn = validate;

    return content;
  }

  function updateTransitionText(playerName: string): void {
    if (!transitionOverlay) return;
    const text = transitionOverlay.querySelector(".transition-text");
    if (text) {
      const passDevice = app.lang.ui.passDevice ?? "Passez l'appareil à";
      text.textContent = `${passDevice} ${playerName}`;
    }
  }

  function updateDraftUI(state: GameState): void {
    if (!root || !draftGrid || !playerProfile || !validateBtn || !draftBar) return;

    const player = getCurrentPlayer(state);
    const pc = computePC(player);
    const carOk = hasCar(player.inventory);
    const canValidate = pc === DRAFT_PC_TARGET && carOk;

    const allCards = getAllDeckCards(state);
    const playerInventorySet = new Set(player.inventory);

    draftGrid.innerHTML = "";
    for (const cardId of allCards) {
      const def = getCardDef(cardId);
      if (!def) continue;

      const cardEl = document.createElement("div");
      const isSelected = playerInventorySet.has(cardId);
      const cardPc = def.pcValue ?? 0;
      const wouldExceed = !isSelected && pc + cardPc > DRAFT_PC_TARGET;

      cardEl.className = "draft-card";
      if (isSelected) cardEl.classList.add("selected");
      if (wouldExceed) cardEl.classList.add("disabled");

      const icon = document.createElement("div");
      icon.className = "card-icon";
      icon.textContent = def.icon ?? "?";

      const name = document.createElement("div");
      name.className = "card-name";
      name.textContent = getCardName(cardId, app.lang);

      const pcEl = document.createElement("div");
      pcEl.className = "card-pc";
      pcEl.textContent = `${cardPc} PC${def.price != null ? ` · ${def.price}€` : ""}`;

      cardEl.appendChild(icon);
      cardEl.appendChild(name);
      cardEl.appendChild(pcEl);

      if (!wouldExceed) {
        cardEl.addEventListener("click", () => {
          if (isSelected) {
            app.draftUnpick(player.id, cardId);
          } else {
            app.draftPick(player.id, cardId);
          }
        });
      }

      draftGrid.appendChild(cardEl);
    }

    playerProfile.innerHTML = "";
    const nameEl = document.createElement("div");
    nameEl.className = "player-name";
    const colorDot = document.createElement("span");
    colorDot.style.display = "inline-block";
    colorDot.style.width = "12px";
    colorDot.style.height = "12px";
    colorDot.style.borderRadius = "50%";
    colorDot.style.backgroundColor = player.color;
    colorDot.style.marginRight = "8px";
    colorDot.style.verticalAlign = "middle";
    nameEl.appendChild(colorDot);
    nameEl.appendChild(document.createTextNode(player.name));
    playerProfile.appendChild(nameEl);

    const selectedList = document.createElement("div");
    selectedList.className = "selected-cards-list";
    selectedList.style.display = "flex";
    selectedList.style.flexWrap = "wrap";
    selectedList.style.gap = "8px";
    selectedList.style.marginTop = "8px";
    for (const cardId of player.inventory) {
      const def = getCardDef(cardId);
      const span = document.createElement("span");
      span.textContent = def?.icon ?? "?";
      span.title = getCardName(cardId, app.lang);
      span.style.fontSize = "1.5rem";
      selectedList.appendChild(span);
    }
    playerProfile.appendChild(selectedList);

    const pcCounterEl = document.createElement("div");
    pcCounterEl.className = "pc-counter";
    pcCounterEl.style.marginTop = "8px";
    pcCounterEl.textContent = `${pc} / ${DRAFT_PC_TARGET} PC`;
    playerProfile.appendChild(pcCounterEl);

    const pcBar = document.createElement("div");
    pcBar.style.height = "8px";
    pcBar.style.background = "var(--bg-panel-alt)";
    pcBar.style.borderRadius = "4px";
    pcBar.style.overflow = "hidden";
    pcBar.style.marginTop = "4px";
    const pcFill = document.createElement("div");
    pcFill.style.height = "100%";
    pcFill.style.width = `${Math.min(100, (pc / DRAFT_PC_TARGET) * 100)}%`;
    pcFill.style.background = pc === DRAFT_PC_TARGET ? "var(--accent)" : "var(--text-muted)";
    pcFill.style.transition = "width 0.3s ease";
    pcBar.appendChild(pcFill);
    playerProfile.appendChild(pcBar);

    const carCheck = document.createElement("div");
    carCheck.style.marginTop = "8px";
    carCheck.textContent = `${carOk ? "✅" : "❌"} Voiture obligatoire`;
    playerProfile.appendChild(carCheck);

    const header = root.querySelector(".draft-header");
    if (header) {
      header.innerHTML = "";
      const title = document.createElement("h2");
      const dot = document.createElement("span");
      dot.style.display = "inline-block";
      dot.style.width = "14px";
      dot.style.height = "14px";
      dot.style.borderRadius = "50%";
      dot.style.backgroundColor = player.color;
      dot.style.marginRight = "8px";
      dot.style.verticalAlign = "middle";
      title.appendChild(dot);
      title.appendChild(
        document.createTextNode(`${app.lang.ui.draft ?? "Draft"} — ${player.name}`),
      );
      header.appendChild(title);
    }

    const barPc = draftBar.querySelector(".pc-counter");
    if (barPc) barPc.textContent = `${pc} / ${DRAFT_PC_TARGET} PC`;

    validateBtn.disabled = !canValidate;
    validateBtn.onclick = () => {
      if (canValidate) app.draftValidate(player.id);
    };
  }

  return {
    mount(container: HTMLElement): void {
      root = document.createElement("div");
      root.className = "screen screen-draft";

      transitionOverlay = buildTransitionOverlay();
      draftContent = buildDraftContent();

      root.appendChild(transitionOverlay);
      root.appendChild(draftContent);

      container.appendChild(root);
    },

    update(state: GameState): void {
      if (state.phase !== GamePhase.DRAFT) return;

      const currentPlayerIndex = state.currentPlayerIndex;

      if (currentPlayerIndex !== lastShownPlayerIndex) {
        lastShownPlayerIndex = currentPlayerIndex;
        if (transitionOverlay) transitionOverlay.style.display = "flex";
        if (draftContent) draftContent.style.display = "none";
      }

      const player = getCurrentPlayer(state);
      updateTransitionText(player.name);
      updateDraftUI(state);
    },

    unmount(): void {
      root = null;
      transitionOverlay = null;
      draftContent = null;
      draftGrid = null;
      playerProfile = null;
      draftBar = null;
      validateBtn = null;
    },
  };
}
