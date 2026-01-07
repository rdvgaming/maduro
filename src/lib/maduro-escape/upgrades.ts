import type { Game } from "./types";

export interface Upgrade {
  name: string;
  description: string;
  apply: (game: Game) => void;
}

export const UPGRADES: Upgrade[] = [
  {
    name: "Speed Boost",
    description: "+30% movement speed",
    apply: (game: Game) => {
      game.player.speed = 300 * 1.3;
    },
  },
  {
    name: "Barrel Damage",
    description: "Barrels deal +50 damage",
    apply: (game: Game) => {
      game.barrelDamage += 50;
    },
  },
  {
    name: "Explosion Size",
    description: "Barrel explosions are 50% larger",
    apply: (game: Game) => {
      game.explosionSize *= 1.5;
    },
  },
  {
    name: "Rapid Fire",
    description: "Drop barrels 30% faster",
    apply: (game: Game) => {
      game.player.barrelInterval *= 0.7;
    },
  },
  {
    name: "Max Health Up",
    description: "+50 max health and heal to full",
    apply: (game: Game) => {
      game.player.maxHealth += 50;
      game.player.health = game.player.maxHealth;
    },
  },
  {
    name: "Armor",
    description: "Gain +25 health immediately",
    apply: (game: Game) => {
      game.player.health = Math.min(
        game.player.maxHealth,
        game.player.health + 25,
      );
    },
  },
  {
    name: "Barrel Pierce",
    description: "Barrels can hit 2 enemies before exploding",
    apply: (game: Game) => {
      game.barrelPierce += 1;
    },
  },
  {
    name: "Container Magnet",
    description: "Collect containers from further away",
    apply: (game: Game) => {
      game.collectRadius *= 1.5;
    },
  },
  {
    name: "Regeneration",
    description: "Slowly regenerate health over time",
    apply: (game: Game) => {
      game.healthRegen += 2;
    },
  },
];

export function getRandomUpgrades(count: number = 3): Upgrade[] {
  const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
