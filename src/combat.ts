import type { Enemy, GameState, Projectile, Upgrade } from "./types.js";
import {
  getFormationHalfWidth,
  getLeftColumnWidth,
  getMiddleColumnLeft,
  getMiddleColumnWidth,
  getRightColumnLeft,
  getUnitWorldPositions,
} from "./state.js";

function getColumnCenterX(canvas: HTMLCanvasElement, columnIndex: number): number {
  return (canvas.width / 3) * (columnIndex + 0.5);
}

function getUpgradeHp(): number {
  return 40;
}

function getBossHp(score: number): number {
  return 180 + score * 2.5;
}

function getNormalEnemyHp(score: number): number {
  return 24 + score * 0.6;
}

function getNextUnitUpgradeTier(tier: number): { tier: number; value: number; isMultiplier: boolean; label: string } {
  if (tier <= 0) {
    return { tier: 1, value: 1, isMultiplier: false, label: "+1" };
  }

  if (tier === 1) {
    return { tier: 2, value: 2, isMultiplier: false, label: "+2" };
  }

  if (tier === 2) {
    return { tier: 3, value: 5, isMultiplier: false, label: "+5" };
  }

  return { tier: 4, value: 2, isMultiplier: true, label: "x2" };
}

function removeOneUnit(state: GameState): void {
  state.player.units = Math.max(0, state.player.units - 1);

  if (state.player.units <= 0) {
    state.phase = "gameover";
    state.projectiles = [];
  }
}
function getEnemySpeed(): number {
  return 12;
}

function getEnemySpawnInterval(score: number): number {
  return 0.08;
}

function shouldSpawnBoss(score: number): boolean {
  const chance = Math.min(0.04 + score * 0.0008, 0.12);
  return Math.random() < chance/10.0;
}

function chooseOne<T>(entries: Array<{ value: T; weight: number }>): T {
  let totalWeight = 0;

  for (const entry of entries) {
    totalWeight += entry.weight;
  }

  let roll = Math.random() * totalWeight;

  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.value;
    }
  }

  return entries[entries.length - 1]!.value;
}

function getWeaponUpgradePercent(): number {
  return chooseOne([
    { value: 0.02, weight: 1 },
    { value: 0.05, weight: 1 },
    { value: 0.1, weight: 1 },
    { value: 0.15, weight: 1 },
  ]);
}

function getUnitUpgradeRoll(): { value: number; isMultiplier: boolean; label: string } {
  return chooseOne([
    { value: { value: 1, isMultiplier: false, label: "+1" }, weight: 50 },
    { value: { value: 2, isMultiplier: false, label: "+2" }, weight: 28 },
    { value: { value: 5, isMultiplier: false, label: "+5" }, weight: 20 },
    { value: { value: 2, isMultiplier: true, label: "x2" }, weight: 2 },
  ]);
}

function addWeaponUpgrade(state: GameState, upgrade: Upgrade): void {
  if (upgrade.kind === "weapon-speed") {
    state.player.attackSpeed *= 1 + upgrade.value;
    return;
  }

  if (upgrade.kind === "weapon-damage") {
    state.player.damage *= 1 + upgrade.value;
  }
}

function addUnitUpgrade(state: GameState, upgrade: Upgrade): void {
  if (upgrade.isMultiplier) {
    state.player.units = Math.max(1, Math.floor(state.player.units * upgrade.value));
    return;
  }

  state.player.units += upgrade.value;
}

function spawnEnemy(state: GameState, canvas: HTMLCanvasElement, isBoss: boolean): void {
  const middleLeft = getMiddleColumnLeft(canvas);
  const middleWidth = getMiddleColumnWidth(canvas);
  const speed = getEnemySpeed();

  if (isBoss) {
    const bossHp = getBossHp(state.score);
    state.enemies.push({
      x: getColumnCenterX(canvas, 1),
      y: -40,
      hp: bossHp,
      maxHp: bossHp,
      speed,
      radius: 24,
      isBoss: true,
    });
  } else {
    const hp = getNormalEnemyHp(state.score);
    state.enemies.push({
      x: middleLeft + middleWidth * (0.06 + Math.random() * 0.88),
      y: -20,
      hp,
      maxHp: hp,
      speed,
      radius: 14,
      isBoss: false,
    });
  }
}

function updateEnemySpawns(state: GameState, canvas: HTMLCanvasElement, dt: number): void {
  state.enemySpawnTimer -= dt;
  const spawnInterval = getEnemySpawnInterval(state.score);

  while (state.enemySpawnTimer <= 0) {
    spawnEnemy(state, canvas, shouldSpawnBoss(state.score));
    state.enemySpawnTimer += spawnInterval;
  }
}

function spawnWeaponUpgrade(state: GameState, canvas: HTMLCanvasElement): void {
  const value = getWeaponUpgradePercent();
  const isSpeedUpgrade = Math.random() < 0.5;
  const hp = getUpgradeHp();

  state.upgrades.push({
    kind: isSpeedUpgrade ? "weapon-speed" : "weapon-damage",
    x: getColumnCenterX(canvas, 0),
    y: -24,
    width: 40,
    height: 40,
    speed: 95,
    value,
    isMultiplier: false,
    label: `${Math.round(value * 100)}%`,
    hp,
    maxHp: hp,
    enabled: false,
    tier: 0,
  });
}

function spawnUnitUpgrade(state: GameState, canvas: HTMLCanvasElement): void {
  const firstTier = getNextUnitUpgradeTier(0);
  const hp = getUpgradeHp();

  state.upgrades.push({
    kind: "unit",
    x: getColumnCenterX(canvas, 2),
    y: -24,
    width: 40,
    height: 40,
    speed: 95,
    value: firstTier.value,
    isMultiplier: firstTier.isMultiplier,
    label: firstTier.label,
    hp,
    maxHp: hp,
    enabled: true,
    tier: firstTier.tier,
  });
}

function updateUpgradeSpawns(state: GameState, canvas: HTMLCanvasElement, dt: number): void {
  state.weaponUpgradeSpawnTimer -= dt;
  state.unitUpgradeSpawnTimer -= dt;

  const weaponUpgradeInterval = 2;
  const unitUpgradeInterval = 1 / 0.3;

  while (state.weaponUpgradeSpawnTimer <= 0) {
    spawnWeaponUpgrade(state, canvas);
    state.weaponUpgradeSpawnTimer += weaponUpgradeInterval;
  }

  while (state.unitUpgradeSpawnTimer <= 0) {
    spawnUnitUpgrade(state, canvas);
    state.unitUpgradeSpawnTimer += unitUpgradeInterval;
  }
}

function updatePlayerMovement(state: GameState, canvas: HTMLCanvasElement, dt: number): void {
  let direction = 0;

  if (state.input.left) {
    direction -= 1;
  }

  if (state.input.right) {
    direction += 1;
  }

  state.player.x += direction * state.player.moveSpeed * dt;

  const halfWidth = getFormationHalfWidth(state.player.units);
  const minX = halfWidth;
  const maxX = canvas.width - halfWidth;

  if (state.player.x < minX) {
    state.player.x = minX;
  }

  if (state.player.x > maxX) {
    state.player.x = maxX;
  }
}

function fireProjectiles(state: GameState): void {
  const unitPositions = getUnitWorldPositions(state.player);

  for (const unit of unitPositions) {
    state.projectiles.push({
      x: unit.x,
      y: unit.y - 14,
      radius: 4,
      speed: 460,
      damage: state.player.damage,
    });
  }
}

function updateProjectiles(state: GameState, dt: number): void {
  for (const projectile of state.projectiles) {
    projectile.y -= projectile.speed * dt;
  }

  state.projectiles = state.projectiles.filter((projectile) => projectile.y + projectile.radius > 0);
}

function updateEnemies(state: GameState, dt: number): void {
  for (const enemy of state.enemies) {
    enemy.y += enemy.speed * dt;
  }
}

function updateUpgrades(state: GameState, dt: number): void {
  for (const upgrade of state.upgrades) {
    upgrade.y += upgrade.speed * dt;
  }
}

function circleIntersectsRect(
  circleX: number,
  circleY: number,
  circleRadius: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number,
): boolean {
  const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
  const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
  const dx = circleX - closestX;
  const dy = circleY - closestY;
  return dx * dx + dy * dy <= circleRadius * circleRadius;
}

function handleProjectileHits(state: GameState): void {
  const survivingProjectiles: Projectile[] = [];

  for (const projectile of state.projectiles) {
    let hitEnemy = false;

    for (const enemy of state.enemies) {
      const dx = projectile.x - enemy.x;
      const dy = projectile.y - enemy.y;
      const distance = Math.hypot(dx, dy);

      if (distance < projectile.radius + enemy.radius) {
        enemy.hp -= projectile.damage;
        hitEnemy = true;

        if (enemy.hp <= 0) {
          state.score += enemy.isBoss ? 10 : 1;
        }

        break;
      }
    }

    if (!hitEnemy) {
      survivingProjectiles.push(projectile);
    }
  }

  state.projectiles = survivingProjectiles;
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
}

function handleProjectileUpgradeHits(state: GameState): void {
  const survivingProjectiles: Projectile[] = [];

  for (const projectile of state.projectiles) {
    let hitUpgrade = false;

    for (const upgrade of state.upgrades) {
      const rectX = upgrade.x - upgrade.width / 2;
      const rectY = upgrade.y - upgrade.height / 2;

      if (
        circleIntersectsRect(
          projectile.x,
          projectile.y,
          projectile.radius,
          rectX,
          rectY,
          upgrade.width,
          upgrade.height,
        )
      ) {
        hitUpgrade = true;
        upgrade.hp -= projectile.damage;

        if (upgrade.hp <= 0) {
          if (upgrade.kind === "unit") {
            const nextTier = getNextUnitUpgradeTier(upgrade.tier);
            upgrade.tier = nextTier.tier;
            upgrade.value = nextTier.value;
            upgrade.isMultiplier = nextTier.isMultiplier;
            upgrade.label = nextTier.label;
            upgrade.hp = upgrade.maxHp;
          } else if (!upgrade.enabled) {
            upgrade.enabled = true;
            upgrade.hp = upgrade.maxHp;
          } else {
            upgrade.hp = upgrade.maxHp;
          }
        }

        break;
      }
    }

    if (!hitUpgrade) {
      survivingProjectiles.push(projectile);
    }
  }

  state.projectiles = survivingProjectiles;
}

function handleEnemyUnitCollisions(state: GameState): void {
  if (state.player.units <= 0) {
    return;
  }

  const unitPositions = getUnitWorldPositions(state.player);
  const aliveUnitFlags = unitPositions.map(() => true);
  const survivingEnemies: Enemy[] = [];

  for (const enemy of state.enemies) {
    let consumedUnit = false;

    for (let i = 0; i < unitPositions.length; i++) {
      if (!aliveUnitFlags[i]) {
        continue;
      }

      const unit = unitPositions[i];
      if (unit === undefined) {
        continue;
      }

      const dx = enemy.x - unit.x;
      const dy = enemy.y - unit.y;
      const distance = Math.hypot(dx, dy);

      if (distance < enemy.radius + 12) {
        aliveUnitFlags[i] = false;
        consumedUnit = true;
        break;
      }
    }

    if (!consumedUnit) {
      survivingEnemies.push(enemy);
    }
  }

  state.enemies = survivingEnemies;
  state.player.units = aliveUnitFlags.filter(Boolean).length;

  if (state.player.units <= 0) {
    state.phase = "gameover";
    state.projectiles = [];
  }
}

function handleUpgradeCollisions(state: GameState): void {
  const unitPositions = getUnitWorldPositions(state.player);
  const survivingUpgrades: Upgrade[] = [];

  for (const upgrade of state.upgrades) {
    let collected = false;

    for (const unit of unitPositions) {
      if (
        circleIntersectsRect(
          unit.x,
          unit.y,
          12,
          upgrade.x - upgrade.width / 2,
          upgrade.y - upgrade.height / 2,
          upgrade.width,
          upgrade.height,
        )
      ) {
        collected = true;

        if (upgrade.kind === "unit") {
          addUnitUpgrade(state, upgrade);
        } else if (upgrade.enabled) {
          addWeaponUpgrade(state, upgrade);
        } else {
          removeOneUnit(state);
        }

        break;
      }
    }

    if (!collected) {
      survivingUpgrades.push(upgrade);
    }
  }

  state.upgrades = survivingUpgrades;
}

function checkBaseReached(state: GameState): void {
  for (const enemy of state.enemies) {
    if (enemy.y + enemy.radius >= state.baseY) {
      state.phase = "gameover";
      state.projectiles = [];
      return;
    }
  }
}

function cullOffscreen(state: GameState, canvas: HTMLCanvasElement): void {
  state.upgrades = state.upgrades.filter((upgrade) => upgrade.y - upgrade.height / 2 <= canvas.height + 40);
  state.enemies = state.enemies.filter((enemy) => enemy.y - enemy.radius <= canvas.height + 60);
}

export function updateCombat(state: GameState, canvas: HTMLCanvasElement, dt: number): void {
  updateEnemySpawns(state, canvas, dt);
  updateUpgradeSpawns(state, canvas, dt);
  updatePlayerMovement(state, canvas, dt);

  state.player.fireCooldown -= dt;
  const fireInterval = 1 / state.player.attackSpeed;

  while (state.player.fireCooldown <= 0 && state.player.units > 0) {
    fireProjectiles(state);
    state.player.fireCooldown += fireInterval;
  }

  updateProjectiles(state, dt);
  updateEnemies(state, dt);
  updateUpgrades(state, dt);

  handleProjectileHits(state);
  handleProjectileUpgradeHits(state);
  handleEnemyUnitCollisions(state);
  handleUpgradeCollisions(state);
  checkBaseReached(state);
  cullOffscreen(state, canvas);
}
