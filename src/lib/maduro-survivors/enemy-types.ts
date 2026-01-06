import { Enemy } from "./types";
import trumpImgModule from "./assets/maduro-survivors/trump.png";

export class Trump extends Enemy {
  static trumpSprite: HTMLImageElement | null = null;

  constructor(x: number, y: number) {
    super(x, y);

    this.radius = 40;
    this.speed = 30;
    this.health = 100;
    this.maxHealth = 100;
    this.damage = 25;

    if (!Trump.trumpSprite) {
      Trump.trumpSprite = new Image();
      Trump.trumpSprite.src = trumpImgModule.src;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (Trump.trumpSprite && Trump.trumpSprite.complete) {
      ctx.save();

      ctx.translate(this.position.x, this.position.y);

      if (this.facingLeft) {
        ctx.scale(-1, 1);
      }

      const size = this.radius * 2.5;

      ctx.drawImage(Trump.trumpSprite, -size / 2, -size / 2, size, size);

      ctx.restore();

      const healthBarWidth = 40;
      const healthBarHeight = 5;
      const healthPercent = this.health / this.maxHealth;

      ctx.fillStyle = "#ff0000";
      ctx.fillRect(
        this.position.x - healthBarWidth / 2,
        this.position.y - this.radius - 12,
        healthBarWidth,
        healthBarHeight,
      );

      ctx.fillStyle = "#00ff00";
      ctx.fillRect(
        this.position.x - healthBarWidth / 2,
        this.position.y - this.radius - 12,
        healthBarWidth * healthPercent,
        healthBarHeight,
      );
    } else {
      super.draw(ctx);
    }
  }
}

export function createEnemy(x: number, y: number, gameTime: number): Enemy {
  const rand = Math.random();

  // 15% chance to spawn Trump (increases slightly over time)
  const trumpChance = 0.1 + (gameTime / 600) * 0.1;

  if (rand < trumpChance) {
    return new Trump(x, y);
  }

  return new Enemy(x, y);
}
