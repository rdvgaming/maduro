import type { Weapon } from "./types";
import { Player, Enemy } from "./types";

export class Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number = 5;
  dead: boolean = false;

  constructor(x: number, y: number, vx: number, vy: number, damage: number) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
  }

  update(deltaTime: number): void {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#ffff00";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export class AutoGun implements Weapon {
  name = "Auto Gun";
  damage = 10;
  cooldown = 0.3;
  level = 1;
  currentCooldown = 0;
  projectiles: Projectile[] = [];

  update(deltaTime: number, player: Player, enemies: Enemy[]): void {
    this.currentCooldown -= deltaTime;

    if (this.currentCooldown <= 0 && enemies.length > 0) {
      const closest = this.findClosestEnemy(player, enemies);
      if (closest) {
        this.shoot(player, closest);
        this.currentCooldown = this.cooldown / this.level;
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(deltaTime);

      if (
        proj.dead ||
        proj.x < 0 ||
        proj.x > 1200 ||
        proj.y < 0 ||
        proj.y > 800
      ) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  shoot(player: Player, target: Enemy): void {
    const dx = target.position.x - player.position.x;
    const dy = target.position.y - player.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const speed = 500;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    this.projectiles.push(
      new Projectile(
        player.position.x,
        player.position.y,
        vx,
        vy,
        this.damage * this.level,
      ),
    );
  }

  findClosestEnemy(player: Player, enemies: Enemy[]): Enemy | null {
    let closest: Enemy | null = null;
    let minDist = Infinity;

    for (const enemy of enemies) {
      const dx = enemy.position.x - player.position.x;
      const dy = enemy.position.y - player.position.y;
      const dist = dx * dx + dy * dy;

      if (dist < minDist) {
        minDist = dist;
        closest = enemy;
      }
    }

    return closest;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const proj of this.projectiles) {
      proj.draw(ctx);
    }
  }
}

export class BombLauncher implements Weapon {
  name = "Bomb Launcher";
  damage = 100;
  cooldown = 1.5;
  level = 1;
  currentCooldown = 0;
  bombs: Bomb[] = [];

  update(deltaTime: number, player: Player, enemies: Enemy[]): void {
    this.currentCooldown -= deltaTime;

    if (this.currentCooldown <= 0 && enemies.length > 0) {
      const target = this.findRandomEnemy(enemies);
      if (target) {
        this.launchBomb(player, target);
        this.currentCooldown = this.cooldown / Math.sqrt(this.level);
      }
    }

    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const bomb = this.bombs[i];
      bomb.update(deltaTime);

      if (bomb.exploded) {
        this.bombs.splice(i, 1);
      }
    }
  }

  launchBomb(player: Player, target: Enemy): void {
    const dx = target.position.x - player.position.x;
    const dy = target.position.y - player.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const speed = 300;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    this.bombs.push(
      new Bomb(
        player.position.x,
        player.position.y,
        vx,
        vy,
        this.damage * this.level,
        150 + this.level * 30,
      ),
    );
  }

  findRandomEnemy(enemies: Enemy[]): Enemy | null {
    if (enemies.length === 0) return null;
    return enemies[Math.floor(Math.random() * enemies.length)];
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const bomb of this.bombs) {
      bomb.draw(ctx);
    }
  }
}

export class Bomb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  explosionRadius: number;
  timer: number = 0.8;
  exploded: boolean = false;
  explosionTimer: number = 0;

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    explosionRadius: number,
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.explosionRadius = explosionRadius;
    this.radius = 8;
  }

  update(deltaTime: number): void {
    if (!this.exploded) {
      this.x += this.vx * deltaTime;
      this.y += this.vy * deltaTime;
      this.timer -= deltaTime;

      if (this.timer <= 0) {
        this.exploded = true;
        this.explosionTimer = 0.2;
      }
    } else if (this.explosionTimer > 0) {
      this.explosionTimer -= deltaTime;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.exploded) {
      ctx.fillStyle = "#ff0000";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (this.explosionTimer > 0) {
      const alpha = this.explosionTimer / 0.2;
      ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.explosionRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(255, 200, 0, ${alpha})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.explosionRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

export class MineLayer implements Weapon {
  name = "Mine Layer";
  damage = 40;
  cooldown = 1.5;
  level = 1;
  currentCooldown = 0;
  mines: Mine[] = [];

  update(deltaTime: number, player: Player, _enemies: Enemy[]): void {
    this.currentCooldown -= deltaTime;

    if (this.currentCooldown <= 0) {
      this.dropMine(player);
      this.currentCooldown = this.cooldown;
    }

    for (let i = this.mines.length - 1; i >= 0; i--) {
      const mine = this.mines[i];
      mine.update(deltaTime);

      if (mine.exploded || mine.lifetime <= 0) {
        this.mines.splice(i, 1);
      }
    }
  }

  dropMine(player: Player): void {
    this.mines.push(
      new Mine(
        player.position.x,
        player.position.y,
        this.damage * this.level,
        60 + this.level * 15,
      ),
    );
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const mine of this.mines) {
      mine.draw(ctx);
    }
  }
}

export class Mine {
  x: number;
  y: number;
  damage: number;
  radius: number = 10;
  explosionRadius: number;
  lifetime: number = 10;
  exploded: boolean = false;
  armed: boolean = false;
  armTime: number = 0.3;

  constructor(x: number, y: number, damage: number, explosionRadius: number) {
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.explosionRadius = explosionRadius;
  }

  update(deltaTime: number): void {
    if (!this.armed) {
      this.armTime -= deltaTime;
      if (this.armTime <= 0) {
        this.armed = true;
      }
    }

    if (!this.exploded) {
      this.lifetime -= deltaTime;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.exploded) {
      ctx.fillStyle = this.armed ? "#ff6600" : "#666666";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}
