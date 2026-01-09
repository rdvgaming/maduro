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

import maduroRocketImgModule from "../assets/maduro-rocket.png";

export class Player implements GameObject {
  position: Vector2;
  velocity: Vector2;
  radius: number = 40;
  speed: number = 300;
  static sprite: HTMLImageElement | null = null;
  shootCooldown: number = 0;
  shootInterval: number = 0.3; // Auto-shoot every 0.3 seconds
  facingLeft: boolean = false;

  constructor(x: number, y: number) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };

    if (!Player.sprite) {
      Player.sprite = new Image();
      Player.sprite.src = maduroRocketImgModule.src;
    }
  }

  update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Update facing direction based on movement
    if (this.velocity.x < 0) {
      this.facingLeft = false;
    } else if (this.velocity.x > 0) {
      this.facingLeft = true;
    }

    // Update shoot cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown -= deltaTime;
    }
  }

  canShoot(): boolean {
    return this.shootCooldown <= 0;
  }

  resetShootCooldown(): void {
    this.shootCooldown = this.shootInterval;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (Player.sprite && Player.sprite.complete) {
      ctx.save();
      ctx.translate(this.position.x, this.position.y);

      if (this.facingLeft) {
        ctx.scale(-1, 1);
      }

      const size = this.radius * 2.5;
      ctx.drawImage(Player.sprite, -size / 2, -size / 2, size, size);

      ctx.restore();
    } else {
      ctx.fillStyle = "#ff0000";
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

import marineDuckImgModule from "../assets/marine-duck.png";
import marinePistolImgModule from "../assets/marine-pistol.png";
import marineRifleImgModule from "../assets/marine-rifle.png";
import marineRocketImgModule from "../assets/marine-rocket.png";
import vehicleHelicopterImgModule from "../assets/vehicle-helicopter.png";
import vehicleTankImgModule from "../assets/vehicle-tank.png";
import vehicleMarineImgModule from "../assets/vehicle-marine.png";
import jdVanceImgModule from "../assets/jd-vance.png";

const marineSprites = [
  marineDuckImgModule.src,
  marinePistolImgModule.src,
  marineRifleImgModule.src,
  marineRocketImgModule.src,
  vehicleHelicopterImgModule.src,
  vehicleTankImgModule.src,
  vehicleMarineImgModule.src,
  jdVanceImgModule.src,
];

export class Enemy implements GameObject {
  position: Vector2;
  velocity: Vector2;
  radius: number = 30;
  speed: number = 50;
  dead: boolean = false;
  sprite: HTMLImageElement | null = null;
  gridX: number;
  gridY: number;
  offsetX: number = 0; // For wave movement

  constructor(x: number, y: number, gridX: number, gridY: number) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };
    this.gridX = gridX;
    this.gridY = gridY;

    const randomSprite =
      marineSprites[Math.floor(Math.random() * marineSprites.length)];
    this.sprite = new Image();
    this.sprite.src = randomSprite;
  }

  update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.sprite && this.sprite.complete) {
      ctx.save();
      ctx.translate(this.position.x, this.position.y);

      const size = this.radius * 2.5;
      ctx.drawImage(this.sprite, -size / 2, -size / 2, size, size);

      ctx.restore();
    } else {
      ctx.fillStyle = "#00ff00";
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

import rocketImgModule from "../assets/bullet-rocket.png";

export class Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number = 8;
  damage: number = 1;
  dead: boolean = false;
  static sprite: HTMLImageElement | null = null;

  constructor(x: number, y: number, vx: number, vy: number) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;

    if (!Projectile.sprite) {
      Projectile.sprite = new Image();
      Projectile.sprite.src = rocketImgModule.src;
    }
  }

  update(deltaTime: number): void {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (Projectile.sprite && Projectile.sprite.complete) {
      ctx.save();
      ctx.translate(this.x, this.y);

      const size = this.radius * 4;
      ctx.drawImage(Projectile.sprite, -size / 2, -size / 2, size, size);

      ctx.restore();
    } else {
      ctx.fillStyle = "#ffff00";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
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

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  player: Player;
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  keys: Set<string> = new Set();

  gameTime: number = 0;
  lastTime: number = 0;
  score: number = 0;
  isGameOver: boolean = false;

  // Enemy grid settings
  enemyDirection: number = 1; // 1 for right, -1 for left
  enemySpeed: number = 36;
  enemyDownAmount: number = 20;
  shouldMoveDown: boolean = false;
  baseEnemySpeed: number = 36;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;

    this.player = new Player(canvas.width / 2, canvas.height - 100);
  }
}
