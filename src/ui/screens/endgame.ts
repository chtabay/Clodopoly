import type { App } from "../app";
import type { ScreenRenderer } from "../app";
import type { GameState } from "../../engine/types";
import { PlayerStatus } from "../../engine/types";
import { JournalEntryType } from "../../engine/types";

export function createEndgameScreen(app: App): ScreenRenderer {
  let root: HTMLElement | null = null;
  let winnerEl: HTMLElement | null = null;
  let rankingBody: HTMLTableSectionElement | null = null;

  return {
    mount(container: HTMLElement): void {
      root = document.createElement("div");
      root.className = "screen screen-endgame";

      const endgame = document.createElement("div");
      endgame.className = "endgame";

      const winnerDisplay = document.createElement("div");
      winnerDisplay.className = "winner-display";
      winnerEl = document.createElement("div");
      winnerDisplay.appendChild(winnerEl);

      const table = document.createElement("table");
      table.className = "ranking-table";
      const thead = document.createElement("thead");
      thead.innerHTML = "<tr><th>#</th><th>Joueur</th><th>Statut</th></tr>";
      rankingBody = document.createElement("tbody");
      table.appendChild(thead);
      table.appendChild(rankingBody);

      const btnNew = document.createElement("button");
      btnNew.className = "action-btn primary";
      btnNew.textContent = "Nouvelle partie";
      btnNew.addEventListener("click", () => app.navigate("setup"));

      const btnHome = document.createElement("button");
      btnHome.className = "action-btn";
      btnHome.textContent = "Accueil";
      btnHome.addEventListener("click", () => app.navigate("home"));

      const btnRow = document.createElement("div");
      btnRow.style.display = "flex";
      btnRow.style.gap = "var(--space-md)";
      btnRow.style.justifyContent = "center";
      btnRow.style.marginTop = "var(--space-lg)";
      btnRow.appendChild(btnNew);
      btnRow.appendChild(btnHome);

      endgame.appendChild(winnerDisplay);
      endgame.appendChild(table);
      endgame.appendChild(btnRow);
      root.appendChild(endgame);
      container.appendChild(root);
    },

    update(state: GameState): void {
      if (!winnerEl || !rankingBody) return;
      const tableBody = rankingBody;

      const alive = state.players.find((p) => p.status === PlayerStatus.ALIVE);
      const winnerName = alive?.name ?? "?";

      winnerEl.innerHTML = "";
      const trophy = document.createElement("div");
      trophy.className = "trophy";
      trophy.textContent = "🏆";
      const nameSpan = document.createElement("span");
      nameSpan.className = "winner-name";
      nameSpan.textContent = winnerName;
      const suffix = document.createElement("span");
      suffix.textContent = " a survécu !";
      winnerEl.appendChild(trophy);
      winnerEl.appendChild(nameSpan);
      winnerEl.appendChild(document.createTextNode(" "));
      winnerEl.appendChild(suffix);

      const eliminatedEntries = state.journal.filter(
        (e) => e.type === JournalEntryType.ELIMINATED && e.playerId
      );
      const eliminationOrder = eliminatedEntries.map((e) => e.playerId!);
      const eliminatedSet = new Set(eliminationOrder);

      const alivePlayers = state.players.filter((p) => p.status === PlayerStatus.ALIVE);
      const eliminatedPlayers = state.players.filter((p) => p.status === PlayerStatus.ELIMINATED);
      const sortedEliminated = eliminationOrder
        .map((id) => eliminatedPlayers.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => !!p);
      const ghostOrOther = eliminatedPlayers.filter((p) => !eliminatedSet.has(p.id));
      const fullRanking = [...alivePlayers, ...sortedEliminated, ...ghostOrOther];

      rankingBody.innerHTML = "";
      fullRanking.forEach((player, idx) => {
        const tr = document.createElement("tr");
        const rank = idx + 1;
        const statusText =
          player.status === PlayerStatus.ALIVE
            ? "Survivant"
            : player.status === PlayerStatus.GHOST
              ? "Fantôme"
              : "Éliminé";

        const colorDot = document.createElement("span");
        colorDot.className = "player-color-dot";
        colorDot.style.display = "inline-block";
        colorDot.style.width = "10px";
        colorDot.style.height = "10px";
        colorDot.style.borderRadius = "50%";
        colorDot.style.backgroundColor = player.color;
        colorDot.style.marginRight = "var(--space-sm)";

        const nameCell = document.createElement("td");
        nameCell.appendChild(colorDot);
        nameCell.appendChild(document.createTextNode(player.name));

        tr.innerHTML = `<td>${rank}</td>`;
        tr.appendChild(nameCell);
        tr.appendChild(document.createElement("td")).textContent = statusText;
        tableBody.appendChild(tr);
      });
    },

    unmount(): void {
      // no-op
    },
  };
}
