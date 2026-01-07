export interface Vector2 {
  x: number;
  y: number;
}

export interface GameObject {
  position: Vector2;
  velocity: Vector2;
  update(deltaTime: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

import jdVanceHelicopterImgModule from "../assets/jd-vince-trump-helicopter.png";

export class Helicopter implements GameObject {
  position: Vector2;
  velocity: Vector2;
  width: number = 204;
  height: number = 136;
  static sprite: HTMLImageElement | null = null;
  gravity: number = 150; // Pixels per second squared
  thrust: number = -175; // Upward thrust when pressing up
  horizontalSpeed: number = 120; // Horizontal movement speed
  maxFallSpeed: number = 300; // Max safe landing speed
  crashSpeed: number = 400; // Speed that causes crash
  hitPoints: number = 2;
  isLanded: boolean = false;
  isCrashed: boolean = false;
  facingRight: boolean = true;

  constructor(x: number, y: number) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };

    if (!Helicopter.sprite) {
      Helicopter.sprite = new Image();
      Helicopter.sprite.src = jdVanceHelicopterImgModule.src;
    }
  }

  applyThrust(): void {
    this.velocity.y = this.thrust;
  }

  takeDamage(): void {
    this.hitPoints--;
    if (this.hitPoints <= 0) {
      this.isCrashed = true;
    }
  }

  update(deltaTime: number): void {
    // Apply gravity
    this.velocity.y += this.gravity * deltaTime;

    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (Helicopter.sprite && Helicopter.sprite.complete) {
      ctx.save();
      ctx.translate(this.position.x, this.position.y);

      // Flip sprite horizontally if facing left
      if (!this.facingRight) {
        ctx.scale(-1, 1);
      }

      ctx.drawImage(
        Helicopter.sprite,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height,
      );

      ctx.restore();
    } else {
      ctx.fillStyle = "#0066cc";
      ctx.fillRect(
        this.position.x - this.width / 2,
        this.position.y - this.height / 2,
        this.width,
        this.height,
      );
    }
  }
}

import maduroSmokingImgModule from "../assets/maduro-smoking.png";
import maduroDesperationImgModule from "../assets/maduro-desperation.png";

export class Maduro implements GameObject {
  position: Vector2;
  velocity: Vector2;
  radius: number = 40;
  isDesperate: boolean = false;
  static spriteNormal: HTMLImageElement | null = null;
  static spriteDesperate: HTMLImageElement | null = null;

  constructor(x: number, y: number) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };

    if (!Maduro.spriteNormal) {
      Maduro.spriteNormal = new Image();
      Maduro.spriteNormal.src = maduroSmokingImgModule.src;
    }

    if (!Maduro.spriteDesperate) {
      Maduro.spriteDesperate = new Image();
      Maduro.spriteDesperate.src = maduroDesperationImgModule.src;
    }
  }

  update(deltaTime: number): void {
    // Maduro stays stationary
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const sprite = this.isDesperate
      ? Maduro.spriteDesperate
      : Maduro.spriteNormal;

    if (sprite && sprite.complete) {
      ctx.save();
      ctx.translate(this.position.x, this.position.y);

      const size = this.radius * 3;
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);

      ctx.restore();
    } else {
      ctx.fillStyle = "#ff0000";
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

import rocketImgModule from "../assets/rocket.png";

export class Missile implements GameObject {
  position: Vector2;
  velocity: Vector2;
  width: number = 20;
  height: number = 40;
  dead: boolean = false;
  angle: number = 0; // Rotation angle in radians
  static sprite: HTMLImageElement | null = null;

  constructor(x: number, y: number, vx: number, vy: number) {
    this.position = { x, y };
    this.velocity = { x: vx, y: vy };

    // Calculate angle based on velocity direction
    this.angle = Math.atan2(vy, vx) + Math.PI / 2;

    if (!Missile.sprite) {
      Missile.sprite = new Image();
      Missile.sprite.src = rocketImgModule.src;
    }
  }

  update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (Missile.sprite && Missile.sprite.complete) {
      ctx.save();
      ctx.translate(this.position.x, this.position.y);
      ctx.rotate(this.angle);

      ctx.drawImage(
        Missile.sprite,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height,
      );

      ctx.restore();
    } else {
      ctx.fillStyle = "#ff6600";
      ctx.fillRect(
        this.position.x - this.width / 2,
        this.position.y - this.height / 2,
        this.width,
        this.height,
      );
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

import backgroundWarImgModule from "../assets/background-war.png";
import backgroundBunkerImgModule from "../assets/background-bunker.png";

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  helicopter: Helicopter;
  maduro: Maduro;
  missiles: Missile[] = [];
  particles: Particle[] = [];
  keys: Set<string> = new Set();

  gameTime: number = 0;
  lastTime: number = 0;
  isGameOver: boolean = false;
  isWon: boolean = false;
  hasRescued: boolean = false;

  static backgroundImage: HTMLImageElement | null = null;
  static bunkerImage: HTMLImageElement | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;

    this.helicopter = new Helicopter(canvas.width / 2, 100);
    this.maduro = new Maduro(canvas.width / 2, canvas.height - 80);

    // Load background image
    if (!Game.backgroundImage) {
      Game.backgroundImage = new Image();
      Game.backgroundImage.src = backgroundWarImgModule.src;
    }

    // Load bunker sprite
    if (!Game.bunkerImage) {
      Game.bunkerImage = new Image();
      Game.bunkerImage.src = backgroundBunkerImgModule.src;
    }
  }
}
