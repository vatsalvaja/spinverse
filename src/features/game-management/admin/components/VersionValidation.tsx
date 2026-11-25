"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { gameManagementApi } from "../../services/gameManagementApi";
import { idleValidation, runValidation } from "../../services/validationService";
import type { GameValidationResult, GameVersion, ManagedGame, ValidationScenario } from "../../types";
import { ValidationPanel } from "./ValidationPanel";

/**
 * Validates an already-registered version and stores the result on it, so install and publish rules read the
 * same outcome the admin just saw. The archive is not available any more, so only name and size are checked for real.
 */
export function VersionValidation({ game, version, title }: { game: ManagedGame; version: GameVersion; title?: string }) {
  const toast = useToast();
  const [scenario, setScenario] = useState<ValidationScenario>("pass");
  const [live, setLive] = useState<GameValidationResult | null>(null);
  const [running, setRunning] = useState(false);

  const stored = version.validation.checks.length ? version.validation : idleValidation(version.validation.scenario);
  const shown = live ?? stored;

  const run = async () => {
    setRunning(true);
    const result = await runValidation(
      { fileName: version.package.fileName, sizeBytes: version.package.sizeBytes, headerOk: null, gameId: game.id, version: version.version, scenario },
      setLive,
    );
    await gameManagementApi.saveValidation(game.id, version.id, result);
    setLive(null);
    setRunning(false);
    toast(result.state === "passed" ? `Version ${version.version} passed validation (simulated).` : `Version ${version.version} failed validation.`, result.state === "passed" ? "success" : "error");
  };

  return <ValidationPanel title={title ?? `Package validation · ${version.version}`} result={shown} scenario={scenario} onScenario={setScenario} onRun={run} running={running} />;
}
