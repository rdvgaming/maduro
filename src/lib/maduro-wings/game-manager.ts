import {
  Game,
  Enemy,
  Island,
  Bullet,
  Powerup,
  Particle,
  WeaponType,
} from "./types";

export class GameManager {
  game: Game;
  joystickActive: boolean = false;
  joystickVector: { x: number; y: number } = { x: 0, y: 0 };
  touchId: number | null = null;
  autoShoot: boolean = true;

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

      // Keep player in bounds
      if (this.game.player) {
        this.game.player.x = Math.min(
          this.game.player.x,
          canvas.width - this.game.player.radius,
        );
        this.game.player.y = Math.min(
          Math.max(this.game.player.y, this.game.player.radius),
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

      if (e.key === " " && !this.game.isGameOver && !this.game.isPaused) {
        e.preventDefault();
        this.game.player.activateSpecial();
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

    const specialButton = document.getElementById("special-button");
    if (specialButton) {
      specialButton.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this.game.player.activateSpecial();
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

    document.getElementById("game-over")!.style.display = "none";
  }

  startGameLoop(): void {
    let lastTime = performance.now();
    const gameLoop = () => {
      const currentTime = performance.now();
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (!this.game.isPaused && !this.game.isGameOver) {
        this.update(deltaTime);
      }

      this.draw();
      requestAnimationFrame(gameLoop);
    };

    requestAnimationFrame(gameLoop);
  }

  update(deltaTime: number): void {
    this.game.gameTime += deltaTime;

    // Update player
    this.updatePlayer(deltaTime);

    // Auto shoot
    if (this.autoShoot) {
      this.game.shootBullet();
    }

    // Update background
    this.game.backgroundX += this.game.scrollSpeed * deltaTime;

    // Spawn enemies - MASSIVE HORDES!
    this.game.enemySpawnTimer += deltaTime;
    const difficultyLevel = Math.floor(this.game.gameTime / 10);
    const spawnInterval = Math.max(0.15, 3 - difficultyLevel * 0.5); // Much faster spawning
    const enemiesPerSpawn = Math.min(2 + difficultyLevel * 2, 10); // Way more enemies per spawn

    if (this.game.enemySpawnTimer >= spawnInterval) {
      this.game.enemySpawnTimer = 0;
      // Spawn multiple enemies at once for horde effect
      for (let i = 0; i < enemiesPerSpawn; i++) {
        this.game.spawnEnemy();
      }
    }

    // Spawn islands
    this.game.islandSpawnTimer += deltaTime;
    if (this.game.islandSpawnTimer >= this.game.islandSpawnInterval) {
      this.game.islandSpawnTimer = 0;
      this.game.spawnIsland();
    }

    // Update entities
    this.updateEnemies(deltaTime);
    this.updateIslands(deltaTime);
    this.updateBullets(deltaTime);
    this.updatePowerups(deltaTime);
    this.updateParticles(deltaTime);

    // Handle collisions
    this.handleCollisions();

    // Update UI
    this.updateUI();
  }

  updatePlayer(deltaTime: number): void {
    const player = this.game.player;

    player.vx = 0;
    player.vy = 0;

    if (this.joystickActive) {
      player.vx = this.joystickVector.x * player.speed;
      player.vy = this.joystickVector.y * player.speed;
    } else {
      if (this.game.keys.has("w") || this.game.keys.has("arrowup"))
        player.vy = -player.speed;
      if (this.game.keys.has("s") || this.game.keys.has("arrowdown"))
        player.vy = player.speed;
      if (this.game.keys.has("a") || this.game.keys.has("arrowleft"))
        player.vx = -player.speed;
      if (this.game.keys.has("d") || this.game.keys.has("arrowright"))
        player.vx = player.speed;

      // Normalize diagonal movement
      if (player.vx !== 0 && player.vy !== 0) {
        player.vx *= 0.707;
        player.vy *= 0.707;
      }
    }

    player.update(deltaTime, this.game.canvas.width, this.game.canvas.height);
  }

  updateEnemies(deltaTime: number): void {
    for (let i = this.game.enemies.length - 1; i >= 0; i--) {
      const enemy = this.game.enemies[i];
      enemy.update(
        deltaTime,
        this.game.player.x,
        this.game.player.y,
        this.game.gameTime,
      );

      // Enemy shooting with increased rate based on game time
      const difficultyMultiplier =
        1 + Math.floor(this.game.gameTime / 10) * 0.5;
      const adjustedCooldown = enemy.shootCooldown / difficultyMultiplier;

      enemy.lastShot += deltaTime;
      if (enemy.lastShot >= adjustedCooldown) {
        enemy.lastShot = 0;

        // Shoot at player with random bullet type
        const dx = this.game.player.x - enemy.x;
        const dy = this.game.player.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        const vx = (dx / dist) * 400;
        const vy = (dy / dist) * 400;

        // Randomly choose between simple and rocket bullets
        const bulletType =
          Math.random() > 0.5 ? WeaponType.BASIC : WeaponType.HOMING;
        this.game.bullets.push(
          new Bullet(enemy.x, enemy.y, vx, vy, false, bulletType, 10),
        );
      }

      // Remove off-screen or dead enemies
      if (enemy.x < -100 || enemy.health <= 0) {
        if (enemy.health <= 0) {
          this.game.createExplosion(enemy.x, enemy.y, 25);
          this.game.score += 100;
          this.game.player.addSpecialEnergy(10); // Add energy on kill
        }
        this.game.enemies.splice(i, 1);
      }
    }
  }

  updateIslands(deltaTime: number): void {
    for (let i = this.game.islands.length - 1; i >= 0; i--) {
      const island = this.game.islands[i];
      island.update(deltaTime);

      // Remove off-screen islands
      if (island.x < -200) {
        this.game.islands.splice(i, 1);
      }
    }
  }

  updateBullets(deltaTime: number): void {
    for (let i = this.game.bullets.length - 1; i >= 0; i--) {
      const bullet = this.game.bullets[i];
      bullet.update(
        deltaTime,
        this.game.canvas.width,
        this.game.canvas.height,
        this.game.enemies,
        this.game.islands,
      );

      // Remove off-screen bullets
      const margin = 100;
      if (
        bullet.x < -margin ||
        bullet.x > this.game.canvas.width + margin ||
        bullet.y < -margin ||
        bullet.y > this.game.canvas.height + margin
      ) {
        // Don't remove saw bullets if they still have bounces
        if (
          bullet.type === WeaponType.SAW &&
          bullet.bounces < bullet.maxBounces
        ) {
          continue;
        }
        this.game.bullets.splice(i, 1);
      }
    }
  }

  updatePowerups(deltaTime: number): void {
    for (let i = this.game.powerups.length - 1; i >= 0; i--) {
      const powerup = this.game.powerups[i];
      powerup.update(deltaTime);

      // Remove off-screen powerups
      if (powerup.x < -100) {
        this.game.powerups.splice(i, 1);
      }
    }
  }

  updateParticles(deltaTime: number): void {
    for (let i = this.game.particles.length - 1; i >= 0; i--) {
      const particle = this.game.particles[i];
      particle.update(deltaTime);

      if (particle.life <= 0) {
        this.game.particles.splice(i, 1);
      }
    }
  }

  handleCollisions(): void {
    // Orbiting saws damage enemies and destroy bullets
    if (this.game.player.orbitingSaws > 0) {
      const orbitRadius = this.game.player.specialRadius * 0.8;
      const sawDamage = 5; // Damage per frame
      const sawCollisionRadius = 25;

      for (let i = 0; i < this.game.player.orbitingSaws; i++) {
        const angle =
          this.game.player.orbitAngle +
          (i * Math.PI * 2) / this.game.player.orbitingSaws;
        const sawX = this.game.player.x + Math.cos(angle) * orbitRadius;
        const sawY = this.game.player.y + Math.sin(angle) * orbitRadius;

        // Damage enemies
        for (const enemy of this.game.enemies) {
          const dist = Math.hypot(enemy.x - sawX, enemy.y - sawY);
          if (dist < enemy.radius + sawCollisionRadius) {
            enemy.takeDamage(sawDamage);
          }
        }

        // Destroy enemy bullets
        for (let j = this.game.bullets.length - 1; j >= 0; j--) {
          const bullet = this.game.bullets[j];
          if (!bullet.isPlayerBullet) {
            const dist = Math.hypot(bullet.x - sawX, bullet.y - sawY);
            if (dist < sawCollisionRadius) {
              this.game.bullets.splice(j, 1);
            }
          }
        }
      }
    }

    // Special attack destroys everything nearby
    if (this.game.player.isUsingSpecial) {
      const specialRadius = this.game.player.specialRadius;

      // Destroy enemies
      for (let i = this.game.enemies.length - 1; i >= 0; i--) {
        const enemy = this.game.enemies[i];
        const dist = Math.hypot(
          enemy.x - this.game.player.x,
          enemy.y - this.game.player.y,
        );
        if (dist < specialRadius) {
          this.game.createExplosion(enemy.x, enemy.y, 25);
          this.game.score += 100;
          this.game.enemies.splice(i, 1);
        }
      }

      // Destroy bullets
      for (let i = this.game.bullets.length - 1; i >= 0; i--) {
        const bullet = this.game.bullets[i];
        if (!bullet.isPlayerBullet) {
          const dist = Math.hypot(
            bullet.x - this.game.player.x,
            bullet.y - this.game.player.y,
          );
          if (dist < specialRadius) {
            this.game.bullets.splice(i, 1);
          }
        }
      }
    }

    // Player bullets vs enemies
    for (let i = this.game.bullets.length - 1; i >= 0; i--) {
      const bullet = this.game.bullets[i];
      if (!bullet.isPlayerBullet) continue;

      for (let j = this.game.enemies.length - 1; j >= 0; j--) {
        const enemy = this.game.enemies[j];
        if (
          this.game.checkCollision(
            bullet.x,
            bullet.y,
            bullet.radius,
            enemy.x,
            enemy.y,
            enemy.radius,
          )
        ) {
          enemy.takeDamage(bullet.damage);
          // Don't remove saw bullets on hit
          if (bullet.type !== WeaponType.SAW) {
            this.game.bullets.splice(i, 1);
          }
          break;
        }
      }
    }

    // Player bullets vs islands
    for (let i = this.game.bullets.length - 1; i >= 0; i--) {
      const bullet = this.game.bullets[i];
      if (!bullet.isPlayerBullet || i >= this.game.bullets.length) continue;

      for (const island of this.game.islands) {
        if (island.isDestroyed) continue;

        if (
          this.game.checkCollision(
            bullet.x,
            bullet.y,
            bullet.radius,
            island.x,
            island.y,
            island.radius,
          )
        ) {
          island.takeDamage(bullet.damage);

          if (island.isDestroyed) {
            this.game.createExplosion(island.x, island.y, 40);
            this.game.score += 200;
            // Spawn powerup from destroyed island
            this.game.spawnPowerup(island.x, island.y);
          }

          // Don't remove saw bullets on hit
          if (bullet.type !== WeaponType.SAW && i < this.game.bullets.length) {
            this.game.bullets.splice(i, 1);
            break;
          }
        }
      }
    }

    // Enemy bullets vs player
    for (let i = this.game.bullets.length - 1; i >= 0; i--) {
      const bullet = this.game.bullets[i];
      if (bullet.isPlayerBullet) continue;

      if (
        this.game.checkCollision(
          bullet.x,
          bullet.y,
          bullet.radius,
          this.game.player.x,
          this.game.player.y,
          this.game.player.radius,
        )
      ) {
        this.game.player.takeDamage(bullet.damage);
        this.game.bullets.splice(i, 1);

        if (this.game.player.health <= 0) {
          this.gameOver();
        }
      }
    }

    // Enemies vs player
    for (const enemy of this.game.enemies) {
      if (
        this.game.checkCollision(
          enemy.x,
          enemy.y,
          enemy.radius,
          this.game.player.x,
          this.game.player.y,
          this.game.player.radius,
        )
      ) {
        this.game.player.takeDamage(20);
        enemy.takeDamage(30);

        if (this.game.player.health <= 0) {
          this.gameOver();
        }
      }
    }

    // Powerups vs player
    for (let i = this.game.powerups.length - 1; i >= 0; i--) {
      const powerup = this.game.powerups[i];

      if (
        this.game.checkCollision(
          powerup.x,
          powerup.y,
          powerup.radius,
          this.game.player.x,
          this.game.player.y,
          this.game.player.radius,
        )
      ) {
        if (powerup.type === "HEALTH") {
          this.game.player.heal(30);
        } else if (powerup.type === WeaponType.ORBIT) {
          this.game.player.addOrbitingSaw();
        } else {
          this.game.player.addWeapon(powerup.type as WeaponType);
        }
        this.game.createExplosion(powerup.x, powerup.y, 15);
        this.game.powerups.splice(i, 1);
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

    // Display all weapons
    const weaponText = Array.from(this.game.player.weapons.entries())
      .map(([type, weapon]) => `${type}(${weapon.level})`)
      .join(", ");
    document.getElementById("weapon-type")!.textContent = weaponText;
    document.getElementById("weapon-level")!.textContent = "";

    const healthPercent =
      (this.game.player.health / this.game.player.maxHealth) * 100;
    document.getElementById("health-bar")!.style.width = `${healthPercent}%`;

    const specialPercent =
      (this.game.player.specialEnergy / this.game.player.maxSpecialEnergy) *
      100;
    document.getElementById("special-bar")!.style.width = `${specialPercent}%`;
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
      ctx.globalAlpha = 0.3; // 30% opacity
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

    // Draw islands (destroyed ones first so particles appear on top)
    for (const island of this.game.islands) {
      if (island.isDestroyed) {
        island.draw(ctx);
      }
    }

    // Draw particles (on top of destroyed islands)
    for (const particle of this.game.particles) {
      particle.draw(ctx);
    }

    // Draw active islands (on top of particles)
    for (const island of this.game.islands) {
      if (!island.isDestroyed) {
        island.draw(ctx);
      }
    }

    // Draw powerups
    for (const powerup of this.game.powerups) {
      powerup.draw(ctx);
    }

    // Draw enemies
    for (const enemy of this.game.enemies) {
      enemy.draw(ctx);
    }

    // Draw bullets
    for (const bullet of this.game.bullets) {
      bullet.draw(ctx);
    }

    // Draw player
    this.game.player.draw(ctx);
  }
}
