import maduroAirplaneImgModule from "../assets/maduro-airplane.png";
import containerCocaineImgModule from "../assets/container-cocaine.png";

// Bullet sprites
import bulletSimpleImgModule from "../assets/bullet-simple.png";
import bulletSawImgModule from "../assets/bullet-saw.png";
import bulletWaveImgModule from "../assets/bullet-wave.png";
import bulletSwarmImgModule from "../assets/bullet-swarm.png";
import bulletRocketImgModule from "../assets/bullet-rocket.png";

// Helicopter sprites
import vehicleHelicopterImgModule from "../assets/vehicle-helicopter.png";
import jdVanceHelicopterImgModule from "../assets/jd-vance-helicopter.png";
import jdVinceTrumpHelicopterImgModule from "../assets/jd-vince-trump-helicopter.png";

// Island sprites
import islandContainerImgModule from "../assets/island-container.png";
import islandSamImgModule from "../assets/island-sam.png";
import islandMissileImgModule from "../assets/island-missile.png";
import islandWreckImgModule from "../assets/island-wreck.png";
import islandMissionControlImgModule from "../assets/island-mission-control.png";
import islandSatelliteImgModule from "../assets/island-satellite.png";
import islandHelicoptersImgModule from "../assets/island-helicopters.png";
import islandSamAltImgModule from "../assets/island-sam-alt.png";
import islandTanksImgModule from "../assets/island-tanks.png";

import backgroundSeaImgModule from "../assets/background-sea.png";

export enum WeaponType {
  BASIC = "BASIC",
  SPREAD = "SPREAD",
  RAPID = "RAPID",
  HOMING = "HOMING",
  SAW = "SAW",
  WAVE = "WAVE",
  ORBIT = "ORBIT",
}

export interface Weapon {
  type: WeaponType;
  level: number;
  cooldown: number;
  lastFired: number;
}

export class Player {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  radius: number = 55; // 15% bigger than before (48 * 1.15 ≈ 55)
  health: number = 100;
  maxHealth: number = 100;
  speed: number = 360; // 20% faster (300 * 1.2)
  weapons: Map<WeaponType, Weapon> = new Map();
  specialEnergy: number = 100; // Start with full special attack
  maxSpecialEnergy: number = 100;
  isUsingSpecial: boolean = false;
  specialDuration: number = 0;
  specialMaxDuration: number = 1.5; // 1.5 seconds
  specialRadius: number = 200; // Bubble radius
  orbitingSaws: number = 0; // Number of orbiting saws
  orbitAngle: number = 0; // Current rotation angle for orbits
  static sprite: HTMLImageElement | null = null;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;

    // Start with BASIC weapon
    this.weapons.set(WeaponType.BASIC, {
      type: WeaponType.BASIC,
      level: 1,
      cooldown: 0.25,
      lastFired: 0,
    });

    if (!Player.sprite) {
      Player.sprite = new Image();
      Player.sprite.src = maduroAirplaneImgModule.src;
    }
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    // Keep player on screen
    this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));
    this.y = Math.max(
      this.radius,
      Math.min(canvasHeight - this.radius, this.y),
    );

    // Update special attack duration
    if (this.isUsingSpecial) {
      this.specialDuration += deltaTime;
      if (this.specialDuration >= this.specialMaxDuration) {
        this.isUsingSpecial = false;
        this.specialDuration = 0;
      }
    }

    // Update orbiting saws angle
    if (this.orbitingSaws > 0) {
      this.orbitAngle += deltaTime * 3; // Rotate speed (50% faster: 2 * 1.5 = 3)
    }
  }

  addOrbitingSaw() {
    this.orbitingSaws++;
  }

  activateSpecial() {
    if (this.specialEnergy >= this.maxSpecialEnergy && !this.isUsingSpecial) {
      this.isUsingSpecial = true;
      this.specialDuration = 0;
      this.specialEnergy = 0;
    }
  }

  addSpecialEnergy(amount: number) {
    this.specialEnergy = Math.min(
      this.maxSpecialEnergy,
      this.specialEnergy + amount,
    );
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Draw orbiting saws
    if (this.orbitingSaws > 0) {
      const orbitRadius = this.specialRadius * 0.8; // Slightly smaller than special radius
      const sawSprite = Bullet.sprites.get("saw");

      for (let i = 0; i < this.orbitingSaws; i++) {
        const angle = this.orbitAngle + (i * Math.PI * 2) / this.orbitingSaws;
        const sawX = this.x + Math.cos(angle) * orbitRadius;
        const sawY = this.y + Math.sin(angle) * orbitRadius;

        if (sawSprite && sawSprite.complete) {
          const size = 50;
          ctx.save();
          ctx.translate(sawX, sawY);
          ctx.rotate(this.orbitAngle * 5); // Spin the saw itself
          ctx.drawImage(sawSprite, -size / 2, -size / 2, size, size);
          ctx.restore();
        } else {
          ctx.fillStyle = "#ffaa00";
          ctx.beginPath();
          ctx.arc(sawX, sawY, 20, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw special attack bubble
    if (this.isUsingSpecial) {
      const progress = this.specialDuration / this.specialMaxDuration;
      const currentRadius = this.specialRadius * (1 - progress * 0.3); // Shrink slightly over time

      ctx.save();
      ctx.globalAlpha = 0.6 - progress * 0.4;
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 8;
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#00ffff";
      ctx.beginPath();
      ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner glow
      ctx.globalAlpha = 0.3 - progress * 0.2;
      ctx.fillStyle = "#00ffff";
      ctx.fill();
      ctx.restore();
    }

    if (Player.sprite && Player.sprite.complete) {
      const size = this.radius * 2;
      ctx.drawImage(
        Player.sprite,
        this.x - size / 2,
        this.y - size / 2,
        size,
        size,
      );
    } else {
      ctx.fillStyle = "#3498db";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw health bar
    const barWidth = 60;
    const barHeight = 6;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.radius - 15;

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle =
      healthPercent > 0.5
        ? "#2ecc71"
        : healthPercent > 0.25
          ? "#f39c12"
          : "#e74c3c";
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
  }

  takeDamage(amount: number) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }

  heal(amount: number) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  addWeapon(type: WeaponType) {
    if (this.weapons.has(type)) {
      // Upgrade existing weapon
      const weapon = this.weapons.get(type)!;
      weapon.level = Math.min(5, weapon.level + 1);
    } else {
      // Add new weapon
      this.weapons.set(type, {
        type,
        level: 1,
        cooldown: this.getWeaponCooldown(type),
        lastFired: 0,
      });
    }
  }

  getWeaponCooldown(type: WeaponType): number {
    switch (type) {
      case WeaponType.BASIC:
        return 0.25;
      case WeaponType.SPREAD:
        return 0.4;
      case WeaponType.RAPID:
        return 0.08;
      case WeaponType.HOMING:
        return 0.6;
      case WeaponType.SAW:
        return 0.8;
      case WeaponType.WAVE:
        return 0.35;
      default:
        return 0.3;
    }
  }
}

export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number = 20; // 30% bigger (15 * 1.3 ≈ 20)
  damage: number = 20;
  isPlayerBullet: boolean;
  color: string;
  type: WeaponType;
  targetEnemy: Enemy | null = null;
  rotation: number = 0;
  bounces: number = 0;
  maxBounces: number = 1;
  static sprites: Map<string, HTMLImageElement> = new Map();

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    isPlayerBullet: boolean,
    type: WeaponType = WeaponType.BASIC,
    damage: number = 20,
    maxBounces: number = 1,
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.isPlayerBullet = isPlayerBullet;
    this.type = type;
    this.damage = damage;
    this.maxBounces = maxBounces;
    this.color = isPlayerBullet ? "#f39c12" : "#e74c3c";

    // Calculate initial rotation angle based on velocity direction for homing missiles and enemy bullets
    if (type === WeaponType.HOMING || !isPlayerBullet) {
      this.rotation = Math.atan2(vy, vx);
    }

    // Load sprites
    if (Bullet.sprites.size === 0) {
      const loadSprite = (key: string, src: string) => {
        const img = new Image();
        img.src = src;
        Bullet.sprites.set(key, img);
      };
      loadSprite("simple", bulletSimpleImgModule.src);
      loadSprite("saw", bulletSawImgModule.src);
      loadSprite("wave", bulletWaveImgModule.src);
      loadSprite("swarm", bulletSwarmImgModule.src);
      loadSprite("rocket", bulletRocketImgModule.src);
    }
  }

  update(
    deltaTime: number,
    canvasWidth: number,
    canvasHeight: number,
    enemies?: Enemy[],
    islands?: Island[],
  ) {
    // Saw rotation
    if (this.type === WeaponType.SAW) {
      this.rotation += deltaTime * 10; // Rotate continuously
    }

    // Homing missile logic
    if (this.type === WeaponType.HOMING && this.isPlayerBullet) {
      // Find closest target (enemy or island)
      if (!this.targetEnemy || this.targetEnemy.health <= 0) {
        let closestDist = Infinity;
        this.targetEnemy = null;

        // Check enemies
        if (enemies) {
          for (const enemy of enemies) {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < closestDist && enemy.health > 0) {
              closestDist = dist;
              this.targetEnemy = enemy;
            }
          }
        }

        // Check islands
        if (islands && !this.targetEnemy) {
          for (const island of islands) {
            if (island.isDestroyed) continue;
            const dist = Math.hypot(island.x - this.x, island.y - this.y);
            if (dist < closestDist) {
              closestDist = dist;
              this.targetEnemy = island as any;
            }
          }
        }
      }

      if (this.targetEnemy && this.targetEnemy.health > 0) {
        const dx = this.targetEnemy.x - this.x;
        const dy = this.targetEnemy.y - this.y;
        const dist = Math.hypot(dx, dy);
        const turnSpeed = 8;
        this.vx += (dx / dist) * turnSpeed;
        this.vy += (dy / dist) * turnSpeed;

        // Normalize velocity
        const speed = Math.hypot(this.vx, this.vy);
        const targetSpeed = 500;
        this.vx = (this.vx / speed) * targetSpeed;
        this.vy = (this.vy / speed) * targetSpeed;

        // Update rotation to match velocity direction
        this.rotation = Math.atan2(this.vy, this.vx);
      }
    }

    // Update rotation for enemy bullets to match their direction
    if (
      !this.isPlayerBullet &&
      (this.type === WeaponType.BASIC || this.type === WeaponType.HOMING)
    ) {
      this.rotation = Math.atan2(this.vy, this.vx);
    }

    // Wave motion
    if (this.type === WeaponType.WAVE && this.isPlayerBullet) {
      this.vy = Math.sin(this.x * 0.02) * 200;
    }

    // Update position
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    // Saw bouncing
    if (this.type === WeaponType.SAW && this.bounces < this.maxBounces) {
      if (this.y - this.radius <= 0 || this.y + this.radius >= canvasHeight) {
        this.vy = -this.vy;
        this.y =
          this.y - this.radius <= 0 ? this.radius : canvasHeight - this.radius;
        this.bounces++;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const sprite = Bullet.sprites.get(this.getSpriteKey());

    if (sprite && sprite.complete && this.isPlayerBullet) {
      // Add wind/glow effect
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor =
        this.type === WeaponType.SAW
          ? "#00ffff"
          : this.type === WeaponType.HOMING
            ? "#ff00ff"
            : "#ffaa00";

      const size =
        this.type === WeaponType.SAW
          ? 60 // Keep saw same size
          : this.type === WeaponType.HOMING
            ? 65 // 30% bigger (50 * 1.3)
            : 46; // 30% bigger (35 * 1.3 ≈ 46)
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation + Math.PI / 2); // 90 degrees clockwise
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      ctx.restore();
    } else {
      // Enemy bullets or fallback
      if (!this.isPlayerBullet && sprite && sprite.complete) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff0000";
        const size = 40; // 30% bigger (30 * 1.3 ≈ 40)
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation + Math.PI / 2);
        ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
        ctx.restore();
      } else {
        // Fallback circle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  getSpriteKey(): string {
    switch (this.type) {
      case WeaponType.BASIC:
        return "simple";
      case WeaponType.SAW:
        return "saw";
      case WeaponType.WAVE:
        return "wave";
      case WeaponType.HOMING:
        return "rocket";
      case WeaponType.SPREAD:
        return "swarm";
      default:
        return "simple";
    }
  }
}

export class Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number = 42; // 20% bigger (35 * 1.2)
  health: number = 50;
  maxHealth: number = 50;
  speed: number = 180; // Faster (was 120)
  shootCooldown: number = 2;
  lastShot: number = 0;
  movementType: "straight" | "chase" | "wave" = "straight";
  waveTime: number = 0; // For wave movement
  static sprites: HTMLImageElement[] = [];
  spriteIndex: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;

    // Randomly assign movement types: 33% straight, 33% chase, 33% wave
    const rand = Math.random();
    if (rand < 0.33) {
      this.movementType = "straight";
    } else if (rand < 0.66) {
      this.movementType = "chase";
    } else {
      this.movementType = "wave";
    }

    this.vx = -this.speed;
    this.vy = 0;

    if (Enemy.sprites.length === 0) {
      const spriteSrcs = [
        vehicleHelicopterImgModule.src,
        jdVanceHelicopterImgModule.src,
        jdVinceTrumpHelicopterImgModule.src,
      ];
      Enemy.sprites = spriteSrcs.map((src) => {
        const img = new Image();
        img.src = src;
        return img;
      });
    }

    this.spriteIndex = Math.floor(Math.random() * Enemy.sprites.length);
  }

  update(
    deltaTime: number,
    playerX?: number,
    playerY?: number,
    gameTime?: number,
  ) {
    // Increase speed based on game time (get faster every 10 seconds)
    const speedMultiplier =
      gameTime !== undefined ? 1 + Math.floor(gameTime / 10) * 0.3 : 1;
    const currentSpeed = this.speed * speedMultiplier;

    if (
      this.movementType === "chase" &&
      playerX !== undefined &&
      playerY !== undefined
    ) {
      // Chase the player
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0) {
        this.vx = (dx / dist) * currentSpeed;
        this.vy = (dy / dist) * currentSpeed;
      }
    } else if (this.movementType === "wave") {
      // Wave movement using cosine
      this.waveTime += deltaTime;
      this.vx = -currentSpeed;
      this.vy = Math.cos(this.waveTime * 3) * 150; // Cosine wave vertical movement
    } else {
      // Straight enemies - update speed over time
      this.vx = -currentSpeed;
    }

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const sprite = Enemy.sprites[this.spriteIndex];
    if (sprite && sprite.complete) {
      const baseSize = this.radius * 2.5;
      let width = baseSize;
      let height = baseSize;

      // Preserve aspect ratio for jd-vince-trump-helicopter (index 2: 976x543)
      if (this.spriteIndex === 2) {
        const aspectRatio = 976 / 543;
        width = baseSize * aspectRatio;
        height = baseSize;
      }

      ctx.save();
      ctx.translate(this.x, this.y);
      // Flip all sprites except jd-vance-helicopter (index 1) which needs double flip
      if (this.spriteIndex === 1) {
        // Don't flip (or flip twice = no flip) for jd-vance-helicopter
        ctx.scale(1, 1);
      } else {
        ctx.scale(-1, 1); // Flip to face left
      }
      ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
      ctx.restore();
    } else {
      ctx.fillStyle = "#e74c3c";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw health bar
    const barWidth = 50;
    const barHeight = 5;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.radius - 10;

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
  }

  takeDamage(amount: number) {
    this.health -= amount;
  }
}

export class Island {
  x: number;
  y: number;
  vx: number = -80;
  radius: number = 60;
  health: number = 100;
  maxHealth: number = 100;
  isDestroyed: boolean = false;
  static sprites: HTMLImageElement[] = [];
  static wreckSprite: HTMLImageElement | null = null;
  spriteIndex: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;

    if (Island.sprites.length === 0) {
      const spriteSrcs = [
        islandContainerImgModule.src,
        islandSamImgModule.src,
        islandMissileImgModule.src,
        islandMissionControlImgModule.src,
        islandSatelliteImgModule.src,
        islandHelicoptersImgModule.src,
        islandSamAltImgModule.src,
        islandTanksImgModule.src,
      ];
      Island.sprites = spriteSrcs.map((src) => {
        const img = new Image();
        img.src = src;
        return img;
      });
    }

    if (!Island.wreckSprite) {
      Island.wreckSprite = new Image();
      Island.wreckSprite.src = islandWreckImgModule.src;
    }

    this.spriteIndex = Math.floor(Math.random() * Island.sprites.length);
  }

  update(deltaTime: number) {
    this.x += this.vx * deltaTime;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const sprite = this.isDestroyed
      ? Island.wreckSprite
      : Island.sprites[this.spriteIndex];
    if (sprite && sprite.complete) {
      const size = this.radius * 3;
      ctx.drawImage(sprite, this.x - size / 2, this.y - size / 2, size, size);
    } else {
      ctx.fillStyle = this.isDestroyed ? "#555555" : "#8B4513";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw health bar only if not destroyed
    if (!this.isDestroyed) {
      const barWidth = 70;
      const barHeight = 6;
      const barX = this.x - barWidth / 2;
      const barY = this.y - this.radius - 15;

      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const healthPercent = this.health / this.maxHealth;
      ctx.fillStyle = "#2ecc71";
      ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
  }

  takeDamage(amount: number) {
    if (!this.isDestroyed) {
      this.health -= amount;
      if (this.health <= 0) {
        this.health = 0;
        this.isDestroyed = true;
      }
    }
  }
}

export class Powerup {
  x: number;
  y: number;
  vx: number = -80; // Same speed as islands
  radius: number = 25;
  type: WeaponType | "HEALTH";
  static containerSprite: HTMLImageElement | null = null;

  constructor(x: number, y: number, type: WeaponType | "HEALTH") {
    this.x = x;
    this.y = y;
    this.type = type;

    if (!Powerup.containerSprite) {
      Powerup.containerSprite = new Image();
      Powerup.containerSprite.src = containerCocaineImgModule.src;
    }
  }

  update(deltaTime: number) {
    this.x += this.vx * deltaTime;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (Powerup.containerSprite && Powerup.containerSprite.complete) {
      const size = this.radius * 2.5;
      ctx.drawImage(
        Powerup.containerSprite,
        this.x - size / 2,
        this.y - size / 2,
        size,
        size,
      );
    } else {
      ctx.fillStyle = "#2ecc71";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw letter on powerup
    ctx.fillStyle = "#000000";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const letter = this.type === "HEALTH" ? "H" : this.getWeaponLetter();
    ctx.fillText(letter, this.x, this.y);
  }

  getWeaponLetter(): string {
    switch (this.type) {
      case WeaponType.BASIC:
        return "B";
      case WeaponType.SPREAD:
        return "S";
      case WeaponType.RAPID:
        return "R";
      case WeaponType.HOMING:
        return "M";
      case WeaponType.SAW:
        return "W";
      case WeaponType.WAVE:
        return "V";
      case WeaponType.ORBIT:
        return "O";
      default:
        return "?";
    }
  }
}

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    color: string,
    size: number = 3,
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = size;
  }

  update(deltaTime: number) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= deltaTime;
    this.vx *= 0.98; // Friction
    this.vy *= 0.98;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = Math.max(0, this.life / this.maxLife);
    const hex = this.color.replace("#", "");
    ctx.fillStyle = `#${hex}${Math.floor(alpha * 255)
      .toString(16)
      .padStart(2, "0")}`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  player: Player;
  enemies: Enemy[] = [];
  islands: Island[] = [];
  bullets: Bullet[] = [];
  powerups: Powerup[] = [];
  particles: Particle[] = [];
  keys: Set<string> = new Set();

  // Game state
  score: number = 0;
  isGameOver: boolean = false;
  isPaused: boolean = false;
  gameTime: number = 0;

  // Spawning
  enemySpawnTimer: number = 0;
  enemySpawnInterval: number = 3;
  islandSpawnTimer: number = 0;
  islandSpawnInterval: number = 4;

  // Background
  static backgroundImage: HTMLImageElement | null = null;
  static backgroundPattern: CanvasPattern | null = null;
  backgroundX: number = 0;
  scrollSpeed: number = 80; // Same speed as islands

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.player = new Player(150, canvas.height / 2);

    if (!Game.backgroundImage) {
      Game.backgroundImage = new Image();
      Game.backgroundImage.src = backgroundSeaImgModule.src;
      Game.backgroundImage.onload = () => {
        if (Game.backgroundImage) {
          Game.backgroundPattern = this.ctx.createPattern(
            Game.backgroundImage,
            "repeat",
          )!;
        }
      };
    }
  }

  checkCollision(
    x1: number,
    y1: number,
    r1: number,
    x2: number,
    y2: number,
    r2: number,
  ): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < r1 + r2;
  }

  createExplosion(x: number, y: number, count: number = 30) {
    const colors = ["#ff6600", "#ff9900", "#ffcc00", "#ffffff"];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 100 + Math.random() * 150;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 3 + Math.random() * 4;
      this.particles.push(
        new Particle(x, y, vx, vy, 0.5 + Math.random() * 0.5, color, size),
      );
    }
  }

  spawnEnemy() {
    const y = 50 + Math.random() * (this.canvas.height - 100);
    this.enemies.push(new Enemy(this.canvas.width + 50, y));
  }

  spawnIsland() {
    const y = 50 + Math.random() * (this.canvas.height - 100);
    this.islands.push(new Island(this.canvas.width + 100, y));
  }

  spawnPowerup(x: number, y: number) {
    const types: (WeaponType | "HEALTH")[] = [
      WeaponType.SPREAD,
      WeaponType.RAPID,
      WeaponType.HOMING,
      WeaponType.SAW,
      WeaponType.WAVE,
      WeaponType.ORBIT,
      "HEALTH",
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerups.push(new Powerup(x, y, type));
  }

  shootBullet() {
    const currentTime = this.gameTime;

    // Fire all accumulated weapons
    for (const [weaponType, weapon] of this.player.weapons) {
      if (currentTime - weapon.lastFired < weapon.cooldown) {
        continue;
      }

      weapon.lastFired = currentTime;
      const level = weapon.level;

      switch (weaponType) {
        case WeaponType.BASIC: {
          const damage = 20 + level * 5;
          this.bullets.push(
            new Bullet(
              this.player.x + this.player.radius,
              this.player.y,
              600,
              0,
              true,
              WeaponType.BASIC,
              damage,
            ),
          );
          break;
        }

        case WeaponType.SPREAD: {
          const damage = 15 + level * 3;
          const angles = [-30, -20, -10, 0, 10, 20, 30];
          const numBullets = Math.min(3 + level, 7);
          const startIdx = Math.floor((7 - numBullets) / 2);
          for (let i = 0; i < numBullets; i++) {
            const angle = (angles[startIdx + i] * Math.PI) / 180;
            const vx = Math.cos(angle) * 500;
            const vy = Math.sin(angle) * 500;
            this.bullets.push(
              new Bullet(
                this.player.x + this.player.radius,
                this.player.y,
                vx,
                vy,
                true,
                WeaponType.SPREAD,
                damage,
              ),
            );
          }
          break;
        }

        case WeaponType.RAPID: {
          const damage = 10 + level * 2;
          this.bullets.push(
            new Bullet(
              this.player.x + this.player.radius,
              this.player.y,
              700,
              0,
              true,
              WeaponType.RAPID,
              damage,
            ),
          );
          break;
        }

        case WeaponType.HOMING: {
          const damage = 35 + level * 10;
          const numMissiles = Math.min(1 + Math.floor(level / 2), 3);
          for (let i = 0; i < numMissiles; i++) {
            const offsetY = (i - (numMissiles - 1) / 2) * 20;
            this.bullets.push(
              new Bullet(
                this.player.x + this.player.radius,
                this.player.y + offsetY,
                400,
                0,
                true,
                WeaponType.HOMING,
                damage,
              ),
            );
          }
          break;
        }

        case WeaponType.SAW: {
          const damage = 25 + level * 8;
          const maxBounces = level; // Level increases bounces
          // Shoot two saws: one 45° up, one 45° down
          const angle1 = -Math.PI / 4; // 45° up
          const angle2 = Math.PI / 4; // 45° down
          const speed = 450;

          this.bullets.push(
            new Bullet(
              this.player.x + this.player.radius,
              this.player.y,
              Math.cos(angle1) * speed,
              Math.sin(angle1) * speed,
              true,
              WeaponType.SAW,
              damage,
              maxBounces,
            ),
          );

          this.bullets.push(
            new Bullet(
              this.player.x + this.player.radius,
              this.player.y,
              Math.cos(angle2) * speed,
              Math.sin(angle2) * speed,
              true,
              WeaponType.SAW,
              damage,
              maxBounces,
            ),
          );
          break;
        }

        case WeaponType.WAVE: {
          const damage = 18 + level * 4;
          const numWaves = Math.min(2 + level, 5);
          for (let i = 0; i < numWaves; i++) {
            const offsetX = i * 30;
            this.bullets.push(
              new Bullet(
                this.player.x + this.player.radius + offsetX,
                this.player.y,
                500,
                0,
                true,
                WeaponType.WAVE,
                damage,
              ),
            );
          }
          break;
        }
      }
    }
  }
}
