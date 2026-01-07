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

export interface Weapon {
  name: string;
  damage: number;
  cooldown: number;
  level: number;
  update(
    deltaTime: number,
    player: Player,
    enemies: Enemy[],
    canvas: HTMLCanvasElement,
  ): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

export interface Upgrade {
  name: string;
  description: string;
  apply(game: Game): void;
}

import maduroImgModule from "../assets/maduro.png";
import backgroundImgModule from "../assets/background.png";

export class Player implements GameObject {
  position: Vector2;
  velocity: Vector2;
  radius: number = 35;
  speed: number = 200;
  health: number = 100;
  maxHealth: number = 100;
  exp: number = 0;
  expToLevel: number = 10;
  level: number = 1;
  static sprite: HTMLImageElement | null = null;
  facingLeft: boolean = false;

  constructor(x: number, y: number) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };

    if (!Player.sprite) {
      Player.sprite = new Image();
      Player.sprite.src = maduroImgModule.src;
    }
  }

  update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    if (this.velocity.x < 0) {
      this.facingLeft = true;
    } else if (this.velocity.x > 0) {
      this.facingLeft = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (Player.sprite && Player.sprite.complete) {
      ctx.save();

      ctx.translate(this.position.x, this.position.y);

      if (this.facingLeft) {
        ctx.scale(-1, 1);
      }

      const size = this.radius * 2.2;

      ctx.drawImage(Player.sprite, -size / 2, -size / 2, size, size);

      ctx.restore();
    } else {
      ctx.fillStyle = "#ff0000";
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#000";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("M", this.position.x, this.position.y + 4);

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  takeDamage(amount: number): void {
    this.health -= amount;
  }

  addExp(amount: number): boolean {
    this.exp += amount;
    if (this.exp >= this.expToLevel) {
      this.exp -= this.expToLevel;
      this.level++;
      this.expToLevel = Math.floor(this.expToLevel * 1.5);
      return true;
    }
    return false;
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
  health: number = 20;
  maxHealth: number = 20;
  damage: number = 10;
  dead: boolean = false;
  sprite: HTMLImageElement | null = null;
  facingLeft: boolean = false;

  constructor(x: number, y: number) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };

    const randomSprite =
      marineSprites[Math.floor(Math.random() * marineSprites.length)];
    this.sprite = new Image();
    this.sprite.src = randomSprite;
  }

  update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    if (this.velocity.x < 0) {
      this.facingLeft = true;
    } else if (this.velocity.x > 0) {
      this.facingLeft = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.sprite && this.sprite.complete) {
      ctx.save();

      ctx.translate(this.position.x, this.position.y);

      if (this.facingLeft) {
        ctx.scale(-1, 1);
      }

      const size = this.radius * 2.5;

      ctx.imageSmoothingEnabled = true;

      ctx.drawImage(this.sprite, -size / 2, -size / 2, size, size);

      ctx.restore();

      const healthBarWidth = 30;
      const healthBarHeight = 4;
      const healthPercent = this.health / this.maxHealth;

      ctx.fillStyle = "#ff0000";
      ctx.fillRect(
        this.position.x - healthBarWidth / 2,
        this.position.y - this.radius - 10,
        healthBarWidth,
        healthBarHeight,
      );

      ctx.fillStyle = "#00ff00";
      ctx.fillRect(
        this.position.x - healthBarWidth / 2,
        this.position.y - this.radius - 10,
        healthBarWidth * healthPercent,
        healthBarHeight,
      );
    } else {
      ctx.fillStyle = "#00ff00";
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#000";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.fillText("⚔", this.position.x, this.position.y + 4);

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.dead = true;
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
  particles: Particle[] = [];
  weapons: Weapon[] = [];
  keys: Set<string> = new Set();

  gameTime: number = 0;
  maxGameTime: number = 300;
  lastTime: number = 0;

  kills: number = 0;
  isPaused: boolean = false;
  isGameOver: boolean = false;

  static backgroundPattern: CanvasPattern | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;

    canvas.width = 1200;
    canvas.height = 800;

    this.player = new Player(canvas.width / 2, canvas.height / 2);

    if (!Game.backgroundPattern) {
      const bgImg = new Image();
      bgImg.src = backgroundImgModule.src;
      bgImg.onload = () => {
        Game.backgroundPattern = this.ctx.createPattern(bgImg, "repeat");
      };
    }
  }
}
