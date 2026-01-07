import { Game, Particle, Missile } from "./types";
import type { Game as GameType } from "./types";

export class GameManager {
  game: Game;
  missileSpawnTimer: number = 0;
  missileSpawnInterval: number = 2.0;
  joystickActive: boolean = false;
  touchId: number | null = null;
  thrustPressed: boolean = false;

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

      // Re-center helicopter horizontally
      if (this.game.helicopter) {
        this.game.helicopter.position.x = canvas.width / 2;
      }

      // Keep Maduro at bottom center
      if (this.game.maduro) {
        this.game.maduro.position.x = canvas.width / 2;
        this.game.maduro.position.y = canvas.height - 80;
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

      if (
        e.key.toLowerCase() === "w" ||
        e.key.toLowerCase() === "arrowup" ||
        e.key === " "
      ) {
        this.thrustPressed = true;
      }
    });

    window.addEventListener("keyup", (e) => {
      this.game.keys.delete(e.key.toLowerCase());

      if (
        e.key.toLowerCase() === "w" ||
        e.key.toLowerCase() === "arrowup" ||
        e.key === " "
      ) {
        this.thrustPressed = false;
      }
    });
  }

  setupTouchControls(): void {
    const thrustButton = document.getElementById(
      "thrust-button",
    ) as HTMLElement;

    if (thrustButton) {
      const handleThrustStart = (e: Event) => {
        e.preventDefault();
        this.thrustPressed = true;
      };

      const handleThrustEnd = (e: Event) => {
        e.preventDefault();
        this.thrustPressed = false;
      };

      thrustButton.addEventListener("touchstart", handleThrustStart, {
        passive: false,
      });
      thrustButton.addEventListener("touchend", handleThrustEnd, {
        passive: false,
      });
      thrustButton.addEventListener("touchcancel", handleThrustEnd, {
        passive: false,
      });

      thrustButton.addEventListener("mousedown", handleThrustStart);
      thrustButton.addEventListener("mouseup", handleThrustEnd);
      thrustButton.addEventListener("mouseleave", handleThrustEnd);
    }

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

  restart(): void {
    const canvas = this.game.canvas;
    const currentWidth = canvas.width;
    const currentHeight = canvas.height;

    this.game = new Game(canvas);

    canvas.width = currentWidth;
    canvas.height = currentHeight;

    this.game.helicopter.position.x = canvas.width / 2;
    this.game.helicopter.position.y = 100;
    this.game.maduro.position.x = canvas.width / 2;
    this.game.maduro.position.y = canvas.height - 80;

    this.missileSpawnTimer = 0;
    this.thrustPressed = false;

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

    if (!this.game.isGameOver && !this.game.isWon) {
      this.update(deltaTime);
    }

    this.draw();

    requestAnimationFrame(() => this.gameLoop());
  }

  update(deltaTime: number): void {
    this.game.gameTime += deltaTime;

    // Apply thrust if button/key pressed
    if (this.thrustPressed) {
      this.game.helicopter.applyThrust();
    }

    this.updateHelicopter(deltaTime);
    this.spawnMissiles(deltaTime);
    this.updateMissiles(deltaTime);
    this.handleCollisions();
    this.updateParticles(deltaTime);
    this.checkLandingConditions();
    this.checkDesperationDistance();
    this.updateUI();
  }

  updateHelicopter(deltaTime: number): void {
    // Handle horizontal movement
    const heli = this.game.helicopter;

    if (this.game.keys.has("a") || this.game.keys.has("arrowleft")) {
      heli.velocity.x = -heli.horizontalSpeed;
    } else if (this.game.keys.has("d") || this.game.keys.has("arrowright")) {
      heli.velocity.x = heli.horizontalSpeed;
    } else {
      heli.velocity.x = 0;
    }

    this.game.helicopter.update(deltaTime);

    // Keep helicopter on screen horizontally
    this.game.helicopter.position.x = Math.max(
      this.game.helicopter.width / 2,
      Math.min(
        this.game.canvas.width - this.game.helicopter.width / 2,
        this.game.helicopter.position.x,
      ),
    );

    // Check if helicopter hits top
    if (this.game.helicopter.position.y < this.game.helicopter.height / 2) {
      this.game.helicopter.position.y = this.game.helicopter.height / 2;
      this.game.helicopter.velocity.y = 0;
    }
  }

  spawnMissiles(deltaTime: number): void {
    this.missileSpawnTimer += deltaTime;

    if (this.missileSpawnTimer >= this.missileSpawnInterval) {
      this.missileSpawnTimer = 0;

      // Spawn missile directly below helicopter
      const missile = new Missile(
        this.game.helicopter.position.x,
        this.game.canvas.height,
      );
      this.game.missiles.push(missile);
    }
  }

  updateMissiles(deltaTime: number): void {
    for (let i = this.game.missiles.length - 1; i >= 0; i--) {
      const missile = this.game.missiles[i];
      missile.update(deltaTime);

      // Remove missiles that go off screen
      if (missile.position.y < -missile.height || missile.dead) {
        this.game.missiles.splice(i, 1);
      }
    }
  }

  handleCollisions(): void {
    const heli = this.game.helicopter;

    // Check missile collisions
    for (let i = this.game.missiles.length - 1; i >= 0; i--) {
      const missile = this.game.missiles[i];

      if (
        this.checkCollision(
          heli.position.x,
          heli.position.y,
          heli.width / 2,
          heli.height / 2,
          missile.position.x,
          missile.position.y,
          missile.width / 2,
          missile.height / 2,
        )
      ) {
        // Hit!
        this.game.helicopter.takeDamage();
        missile.dead = true;
        this.game.missiles.splice(i, 1);

        this.createExplosion(missile.position.x, missile.position.y, 20);

        if (this.game.helicopter.isCrashed) {
          this.gameOver();
          return;
        }
      }
    }
  }

  checkCollision(
    x1: number,
    y1: number,
    w1: number,
    h1: number,
    x2: number,
    y2: number,
    w2: number,
    h2: number,
  ): boolean {
    return Math.abs(x1 - x2) < w1 + w2 && Math.abs(y1 - y2) < h1 + h2;
  }

  checkLandingConditions(): void {
    const heli = this.game.helicopter;
    const maduro = this.game.maduro;

    // Check if close to Maduro for landing
    const distanceToMaduro = Math.sqrt(
      Math.pow(heli.position.x - maduro.position.x, 2) +
        Math.pow(heli.position.y - maduro.position.y, 2),
    );

    const landingZone = 100; // Close enough to Maduro

    if (distanceToMaduro < landingZone && !this.game.hasRescued) {
      // Check landing speed
      if (Math.abs(heli.velocity.y) > heli.crashSpeed) {
        // Crashed due to high speed
        this.game.helicopter.isCrashed = true;
        this.gameOver();
        return;
      } else if (Math.abs(heli.velocity.y) < heli.maxFallSpeed) {
        // Successful landing!
        this.game.hasRescued = true;
        this.game.helicopter.isLanded = true;
        this.game.helicopter.velocity.y = 0;
        this.gameWon();
      }
    }
  }

  checkDesperationDistance(): void {
    const heli = this.game.helicopter;
    const maduro = this.game.maduro;

    const distance = Math.abs(heli.position.y - maduro.position.y);
    const halfScreen = this.game.canvas.height / 2;

    // Switch to desperate when helicopter is within half screen distance
    if (distance < halfScreen) {
      maduro.isDesperate = true;
    } else {
      maduro.isDesperate = false;
    }
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

  gameWon(): void {
    this.game.isWon = true;

    document.getElementById("won-time")!.textContent = this.formatTime(
      this.game.gameTime,
    );
    document.getElementById("game-won")!.style.display = "block";
  }

  gameOver(): void {
    this.game.isGameOver = true;

    document.getElementById("final-time")!.textContent = this.formatTime(
      this.game.gameTime,
    );
    document.getElementById("game-over")!.style.display = "block";
  }

  updateUI(): void {
    document.getElementById("timer")!.textContent = this.formatTime(
      this.game.gameTime,
    );
    document.getElementById("altitude")!.textContent = Math.floor(
      this.game.canvas.height - this.game.helicopter.position.y,
    ).toString();

    const speed = Math.abs(this.game.helicopter.velocity.y);
    document.getElementById("speed")!.textContent =
      Math.floor(speed).toString();

    // Color code speed indicator
    const speedElement = document.getElementById("speed")!;
    if (speed > this.game.helicopter.crashSpeed) {
      speedElement.style.color = "#ff0000"; // Red - crash speed
    } else if (speed > this.game.helicopter.maxFallSpeed) {
      speedElement.style.color = "#ff9900"; // Orange - warning
    } else {
      speedElement.style.color = "#00ff00"; // Green - safe
    }

    document.getElementById("hits")!.textContent =
      `${this.game.helicopter.hitPoints}/2`;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  draw(): void {
    const ctx = this.game.ctx;

    // Draw background - fill entire canvas
    if (Game.backgroundImage && Game.backgroundImage.complete) {
      ctx.drawImage(
        Game.backgroundImage,
        0,
        0,
        this.game.canvas.width,
        this.game.canvas.height,
      );
    } else {
      ctx.fillStyle = "#87ceeb";
      ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    }

    // Draw bunker sprite centered on Maduro at original size
    if (Game.bunkerImage && Game.bunkerImage.complete) {
      const bunkerX = this.game.maduro.position.x - Game.bunkerImage.width / 2;
      const bunkerY = this.game.maduro.position.y - Game.bunkerImage.height / 2;
      ctx.drawImage(Game.bunkerImage, bunkerX, bunkerY);
    }

    this.game.maduro.draw(ctx);

    for (const particle of this.game.particles) {
      particle.draw(ctx);
    }

    for (const missile of this.game.missiles) {
      missile.draw(ctx);
    }

    this.game.helicopter.draw(ctx);
  }
}
