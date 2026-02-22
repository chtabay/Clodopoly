import type { App } from "../app";
import type { ScreenRenderer } from "../app";
import { showNotification } from "../components/notification";

const PLAYER_COLORS = ["#e94560", "#4e9ff5", "#4ecca3", "#f5a623", "#c06ef0"];

export function createSetupScreen(app: App): ScreenRenderer {
  let root: HTMLElement | null = null;
  let playerCount = 3;
  let playerInputs: HTMLInputElement[] = [];

  function buildPlayerRows(container: HTMLElement): void {
    const existing = container.querySelectorAll(".player-row");
    existing.forEach((el) => el.remove());

    playerInputs = [];
    for (let i = 0; i < playerCount; i++) {
      const row = document.createElement("div");
      row.className = "player-row";

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = `Joueur ${i + 1}`;
      input.maxLength = 12;

      const colorDot = document.createElement("div");
      colorDot.style.width = "28px";
      colorDot.style.height = "28px";
      colorDot.style.borderRadius = "50%";
      colorDot.style.backgroundColor = PLAYER_COLORS[i];
      colorDot.style.flexShrink = "0";

      row.appendChild(input);
      row.appendChild(colorDot);
      container.appendChild(row);
      playerInputs.push(input);
    }
  }

  return {
    mount(container: HTMLElement): void {
      root = document.createElement("div");
      root.className = "screen screen-setup";

      const form = document.createElement("form");
      form.className = "setup-form";

      const h2 = document.createElement("h2");
      h2.className = "form-title";
      h2.textContent = "Création de partie";

      const countSelect = document.createElement("select");
      for (let n = 2; n <= 5; n++) {
        const opt = document.createElement("option");
        opt.value = String(n);
        opt.textContent = `${n} joueurs`;
        if (n === 3) opt.selected = true;
        countSelect.appendChild(opt);
      }
      countSelect.addEventListener("change", () => {
        playerCount = parseInt(countSelect.value, 10);
        buildPlayerRows(playersContainer);
      });

      const playersContainer = document.createElement("div");

      const btnStart = document.createElement("button");
      btnStart.type = "button";
      btnStart.textContent = "Commencer";
      btnStart.addEventListener("click", () => {
        const names = playerInputs.map((inp) => inp.value.trim());
        if (names.some((n) => !n)) {
          showNotification("Tous les joueurs doivent avoir un nom", "error");
          return;
        }
        const unique = new Set(names);
        if (unique.size !== names.length) {
          showNotification("Les noms des joueurs doivent être uniques", "error");
          return;
        }
        const colors = PLAYER_COLORS.slice(0, playerCount);
        app.startGame(names, colors);
      });

      const btnBack = document.createElement("button");
      btnBack.type = "button";
      btnBack.className = "action-btn";
      btnBack.textContent = "← Retour";
      btnBack.addEventListener("click", () => app.navigate("home"));

      form.appendChild(h2);
      form.appendChild(countSelect);
      form.appendChild(playersContainer);
      form.appendChild(btnStart);
      form.appendChild(btnBack);

      buildPlayerRows(playersContainer);

      root.appendChild(form);
      container.appendChild(root);
    },

    update(): void {
      // no-op
    },

    unmount(): void {
      // no-op
    },
  };
}
