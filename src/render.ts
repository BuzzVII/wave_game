import type { Enemy, GameState, Player, Projectile, Upgrade } from "./types.js";
import {
  getMiddleColumnCenterX,
  getMiddleColumnLeft,
  getMiddleColumnRight,
  getUnitWorldPositions,
} from "./state.js";

function drawColumns(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  const third = canvas.width / 3;

  ctx.fillStyle = "#1f3a1f";
  ctx.fillRect(0, 0, third, canvas.height);

  ctx.fillStyle = "#2d2d2d";
  ctx.fillRect(third, 0, third, canvas.height);

  ctx.fillStyle = "#1f2f4a";
  ctx.fillRect(third * 2, 0, third, canvas.height);

  ctx.strokeStyle = "#666";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(third, 0);
  ctx.lineTo(third, canvas.height);
  ctx.moveTo(third * 2, 0);
  ctx.lineTo(third * 2, canvas.height);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("WEAPON", third * 0.5, 36);
  ctx.fillText("ENEMIES", third * 1.5, 36);
  ctx.fillText("UNITS", third * 2.5, 36);
}

function drawBase(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: GameState): void {
  ctx.strokeStyle = "#ffcc66";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(getMiddleColumnLeft(canvas), state.baseY);
  ctx.lineTo(getMiddleColumnRight(canvas), state.baseY);
  ctx.stroke();

  ctx.fillStyle = "#ffcc66";
  ctx.font = "18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("BASE", getMiddleColumnCenterX(canvas), state.baseY - 10);
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player): void {
  const positions = getUnitWorldPositions(player);

  for (const unit of positions) {
    ctx.fillStyle = "#4d9cff";
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#cfe4ff";
    ctx.beginPath();
    ctx.arc(unit.x - 4, unit.y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]): void {
  for (const projectile of projectiles) {
    ctx.fillStyle = "#ffe082";
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[]): void {
  for (const enemy of enemies) {
    ctx.fillStyle = enemy.isBoss ? "#ff8844" : "#d94a4a";

    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    const hpWidth = enemy.isBoss ? 60 : 32;
    const hpHeight = 5;
    const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);

    ctx.fillStyle = "#111";
    ctx.fillRect(enemy.x - hpWidth / 2, enemy.y - enemy.radius - 14, hpWidth, hpHeight);

    ctx.fillStyle = "#6cff6c";
    ctx.fillRect(enemy.x - hpWidth / 2, enemy.y - enemy.radius - 14, hpWidth * hpRatio, hpHeight);
  }
}

function drawUpgrades(ctx: CanvasRenderingContext2D, upgrades: Upgrade[]): void {
  for (const upgrade of upgrades) {
    if (upgrade.kind === "weapon-speed") {
      ctx.fillStyle = upgrade.enabled ? "#e6d94a" : "#7a7440";
    } else if (upgrade.kind === "weapon-damage") {
      ctx.fillStyle = upgrade.enabled ? "#57d657" : "#3f6f3f";
    } else {
      ctx.fillStyle = "#4d9cff";
    }

    ctx.fillRect(
      upgrade.x - upgrade.width / 2,
      upgrade.y - upgrade.height / 2,
      upgrade.width,
      upgrade.height,
    );

    if (upgrade.kind === "weapon-speed") {
      ctx.fillStyle = upgrade.enabled ? "#fff6b3" : "#aaa27a";
    } else if (upgrade.kind === "weapon-damage") {
      ctx.fillStyle = upgrade.enabled ? "#c9ffc9" : "#8fb28f";
    } else {
      ctx.fillStyle = "#dcecff";
    }

    ctx.fillRect(
      upgrade.x - upgrade.width / 2 + 4,
      upgrade.y - upgrade.height / 2 + 4,
      upgrade.width - 8,
      upgrade.height - 8,
    );

    ctx.fillStyle = "#111";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(upgrade.label, upgrade.x, upgrade.y + 0.5);

    const hpRatio = Math.max(0, upgrade.hp / upgrade.maxHp);
    const hpWidth = 34;
    const hpHeight = 5;

    ctx.fillStyle = "#111";
    ctx.fillRect(upgrade.x - hpWidth / 2, upgrade.y - upgrade.height / 2 - 10, hpWidth, hpHeight);

    ctx.fillStyle = upgrade.kind === "unit" ? "#4d9cff" : upgrade.enabled ? "#6cff6c" : "#ff8a8a";
    ctx.fillRect(upgrade.x - hpWidth / 2, upgrade.y - upgrade.height / 2 - 10, hpWidth * hpRatio, hpHeight);

    if (upgrade.kind !== "unit" && !upgrade.enabled) {
      ctx.strokeStyle = "#ff4444";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(upgrade.x - 12, upgrade.y - 12);
      ctx.lineTo(upgrade.x + 12, upgrade.y + 12);
      ctx.moveTo(upgrade.x + 12, upgrade.y - 12);
      ctx.lineTo(upgrade.x - 12, upgrade.y + 12);
      ctx.stroke();
    }
  }

  ctx.textBaseline = "alphabetic";
}

function drawHud(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: GameState): void {
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Units: ${state.player.units}`, 20, 30);
  ctx.fillText(`Damage: ${state.player.damage.toFixed(1)}`, 20, 58);
  ctx.fillText(`Fire Rate: ${state.player.attackSpeed.toFixed(2)}/s`, 20, 86);
  ctx.fillText(`Score: ${state.score}`, 20, 114);
  ctx.fillText(`Enemies: ${state.enemies.length}`, 20, 142);

  ctx.textAlign = "right";
  ctx.fillText("Move: A/D or ←/→", canvas.width - 20, 30);
  ctx.fillText("Collect green for weapon, blue for units", canvas.width - 20, 58);
  ctx.fillText("R to restart after game over", canvas.width - 20, 86);
}

function drawGameOver(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "48px sans-serif";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = "24px sans-serif";
  ctx.fillText("An enemy reached the base or all units died", canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText("Press R to restart", canvas.width / 2, canvas.height / 2 + 56);
}

export function draw(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  state: GameState,
): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawColumns(ctx, canvas);
  drawBase(ctx, canvas, state);
  drawPlayer(ctx, state.player);
  drawProjectiles(ctx, state.projectiles);
  drawEnemies(ctx, state.enemies);
  drawUpgrades(ctx, state.upgrades);
  drawHud(ctx, canvas, state);

  if (state.phase === "gameover") {
    drawGameOver(ctx, canvas);
  }
}
