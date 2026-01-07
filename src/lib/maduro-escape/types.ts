export interface Vector2 {
  x: number;
  y: number;
}

export interface GameObject {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  update(deltaTime: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

import maduroBoatImgModule from "../assets/maduro-boat.png";

export class Player implements GameObject {
  position: Vector2;
  velocity: Vector2;
  radius: number = 50;
  speed: number = 0;
  static sprite: HTMLImageElement | null = null;
  barrelCooldown: number = 0;
  barrelInterval: number = 0.8; // Drop barrel every 0.8 seconds
  health: number = 100;
  maxHealth: number = 100;

  constructor(x: number, y: number) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };

    if (!Player.sprite) {
      Player.sprite = new Image();
      Player.sprite.src = maduroBoatImgModule.src;
    }
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health < 0) {
      this.health = 0;
    }
  }

  update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Update barrel drop cooldown
    if (this.barrelCooldown > 0) {
      this.barrelCooldown -= deltaTime;
    }
  }

  canDropBarrel(): boolean {
    return this.barrelCooldown <= 0;
  }

  resetBarrelCooldown(): void {
    this.barrelCooldown = this.barrelInterval;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (Player.sprite && Player.sprite.complete) {
      ctx.save();
      ctx.translate(this.position.x, this.position.y);

      const size = this.radius * 3;
      ctx.drawImage(Player.sprite, -size / 2, -size / 2, size, size);

      ctx.restore();
    } else {
      ctx.fillStyle = "#0066cc";
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

import barrelOilImgModule from "../assets/barrel-oil.png";

export class Barrel {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number = 20;
  damage: number = 100;
  dead: boolean = false;
  exploded: boolean = false;
  static sprite: HTMLImageElement | null = null;
  rotation: number = 0;
  pierceCount: number = 0;
  maxPierce: number = 0;

  constructor(
    x: number,
    y: number,
    scrollSpeed: number,
    damage: number,
    pierce: number,
  ) {
    this.x = x;
    this.y = y;
    this.vx = -scrollSpeed; // Move left with scroll speed
    this.vy = 0; // Float, don't fall
    this.damage = damage;
    this.maxPierce = pierce;

    if (!Barrel.sprite) {
      Barrel.sprite = new Image();
      Barrel.sprite.src = barrelOilImgModule.src;
    }
  }

  update(deltaTime: number): void {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    // No rotation for floating barrels
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (Barrel.sprite && Barrel.sprite.complete) {
      ctx.save();
      ctx.translate(this.x, this.y);

      const size = this.radius * 3;
      ctx.drawImage(Barrel.sprite, -size / 2, -size / 2, size, size);

      ctx.restore();
    } else {
      ctx.fillStyle = "#8b4513";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

import marineBoatGunsImgModule from "../assets/marine-boat-guns.png";
import marineBoatRocketImgModule from "../assets/marine-boat-rocket.png";
import marineBoatGranadeObstacleImgModule from "../assets/marine-boat-granade.png";

const marineBoatSprites = [
  marineBoatGunsImgModule.src,
  marineBoatRocketImgModule.src,
  marineBoatGranadeObstacleImgModule.src,
];

export class Obstacle implements GameObject {
  position: Vector2;
  velocity: Vector2;
  radius: number = 39; // 30% bigger (30 * 1.3)
  speed: number = 100;
  dead: boolean = false;
  health: number = 30;
  maxHealth: number = 30;
  damage: number = 10;
  sprite: HTMLImageElement | null = null;

  constructor(x: number, y: number) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };

    const randomSprite =
      marineBoatSprites[Math.floor(Math.random() * marineBoatSprites.length)];
    this.sprite = new Image();
    this.sprite.src = randomSprite;
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.dead = true;
    }
  }

  update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.sprite && this.sprite.complete) {
      ctx.save();
      ctx.translate(this.position.x, this.position.y);

      const size = this.radius * 2.5 * 1.3; // 30% bigger sprite
      ctx.drawImage(this.sprite, -size / 2, -size / 2, size, size);

      ctx.restore();
    } else {
      ctx.fillStyle = "#ff0000";
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

import containerCocaineImgModule from "../assets/container-cocaine.png";

export class Collectible implements GameObject {
  position: Vector2;
  velocity: Vector2;
  radius: number = 30;
  dead: boolean = false;
  static sprite: HTMLImageElement | null = null;
  bobOffset: number = 0; // For bobbing animation
  bobSpeed: number = 2;

  constructor(x: number, y: number) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };

    if (!Collectible.sprite) {
      Collectible.sprite = new Image();
      Collectible.sprite.src = containerCocaineImgModule.src;
    }
  }

  update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Bobbing animation
    this.bobOffset += deltaTime * this.bobSpeed;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (Collectible.sprite && Collectible.sprite.complete) {
      ctx.save();
      const bobY = Math.sin(this.bobOffset) * 10;
      ctx.translate(this.position.x, this.position.y + bobY);

      const size = this.radius * 2.5;
      ctx.drawImage(Collectible.sprite, -size / 2, -size / 2, size, size);

      ctx.restore();
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export class Particle {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  life: number;
  maxLife: number;
  color: string;

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string = "#ff6600",
  ) {
    this.position = { x, y };
    this.velocity = { x: vx, y: vy };
    this.radius = Math.random() * 10 + 5;
    this.maxLife = Math.random() * 0.8 + 0.5;
    this.life = this.maxLife;
    this.color = color;
  }

  update(deltaTime: number): boolean {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.velocity.x *= 0.95;
    this.velocity.y *= 0.95;
    this.life -= deltaTime;
    return this.life > 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const alpha = this.life / this.maxLife;
    ctx.fillStyle =
      this.color +
      Math.floor(alpha * 255)
        .toString(16)
        .padStart(2, "0");
    ctx.beginPath();
    ctx.arc(
      this.position.x,
      this.position.y,
      this.radius * alpha,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

import backgroundSeaImgModule from "../assets/background-sea.png";

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  player: Player;
  obstacles: Obstacle[] = [];
  barrels: Barrel[] = [];
  collectibles: Collectible[] = [];
  particles: Particle[] = [];
  keys: Set<string> = new Set();

  gameTime: number = 0;
  lastTime: number = 0;
  score: number = 0;
  collectiblesCollected: number = 0;
  collectiblesNeeded: number = 20; // Win condition
  isGameOver: boolean = false;
  isWon: boolean = false;
  isPaused: boolean = false;
  distance: number = 0; // Track distance traveled

  // Scrolling background
  backgroundX: number = 0;
  scrollSpeed: number = 150; // Pixels per second
  static backgroundImage: HTMLImageElement | null = null;
  static backgroundPattern: CanvasPattern | null = null;

  // Upgrade properties
  barrelDamage: number = 100;
  explosionSize: number = 1;
  barrelPierce: number = 0;
  collectRadius: number = 1;
  healthRegen: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;

    this.player = new Player(canvas.width / 2, canvas.height / 2);

    // Load background image
    if (!Game.backgroundImage) {
      Game.backgroundImage = new Image();
      Game.backgroundImage.src = backgroundSeaImgModule.src;
      Game.backgroundImage.onload = () => {
        if (Game.backgroundImage) {
          Game.backgroundPattern = this.ctx.createPattern(
            Game.backgroundImage,
            "repeat",
          );
        }
      };
    }
  }
}
