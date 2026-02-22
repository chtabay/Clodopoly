import type { App } from "../app";
import type { ScreenRenderer } from "../app";

const VERSION = "v0.1.0";

export function createHomeScreen(app: App): ScreenRenderer {
  let root: HTMLElement | null = null;

  return {
    mount(container: HTMLElement): void {
      root = document.createElement("div");
      root.className = "screen screen-home";

      const title = document.createElement("h1");
      title.className = "title";
      title.textContent = "Clodopoly";

      const subtitle = document.createElement("p");
      subtitle.className = "text-secondary";
      subtitle.style.color = "var(--text-secondary)";
      subtitle.textContent = "Les Billets Restent dans la Boîte";

      const btnNew = document.createElement("button");
      btnNew.className = "action-btn primary";
      btnNew.textContent = "Nouvelle partie";
      btnNew.addEventListener("click", () => app.navigate("setup"));

      const btnRules = document.createElement("button");
      btnRules.className = "action-btn";
      btnRules.textContent = "Règles";
      btnRules.addEventListener("click", () => {
        console.log("Règles - future rules panel");
      });

      const version = document.createElement("p");
      version.style.fontSize = "var(--font-size-xs)";
      version.style.color = "var(--text-muted)";
      version.style.marginTop = "var(--space-xl)";
      version.textContent = VERSION;

      root.appendChild(title);
      root.appendChild(subtitle);
      root.appendChild(btnNew);
      root.appendChild(btnRules);
      root.appendChild(version);

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
