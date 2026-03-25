import type { Enemy, Explosion, GameState, Player, Projectile, Upgrade } from "./types.js";
import {
  getEnemyColumnCenterX,
  getEnemyColumnLeft,
  getEnemyColumnRight,
  getUnitWorldPositions,
} from "./state.js";

function drawColumns(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  const fourth = canvas.width / 4;

  ctx.fillStyle = "#1f3a1f";
  ctx.fillRect(0, 0, fourth, canvas.height);

  ctx.fillStyle = "#3a2f1f";
  ctx.fillRect(fourth, 0, fourth, canvas.height);

  ctx.fillStyle = "#2d2d2d";
  ctx.fillRect(fourth * 2, 0, fourth, canvas.height);

  ctx.fillStyle = "#1f2f4a";
  ctx.fillRect(fourth * 3, 0, fourth, canvas.height);

  ctx.strokeStyle = "#666";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fourth, 0);
  ctx.lineTo(fourth, canvas.height);
  ctx.moveTo(fourth * 2, 0);
  ctx.lineTo(fourth * 2, canvas.height);
  ctx.moveTo(fourth * 3, 0);
  ctx.lineTo(fourth * 3, canvas.height);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("WEAPON", fourth * 0.5, 36);
  ctx.fillText("SPECIAL", fourth * 1.5, 36);
  ctx.fillText("ENEMIES", fourth * 2.5, 36);
  ctx.fillText("UNITS", fourth * 3.5, 36);
}

function drawBase(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: GameState): void {
  ctx.strokeStyle = "#ffcc66";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(getEnemyColumnLeft(canvas), state.baseY);
  ctx.lineTo(getEnemyColumnRight(canvas), state.baseY);
  ctx.stroke();

  ctx.fillStyle = "#ffcc66";
  ctx.font = "18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("BASE", getEnemyColumnCenterX(canvas), state.baseY - 10);
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

  if (player.supportUnits > 0) {
    const radius = 34;

    for (let i = 0; i < player.supportUnits; i++) {
      const angle = (i / Math.max(1, player.supportUnits)) * Math.PI * 2;
      const x = player.x + Math.cos(angle) * radius;
      const y = player.y + Math.sin(angle) * radius;

      ctx.fillStyle = "#444";
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#ffcc33";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#ffcc33";
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#ffcc33";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 4, y);
      ctx.lineTo(x + 4, y);
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x, y + 4);
      ctx.stroke();
    }
  }
}

function drawProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]): void {
  for (const projectile of projectiles) {
    if (projectile.radius <= 3) {
        ctx.fillStyle = "#d0f0ff";
    } else {
        ctx.fillStyle = projectile.radius >= 5 ? "#ff9f43" : "#ffe082";
    }
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
    ctx.fill();

    if (projectile.radius >= 5) {
        ctx.fillStyle = "#ffd6a0";
        ctx.beginPath();
        ctx.arc(projectile.x - 1.5, projectile.y - 1.5, projectile.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
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

function drawSpecialBox(ctx: CanvasRenderingContext2D, state: GameState): void {
  const box = state.specialBox;

  ctx.fillStyle = "#a84cff";
  ctx.fillRect(box.x - box.width / 2, box.y - box.height / 2, box.width, box.height);

  ctx.fillStyle = "#e4c9ff";
  ctx.fillRect(box.x - box.width / 2 + 5, box.y - box.height / 2 + 5, box.width - 10, box.height - 10);

  ctx.fillStyle = "#111";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SP", box.x, box.y);

  const hpRatio = Math.max(0, box.hp / box.maxHp);
  const hpWidth = 46;
  const hpHeight = 6;

  ctx.fillStyle = "#111";
  ctx.fillRect(box.x - hpWidth / 2, box.y - box.height / 2 - 12, hpWidth, hpHeight);

  ctx.fillStyle = "#ff77ff";
  ctx.fillRect(box.x - hpWidth / 2, box.y - box.height / 2 - 12, hpWidth * hpRatio, hpHeight);

  ctx.textBaseline = "alphabetic";
}

function drawExplosions(ctx: CanvasRenderingContext2D, explosions: Explosion[]): void {
  for (const explosion of explosions) {
    const alpha = Math.max(0, explosion.life / explosion.maxLife);

    ctx.fillStyle = `rgba(255, 170, 60, ${0.28 * alpha})`;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 230, 160, ${0.9 * alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawRoller(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: GameState): void {
  if (!state.roller.active) {
    return;
  }

  const x = canvas.width * 0.625;

  ctx.fillStyle = "#ffcc33";
  ctx.beginPath();
  ctx.arc(x, state.roller.y, state.roller.radius, 0, Math.PI * 2);
  ctx.fill();
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

  if (state.player.specialWeapon !== null) {
    ctx.fillText(`Special: ${state.player.specialWeapon}`, 20, 170);
    ctx.fillText(`Time: ${state.player.specialTimer.toFixed(1)}`, 20, 198);
  }

  ctx.textAlign = "right";
  ctx.fillText("Move: A/D or ←/→", canvas.width - 20, 30);
  // ctx.fillText("Shoot upgrades and special box", canvas.width - 20, 58);
  // ctx.fillText("R to restart after game over", canvas.width - 20, 86);
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
  drawSpecialBox(ctx, state);
  drawPlayer(ctx, state.player);
  drawProjectiles(ctx, state.projectiles);
  drawExplosions(ctx, state.explosions);
  drawRoller(ctx, canvas, state);
  drawEnemies(ctx, state.enemies);
  drawUpgrades(ctx, state.upgrades);
  drawHud(ctx, canvas, state);

  if (state.phase === "gameover") {
    drawGameOver(ctx, canvas);
  }
}
