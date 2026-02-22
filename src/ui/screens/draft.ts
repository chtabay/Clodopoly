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
  let introShown = false;

  function getAllDeckCards(state: { objectDeck: string[] }): string[] {
    return [...state.objectDeck];
  }

  function hasCar(inventory: string[]): boolean {
    return inventory.some((id) => id.startsWith("obj_car"));
  }

  function autoPickCar(state: GameState): void {
    const player = getCurrentPlayer(state);
    if (hasCar(player.inventory)) return;
    const carCard = state.objectDeck.find(id => id.startsWith("obj_car") && !player.inventory.includes(id));
    if (carCard) {
      app.draftPick(player.id, carCard);
    }
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

      const isCar = cardId.startsWith("obj_car");
      if (isCar) continue;

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
    carCheck.style.fontSize = "var(--font-size-xs)";
    carCheck.style.color = "var(--text-muted)";
    carCheck.textContent = `🚗 Voiture incluse (3 PC). Choisissez 5 PC d'objets.`;
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
        document.createTextNode(`Équipement — ${player.name}`),
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

  function showIntroModal(): void {
    const overlay = document.createElement("div");
    overlay.className = "intro-modal-overlay";

    const modal = document.createElement("div");
    modal.className = "intro-modal";

    modal.innerHTML = `
      <h2>🏚️ Clodopoly</h2>
      <p class="intro-subtitle">Les Billets Restent dans la Boîte</p>

      <div class="intro-section">
        <strong>🎯 Objectif</strong>
        <p>Être le dernier survivant. Tout le monde descend — vous descendez juste en dernier.</p>
      </div>

      <div class="intro-section">
        <strong>📉 Chaque tour, vous perdez</strong>
        <p>Nourriture (20€+), logement (30–120€), transport. Même avec un emploi, le budget est déficitaire. La spirale est inévitable.</p>
      </div>

      <div class="intro-section">
        <strong>🤝 Le Camp sauve… ou détruit</strong>
        <p>Terminez un tour sur la même case qu'un autre joueur → vous formez un <strong>Camp</strong>. Coûts partagés, +1 PC. Mais la nuit, chacun choisit en secret : <em>dormir, veiller, fouiller,</em> ou <em>se servir</em> dans les affaires des autres.</p>
      </div>

      <div class="intro-section">
        <strong>🌙 La nuit, 4 choix</strong>
        <ul>
          <li>😴 <strong>Dormir</strong> — repos, +1 PC, mais vulnérable au vol</li>
          <li>👁️ <strong>Veiller</strong> — protège le camp, bloque les voleurs</li>
          <li>🔦 <strong>Fouiller</strong> — trouver des objets, mais vos affaires sont sans garde</li>
          <li>🤚 <strong>Se servir</strong> — prendre un objet d'un dormeur. Risqué si un veilleur est là</li>
        </ul>
      </div>

      <div class="intro-section">
        <strong>🃏 Votre équipement de départ</strong>
        <p>Choisissez vos objets (5 PC à répartir, voiture incluse). Plus d'objets = résilience aux pertes. Moins d'objets mais de valeur = PC élevés mais fragiles.</p>
      </div>

      <div class="intro-section">
        <strong>💀 Élimination</strong>
        <p>0 PV = éliminé. PC trop bas = licencié. Bâtiments condamnés tous les 4 tours. L'inflation monte. Personne ne s'en sort seul.</p>
      </div>
    `;

    const btn = document.createElement("button");
    btn.className = "action-btn primary intro-start-btn";
    btn.textContent = "Choisir son équipement";
    btn.addEventListener("click", () => overlay.remove());
    modal.appendChild(btn);

    overlay.appendChild(modal);
    if (root) root.appendChild(overlay);
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

      if (!introShown) {
        introShown = true;
        showIntroModal();
      }
    },

    update(state: GameState): void {
      if (state.phase !== GamePhase.DRAFT) return;

      const currentPlayerIndex = state.currentPlayerIndex;

      if (currentPlayerIndex !== lastShownPlayerIndex) {
        lastShownPlayerIndex = currentPlayerIndex;
        if (transitionOverlay) transitionOverlay.style.display = "flex";
        if (draftContent) draftContent.style.display = "none";

        autoPickCar(state);
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
