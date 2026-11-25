import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GameHostProvider } from "@spinverse/game-sdk";
import "@spinverse/game-sdk/base.css"; // shared Tailwind layers and the platform's base look
import "./fonts"; // fonts are bundled into the package: games never load fonts from a CDN
import "./game.css"; // this game's own rules (the pf-* classes), after base.css
import { PharaohsFortune } from "./PharaohsFortune";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GameHostProvider gameId="pharaohs-fortune">
      <PharaohsFortune />
    </GameHostProvider>
  </StrictMode>,
);
