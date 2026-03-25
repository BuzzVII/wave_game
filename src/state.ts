import type { GameState, Player, Point } from "./types.js";

export function getCanvas(): HTMLCanvasElement {
  const el = document.getElementById("game");
  if (!(el instanceof HTMLCanvasElement)) {
    throw new Error("Could not find canvas element with id 'game'");
  }
  return el;
}

export function getContext2D(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Could not get 2D rendering context");
  }
  return context;
}

export function getColumnWidth(canvas: HTMLCanvasElement): number {
  return canvas.width / 3;
}

export function getLeftColumnWidth(canvas: HTMLCanvasElement): number {
  return getColumnWidth(canvas);
}

export function getMiddleColumnLeft(canvas: HTMLCanvasElement): number {
  return getColumnWidth(canvas);
}

export function getMiddleColumnRight(canvas: HTMLCanvasElement): number {
  return getColumnWidth(canvas) * 2;
}

export function getMiddleColumnWidth(canvas: HTMLCanvasElement): number {
  return getColumnWidth(canvas);
}

export function getMiddleColumnCenterX(canvas: HTMLCanvasElement): number {
  return getColumnWidth(canvas) * 1.5;
}

export function getRightColumnLeft(canvas: HTMLCanvasElement): number {
  return getColumnWidth(canvas) * 2;
}

export function createInitialPlayer(canvas: HTMLCanvasElement): Player {
  return {
    x: canvas.width * 0.5,
    y: canvas.height * 0.82,
    units: 1,
    damage: 10,
    attackSpeed: 1,
    fireCooldown: 0,
    moveSpeed: 360,
  };
}

export function createInitialState(canvas: HTMLCanvasElement): GameState {
  return {
    phase: "combat",
    player: createInitialPlayer(canvas),
    enemies: [],
    upgrades: [],
    projectiles: [],
    input: {
      left: false,
      right: false,
    },
    baseY: canvas.height * 0.92,
    lastTime: 0,
    enemySpawnTimer: 0,
    weaponUpgradeSpawnTimer: 0,
    unitUpgradeSpawnTimer: 0,
    score: 0,
  };
}

export function resizeCanvas(canvas: HTMLCanvasElement, state: GameState): void {
  canvas.width = 480;
  canvas.height = 854;

  state.player.x = Math.min(
    Math.max(state.player.x || canvas.width * 0.5, 20),
    canvas.width - 20,
  );
  state.player.y = canvas.height * 0.82;
  state.baseY = canvas.height * 0.92;
}

export function getUnitOffsets(unitCount: number): Point[] {
  const spacing = 22; // controls density
  const offsets: Point[] = [];

  if (unitCount <= 0) return offsets;

  // first unit is the center
  offsets.push({ x: 0, y: 0 });

  let remaining = unitCount - 1;
  let ring = 1;

  while (remaining > 0) {
    const radius = ring * spacing;

    // number of units that fit nicely on this ring
    const circumference = 2 * Math.PI * radius;
    const maxInRing = Math.max(6, Math.floor(circumference / spacing));

    const count = Math.min(remaining, maxInRing);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;

      offsets.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    }

    remaining -= count;
    ring += 1;
  }

  return offsets;
}

export function getUnitWorldPositions(player: Player): Point[] {
  const offsets = getUnitOffsets(player.units);
  return offsets.map((offset) => ({
    x: player.x + offset.x,
    y: player.y + offset.y,
  }));
}

export function getFormationHalfWidth(unitCount: number): number {
  const offsets = getUnitOffsets(unitCount);
  let maxAbsX = 0;

  for (const offset of offsets) {
    const value = Math.abs(offset.x);
    if (value > maxAbsX) {
      maxAbsX = value;
    }
  }

  return maxAbsX + 12;
}
