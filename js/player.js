/**
 * Soldier: 76 Player Controller (이동, 점프, 질주, 카메라 시점, 체력 시스템)
 * Includes Pointer Lock, Authentic Overwatch Movement Physics & Biotic Field Healing.
 */

class PlayerController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Health Stats
    this.maxHealth = 200;
    this.health = 200;
    this.isDead = false;
    this.deaths = 0;

    // Current Hero ('soldier' or 'genji')
    this.currentHero = 'soldier';

    // Genji Cyber-Agility
    this.hasDoubleJumped = false;
    this.isWallClimbing = false;
    this.spaceHeld = false;

    // Boss Earthquake Launch & Fall Damage State
    this.pendingFallDamage = 0;
    this.earthquakeTimer = 0;

    // Ice Terrain Slipperiness State
    this.isIceTerrain = false;

    // Movement Speeds (m/s)
    this.walkSpeed = 6.8;
    this.sprintSpeed = 10.5;
    this.jumpForce = 7.5;
    this.gravity = 22.0;

    // State
    this.velocity = new THREE.Vector3();
    this.isOnGround = true;
    this.isSprinting = false;
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;

    // Mouse Look (Euler Angles)
    this.yaw = 0;
    this.pitch = 0;
    this.sensitivity = 2.5; // multiplier
    this.invertY = false;

    // Camera FOV
    this.baseFov = 75;
    this.sprintFov = 84;

    // Footstep timer
    this.stepTimer = 0;

    // Spawn Position (Soldier starts on spawn deck)
    this.camera.position.set(0, 1.7, -10);

    // Initial orientation
    this.camera.rotation.order = 'YXZ';

    this.setupInputs();
  }

  setHero(hero) {
    this.currentHero = hero;
    this.isSprinting = false;
    this.hasDoubleJumped = false;
    if (hero === 'genji') {
      this.walkSpeed = 7.2; // Genji is slightly faster naturally in OW
    } else {
      this.walkSpeed = 6.8;
    }
  }

  setupInputs() {
    // Keyboard listeners
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Mouse movement
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
  }

  onKeyDown(e) {
    const code = e.code;
    const key = e.key ? e.key.toLowerCase() : '';

    if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'ㅈ') {
      this.moveForward = true;
    } else if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'ㄴ') {
      this.moveBackward = true;
    } else if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'ㅁ') {
      this.moveLeft = true;
    } else if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'ㅇ') {
      this.moveRight = true;
    } else if (code === 'ShiftLeft' || code === 'ShiftRight') {
      if (this.currentHero === 'soldier') {
        if (this.moveForward && !this.moveBackward) {
          this.isSprinting = true;
        }
      }
    } else if (code === 'Space') {
      this.spaceHeld = true;
      if (this.isOnGround) {
        this.velocity.y = this.jumpForce;
        this.isOnGround = false;
        this.hasDoubleJumped = false;
      } else if (this.currentHero === 'genji' && !this.hasDoubleJumped) {
        // Genji Double Jump!
        this.velocity.y = this.jumpForce * 1.05;
        this.hasDoubleJumped = true;
        if (window.audioEngine) window.audioEngine.playDoubleJump();
      }
    }
  }

  onKeyUp(e) {
    const code = e.code;
    const key = e.key ? e.key.toLowerCase() : '';

    if (code === 'KeyW' || code === 'ArrowUp' || key === 'w' || key === 'ㅈ') {
      this.moveForward = false;
      if (!this.moveForward) this.isSprinting = false;
    } else if (code === 'KeyS' || code === 'ArrowDown' || key === 's' || key === 'ㄴ') {
      this.moveBackward = false;
    } else if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'ㅁ') {
      this.moveLeft = false;
    } else if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'ㅇ') {
      this.moveRight = false;
    } else if (code === 'ShiftLeft' || code === 'ShiftRight') {
      if (this.currentHero === 'soldier') {
        this.isSprinting = false;
      }
    } else if (code === 'Space') {
      this.spaceHeld = false;
    }
  }

  onMouseMove(e) {
    if (document.pointerLockElement !== this.domElement) return;

    const factor = 0.0009 * (this.sensitivity / 2.5);
    const movementX = e.movementX || 0;
    const movementY = e.movementY || 0;

    this.yaw -= movementX * factor;
    const yDir = this.invertY ? -1 : 1;
    this.pitch -= movementY * factor * yDir;

    // Clamp vertical look between -85 deg and +85 deg
    this.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.pitch));

    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  cancelSprint() {
    this.isSprinting = false;
  }



  heal(amount) {
    if (this.health >= this.maxHealth) return;
    this.health = Math.min(this.maxHealth, this.health + amount);

    const vignette = document.getElementById('heal-vignette');
    if (vignette) {
      vignette.classList.add('active');
      setTimeout(() => vignette.classList.remove('active'), 200);
    }
  }

  applyExplosionBoost(verticalForce) {
    this.velocity.y = Math.max(this.velocity.y, verticalForce);
    this.isOnGround = false;
  }

  update(delta, bioticBeacon, bioticRadius, bioticActive, bioticHealRate, jumpPads) {
    // 1. Biotic Field Healing Detection
    if (bioticActive && bioticBeacon) {
      const dist = new THREE.Vector2(this.camera.position.x, this.camera.position.z)
        .distanceTo(new THREE.Vector2(bioticBeacon.position.x, bioticBeacon.position.z));
      if (dist <= bioticRadius) {
        this.heal(bioticHealRate * delta);
      }
    }

    // 2. Sprint Check (Only allow sprinting while moving forward)
    if (this.isSprinting && !this.moveForward) {
      this.isSprinting = false;
    }

    const currentSpeed = this.isSprinting ? this.sprintSpeed : this.walkSpeed;

    // 3. Movement Direction relative to camera yaw
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    const moveDir = new THREE.Vector3();
    if (this.moveForward) moveDir.add(forward);
    if (this.moveBackward) moveDir.sub(forward);
    if (this.moveRight) moveDir.add(right);
    if (this.moveLeft) moveDir.sub(right);

    const isIce = (this.isIceTerrain || (window.gameInstance && window.gameInstance.currentMapTheme === 'ice'));

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      if (isIce) {
        // Slippery Ice Acceleration: build up momentum smoothly with drift!
        const accelRate = this.isOnGround ? 4.2 : 2.2;
        this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, moveDir.x * currentSpeed, delta * accelRate);
        this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, moveDir.z * currentSpeed, delta * accelRate);
      } else {
        this.velocity.x = moveDir.x * currentSpeed;
        this.velocity.z = moveDir.z * currentSpeed;
      }

      // Footstep audio
      if (this.isOnGround) {
        this.stepTimer += delta;
        const interval = this.isSprinting ? 0.28 : 0.42;
        if (this.stepTimer >= interval) {
          this.stepTimer = 0;
          window.audioEngine.playFootstep(this.isSprinting);
        }
      }
    } else {
      // Deceleration (On ice, player slides and glides with low friction!)
      const friction = isIce ? 1.5 : 12.0;
      this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, 0, delta * friction);
      this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, 0, delta * friction);
      this.stepTimer = 0;
    }

    // 4. Gravity & Jump Physics
    this.velocity.y -= this.gravity * delta;
    this.camera.position.y += this.velocity.y * delta;

    // Arena Floor & High Platform Collision (Prevent abnormal teleportation)
    let groundLevel = 1.7;

    const onHighPlatform = (
      this.camera.position.x >= -21.5 && this.camera.position.x <= -10.5 &&
      this.camera.position.z >= 5.5 && this.camera.position.z <= 34.5
    );
    const onRamp = (
      this.camera.position.x >= -19.5 && this.camera.position.x <= -12.5 &&
      this.camera.position.z >= -6.0 && this.camera.position.z < 6.0
    );

    if (onRamp) {
      const rampProgress = (this.camera.position.z - (-6.0)) / 12.0;
      const rampHeight = Math.max(0, Math.min(4.5, rampProgress * 4.5));
      groundLevel = rampHeight + 1.7;
    } else if (onHighPlatform) {
      // Only stand on high platform if player is near platform top height (not underneath)
      if (this.camera.position.y >= 4.2) {
        groundLevel = 4.5 + 1.7; // 6.2m eye height
      } else {
        groundLevel = 1.7;
      }
    }

    if (this.camera.position.y <= groundLevel) {
      this.camera.position.y = groundLevel;
      this.velocity.y = 0;
      this.isOnGround = true;
      this.hasDoubleJumped = false;

      // Apply pending fall damage from boss earthquake launch! (40 damage)
      if (this.pendingFallDamage > 0) {
        const dmg = this.pendingFallDamage;
        this.pendingFallDamage = 0;
        this.earthquakeTimer = 0.25; // Brief landing impact thud
        this.takeDamage(dmg);
        if (window.audioEngine) {
          window.audioEngine.playExplosion();
        }
        if (window.particleSystem) {
          window.particleSystem.spawnHitSparks(this.camera.position, true);
        }
        if (window.gameInstance && window.gameInstance.ui) {
          window.gameInstance.ui.showElimination(`💥 낙사 피해 ${dmg}을(를) 입었습니다! (남은 체력: ${Math.max(0, Math.round(this.health))})`);
        }
      }
    } else {
      this.isOnGround = false;
    }

    // 5. Jump Pad Detection & Launch (슬라임 점프대 도약)
    if (jumpPads) {
      this.checkJumpPads(jumpPads);
    }

    // Genji Wall Climb (사이버 민첩성 벽 타기)
    if (this.currentHero === 'genji' && this.spaceHeld && !this.isOnGround) {
      const nearWall = Math.abs(this.camera.position.x) > 22.5 ||
                       this.camera.position.z > 47.5 ||
                       this.camera.position.z < -17.5 ||
                       (this.camera.position.x >= -22 && this.camera.position.x <= -10 && this.camera.position.z >= 5 && this.camera.position.z <= 35 && this.camera.position.y < 6.2);
      if (nearWall && this.moveForward) {
        this.velocity.y = 5.5; // Climb upward
      }
    }

    // Horizontal Movement Apply
    this.camera.position.x += this.velocity.x * delta;
    this.camera.position.z += this.velocity.z * delta;

    // Safety checks against NaN values
    if (isNaN(this.camera.position.x) || isNaN(this.camera.position.y) || isNaN(this.camera.position.z)) {
      this.camera.position.set(0, 1.7, -10);
      this.velocity.set(0, 0, 0);
    }

    // Clamp within Map Boundaries (-24 to 24 in X, -18 to 48 in Z)
    this.camera.position.x = Math.max(-23.5, Math.min(23.5, this.camera.position.x));
    this.camera.position.z = Math.max(-18.5, Math.min(48.5, this.camera.position.z));

    // 6. Dynamic Camera FOV (Punch on Sprint)
    const targetFov = this.isSprinting ? this.sprintFov : this.baseFov;
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 8);
      this.camera.updateProjectionMatrix();
    }

    // 7. Earthquake Screen Shake while launched into air
    let shakePitch = 0;
    let shakeYaw = 0;
    let shakeRoll = 0;
    const isEarthquakeAirborne = (this.pendingFallDamage > 0 && !this.isOnGround);
    if (this.earthquakeTimer > 0 || isEarthquakeAirborne) {
      if (this.earthquakeTimer > 0) this.earthquakeTimer -= delta;
      const intensity = isEarthquakeAirborne ? 1.0 : Math.min(1.0, this.earthquakeTimer / 0.5);
      shakeRoll = (Math.random() - 0.5) * 0.18 * intensity;
      shakePitch = (Math.random() - 0.5) * 0.14 * intensity;
      shakeYaw = (Math.random() - 0.5) * 0.10 * intensity;
    }

    this.camera.rotation.x = this.pitch + shakePitch;
    this.camera.rotation.y = this.yaw + shakeYaw;
    this.camera.rotation.z = shakeRoll;
  }

  // Boss Jump Earthquake Launch Trigger (조인준 점프 시 발동)
  triggerBossEarthquakeLaunch(force = 19.0, fallDamage = 40) {
    if (this.isDead) return;

    // Launch player into the air with exact slime block height force (19.0)
    this.velocity.y = force;
    this.isOnGround = false;
    this.hasDoubleJumped = false;

    // Set pending fall damage upon landing (40)
    this.pendingFallDamage = fallDamage;

    // Active earthquake screen shake timer (shakes violently while airborne)
    this.earthquakeTimer = 2.0;

    if (window.audioEngine) {
      window.audioEngine.playJumpPadLaunch();
      window.audioEngine.playBossRoar();
    }
    if (window.gameInstance && window.gameInstance.ui) {
      window.gameInstance.ui.showElimination('⚡ [지진 경보] 조인준의 대지 분쇄 도약! 공중으로 높이 솟구칩니다! (착지 시 40 낙사 피해)');
    }
  }

  checkJumpPads(jumpPads) {
    if (!jumpPads || jumpPads.length === 0) return;
    const px = this.camera.position.x;
    const pz = this.camera.position.z;
    const feetY = this.camera.position.y - 1.7;

    for (const pad of jumpPads) {
      if (pad.cooldown > 0) continue;
      const dx = px - pad.position.x;
      const dz = pz - pad.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Within pad horizontal radius and feet near pad surface
      const padY = (pad.position && typeof pad.position.y === 'number') ? pad.position.y : 0.6;
      if (dist <= (pad.radius || 1.5) && Math.abs(feetY - padY) < 1.4) {
        this.launchFromPad(pad);
        break;
      }
    }
  }

  launchFromPad(pad) {
    if (!pad) return;
    pad.cooldown = 0.5;
    pad.bounceAnim = 1.0;

    // Super vertical launch with robust fallback (19.0)
    const force = (typeof pad.verticalForce === 'number' && !isNaN(pad.verticalForce)) ? pad.verticalForce : 19.0;
    this.velocity.y = force;
    this.isOnGround = false;
    this.hasDoubleJumped = false; // Reset Genji's double jump for mid-air combos!

    // Ensure velocity is valid numbers
    if (isNaN(this.velocity.x)) this.velocity.x = 0;
    if (isNaN(this.velocity.z)) this.velocity.z = 0;

    // Apply horizontal boost if configured
    if (pad.horizontalBoost && typeof pad.horizontalBoost.lengthSq === 'function' && pad.horizontalBoost.lengthSq() > 0) {
      this.velocity.x = pad.horizontalBoost.x;
      this.velocity.z = pad.horizontalBoost.z;
    } else if (this.isSprinting) {
      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);
      camDir.y = 0;
      camDir.normalize();
      this.velocity.x += camDir.x * 6.0;
      this.velocity.z += camDir.z * 6.0;
    }

    if (window.audioEngine) {
      window.audioEngine.playJumpPadLaunch();
    }
    if (window.particleSystem) {
      window.particleSystem.spawnJumpPadBurst(pad.position);
    }
  }

  // Genji Swift Strike (질풍참 15m 대시)
  performDash(distance = 15) {
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    const startPos = this.camera.position.clone();

    const targetPos = this.camera.position.clone().add(camDir.multiplyScalar(distance));
    targetPos.x = Math.max(-23.5, Math.min(23.5, targetPos.x));
    targetPos.z = Math.max(-18.5, Math.min(48.5, targetPos.z));
    targetPos.y = Math.max(1.7, Math.min(12, targetPos.y));

    this.camera.position.copy(targetPos);
    this.velocity.set(0, 1.2, 0); // slight hover
    this.isOnGround = false;
    this.hasDoubleJumped = false;

    return { start: startPos, end: targetPos };
  }

  takeDamage(amount) {
    if (this.isDead) return;

    this.health = Math.max(0, this.health - amount);

    // Red screen damage flash vignette
    const vignette = document.getElementById('damage-vignette');
    if (vignette) {
      vignette.classList.add('active');
      setTimeout(() => {
        vignette.classList.remove('active');
      }, 240);
    }

    // Camera punch shake
    this.pitch += (Math.random() - 0.5) * 0.08;
    this.yaw += (Math.random() - 0.5) * 0.08;

    // Hurt sound
    if (window.audioEngine) {
      window.audioEngine.playVillagerHurt();
    }

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.health = 0;
    this.deaths++;

    if (window.audioEngine) {
      window.audioEngine.playElimination();
    }

    // Delegate player death to GameInstance (handles stage lives and elimination)
    if (window.gameInstance && typeof window.gameInstance.onPlayerDeath === 'function') {
      window.gameInstance.onPlayerDeath();
    } else {
      // Fallback respawn
      setTimeout(() => {
        this.respawn();
      }, 2500);
    }
  }

  respawn() {
    this.isDead = false;
    this.health = this.maxHealth;
    this.camera.position.set(0, 1.7, -10);
    this.velocity.set(0, 0, 0);

    if (window.particleSystem) {
      window.particleSystem.spawnHoloSpawnEffect(new THREE.Vector3(0, 0.5, -10));
    }
  }
}
