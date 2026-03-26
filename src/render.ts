import type { Enemy, Explosion, GameState, Player, Projectile, Upgrade } from "./types.js";
import {
  getEnemyColumnCenterX,
  getEnemyColumnLeft,
  getEnemyColumnRight,
  getUnitWorldPositions,
} from "./state.js";

type ProjectedPoint = {
  x: number;
  y: number;
  scale: number;
  progress: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getHorizonY(canvas: HTMLCanvasElement): number {
  return canvas.height * -0.18;
}

function getPlayfieldNearBounds(
  canvas: HTMLCanvasElement,
): { left: number; right: number; centerX: number; width: number } {
  return {
    left: 0,
    right: canvas.width,
    centerX: canvas.width * 0.5,
    width: canvas.width,
  };
}

function getPlayfieldEdgesAtY(
  canvas: HTMLCanvasElement,
  worldY: number,
  baseY: number,
): { left: number; right: number; progress: number; rawProgress: number } {
  const near = getPlayfieldNearBounds(canvas);
  const horizonY = getHorizonY(canvas);

  const rawProgress = (worldY - horizonY) / (baseY - horizonY);
  const progress = clamp(rawProgress, 0, 1);
  const topWidth = near.width * 0.46;
  const width = lerp(topWidth, near.width, progress);

  return {
    left: near.centerX - width * 0.5,
    right: near.centerX + width * 0.5,
    progress,
    rawProgress,
  };
}

function getLaneEdgesAtY(
  canvas: HTMLCanvasElement,
  columnIndex: number,
  worldY: number,
  baseY: number,
): { left: number; right: number; progress: number } {
  const playfieldNear = getPlayfieldNearBounds(canvas);
  const projectedPlayfield = getPlayfieldEdgesAtY(canvas, worldY, baseY);

  const nearLeft = lerp(playfieldNear.left, playfieldNear.right, columnIndex / 4);
  const nearRight = lerp(playfieldNear.left, playfieldNear.right, (columnIndex + 1) / 4);

  const normalizedLeft = (nearLeft - playfieldNear.left) / playfieldNear.width;
  const normalizedRight = (nearRight - playfieldNear.left) / playfieldNear.width;

  return {
    left: lerp(projectedPlayfield.left, projectedPlayfield.right, normalizedLeft),
    right: lerp(projectedPlayfield.left, projectedPlayfield.right, normalizedRight),
    progress: projectedPlayfield.progress,
  };
}

function projectLanePoint(
  canvas: HTMLCanvasElement,
  worldX: number,
  worldY: number,
  baseY: number,
): ProjectedPoint {
  const playfieldNear = getPlayfieldNearBounds(canvas);
  const projectedPlayfield = getPlayfieldEdgesAtY(canvas, worldY, baseY);
  const horizonY = getHorizonY(canvas);
  const normalizedX = clamp((worldX - playfieldNear.left) / playfieldNear.width, 0, 1);

  return {
    x: lerp(projectedPlayfield.left, projectedPlayfield.right, normalizedX),
    y: lerp(horizonY, baseY, projectedPlayfield.rawProgress),
    scale: lerp(0.42, 1, projectedPlayfield.progress),
    progress: projectedPlayfield.progress,
  };
}

function getEnemyLaneEdgesAtY(
  canvas: HTMLCanvasElement,
  worldY: number,
  baseY: number,
): { left: number; right: number; progress: number } {
  return getLaneEdgesAtY(canvas, 2, worldY, baseY);
}

function projectEnemyLanePoint(
  canvas: HTMLCanvasElement,
  worldX: number,
  worldY: number,
  baseY: number,
): ProjectedPoint {
  return projectLanePoint(canvas, worldX, worldY, baseY);
}

function isInsidePlayfield(canvas: HTMLCanvasElement, x: number): boolean {
  return x >= 0 && x <= canvas.width;
}

function drawColumns(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: GameState): void {
  const fourth = canvas.width / 4;
  const horizonY = getHorizonY(canvas);

  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const laneFillColors: readonly [string, string, string, string] = ["#2a4a2a", "#524126", "#353535", "#2a3f62"];
  const laneLineColors: readonly [string, string, string, string] = ["#4a6d4a", "#6a5736", "#555", "#4e6fa0"];

  for (const columnIndex of [0, 1, 2, 3] as const) {
    const nearLeft = fourth * columnIndex;
    const nearRight = nearLeft + fourth;
    const topLane = getLaneEdgesAtY(canvas, columnIndex, horizonY, state.baseY);

    ctx.fillStyle = laneFillColors[columnIndex];
    ctx.beginPath();
    ctx.moveTo(topLane.left, horizonY);
    ctx.lineTo(topLane.right, horizonY);
    ctx.lineTo(nearRight, state.baseY);
    ctx.lineTo(nearLeft, state.baseY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = laneLineColors[columnIndex];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(topLane.left, horizonY);
    ctx.lineTo(nearLeft, state.baseY);
    ctx.moveTo(topLane.right, horizonY);
    ctx.lineTo(nearRight, state.baseY);
    ctx.stroke();

    ctx.strokeStyle = columnIndex === 2 ? "#404040" : "rgba(255, 255, 255, 0.09)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const y = lerp(horizonY, state.baseY, i / 6);
      const edges = getLaneEdgesAtY(canvas, columnIndex, y, state.baseY);
      ctx.beginPath();
      ctx.moveTo(edges.left, y);
      ctx.lineTo(edges.right, y);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = "#666";
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    const nearX = fourth * i;
    const top = getLaneEdgesAtY(canvas, i - 1, horizonY, state.baseY).right;
    ctx.beginPath();
    ctx.moveTo(top, horizonY);
    ctx.lineTo(nearX, state.baseY);
    ctx.stroke();
  }

  // ctx.fillStyle = "#ffffff";
  // ctx.font = "18px sans-serif";
  // ctx.textAlign = "center";
  // ctx.fillText("WEAPON", fourth * 0.5, 36);
  // ctx.fillText("SPECIAL", fourth * 1.5, 36);
  // ctx.fillText("ENEMIES", fourth * 2.5, 36);
  // ctx.fillText("UNITS", fourth * 3.5, 36);
}

function drawBase(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: GameState): void {
  ctx.strokeStyle = "#ffcc66";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(getEnemyColumnLeft(canvas), state.baseY);
  ctx.lineTo(getEnemyColumnRight(canvas), state.baseY);
  ctx.stroke();

  ctx.fillStyle = "#ffcc66";
  ctx.font = "18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("BASE", getEnemyColumnCenterX(canvas), state.baseY - 12);
}

function drawUnitBody(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  ctx.fillStyle = "#285d99";
  ctx.beginPath();
  ctx.arc(x + radius * 0.18, y + radius * 0.2, radius * 1.02, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#4d9cff";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#cfe4ff";
  ctx.beginPath();
  ctx.arc(x - radius * 0.32, y - radius * 0.34, radius * 0.34, 0, Math.PI * 2);
  ctx.fill();
}

function drawMineBody(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  ctx.fillStyle = "#2a2a2a";
  ctx.beginPath();
  ctx.arc(x + radius * 0.16, y + radius * 0.18, radius * 1.02, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#444";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ffcc33";
  ctx.lineWidth = Math.max(1.5, radius * 0.22);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ffcc33";
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ffcc33";
  ctx.lineWidth = Math.max(1.4, radius * 0.16);
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.5, y);
  ctx.lineTo(x + radius * 0.5, y);
  ctx.moveTo(x, y - radius * 0.5);
  ctx.lineTo(x, y + radius * 0.5);
  ctx.stroke();
}

function drawPlayer(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: GameState): void {
  const positions = getUnitWorldPositions(state.player)
    .map((unit) => {
      const projected = projectLanePoint(canvas, unit.x, unit.y, state.baseY);
      return {
        x: projected.x,
        y: projected.y,
        radius: 12 * projected.scale,
      };
    })
    .sort((a, b) => a.y - b.y);

  for (const unit of positions) {
    drawUnitBody(ctx, unit.x, unit.y, unit.radius);
  }

  if (state.player.supportUnits > 0) {
    const minesPerRow = 5;
    const mineWorldRadius = 8;
    const spacingX = mineWorldRadius * 2 + 2;
    const spacingY = mineWorldRadius * 2 + 2;
    const centerX = getEnemyColumnCenterX(canvas);
    const baseY = state.player.y - 140;

    for (let i = 0; i < state.player.supportUnits; i++) {
      const row = Math.floor(i / minesPerRow);
      const col = i % minesPerRow;

      const worldX = centerX + (col - (minesPerRow - 1) / 2) * spacingX;
      const worldY = baseY - row * spacingY;
      const projected = projectEnemyLanePoint(canvas, worldX, worldY, state.baseY);
      const radius = mineWorldRadius * projected.scale;

      drawMineBody(ctx, projected.x, projected.y, radius);
    }
  }
}

function drawProjectiles(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: GameState): void {
  for (const projectile of state.projectiles) {
    let drawX = projectile.x;
    let drawY = projectile.y;
    let radius = projectile.radius;

    if (isInsidePlayfield(canvas, projectile.x)) {
      const projected = projectLanePoint(canvas, projectile.x, projectile.y, state.baseY);
      drawX = projected.x;
      drawY = projected.y;
      radius = projectile.radius * lerp(0.65, 1, projected.progress);
    }

    if (projectile.radius <= 3) {
      ctx.fillStyle = "#d0f0ff";
    } else {
      ctx.fillStyle = projectile.radius >= 5 ? "#ff9f43" : "#ffe082";
    }

    ctx.beginPath();
    ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
    ctx.fill();

    if (projectile.radius >= 5) {
      ctx.fillStyle = "#ffd6a0";
      ctx.beginPath();
      ctx.arc(drawX - radius * 0.28, drawY - radius * 0.28, radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawEnemies(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: GameState): void {
  const enemies = [...state.enemies].sort((a, b) => a.y - b.y);

  for (const enemy of enemies) {
    const projected = projectEnemyLanePoint(canvas, enemy.x, enemy.y, state.baseY);
    const radius = enemy.radius * projected.scale;

    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.beginPath();
    ctx.ellipse(projected.x, projected.y + radius * 0.78, radius * 0.92, radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = enemy.isBoss ? "#a94e1b" : "#7d2424";
    ctx.beginPath();
    ctx.arc(projected.x + radius * 0.16, projected.y + radius * 0.18, radius * 1.02, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = enemy.isBoss ? "#ff8844" : "#d94a4a";
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = enemy.isBoss ? "#ffd2aa" : "#ffc0c0";
    ctx.beginPath();
    ctx.arc(projected.x - radius * 0.32, projected.y - radius * 0.34, radius * 0.34, 0, Math.PI * 2);
    ctx.fill();

    const hpWidth = (enemy.isBoss ? 60 : 32) * lerp(0.7, 1, projected.progress);
    const hpHeight = Math.max(3, 5 * lerp(0.7, 1, projected.progress));
    const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);

    ctx.fillStyle = "#111";
    ctx.fillRect(projected.x - hpWidth / 2, projected.y - radius - 14 * projected.scale, hpWidth, hpHeight);

    ctx.fillStyle = "#6cff6c";
    ctx.fillRect(projected.x - hpWidth / 2, projected.y - radius - 14 * projected.scale, hpWidth * hpRatio, hpHeight);
  }
}

function drawUpgradeCube(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  frontColor: string,
  topColor: string,
  sideColor: string,
): void {
  const left = x - width / 2;
  const top = y - height / 2;
  const depth = Math.max(3, width * 0.14);

  ctx.fillStyle = sideColor;
  ctx.beginPath();
  ctx.moveTo(left + width, top);
  ctx.lineTo(left + width + depth, top - depth);
  ctx.lineTo(left + width + depth, top + height - depth);
  ctx.lineTo(left + width, top + height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = topColor;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left + depth, top - depth);
  ctx.lineTo(left + width + depth, top - depth);
  ctx.lineTo(left + width, top);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = frontColor;
  ctx.fillRect(left, top, width, height);
}

function drawUpgrades(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: GameState): void {
  const upgrades = [...state.upgrades].sort((a, b) => a.y - b.y);

  for (const upgrade of upgrades) {
    let frontColor = "#4d9cff";
    let topColor = "#dcecff";
    let sideColor = "#274a78";

    if (upgrade.kind === "weapon-speed") {
      frontColor = upgrade.enabled ? "#e6d94a" : "#7a7440";
      topColor = upgrade.enabled ? "#fff6b3" : "#aaa27a";
      sideColor = upgrade.enabled ? "#9c9125" : "#57522b";
    } else if (upgrade.kind === "weapon-damage") {
      frontColor = upgrade.enabled ? "#57d657" : "#3f6f3f";
      topColor = upgrade.enabled ? "#c9ffc9" : "#8fb28f";
      sideColor = upgrade.enabled ? "#2e912e" : "#315031";
    }

    const projected = projectLanePoint(canvas, upgrade.x, upgrade.y, state.baseY);
    const width = upgrade.width * projected.scale;
    const height = upgrade.height * projected.scale;

    drawUpgradeCube(
      ctx,
      projected.x,
      projected.y,
      width,
      height,
      frontColor,
      topColor,
      sideColor,
    );

    ctx.fillStyle = "#111";
    ctx.font = `bold ${Math.max(8, Math.round(12 * projected.scale))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(upgrade.label, projected.x, projected.y + 0.5);

    const hpRatio = Math.max(0, upgrade.hp / upgrade.maxHp);
    const hpWidth = 34 * projected.scale;
    const hpHeight = Math.max(3, 5 * projected.scale);

    ctx.fillStyle = "#111";
    ctx.fillRect(projected.x - hpWidth / 2, projected.y - height / 2 - 14 * projected.scale, hpWidth, hpHeight);

    ctx.fillStyle = upgrade.kind === "unit" ? "#4d9cff" : upgrade.enabled ? "#6cff6c" : "#ff8a8a";
    ctx.fillRect(projected.x - hpWidth / 2, projected.y - height / 2 - 14 * projected.scale, hpWidth * hpRatio, hpHeight);

    if (upgrade.kind !== "unit" && !upgrade.enabled) {
      const crossRadius = 12 * projected.scale;
      ctx.strokeStyle = "#ff4444";
      ctx.lineWidth = Math.max(1.5, 3 * projected.scale);
      ctx.beginPath();
      ctx.moveTo(projected.x - crossRadius, projected.y - crossRadius);
      ctx.lineTo(projected.x + crossRadius, projected.y + crossRadius);
      ctx.moveTo(projected.x + crossRadius, projected.y - crossRadius);
      ctx.lineTo(projected.x - crossRadius, projected.y + crossRadius);
      ctx.stroke();
    }
  }

  ctx.textBaseline = "alphabetic";
}

function drawSpecialBox(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: GameState): void {
  const box = state.specialBox;
  const projected = projectLanePoint(canvas, box.x, box.y, state.baseY);
  const width = box.width * projected.scale;
  const height = box.height * projected.scale;
  const depth = Math.max(3, 8 * projected.scale);

  ctx.fillStyle = "#6e24b7";
  ctx.beginPath();
  ctx.moveTo(projected.x + width / 2, projected.y - height / 2);
  ctx.lineTo(projected.x + width / 2 + depth, projected.y - height / 2 - depth);
  ctx.lineTo(projected.x + width / 2 + depth, projected.y + height / 2 - depth);
  ctx.lineTo(projected.x + width / 2, projected.y + height / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#d2a8ff";
  ctx.beginPath();
  ctx.moveTo(projected.x - width / 2, projected.y - height / 2);
  ctx.lineTo(projected.x - width / 2 + depth, projected.y - height / 2 - depth);
  ctx.lineTo(projected.x + width / 2 + depth, projected.y - height / 2 - depth);
  ctx.lineTo(projected.x + width / 2, projected.y - height / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#a84cff";
  ctx.fillRect(projected.x - width / 2, projected.y - height / 2, width, height);

  const innerPadding = Math.max(2, 5 * projected.scale);
  ctx.fillStyle = "#e4c9ff";
  ctx.fillRect(
    projected.x - width / 2 + innerPadding,
    projected.y - height / 2 + innerPadding,
    width - innerPadding * 2,
    height - innerPadding * 2,
  );

  ctx.fillStyle = "#111";
  ctx.font = `bold ${Math.max(8, Math.round(11 * projected.scale))}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SP", projected.x, projected.y);

  const hpRatio = Math.max(0, box.hp / box.maxHp);
  const hpWidth = 46 * projected.scale;
  const hpHeight = Math.max(3, 6 * projected.scale);

  ctx.fillStyle = "#111";
  ctx.fillRect(projected.x - hpWidth / 2, projected.y - height / 2 - 16 * projected.scale, hpWidth, hpHeight);

  ctx.fillStyle = "#ff77ff";
  ctx.fillRect(projected.x - hpWidth / 2, projected.y - height / 2 - 16 * projected.scale, hpWidth * hpRatio, hpHeight);

  ctx.textBaseline = "alphabetic";
}

function drawExplosions(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: GameState): void {
  for (const explosion of state.explosions) {
    let drawX = explosion.x;
    let drawY = explosion.y;
    let drawRadius = explosion.radius;

    if (isInsidePlayfield(canvas, explosion.x)) {
      const projected = projectLanePoint(canvas, explosion.x, explosion.y, state.baseY);
      drawX = projected.x;
      drawY = projected.y;
      drawRadius = explosion.radius * lerp(0.65, 1, projected.progress);
    }

    const alpha = Math.max(0, explosion.life / explosion.maxLife);

    ctx.fillStyle = `rgba(255, 170, 60, ${0.28 * alpha})`;
    ctx.beginPath();
    ctx.arc(drawX, drawY, drawRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 230, 160, ${0.9 * alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(drawX, drawY, drawRadius * 0.72, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawRoller(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: GameState): void {
  if (!state.roller.active) {
    return;
  }

  const projected = projectEnemyLanePoint(canvas, getEnemyColumnCenterX(canvas), state.roller.y, state.baseY);
  const radius = state.roller.radius * projected.scale;

  ctx.fillStyle = "#9c6f00";
  ctx.beginPath();
  ctx.arc(projected.x + radius * 0.16, projected.y + radius * 0.18, radius * 1.02, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffcc33";
  ctx.beginPath();
  ctx.arc(projected.x, projected.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#fff2a6";
  ctx.lineWidth = Math.max(1.5, radius * 0.15);
  ctx.beginPath();
  ctx.arc(projected.x, projected.y, radius * 0.72, 0, Math.PI * 2);
  ctx.stroke();
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

  if (state.roller.active) {
    ctx.fillText("Roller: active", 20, state.player.specialWeapon !== null ? 226 : 170);
  }

  if (state.player.supportUnits > 0) {
    const mineLineY = state.player.specialWeapon !== null
      ? (state.roller.active ? 254 : 226)
      : (state.roller.active ? 198 : 170);

    ctx.fillText(`Mines: ${state.player.supportUnits}`, 20, mineLineY);
  }

  ctx.textAlign = "right";
  ctx.fillText("Move: A/D or ←/→", canvas.width - 20, 30);
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

  drawColumns(ctx, canvas, state);
  drawBase(ctx, canvas, state);
  drawSpecialBox(ctx, canvas, state);
  drawPlayer(ctx, canvas, state);
  drawProjectiles(ctx, canvas, state);
  drawExplosions(ctx, canvas, state);
  drawRoller(ctx, canvas, state);
  drawEnemies(ctx, canvas, state);
  drawUpgrades(ctx, canvas, state);
  drawHud(ctx, canvas, state);

  if (state.phase === "gameover") {
    drawGameOver(ctx, canvas);
  }
}
