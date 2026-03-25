import type { Enemy, GameState, Projectile, SpecialWeaponKind, Upgrade } from "./types.js";
import {
  getEnemyColumnCenterX,
  getEnemyColumnLeft,
  getEnemyColumnWidth,
  getFormationHalfWidth,
  getUnitColumnCenterX,
  getUnitWorldPositions,
  getWeaponColumnCenterX,
} from "./state.js";

function chooseSpecialWeapon(): SpecialWeaponKind {
  const roll = Math.random();

  if (roll < 0.25) {
    return "roller";
  }

  if (roll < 0.5) {
    return "explosive";
  }

  if (roll < 0.75) {
    return "machine-gun";
  }

  return "mines";
}

function getSpecialDuration(kind: SpecialWeaponKind): number {
  if (kind === "machine-gun") {
    return 8;
  }

  if (kind === "explosive") {
    return 10;
  }

  if (kind === "mines") {
    return 12;
  }

  return 6;
}

function getEffectiveAttackSpeed(state: GameState): number {
  if (state.player.specialWeapon === "machine-gun") {
    return state.player.attackSpeed * 10;
  }

  return state.player.attackSpeed;
}

function updateSpecialWeapon(state: GameState, dt: number): void {
  if (state.player.specialWeapon === null) {
    return;
  }

  state.player.specialTimer -= dt;

  if (state.player.specialWeapon === "roller" && state.roller.active) {
    state.roller.y += state.roller.speed * dt;
  }

  if (state.player.specialTimer <= 0) {
    state.player.specialWeapon = null;
    state.player.specialTimer = 0;
    state.player.supportUnits = 0;
    state.roller.active = false;
  }
}

function handleRollerHits(state: GameState, canvas: HTMLCanvasElement): void {
  if (!state.roller.active) {
    return;
  }

  const rollerX = getEnemyColumnCenterX(canvas);
  const survivingEnemies: Enemy[] = [];

  for (const enemy of state.enemies) {
    const dx = enemy.x - rollerX;
    const dy = enemy.y - state.roller.y;
    const distance = Math.hypot(dx, dy);

    if (distance < enemy.radius + state.roller.radius) {
      if (enemy.isBoss) {
        enemy.hp -= 40;
        if (enemy.hp > 0) {
          survivingEnemies.push(enemy);
        } else {
          state.score += 10;
        }
      } else {
        state.score += 1;
      }
    } else {
      survivingEnemies.push(enemy);
    }
  }

  state.enemies = survivingEnemies;

  if (state.roller.y > canvas.height + 80) {
    state.roller.active = false;
  }
}

function spawnExplosion(state: GameState, x: number, y: number, maxRadius = 42): void {
  state.explosions.push({
    x,
    y,
    radius: 8,
    maxRadius,
    life: 0.22,
    maxLife: 0.22,
  });
}

function updateExplosions(state: GameState, dt: number): void {
  for (const explosion of state.explosions) {
    explosion.life -= dt;

    const progress = 1 - Math.max(0, explosion.life) / explosion.maxLife;
    explosion.radius = 8 + (explosion.maxRadius - 8) * progress;
  }

  state.explosions = state.explosions.filter((explosion) => explosion.life > 0);
}

function applyExplosionDamage(state: GameState, hitX: number, hitY: number, damage: number): void {
  const radius = 42;
  spawnExplosion(state, hitX, hitY, radius);

  for (const enemy of state.enemies) {
    const dx = enemy.x - hitX;
    const dy = enemy.y - hitY;
    const distance = Math.hypot(dx, dy);

    if (distance <= radius) {
      enemy.hp -= damage;
    }
  }
}

function activateSpecialWeapon(state: GameState, kind: SpecialWeaponKind): void {
  state.player.specialWeapon = kind;
  state.player.specialTimer = getSpecialDuration(kind);

  if (kind === "roller") {
    state.roller.active = true;
    state.roller.y = -60;
  }

  if (kind === "mines") {
    state.player.supportUnits += 10;
    state.player.supportUnits = Math.min(state.player.supportUnits, getMaxSupportUnits());
  }
}

function resetSpecialBox(state: GameState): void {
  state.specialBox.hp = state.specialBox.maxHp;

}
function getColumnCenterX(canvas: HTMLCanvasElement, columnIndex: number): number {
  return (canvas.width / 3) * (columnIndex + 0.5);
}

function getUnitDecayInterval(): number {
  return 14;
}

function getMaxUnits(): number {
    return 25;
}

function getDamageDecayRate(): number {
  return 0.03;
}

function getAttackSpeedDecayRate(): number {
  return 0.04;
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

function getMaxSupportUnits(): number {
    return 15;
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
  } else {
      state.player.units += upgrade.value;
  }

  state.player.units = Math.min(state.player.units, getMaxUnits());
}

function spawnEnemy(state: GameState, canvas: HTMLCanvasElement, isBoss: boolean): void {
  const enemyLeft = getEnemyColumnLeft(canvas);
  const enemyWidth = getEnemyColumnWidth(canvas);
  const speed = getEnemySpeed();

  if (isBoss) {
    const bossHp = getBossHp(state.score);
    state.enemies.push({
      x: getEnemyColumnCenterX(canvas),
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
      x: enemyLeft + enemyWidth * (0.06 + Math.random() * 0.88),
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
    x: getWeaponColumnCenterX(canvas),
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
    x: getUnitColumnCenterX(canvas),
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
  const isExplosive = state.player.specialWeapon === "explosive";

  for (const unit of unitPositions) {
    state.projectiles.push({
      x: unit.x,
      y: unit.y - 14,
      radius: isExplosive ? 6 : 4,
      speed: isExplosive ? 360 : 460,
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

function updatePlayerDecay(state: GameState, dt: number): void {
  state.player.unitDecayTimer += dt;

  while (state.player.unitDecayTimer >= getUnitDecayInterval()) {
    state.player.unitDecayTimer -= getUnitDecayInterval();

    if (state.player.units > 1) {
      state.player.units -= 1;
    }
  }

  const damageDecay = getDamageDecayRate();
  const attackSpeedDecay = getAttackSpeedDecayRate();

  if (state.player.damage > state.player.baseDamage) {
    const excessDamage = state.player.damage - state.player.baseDamage;
    state.player.damage -= excessDamage * damageDecay * dt;

    if (state.player.damage < state.player.baseDamage) {
      state.player.damage = state.player.baseDamage;
    }
  }

  if (state.player.attackSpeed > state.player.baseAttackSpeed) {
    const excessAttackSpeed = state.player.attackSpeed - state.player.baseAttackSpeed;
    state.player.attackSpeed -= excessAttackSpeed * attackSpeedDecay * dt;

    if (state.player.attackSpeed < state.player.baseAttackSpeed) {
      state.player.attackSpeed = state.player.baseAttackSpeed;
    }
  }
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

        if (state.player.specialWeapon === "explosive") {
          applyExplosionDamage(state, enemy.x, enemy.y, projectile.damage * 0.6);
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

function handleProjectileSpecialBoxHits(state: GameState): void {
  const survivingProjectiles: Projectile[] = [];

  for (const projectile of state.projectiles) {
    const hit = circleIntersectsRect(
      projectile.x,
      projectile.y,
      projectile.radius,
      state.specialBox.x - state.specialBox.width / 2,
      state.specialBox.y - state.specialBox.height / 2,
      state.specialBox.width,
      state.specialBox.height,
    );

    if (hit) {
      state.specialBox.hp -= projectile.damage;

      if (state.specialBox.hp <= 0) {
        activateSpecialWeapon(state, chooseSpecialWeapon());
        resetSpecialBox(state);
      }
    } else {
      survivingProjectiles.push(projectile);
    }
  }

  state.projectiles = survivingProjectiles;
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

function getAllUnitPositions(state: GameState): Array<{ x: number; y: number; isSupport: boolean }> {
  const mainUnits = getUnitWorldPositions(state.player).map((p) => ({
    x: p.x,
    y: p.y,
    isSupport: false,
  }));

  const support: Array<{ x: number; y: number; isSupport: boolean }> = [];
  const spacing = 18;

  for (let i = 0; i < state.player.supportUnits; i++) {
    const angle = (i / Math.max(1, state.player.supportUnits)) * Math.PI * 2;
    support.push({
      x: state.player.x + Math.cos(angle) * 34,
      y: state.player.y + Math.sin(angle) * 34,
      isSupport: true,
    });
  }

  return [...mainUnits, ...support];
}

function handleEnemyUnitCollisions(state: GameState): void {
  if (state.player.units <= 0 && state.player.supportUnits <= 0) {
    return;
  }

  const unitPositions = getAllUnitPositions(state);
  const aliveFlags = unitPositions.map(() => true);
  const survivingEnemies: Enemy[] = [];

  for (const enemy of state.enemies) {
    let consumedUnit = false;

    for (let i = 0; i < unitPositions.length; i++) {
      if (!aliveFlags[i]) {
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
        aliveFlags[i] = false;
        consumedUnit = true;
        break;
      }
    }

    if (!consumedUnit) {
      survivingEnemies.push(enemy);
    }
  }

  let normalAlive = 0;
  let supportAlive = 0;

  for (let i = 0; i < unitPositions.length; i++) {
    if (!aliveFlags[i]) {
      continue;
    }

    const unit = unitPositions[i];
    if (unit?.isSupport) {
      supportAlive += 1;
    } else {
      normalAlive += 1;
    }
  }

  state.enemies = survivingEnemies;
  state.player.units = normalAlive;
  state.player.supportUnits = supportAlive;

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
  updatePlayerDecay(state, dt);
  updateSpecialWeapon(state, dt);

  state.player.fireCooldown -= dt;
  const fireInterval = 1 / getEffectiveAttackSpeed(state);

  while (state.player.fireCooldown <= 0 && state.player.units > 0) {
    fireProjectiles(state);
    state.player.fireCooldown += fireInterval;
  }

  updateProjectiles(state, dt);
  updateEnemies(state, dt);
  updateUpgrades(state, dt);
  updateExplosions(state, dt);

  handleProjectileHits(state);
  handleProjectileUpgradeHits(state);
  handleProjectileSpecialBoxHits(state);
  handleRollerHits(state, canvas);
  handleEnemyUnitCollisions(state);
  handleUpgradeCollisions(state);
  checkBaseReached(state);
  cullOffscreen(state, canvas);
}
