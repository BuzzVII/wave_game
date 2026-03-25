export type Phase = "combat" | "gameover";

export type Point = {
  x: number;
  y: number;
};

export type InputState = {
  left: boolean;
  right: boolean;
};

export type UpgradeKind = "weapon-speed" | "weapon-damage" | "unit";

export type SpecialWeaponKind = "roller" | "explosive" | "machine-gun" | "mines";

export type Player = {
  x: number;
  y: number;
  units: number;
  damage: number;
  attackSpeed: number;
  fireCooldown: number;
  moveSpeed: number;
  baseDamage: number;
  baseAttackSpeed: number;
  unitDecayTimer: number;
  specialWeapon: SpecialWeaponKind | null;
  specialTimer: number;
  supportUnits: number;
};

export type Enemy = {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  isBoss: boolean;
};

export type Upgrade = {
  kind: UpgradeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  value: number;
  isMultiplier: boolean;
  label: string;
  hp: number;
  maxHp: number;
  enabled: boolean;
  tier: number;
};

export type Projectile = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  damage: number;
};

export type SpecialBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
};

export type ActiveRoller = {
  active: boolean;
  y: number;
  speed: number;
  radius: number;
};

export type GameState = {
  phase: Phase;
  player: Player;
  enemies: Enemy[];
  upgrades: Upgrade[];
  projectiles: Projectile[];
  input: InputState;
  baseY: number;
  lastTime: number;
  enemySpawnTimer: number;
  weaponUpgradeSpawnTimer: number;
  unitUpgradeSpawnTimer: number;
  score: number;
  specialBox: SpecialBox;
  roller: ActiveRoller;
};
