import type { Upgrade } from "./types";
import { Game } from "./types";
import { AutoGun, BombLauncher, MineLayer } from "./weapons";

export const UPGRADES: Upgrade[] = [
  {
    name: "Auto Gun",
    description: "Shoots nearest enemy automatically",
    apply: (game: Game) => {
      const existing = game.weapons.find((w) => w.name === "Auto Gun");
      if (existing) {
        existing.level++;
      } else {
        game.weapons.push(new AutoGun());
      }
    },
  },
  {
    name: "Bomb Launcher",
    description: "Launches explosive bombs - HUGE EXPLOSIONS!",
    apply: (game: Game) => {
      const existing = game.weapons.find((w) => w.name === "Bomb Launcher");
      if (existing) {
        existing.level++;
      } else {
        game.weapons.push(new BombLauncher());
      }
    },
  },
  {
    name: "Mine Layer",
    description: "Drops mines that explode when enemies get close",
    apply: (game: Game) => {
      const existing = game.weapons.find((w) => w.name === "Mine Layer");
      if (existing) {
        existing.level++;
      } else {
        game.weapons.push(new MineLayer());
      }
    },
  },
  {
    name: "Speed Boost",
    description: "+20% movement speed",
    apply: (game: Game) => {
      game.player.speed *= 1.2;
    },
  },
  {
    name: "Max Health Up",
    description: "+25 max health and heal to full",
    apply: (game: Game) => {
      game.player.maxHealth += 25;
      game.player.health = game.player.maxHealth;
    },
  },
  {
    name: "Armor",
    description: "Take 10% less damage",
    apply: (game: Game) => {
      game.player.health = Math.min(
        game.player.maxHealth,
        game.player.health + 20,
      );
    },
  },
];

export function getRandomUpgrades(count: number = 3): Upgrade[] {
  const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
