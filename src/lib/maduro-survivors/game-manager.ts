import { Game, Particle } from "./types";
import { AutoGun, BombLauncher, MineLayer } from "./weapons";
import { getRandomUpgrades } from "./upgrades";
import { createEnemy } from "./enemy-types";

export class GameManager {
  game: Game;
  spawnTimer: number = 0;
  spawnInterval: number = 0.5;
  joystickActive: boolean = false;
  joystickVector: { x: number; y: number } = { x: 0, y: 0 };
  touchId: number | null = null;

  constructor() {
    const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    this.game = new Game(canvas);

    this.game.weapons.push(new AutoGun());

    this.setupCanvas();
    this.setupControls();
    this.setupTouchControls();
    this.startGameLoop();
  }

  setupCanvas(): void {
    const canvas = this.game.canvas;
    const resizeCanvas = () => {
      const isMobile = window.innerWidth <= 768;
      const isLandscape = window.innerWidth > window.innerHeight;

      if (isMobile) {
        if (isLandscape) {
          canvas.width = Math.min(window.innerWidth - 20, 1200);
          canvas.height = Math.min(window.innerHeight - 20, 600);
        } else {
          canvas.width = Math.min(window.innerWidth - 20, 800);
          canvas.height = Math.min(window.innerHeight - 20, 1000);
        }
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      if (this.game.player) {
        this.game.player.position.x = Math.min(
          this.game.player.position.x,
          canvas.width - this.game.player.radius,
        );
        this.game.player.position.y = Math.min(
          this.game.player.position.y,
          canvas.height - this.game.player.radius,
        );
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
  }

  setupControls(): void {
    window.addEventListener("keydown", (e) => {
      this.game.keys.add(e.key.toLowerCase());

      if (e.key.toLowerCase() === "r" && this.game.isGameOver) {
        this.restart();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.game.keys.delete(e.key.toLowerCase());
    });
  }

  setupTouchControls(): void {
    const joystickBase = document.getElementById(
      "joystick-base",
    ) as HTMLElement;
    const joystickStick = document.getElementById(
      "joystick-stick",
    ) as HTMLElement;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();

      const touch = e.touches[0];
      const rect = joystickBase.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      this.joystickActive = true;
      this.touchId = touch.identifier;
      this.updateJoystick(
        touch.clientX,
        touch.clientY,
        centerX,
        centerY,
        rect.width / 2,
      );
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      if (!this.joystickActive) return;

      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === this.touchId) {
          const touch = e.touches[i];
          const rect = joystickBase.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          this.updateJoystick(
            touch.clientX,
            touch.clientY,
            centerX,
            centerY,
            rect.width / 2,
          );
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();

      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.touchId) {
          this.joystickActive = false;
          this.touchId = null;
          this.joystickVector = { x: 0, y: 0 };
          joystickStick.style.transform = "translate(-50%, -50%)";
          break;
        }
      }
    };

    joystickBase.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    joystickBase.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    joystickBase.addEventListener("touchend", handleTouchEnd, {
      passive: false,
    });
    joystickBase.addEventListener("touchcancel", handleTouchEnd, {
      passive: false,
    });

    const upgradeOptionsDiv = document.getElementById("upgrade-options");
    if (upgradeOptionsDiv) {
      upgradeOptionsDiv.addEventListener(
        "touchstart",
        (e) => {
          e.stopPropagation();
        },
        { passive: true },
      );
    }

    const gameOverDiv = document.getElementById("game-over");
    if (gameOverDiv) {
      gameOverDiv.addEventListener("touchstart", () => {
        if (this.game.isGameOver) {
          this.restart();
        }
      });
    }
  }

  updateJoystick(
    touchX: number,
    touchY: number,
    centerX: number,
    centerY: number,
    maxRadius: number,
  ): void {
    const dx = touchX - centerX;
    const dy = touchY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const limitedDistance = Math.min(distance, maxRadius - 30);
    const angle = Math.atan2(dy, dx);

    const stickX = Math.cos(angle) * limitedDistance;
    const stickY = Math.sin(angle) * limitedDistance;

    const joystickStick = document.getElementById(
      "joystick-stick",
    ) as HTMLElement;
    joystickStick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;

    if (distance > 10) {
      this.joystickVector.x = dx / maxRadius;
      this.joystickVector.y = dy / maxRadius;

      const magnitude = Math.sqrt(
        this.joystickVector.x * this.joystickVector.x +
          this.joystickVector.y * this.joystickVector.y,
      );
      if (magnitude > 1) {
        this.joystickVector.x /= magnitude;
        this.joystickVector.y /= magnitude;
      }
    } else {
      this.joystickVector = { x: 0, y: 0 };
    }
  }

  restart(): void {
    const canvas = this.game.canvas;
    this.game = new Game(canvas);
    this.game.weapons.push(new AutoGun());
    this.spawnTimer = 0;

    document.getElementById("game-over")!.style.display = "none";
  }

  startGameLoop(): void {
    this.game.lastTime = performance.now();
    requestAnimationFrame(() => this.gameLoop());
  }

  gameLoop(): void {
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.game.lastTime) / 1000, 0.1);
    this.game.lastTime = currentTime;

    if (!this.game.isPaused && !this.game.isGameOver) {
      this.update(deltaTime);
    }

    this.draw();

    requestAnimationFrame(() => this.gameLoop());
  }

  update(deltaTime: number): void {
    this.game.gameTime += deltaTime;

    if (this.game.gameTime >= this.game.maxGameTime) {
      this.gameOver();
      return;
    }

    this.updatePlayer(deltaTime);
    this.spawnEnemies(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateWeapons(deltaTime);
    this.handleCollisions();
    this.updateParticles(deltaTime);
    this.updateUI();
  }

  updatePlayer(deltaTime: number): void {
    const player = this.game.player;

    player.velocity.x = 0;
    player.velocity.y = 0;

    if (this.joystickActive) {
      player.velocity.x = this.joystickVector.x * player.speed;
      player.velocity.y = this.joystickVector.y * player.speed;
    } else {
      if (this.game.keys.has("w") || this.game.keys.has("arrowup"))
        player.velocity.y = -player.speed;
      if (this.game.keys.has("s") || this.game.keys.has("arrowdown"))
        player.velocity.y = player.speed;
      if (this.game.keys.has("a") || this.game.keys.has("arrowleft"))
        player.velocity.x = -player.speed;
      if (this.game.keys.has("d") || this.game.keys.has("arrowright"))
        player.velocity.x = player.speed;

      if (player.velocity.x !== 0 && player.velocity.y !== 0) {
        player.velocity.x *= 0.707;
        player.velocity.y *= 0.707;
      }
    }

    player.update(deltaTime);

    player.position.x = Math.max(
      player.radius,
      Math.min(this.game.canvas.width - player.radius, player.position.x),
    );
    player.position.y = Math.max(
      player.radius,
      Math.min(this.game.canvas.height - player.radius, player.position.y),
    );
  }

  spawnEnemies(deltaTime: number): void {
    this.spawnTimer += deltaTime;

    const difficultyMultiplier = 1 + this.game.gameTime / 60;
    const currentSpawnInterval = this.spawnInterval / difficultyMultiplier;

    if (this.spawnTimer >= currentSpawnInterval) {
      this.spawnTimer = 0;

      const count = Math.floor(1 + difficultyMultiplier / 2);
      for (let i = 0; i < count; i++) {
        this.spawnEnemy();
      }
    }
  }

  spawnEnemy(): void {
    const side = Math.floor(Math.random() * 4);
    let x = 0,
      y = 0;

    switch (side) {
      case 0:
        x = Math.random() * this.game.canvas.width;
        y = -20;
        break;
      case 1:
        x = this.game.canvas.width + 20;
        y = Math.random() * this.game.canvas.height;
        break;
      case 2:
        x = Math.random() * this.game.canvas.width;
        y = this.game.canvas.height + 20;
        break;
      case 3:
        x = -20;
        y = Math.random() * this.game.canvas.height;
        break;
    }

    const enemy = createEnemy(x, y, this.game.gameTime);
    enemy.speed += Math.random() * 30 + this.game.gameTime * 2;
    enemy.health += this.game.gameTime * 2;
    enemy.maxHealth = enemy.health;

    this.game.enemies.push(enemy);
  }

  updateEnemies(deltaTime: number): void {
    for (let i = this.game.enemies.length - 1; i >= 0; i--) {
      const enemy = this.game.enemies[i];

      const dx = this.game.player.position.x - enemy.position.x;
      const dy = this.game.player.position.y - enemy.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      enemy.velocity.x = (dx / dist) * enemy.speed;
      enemy.velocity.y = (dy / dist) * enemy.speed;

      enemy.update(deltaTime);

      if (enemy.dead) {
        this.createExplosion(enemy.position.x, enemy.position.y, 15);
        this.game.enemies.splice(i, 1);
        this.game.kills++;

        if (this.game.player.addExp(1)) {
          this.showLevelUp();
        }
      }
    }
  }

  updateWeapons(deltaTime: number): void {
    for (const weapon of this.game.weapons) {
      weapon.update(deltaTime, this.game.player, this.game.enemies);
    }
  }

  handleCollisions(): void {
    for (const weapon of this.game.weapons) {
      if (weapon instanceof AutoGun) {
        for (const proj of weapon.projectiles) {
          for (let i = this.game.enemies.length - 1; i >= 0; i--) {
            const enemy = this.game.enemies[i];
            if (
              this.checkCollision(
                proj.x,
                proj.y,
                proj.radius,
                enemy.position.x,
                enemy.position.y,
                enemy.radius,
              )
            ) {
              enemy.takeDamage(proj.damage);
              proj.dead = true;
              this.createExplosion(proj.x, proj.y, 5, "#ffff00");
              break;
            }
          }
        }
      }

      if (weapon instanceof BombLauncher) {
        for (const bomb of weapon.bombs) {
          if (!bomb.exploded) {
            for (const enemy of this.game.enemies) {
              const dx = enemy.position.x - bomb.x;
              const dy = enemy.position.y - bomb.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < bomb.radius + enemy.radius) {
                bomb.exploded = true;
                bomb.explosionTimer = 0.2;
                break;
              }
            }
          }

          if (bomb.exploded && bomb.explosionTimer === 0.2) {
            this.createExplosion(bomb.x, bomb.y, 100, "#ff6600");
            this.createExplosion(bomb.x, bomb.y, 80, "#ff9900");
            this.createExplosion(bomb.x, bomb.y, 60, "#ffcc00");

            for (const enemy of this.game.enemies) {
              const dx = enemy.position.x - bomb.x;
              const dy = enemy.position.y - bomb.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < bomb.explosionRadius) {
                enemy.takeDamage(bomb.damage);
              }
            }
          }
        }
      }

      if (weapon instanceof MineLayer) {
        for (const mine of weapon.mines) {
          if (!mine.exploded && mine.armed) {
            for (const enemy of this.game.enemies) {
              const dx = enemy.position.x - mine.x;
              const dy = enemy.position.y - mine.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < mine.radius + enemy.radius) {
                mine.exploded = true;
                this.createExplosion(mine.x, mine.y, 70, "#ff6600");
                this.createExplosion(mine.x, mine.y, 50, "#ff9900");

                for (const e of this.game.enemies) {
                  const edx = e.position.x - mine.x;
                  const edy = e.position.y - mine.y;
                  const edist = Math.sqrt(edx * edx + edy * edy);

                  if (edist < mine.explosionRadius) {
                    e.takeDamage(mine.damage);
                  }
                }
                break;
              }
            }
          }
        }
      }
    }

    for (const enemy of this.game.enemies) {
      if (
        this.checkCollision(
          this.game.player.position.x,
          this.game.player.position.y,
          this.game.player.radius,
          enemy.position.x,
          enemy.position.y,
          enemy.radius,
        )
      ) {
        this.game.player.takeDamage(enemy.damage * 0.016);

        if (this.game.player.health <= 0) {
          this.gameOver();
        }
      }
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
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < r1 + r2;
  }

  createExplosion(
    x: number,
    y: number,
    count: number,
    color: string = "#ff6600",
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 100 + Math.random() * 200;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.game.particles.push(new Particle(x, y, vx, vy, color));
    }
  }

  updateParticles(deltaTime: number): void {
    for (let i = this.game.particles.length - 1; i >= 0; i--) {
      if (!this.game.particles[i].update(deltaTime)) {
        this.game.particles.splice(i, 1);
      }
    }
  }

  showLevelUp(): void {
    this.game.isPaused = true;

    const levelUpDiv = document.getElementById("level-up")!;
    const optionsDiv = document.getElementById("upgrade-options")!;

    optionsDiv.innerHTML = "";

    const upgrades = getRandomUpgrades(3);

    upgrades.forEach((upgrade) => {
      const option = document.createElement("div");
      option.className = "upgrade-option";
      option.innerHTML = `<strong>${upgrade.name}</strong><br>${upgrade.description}`;
      option.onclick = () => {
        upgrade.apply(this.game);
        levelUpDiv.style.display = "none";
        this.game.isPaused = false;
      };
      optionsDiv.appendChild(option);
    });

    levelUpDiv.style.display = "block";
  }

  gameOver(): void {
    this.game.isGameOver = true;

    document.getElementById("final-time")!.textContent = this.formatTime(
      this.game.gameTime,
    );
    document.getElementById("final-kills")!.textContent =
      this.game.kills.toString();
    document.getElementById("game-over")!.style.display = "block";
  }

  updateUI(): void {
    document.getElementById("timer")!.textContent = this.formatTime(
      this.game.gameTime,
    );
    document.getElementById("level")!.textContent =
      this.game.player.level.toString();
    document.getElementById("kills")!.textContent = this.game.kills.toString();

    const expPercent =
      (this.game.player.exp / this.game.player.expToLevel) * 100;
    document.getElementById("exp-bar")!.style.width = `${expPercent}%`;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  draw(): void {
    const ctx = this.game.ctx;

    ctx.fillStyle = "#2d5016";
    ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);

    for (const particle of this.game.particles) {
      particle.draw(ctx);
    }

    for (const weapon of this.game.weapons) {
      weapon.draw(ctx);
    }

    for (const enemy of this.game.enemies) {
      enemy.draw(ctx);
    }

    this.game.player.draw(ctx);

    ctx.fillStyle = "#ff0000";
    ctx.fillRect(
      10,
      this.game.canvas.height - 30,
      (this.game.player.health / this.game.player.maxHealth) * 200,
      20,
    );
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(10, this.game.canvas.height - 30, 200, 20);
  }
}
