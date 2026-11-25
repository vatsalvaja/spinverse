import { LobbyLink, assetUrl, useGameHost } from "@spinverse/game-sdk";

// Starting point for a new SPINVERSE game. Replace this file with your game.
//
// Rules for everything you build here:
//  - This code ships to the player's browser and is public. Never put secrets, keys or credentials in it.
//  - Outcomes, payouts and any authoritative game logic belong on the server. The browser only presents
//    results it is given; it must never decide them. Play is free demo credits with no cash value.
//  - Talk to the platform only through the SDK (useGameHost). Never import the host website's code.
//  - Reference files in public/ with assetUrl("path"), never with a root-absolute "/path".
export function App() {
  const host = useGameHost();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-obsidian-950 p-6 text-center">
      <img src={assetUrl("assets/thumbnail.svg")} alt="" className="h-24 w-32 rounded-xl" />
      <h1 className="font-num text-3xl font-bold text-gold-300">Your Game Name</h1>
      <p className="text-obsidian-200">
        {host.player ? `${host.player.name} · demo balance ${host.player.demoBalance.toLocaleString("en-US")}` : "Running standalone"}
      </p>
      <LobbyLink className="rounded-full border border-gold-400/40 px-4 py-2 text-sm text-gold-200 hover:bg-white/5">Back to lobby</LobbyLink>
    </main>
  );
}
