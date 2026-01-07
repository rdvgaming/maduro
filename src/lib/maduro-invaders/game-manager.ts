import { Game, Projectile, Particle, Enemy } from "./types";
import type { Game as GameType } from "./types";

export class GameManager {
  game: Game;
  joystickActive: boolean = false;
  joystickVector: { x: number; y: number } = { x: 0, y: 0 };
  touchId: number | null = null;

  constructor() {
    const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    this.game = new Game(canvas);

    this.setupCanvas();
    this.setupControls();
    this.setupTouchControls();
    this.spawnEnemyGrid();
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
          Math.max(this.game.player.position.x, this.game.player.radius),
          canvas.width - this.game.player.radius,
        );
        this.game.player.position.y = canvas.height - 100;
      }

      // Respawn enemies on resize
      if (this.game.enemies.length === 0 && !this.game.isGameOver) {
        this.spawnEnemyGrid();
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

  spawnEnemyGrid(): void {
    const canvas = this.game.canvas;
    const enemySize = 60; // Space each enemy takes (radius * 2 + padding)
    const startY = 80;
    const rows = Math.floor((canvas.height * 0.3) / enemySize);
    const cols = Math.floor((canvas.width * 0.8) / enemySize);

    // Calculate spacing to center the grid
    const totalWidth = cols * enemySize;
    const startX = (canvas.width - totalWidth) / 2 + enemySize / 2;

    this.game.enemies = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * enemySize;
        const y = startY + row * enemySize;
        const enemy = new Enemy(x, y, col, row);
        this.game.enemies.push(enemy);
      }
    }
  }

  restart(): void {
    const canvas = this.game.canvas;
    const currentWidth = canvas.width;
    const currentHeight = canvas.height;

    this.game = new Game(canvas);

    canvas.width = currentWidth;
    canvas.height = currentHeight;

    this.game.player.position.x = canvas.width / 2;
    this.game.player.position.y = canvas.height - 100;

    this.spawnEnemyGrid();

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

    if (!this.game.isGameOver) {
      this.update(deltaTime);
    }

    this.draw();

    requestAnimationFrame(() => this.gameLoop());
  }

  update(deltaTime: number): void {
    this.game.gameTime += deltaTime;

    this.updatePlayer(deltaTime);
    this.updateProjectiles(deltaTime);
    this.updateEnemies(deltaTime);
    this.handleCollisions();
    this.updateParticles(deltaTime);
    this.updateUI();
    this.autoShoot();

    // Check if enemies reached the ground
    for (const enemy of this.game.enemies) {
      if (enemy.position.y + enemy.radius >= this.game.canvas.height - 50) {
        this.gameOver();
        return;
      }
    }

    // Check if all enemies are dead - spawn new wave
    if (this.game.enemies.length === 0) {
      this.spawnEnemyGrid();
      this.game.enemySpeed =
        this.game.baseEnemySpeed * (1 + this.game.gameTime / 30);
    }
  }

  updatePlayer(deltaTime: number): void {
    const player = this.game.player;

    player.velocity.x = 0;

    if (this.joystickActive) {
      // Only allow horizontal movement for mobile
      player.velocity.x = this.joystickVector.x * player.speed;
    } else {
      if (this.game.keys.has("a") || this.game.keys.has("arrowleft"))
        player.velocity.x = -player.speed;
      if (this.game.keys.has("d") || this.game.keys.has("arrowright"))
        player.velocity.x = player.speed;
    }

    player.update(deltaTime);

    // Keep player in bounds (only horizontal)
    player.position.x = Math.max(
      player.radius,
      Math.min(this.game.canvas.width - player.radius, player.position.x),
    );
  }

  autoShoot(): void {
    if (this.game.player.canShoot()) {
      const projectile = new Projectile(
        this.game.player.position.x,
        this.game.player.position.y - this.game.player.radius,
        0,
        -600, // Fast upward velocity
      );
      this.game.projectiles.push(projectile);
      this.game.player.resetShootCooldown();
    }
  }

  updateProjectiles(deltaTime: number): void {
    for (let i = this.game.projectiles.length - 1; i >= 0; i--) {
      const proj = this.game.projectiles[i];
      proj.update(deltaTime);

      // Remove projectiles that are off screen
      if (proj.y < -proj.radius || proj.dead) {
        this.game.projectiles.splice(i, 1);
      }
    }
  }

  updateEnemies(deltaTime: number): void {
    if (this.game.enemies.length === 0) return;

    // Calculate speed based on remaining enemies (fewer enemies = faster)
    // Speed increases progressively as enemies are eliminated
    const totalEnemies =
      Math.floor((this.game.canvas.width * 0.8) / 60) *
      Math.floor((this.game.canvas.height * 0.3) / 60);
    const remainingRatio = this.game.enemies.length / totalEnemies;
    // Speed ranges from 3x base speed (at start) to 10x base speed (at 1 enemy)
    // Using inverse ratio: when 100% remain -> 3x, when ~10% remain -> 10x
    const speedMultiplier = 3 + (1 - remainingRatio) * 7;
    const currentSpeed = this.game.enemySpeed * speedMultiplier;

    // Check if any enemy hit the edge
    let hitLeftEdge = false;
    let hitRightEdge = false;

    for (const enemy of this.game.enemies) {
      const nextX =
        enemy.position.x + this.game.enemyDirection * currentSpeed * deltaTime;
      if (nextX - enemy.radius < 0) hitLeftEdge = true;
      if (nextX + enemy.radius > this.game.canvas.width) hitRightEdge = true;
    }

    // Move down and reverse direction if hit edge
    if (
      (hitLeftEdge && this.game.enemyDirection === -1) ||
      (hitRightEdge && this.game.enemyDirection === 1)
    ) {
      this.game.enemyDirection *= -1;

      for (const enemy of this.game.enemies) {
        enemy.position.y += this.game.enemyDownAmount;
      }
    }

    // Move all enemies
    for (const enemy of this.game.enemies) {
      enemy.velocity.x = this.game.enemyDirection * currentSpeed;
      enemy.velocity.y = 0;
      enemy.update(deltaTime);
    }
  }

  handleCollisions(): void {
    for (let i = this.game.projectiles.length - 1; i >= 0; i--) {
      const proj = this.game.projectiles[i];

      for (let j = this.game.enemies.length - 1; j >= 0; j--) {
        const enemy = this.game.enemies[j];

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
          // Hit!
          this.createExplosion(enemy.position.x, enemy.position.y, 20);
          this.game.enemies.splice(j, 1);
          this.game.projectiles.splice(i, 1);
          this.game.score += 10;
          break;
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

  gameOver(): void {
    this.game.isGameOver = true;

    document.getElementById("final-time")!.textContent = this.formatTime(
      this.game.gameTime,
    );
    document.getElementById("final-score")!.textContent =
      this.game.score.toString();
    document.getElementById("game-over")!.style.display = "block";
  }

  updateUI(): void {
    document.getElementById("timer")!.textContent = this.formatTime(
      this.game.gameTime,
    );
    document.getElementById("score")!.textContent = this.game.score.toString();
    document.getElementById("enemies")!.textContent =
      this.game.enemies.length.toString();
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  draw(): void {
    const ctx = this.game.ctx;

    // Clear canvas (background is handled by CSS)
    ctx.clearRect(0, 0, this.game.canvas.width, this.game.canvas.height);

    // Draw particles
    for (const particle of this.game.particles) {
      particle.draw(ctx);
    }

    // Draw projectiles
    for (const proj of this.game.projectiles) {
      proj.draw(ctx);
    }

    // Draw enemies
    for (const enemy of this.game.enemies) {
      enemy.draw(ctx);
    }

    // Draw player
    this.game.player.draw(ctx);
  }
}
