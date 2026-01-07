import { Game, Particle, Obstacle, Barrel, Collectible } from "./types";
import type { Game as GameType } from "./types";
import { getRandomUpgrades } from "./upgrades";

export class GameManager {
  game: Game;
  spawnTimer: number = 0;
  spawnInterval: number = 2.0;
  collectibleSpawnTimer: number = 0;
  collectibleSpawnInterval: number = 5.0;
  joystickActive: boolean = false;
  joystickVector: { x: number; y: number } = { x: 0, y: 0 };
  touchId: number | null = null;

  constructor() {
    const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    this.game = new Game(canvas);

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
          Math.max(this.game.player.position.y, this.game.player.radius),
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

      if (
        e.key.toLowerCase() === "r" &&
        (this.game.isGameOver || this.game.isWon)
      ) {
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
        if (this.game.isGameOver || this.game.isWon) {
          this.restart();
        }
      });
    }

    const gameWonDiv = document.getElementById("game-won");
    if (gameWonDiv) {
      gameWonDiv.addEventListener("touchstart", () => {
        if (this.game.isWon) {
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
    const currentWidth = canvas.width;
    const currentHeight = canvas.height;

    this.game = new Game(canvas);

    canvas.width = currentWidth;
    canvas.height = currentHeight;

    this.game.player.position.x = canvas.width / 2;
    this.game.player.position.y = canvas.height / 2;

    this.spawnTimer = 0;
    this.collectibleSpawnTimer = 0;

    document.getElementById("game-over")!.style.display = "none";
    document.getElementById("game-won")!.style.display = "none";
  }

  startGameLoop(): void {
    this.game.lastTime = performance.now();
    requestAnimationFrame(() => this.gameLoop());
  }

  gameLoop(): void {
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.game.lastTime) / 1000, 0.1);
    this.game.lastTime = currentTime;

    if (!this.game.isPaused && !this.game.isGameOver && !this.game.isWon) {
      this.update(deltaTime);
    }

    this.draw();

    requestAnimationFrame(() => this.gameLoop());
  }

  update(deltaTime: number): void {
    this.game.gameTime += deltaTime;
    this.game.distance += this.game.scrollSpeed * deltaTime;

    // Health regeneration
    if (this.game.healthRegen > 0) {
      this.game.player.health = Math.min(
        this.game.player.maxHealth,
        this.game.player.health + this.game.healthRegen * deltaTime,
      );
    }

    this.updatePlayer(deltaTime);
    this.updateBackground(deltaTime);
    this.spawnObstacles(deltaTime);
    this.spawnCollectibles(deltaTime);
    this.updateObstacles(deltaTime);
    this.updateCollectibles(deltaTime);
    this.updateBarrels(deltaTime);
    this.handleCollisions(deltaTime);
    this.updateParticles(deltaTime);
    this.updateUI();
    this.autoDropBarrel();
    this.checkWinCondition();
  }

  updatePlayer(deltaTime: number): void {
    const player = this.game.player;
    const speed = 300;

    player.velocity.x = 0;
    player.velocity.y = 0;

    if (this.joystickActive) {
      player.velocity.x = this.joystickVector.x * speed;
      player.velocity.y = this.joystickVector.y * speed;
    } else {
      if (this.game.keys.has("w") || this.game.keys.has("arrowup"))
        player.velocity.y = -speed;
      if (this.game.keys.has("s") || this.game.keys.has("arrowdown"))
        player.velocity.y = speed;
      if (this.game.keys.has("a") || this.game.keys.has("arrowleft"))
        player.velocity.x = -speed;
      if (this.game.keys.has("d") || this.game.keys.has("arrowright"))
        player.velocity.x = speed;

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

  updateBackground(deltaTime: number): void {
    this.game.backgroundX += this.game.scrollSpeed * deltaTime;
  }

  spawnObstacles(deltaTime: number): void {
    this.spawnTimer += deltaTime;

    const difficultyMultiplier = 1 + this.game.gameTime / 30;
    const currentSpawnInterval = this.spawnInterval / difficultyMultiplier;

    if (this.spawnTimer >= currentSpawnInterval) {
      this.spawnTimer = 0;

      // Only spawn from the left side
      const x = -20;
      const y = Math.random() * this.game.canvas.height;

      const obstacle = new Obstacle(x, y);
      obstacle.speed += Math.random() * 30 + this.game.gameTime * 2;
      obstacle.health += this.game.gameTime * 2;
      obstacle.maxHealth = obstacle.health;

      this.game.obstacles.push(obstacle);
    }
  }

  spawnCollectibles(deltaTime: number): void {
    this.collectibleSpawnTimer += deltaTime;

    if (this.collectibleSpawnTimer >= this.collectibleSpawnInterval) {
      this.collectibleSpawnTimer = 0;

      const y = 50 + Math.random() * (this.game.canvas.height - 100);
      const collectible = new Collectible(this.game.canvas.width + 50, y);
      collectible.velocity.x = -this.game.scrollSpeed;

      this.game.collectibles.push(collectible);
    }
  }

  updateCollectibles(deltaTime: number): void {
    for (let i = this.game.collectibles.length - 1; i >= 0; i--) {
      const collectible = this.game.collectibles[i];
      collectible.update(deltaTime);

      if (
        collectible.position.x < -collectible.radius - 50 ||
        collectible.dead
      ) {
        this.game.collectibles.splice(i, 1);
      }
    }
  }

  updateObstacles(deltaTime: number): void {
    for (let i = this.game.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.game.obstacles[i];

      // Chase the player like in maduro-survivors
      const dx = this.game.player.position.x - obstacle.position.x;
      const dy = this.game.player.position.y - obstacle.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        obstacle.velocity.x = (dx / dist) * obstacle.speed;
        obstacle.velocity.y = (dy / dist) * obstacle.speed;
      }

      obstacle.update(deltaTime);

      if (obstacle.dead) {
        this.createExplosion(obstacle.position.x, obstacle.position.y, 15);
        this.game.obstacles.splice(i, 1);
        this.game.score += 10;
      }
    }
  }

  autoDropBarrel(): void {
    if (this.game.player.canDropBarrel()) {
      const barrel = new Barrel(
        this.game.player.position.x,
        this.game.player.position.y,
        this.game.scrollSpeed,
        this.game.barrelDamage,
        this.game.barrelPierce,
      );
      this.game.barrels.push(barrel);
      this.game.player.resetBarrelCooldown();
    }
  }

  updateBarrels(deltaTime: number): void {
    for (let i = this.game.barrels.length - 1; i >= 0; i--) {
      const barrel = this.game.barrels[i];
      barrel.update(deltaTime);

      if (barrel.x < -barrel.radius - 50 || barrel.dead || barrel.exploded) {
        this.game.barrels.splice(i, 1);
      }
    }
  }

  handleCollisions(deltaTime: number): void {
    for (let i = this.game.barrels.length - 1; i >= 0; i--) {
      const barrel = this.game.barrels[i];

      if (barrel.exploded) continue;

      for (let j = this.game.obstacles.length - 1; j >= 0; j--) {
        const obstacle = this.game.obstacles[j];

        if (
          this.checkCollision(
            barrel.x,
            barrel.y,
            barrel.radius,
            obstacle.position.x,
            obstacle.position.y,
            obstacle.radius,
          )
        ) {
          obstacle.takeDamage(barrel.damage);
          barrel.pierceCount++;

          const explosionSize = 30 * this.game.explosionSize;
          this.createExplosion(barrel.x, barrel.y, explosionSize, "#ff6600");
          this.createExplosion(
            barrel.x,
            barrel.y,
            explosionSize * 0.7,
            "#ff9900",
          );
          this.createExplosion(
            barrel.x,
            barrel.y,
            explosionSize * 0.5,
            "#ffcc00",
          );

          if (barrel.pierceCount > barrel.maxPierce) {
            barrel.exploded = true;
            barrel.dead = true;
            break;
          }
        }
      }
    }

    for (const obstacle of this.game.obstacles) {
      if (
        this.checkCollision(
          this.game.player.position.x,
          this.game.player.position.y,
          this.game.player.radius,
          obstacle.position.x,
          obstacle.position.y,
          obstacle.radius,
        )
      ) {
        this.game.player.takeDamage(obstacle.damage * deltaTime * 60);

        if (this.game.player.health <= 0) {
          this.gameOver();
          return;
        }
      }
    }

    // Check collectible pickup
    for (let i = this.game.collectibles.length - 1; i >= 0; i--) {
      const collectible = this.game.collectibles[i];

      const collectRadiusBonus =
        this.game.player.radius * this.game.collectRadius;

      if (
        this.checkCollision(
          this.game.player.position.x,
          this.game.player.position.y,
          collectRadiusBonus,
          collectible.position.x,
          collectible.position.y,
          collectible.radius,
        )
      ) {
        collectible.dead = true;
        this.game.collectibles.splice(i, 1);
        this.game.collectiblesCollected++;
        this.game.score += 50;

        // Create celebration particles
        this.createExplosion(
          collectible.position.x,
          collectible.position.y,
          20,
          "#ffff00",
        );
        this.createExplosion(
          collectible.position.x,
          collectible.position.y,
          15,
          "#ffffff",
        );

        // Show upgrade selection
        this.showUpgradeSelection();
      }
    }
  }

  showUpgradeSelection(): void {
    this.game.isPaused = true;

    const upgradeDiv = document.getElementById("upgrade-selection")!;
    const optionsDiv = document.getElementById("upgrade-options")!;

    optionsDiv.innerHTML = "";

    const upgrades = getRandomUpgrades(3);

    upgrades.forEach((upgrade) => {
      const option = document.createElement("div");
      option.className = "upgrade-option";
      option.innerHTML = `<strong>${upgrade.name}</strong><br>${upgrade.description}`;

      const selectUpgrade = () => {
        upgrade.apply(this.game);
        upgradeDiv.style.display = "none";
        this.game.isPaused = false;
      };

      option.onclick = selectUpgrade;
      option.addEventListener("touchstart", (e) => {
        e.stopPropagation();
        selectUpgrade();
      });

      optionsDiv.appendChild(option);
    });

    upgradeDiv.style.display = "block";
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

  checkWinCondition(): void {
    if (this.game.collectiblesCollected >= this.game.collectiblesNeeded) {
      this.gameWon();
    }
  }

  gameWon(): void {
    this.game.isWon = true;

    document.getElementById("won-time")!.textContent = this.formatTime(
      this.game.gameTime,
    );
    document.getElementById("won-score")!.textContent =
      this.game.score.toString();
    document.getElementById("won-collectibles")!.textContent =
      this.game.collectiblesCollected.toString();
    document.getElementById("game-won")!.style.display = "block";
  }

  gameOver(): void {
    this.game.isGameOver = true;

    document.getElementById("final-time")!.textContent = this.formatTime(
      this.game.gameTime,
    );
    document.getElementById("final-score")!.textContent =
      this.game.score.toString();
    document.getElementById("final-distance")!.textContent = Math.floor(
      this.game.distance,
    ).toString();
    document.getElementById("game-over")!.style.display = "block";
  }

  updateUI(): void {
    document.getElementById("timer")!.textContent = this.formatTime(
      this.game.gameTime,
    );
    document.getElementById("score")!.textContent = this.game.score.toString();
    document.getElementById("distance")!.textContent = Math.floor(
      this.game.distance,
    ).toString();
    document.getElementById("collectibles")!.textContent =
      `${this.game.collectiblesCollected}/${this.game.collectiblesNeeded}`;

    const healthPercent =
      (this.game.player.health / this.game.player.maxHealth) * 100;
    document.getElementById("health-bar")!.style.width = `${healthPercent}%`;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  draw(): void {
    const ctx = this.game.ctx;

    // Draw scrolling background
    if (Game.backgroundImage && Game.backgroundImage.complete) {
      const bgWidth = Game.backgroundImage.width;
      const bgHeight = Game.backgroundImage.height;

      const scale = this.game.canvas.height / bgHeight;
      const scaledWidth = bgWidth * scale;

      const offsetX = -(this.game.backgroundX % scaledWidth);

      ctx.save();
      ctx.scale(scale, scale);

      const numRepeats = Math.ceil(this.game.canvas.width / scaledWidth) + 2;
      for (let i = 0; i < numRepeats; i++) {
        ctx.drawImage(Game.backgroundImage, offsetX / scale + i * bgWidth, 0);
      }

      ctx.restore();
    } else {
      ctx.fillStyle = "#87ceeb";
      ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    }

    for (const particle of this.game.particles) {
      particle.draw(ctx);
    }

    for (const collectible of this.game.collectibles) {
      collectible.draw(ctx);
    }

    for (const obstacle of this.game.obstacles) {
      obstacle.draw(ctx);
    }

    for (const barrel of this.game.barrels) {
      barrel.draw(ctx);
    }

    this.game.player.draw(ctx);
  }
}
