import "./ui/styles.css";
import { initApp } from "./ui/app";
import { createHomeScreen } from "./ui/screens/home";
import { createSetupScreen } from "./ui/screens/setup";
import { createDraftScreen } from "./ui/screens/draft";
import { createGameScreen } from "./ui/screens/game";
import { createEndgameScreen } from "./ui/screens/endgame";

const appEl = document.getElementById("app");
if (appEl) {
  const app = initApp(appEl);
  app.registerScreen("home", () => createHomeScreen(app));
  app.registerScreen("setup", () => createSetupScreen(app));
  app.registerScreen("draft", () => createDraftScreen(app));
  app.registerScreen("game", () => createGameScreen(app));
  app.registerScreen("endgame", () => createEndgameScreen(app));
  app.navigate("home");
}
