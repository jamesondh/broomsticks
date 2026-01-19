import { useGameStore } from "./store";
import { MainMenu, SettingsScreen, GameScreen, ResultsScreen } from "./components/screens";

function App() {
  const screen = useGameStore((s) => s.currentScreen);

  switch (screen) {
    case "menu":
      return <MainMenu />;
    case "settings":
      return <SettingsScreen />;
    case "playing":
      return <GameScreen />;
    case "results":
      return <ResultsScreen />;
    default:
      return <MainMenu />;
  }
}

export default App
