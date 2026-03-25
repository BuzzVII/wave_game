import type { GameState } from "./types.js";
import { createInitialPlayer } from "./state.js";
import { updateCombat } from "./combat.js";

export function resetGame(state: GameState, canvas: HTMLCanvasElement): void {
  state.phase = "combat";
  state.enemies = [];
  state.upgrades = [];
  state.projectiles = [];
  state.input.left = false;
  state.input.right = false;
  state.lastTime = 0;
  state.enemySpawnTimer = 0;
  state.weaponUpgradeSpawnTimer = 0;
  state.unitUpgradeSpawnTimer = 0;
  state.score = 0;
  state.player = createInitialPlayer(canvas);
  state.baseY = canvas.height * 0.92;
}

export function update(state: GameState, canvas: HTMLCanvasElement, time: number): void {
  const dt = Math.min(0.033, (time - state.lastTime) / 1000 || 0);
  state.lastTime = time;

  if (state.phase === "combat") {
    updateCombat(state, canvas, dt);
  }
}
