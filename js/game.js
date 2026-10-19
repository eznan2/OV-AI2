/**
 * Overwatch Practice Range Master Game Controller
 * Orchestrates Soldier: 76 & Genji, Three.js rendering, particles, bot AI & challenge modes.
 */

// ==========================================================================
// 1. PARTICLE SYSTEM
// ==========================================================================
class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  spawnHitSparks(pos, isCrit = false) {
    const count = isCrit ? 16 : 8;
    const color = isCrit ? 0xff2a4b : (window.gameInstance && window.gameInstance.currentHero === 'genji' ? 0x38e469 : 0x00e5ff);
    const geo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
    const mat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 5 + 1,
        (Math.random() - 0.5) * 6
      );

      this.particles.push({
        mesh,
        vel,
        gravity: 14,
        life: 0.22,
        maxLife: 0.22
      });
    }
  }

  spawnHelixExplosion(pos) {
    const ringGeo = new THREE.RingGeometry(0.2, 0.4, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(pos);
    ring.position.y += 0.05;
    this.scene.add(ring);

    this.particles.push({
      mesh: ring,
      isRing: true,
      growth: 14,
      life: 0.35,
      maxLife: 0.35
    });

    const count = 30;
    const pGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    for (let i = 0; i < count; i++) {
      const col = Math.random() > 0.4 ? 0x00e5ff : 0xf99e1a;
      const mat = new THREE.MeshBasicMaterial({ color: col });
      const mesh = new THREE.Mesh(pGeo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        Math.random() * 10 + 2,
        (Math.random() - 0.5) * 12
      );

      this.particles.push({
        mesh,
        vel,
        gravity: 18,
        life: 0.45,
        maxLife: 0.45
      });
    }
  }

  spawnBotExplosion(pos) {
    this.spawnVillagerDeathPoof(pos);
  }

  spawnVillagerDeathPoof(pos) {
    const count = 28;
    const poofGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    for (let i = 0; i < count; i++) {
      const shade = 210 + Math.floor(Math.random() * 45);
      const poofMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(`rgb(${shade},${shade},${shade})`),
        transparent: true,
        opacity: 0.95
      });
      const mesh = new THREE.Mesh(poofGeo, poofMat);
      mesh.position.copy(pos);
      this.scene.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 4 + 1.2,
        (Math.random() - 0.5) * 6
      );

      this.particles.push({
        mesh,
        vel,
        gravity: 2.5,
        life: 0.65,
        maxLife: 0.65
      });
    }
  }

  spawnHoloSpawnEffect(pos) {
    const ringGeo = new THREE.RingGeometry(0.1, 0.8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(pos);
    this.scene.add(ring);

    this.particles.push({
      mesh: ring,
      isRisingRing: true,
      life: 0.5,
      maxLife: 0.5
    });
  }

  // Jump Pad Emerald Shockwave & Slime Cube Burst
  spawnJumpPadBurst(pos) {
    const ringGeo = new THREE.RingGeometry(0.3, 0.9, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x5aff60,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(pos);
    ring.position.y += 0.2;
    this.scene.add(ring);

    this.particles.push({
      mesh: ring,
      isRing: true,
      growth: 15,
      life: 0.45,
      maxLife: 0.45
    });

    const count = 18;
    const pGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    const slimeMat = new THREE.MeshBasicMaterial({ color: 0x5bcf56 });
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(pGeo, slimeMat);
      mesh.position.copy(pos);
      mesh.position.y += 0.35;
      this.scene.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        Math.random() * 8 + 5,
        (Math.random() - 0.5) * 8
      );

      this.particles.push({
        mesh,
        vel,
        gravity: 20,
        life: 0.6,
        maxLife: 0.6
      });
    }
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.isRing) {
        const scale = 1 + (1 - p.life / p.maxLife) * p.growth;
        p.mesh.scale.set(scale, scale, 1);
        p.mesh.material.opacity = (p.life / p.maxLife) * 0.9;
      } else if (p.isRisingRing) {
        p.mesh.position.y += delta * 3;
        p.mesh.material.opacity = (p.life / p.maxLife) * 0.8;
      } else {
        p.vel.y -= p.gravity * delta;
        p.mesh.position.addScaledVector(p.vel, delta);
        if (p.rotSpeed) {
          p.mesh.rotation.x += p.rotSpeed.x * delta;
          p.mesh.rotation.y += p.rotSpeed.y * delta;
        }
        if (p.mesh.position.y < 0.05) {
          p.mesh.position.y = 0.05;
          p.vel.y *= -0.3;
        }
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }
}

// ==========================================================================
// 2. PROJECTILE SYSTEM (Bot lasers & Genji Deflect handling)
// ==========================================================================
class ProjectileSystem {
  constructor(scene) {
    this.scene = scene;
    this.botLasers = [];
  }

  spawnBotLaser(origin, dir) {
    this.spawnEmerald(origin, dir);
  }

  // Combat Villager Emerald Projectile
  spawnEmerald(origin, dir, damage = 20) {
    const geo = new THREE.OctahedronGeometry(0.24);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1fad46,
      emissive: 0x0f8532,
      roughness: 0.1,
      metalness: 0.6
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    this.scene.add(mesh);

    this.botLasers.push({
      mesh,
      dir: dir.clone(),
      speed: 22,
      life: 4.0,
      isReflected: false,
      isEmerald: true,
      damage: damage
    });
  }

  // Giant Boss Dark Explosive Fireball (Instant Kill: 999 Damage!)
  spawnBossFireball(origin, dir) {
    const geo = new THREE.DodecahedronGeometry(0.65);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff1744,
      emissive: 0xd50000,
      roughness: 0.2,
      metalness: 0.7
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    this.scene.add(mesh);

    this.botLasers.push({
      mesh,
      dir: dir.clone(),
      speed: 25,
      life: 5.0,
      isReflected: false,
      isBossBall: true,
      damage: 999 // Instant kill
    });
  }

  update(delta, playerController, weapons, bots) {
    for (let i = this.botLasers.length - 1; i >= 0; i--) {
      const laser = this.botLasers[i];
      laser.life -= delta;
      laser.mesh.position.addScaledVector(laser.dir, laser.speed * delta);

      // Rotating spinning emerald or boss fireball
      if (laser.isEmerald) {
        laser.mesh.rotation.x += delta * 8;
        laser.mesh.rotation.y += delta * 12;
      } else if (laser.isBossBall) {
        laser.mesh.rotation.x += delta * 6;
        laser.mesh.rotation.y += delta * 9;
      }

      if (laser.isReflected) {
        // Reflected projectile damages bots or Giant Boss!
        for (const b of bots) {
          if (b.isDead) continue;
          const hitRadius = (b.name && b.name.includes('보스')) ? 3.0 : 1.4;
          const bPos = b.group.position.clone().add(new THREE.Vector3(0, 1.5, 0));
          if (laser.mesh.position.distanceTo(bPos) < hitRadius) {
            const reflectedDmg = laser.isBossBall ? 250 : 55;
            b.takeDamage(reflectedDmg, false);
            this.scene.remove(laser.mesh);
            this.botLasers.splice(i, 1);
            if (window.particleSystem) {
              window.particleSystem.spawnHitSparks(laser.mesh.position, true);
            }
            break;
          }
        }
      } else {
        // Check collision with player
        const dist = laser.mesh.position.distanceTo(playerController.camera.position);
        const playerHitRadius = laser.isBossBall ? 2.0 : 1.4;
        if (dist < playerHitRadius) {
          // Genji Deflect Check!
          if (weapons.currentHero === 'genji' && weapons.isDeflecting) {
            laser.isReflected = true;
            if (laser.mesh.material) {
              laser.mesh.material.color.setHex(laser.isBossBall ? 0x00e5ff : 0xffea33);
            }
            const camDir = new THREE.Vector3();
            playerController.camera.getWorldDirection(camDir);
            laser.dir.copy(camDir);
            laser.mesh.position.addScaledVector(camDir, 1.4);
            laser.speed = 45; // reflected speed boost
            laser.life = 3.0;
            window.audioEngine.playDeflectHit();
          } else {
            // Player takes damage (70 from Boss fireball, 20 from emerald)
            const dmg = laser.damage || (laser.isBossBall ? 70 : 20);
            playerController.takeDamage(dmg);
            this.scene.remove(laser.mesh);
            this.botLasers.splice(i, 1);
            continue;
          }
        }
      }

      if (laser.life <= 0 || laser.mesh.position.y <= 0) {
        this.scene.remove(laser.mesh);
        this.botLasers.splice(i, 1);
      }
    }
  }
}

// ==========================================================================
// 3. MASTER GAME CONTROLLER
// ==========================================================================
class OverwatchGame {
  constructor() {
    this.container = document.getElementById('game-container');
    this.clock = new THREE.Clock();

    // Stats
    this.stats = {
      kills: 0,
      shotsFired: 0,
      shotsHit: 0,
      headshots: 0,
      ultCharge: 0
    };

    this.currentHero = 'soldier'; // 'soldier' or 'genji'

    // Modes: 'free', 'tracking', 'flick'
    this.currentMode = 'free';
    this.challengeTimer = 30.0;
    this.challengeScore = 0;
    this.isChallengeActive = false;

    // Immortality & Infinite Ult
    this.botImmortal = false;
    this.infiniteUlt = false;
    this.isMouseDown = false;

    // Game Mode: 'menu', 'stage', 'practice'
    this.gameMode = 'menu';
    this.currentStage = 1;
    this.stageLives = 3;
    this.maxStageLives = 3;

    // Quest & Play Time Statistics
    this.questKills = 0;
    this.questTarget = 10;
    this.playTime = 0;
    this.isGameActive = false;
    this.isGameCleared = false;
    this.isGameOver = false;
    this.totalDamageDealt = 0;

    // Stage Configurations (1-1 to 1-5)
    this.initStageConfigs();

    this.initThree();
    this.initComponents();
    this.setupEvents();
    this.animate();
  }

  initStageConfigs() {
    this.stageConfigs = {
      1: {
        name: '화염의 조인준 (대수신 JO)',
        desc: '움직이는 준성이 10마리를 처치하면 조인준 보스가 강림합니다! (즉사기 & 용암 지형 & 낙사 점프)',
        targetKills: 10,
        star3Time: 80.0,
        star2Time: 160.0,
        isBoss: false
      },
      2: {
        name: '빙원의 가시전차: 노윤상',
        desc: '미끄러운 얼음 지형! 데미지 반사 가시 갑옷 & 구르기 돌격을 돌파하고 거대 각성 노윤상을 격파하십시오!',
        targetKills: 1,
        star3Time: 90.0,
        star2Time: 180.0,
        isBoss: true
      },
      3: {
        name: '탄막 시험',
        desc: '원거리 탄환을 발사하는 공격 봇 10마리를 처치하십시오!',
        targetKills: 10,
        star3Time: 40.0,
        star2Time: 80.0,
        isBoss: false
      },
      4: {
        name: '정예 방어선',
        desc: '고체력 정예군 12마리를 처치하십시오!',
        targetKills: 12,
        star3Time: 50.0,
        star2Time: 100.0,
        isBoss: false
      },
      5: {
        name: '대수신 JO 총력전',
        desc: '붉은색 위험 장판을 피하며 5가지 맹공 패턴의 대수신 JO를 격퇴하십시오!',
        targetKills: 1,
        star3Time: 70.0,
        star2Time: 140.0,
        isBoss: true
      }
    };
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a101d);
    this.scene.fog = new THREE.FogExp2(0x0a101d, 0.015);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initComponents() {
    this.map = new PracticeRangeMap(this.scene);
    window.particleSystem = new ParticleSystem(this.scene);
    window.projectileSystem = new ProjectileSystem(this.scene);
    window.playerController = new PlayerController(this.camera, this.renderer.domElement);
    this.weapons = new WeaponSystem(this.scene, this.camera);
    this.ui = new UIController();
    this.bots = [];

    // Boss Spawner Block & Giant Boss System (Drops from sky upon completing 10 kills quest)
    this.bossBlock = null;
    this.giantBoss = null;

    // Initialize Quest HUD (0 / 10)
    this.ui.updateQuest(0, this.questTarget, '전준성 들을 잡으세요');
  }

  spawnDefaultBots() {
    this.bots.forEach(b => this.scene.remove(b.group));
    this.bots = [];

    // All Photo Cubes actively move and patrol across the map!
    // Lane 1: 10m Distance Lane (Fast strafing photo cube)
    this.bots.push(new TrainingBot(this.scene, {
      type: 'patrol',
      position: new THREE.Vector3(0, 0, 10),
      patrolRange: 12,
      patrolAxis: 'x',
      patrolSpeed: 3.2,
      faceIndex: 0
    }));

    // Lane 2: 20m Distance Lane
    this.bots.push(new TrainingBot(this.scene, {
      type: 'patrol',
      position: new THREE.Vector3(0, 0, 20),
      patrolRange: 15,
      patrolAxis: 'x',
      patrolSpeed: 3.8,
      faceIndex: 1
    }));

    // Lane 3: 30m Distance Lane
    this.bots.push(new TrainingBot(this.scene, {
      type: 'patrol',
      position: new THREE.Vector3(0, 0, 30),
      patrolRange: 16,
      patrolAxis: 'x',
      patrolSpeed: 4.2,
      faceIndex: 2
    }));

    // Lane 4: 40m Distance Lane
    this.bots.push(new TrainingBot(this.scene, {
      type: 'patrol',
      position: new THREE.Vector3(0, 0, 40),
      patrolRange: 18,
      patrolAxis: 'x',
      patrolSpeed: 3.5,
      faceIndex: 3
    }));

    // Left Mid Lane (Longitudinal patrol Z)
    this.bots.push(new TrainingBot(this.scene, {
      type: 'patrol',
      position: new THREE.Vector3(-6, 0, 16),
      patrolRange: 12,
      patrolAxis: 'z',
      patrolSpeed: 2.8,
      faceIndex: 0
    }));

    // Right Mid Lane (Longitudinal patrol Z)
    this.bots.push(new TrainingBot(this.scene, {
      type: 'patrol',
      position: new THREE.Vector3(6, 0, 24),
      patrolRange: 12,
      patrolAxis: 'z',
      patrolSpeed: 3.0,
      faceIndex: 1
    }));

    // West Ground Patrol Bot
    this.bots.push(new TrainingBot(this.scene, {
      type: 'patrol',
      position: new THREE.Vector3(-10, 0, 20),
      patrolRange: 12,
      patrolAxis: 'z',
      patrolSpeed: 2.6,
      faceIndex: 2
    }));

    // Combat Shooting Photo Cube (Patrols and tosses Emeralds)
    this.bots.push(new TrainingBot(this.scene, {
      type: 'combat',
      position: new THREE.Vector3(12, 0, 18),
      patrolRange: 10,
      patrolAxis: 'x',
      patrolSpeed: 2.5,
      shootInterval: 2.8,
      faceIndex: 3
    }));
  }

  setHero(hero) {
    this.currentHero = hero;
    window.playerController.setHero(hero);
    this.weapons.setHero(hero);
    this.resetStats();
  }

  setupEvents() {
    const btnStart = document.getElementById('btn-start-game');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        window.audioEngine.ensureContext();
        this.isGameActive = true;
        this.requestPointerLock();
      });
    }

    const btnFlick = document.getElementById('btn-switch-flick-mode');
    if (btnFlick) {
      btnFlick.addEventListener('click', (e) => {
        if (e) e.stopPropagation();
        window.audioEngine.ensureContext();
        this.gameMode = 'practice';
        this.isGameActive = true;
        this.ui.hideAllModals();
        this.startChallengeMode();
        this.requestPointerLock();
      });
    }

    // Pointer Lock Change
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === this.renderer.domElement) {
        this.isGameActive = true;
        this.ui.hideAllModals();
      } else {
        this.isMouseDown = false;
        // Only return to start screen if gameMode is menu
        if (this.gameMode === 'menu') {
          const sModalHidden = this.ui.elSettingsModal ? this.ui.elSettingsModal.classList.contains('hidden') : true;
          const hModalHidden = this.ui.elHeroModal ? this.ui.elHeroModal.classList.contains('hidden') : true;
          const stModalHidden = this.ui.elStageSelectModal ? this.ui.elStageSelectModal.classList.contains('hidden') : true;
          if (sModalHidden && hModalHidden && stModalHidden) {
            this.ui.showStartScreen(true);
          }
        }
      }
    });

    // Re-lock pointer when clicking anywhere on canvas during gameplay
    this.renderer.domElement.addEventListener('click', () => {
      if (this.gameMode !== 'menu' && !this.isGameCleared && !this.isGameOver) {
        if (document.pointerLockElement !== this.renderer.domElement) {
          this.requestPointerLock();
        }
      }
    });

    // Mouse Down (Primary fire / Secondary fire)
    window.addEventListener('mousedown', (e) => {
      if (document.pointerLockElement !== this.renderer.domElement) return;

      if (e.button === 0) {
        // Left click
        this.isMouseDown = true;
        if (window.playerController.isSprinting) {
          window.playerController.cancelSprint();
        }
        this.tryPrimaryFire();
      } else if (e.button === 2) {
        // Right click
        this.trySecondaryFire();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isMouseDown = false;
      }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Keyboard abilities (E, Q, R, Shift, H, ESC, P)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyH') {
        // Hero Selection Modal
        this.ui.showHeroModal(true);
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (this.currentHero === 'genji') {
          // Genji Swift Strike (질풍참)
          this.weapons.useSwiftStrike(this.getAllShootableTargets(), window.playerController, (bot) => {
            this.handleBotKill(bot, false);
          });
        }
      } else if (e.code === 'KeyE') {
        if (this.currentHero === 'soldier') {
          // Soldier Biotic Field
          this.weapons.deployBiotic(window.playerController.camera.position);
        } else {
          // Genji Deflect
          this.weapons.useDeflect();
        }
      } else if (e.code === 'KeyQ') {
        // Ultimate
        if (this.stats.ultCharge >= 100 || this.infiniteUlt) {
          this.weapons.activateUltimate();
          this.stats.ultCharge = 0;
        }
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        const preservedUlt = this.stats ? this.stats.ultCharge : 0;
        this.weapons.reload();
        if (this.stats) this.stats.ultCharge = preservedUlt;
      } else if (e.code === 'KeyP') {
        document.exitPointerLock();
        this.ui.showSettings(true);
      } else if (e.code === 'Escape') {
        if (this.ui.elStageSelectModal && !this.ui.elStageSelectModal.classList.contains('hidden')) {
          this.ui.showStageSelect(false);
          this.ui.showStartScreen(true);
        } else if (this.ui.elHeroModal && !this.ui.elHeroModal.classList.contains('hidden')) {
          this.ui.showHeroModal(false);
        } else if (this.ui.elSettingsModal && !this.ui.elSettingsModal.classList.contains('hidden')) {
          this.ui.showSettings(false);
        } else if (this.isGameActive && !this.isGameCleared && !this.isGameOver) {
          try { document.exitPointerLock(); } catch(err) {}
          this.ui.showSettings(true);
        }
      }
    });

    const selectMode = document.getElementById('select-training-mode');
    if (selectMode) {
      selectMode.addEventListener('change', (e) => this.setTrainingMode(e.target.value));
    }

    const chkImmortal = document.getElementById('chk-bot-immortal');
    if (chkImmortal) {
      chkImmortal.addEventListener('change', (e) => {
        this.botImmortal = e.target.checked;
        this.bots.forEach(b => b.immortal = this.botImmortal);
      });
    }

    const chkInfUlt = document.getElementById('chk-infinite-ult');
    if (chkInfUlt) {
      chkInfUlt.addEventListener('change', (e) => {
        this.infiniteUlt = e.target.checked;
        if (this.infiniteUlt) this.stats.ultCharge = 100;
      });
    }

    const btnSummonBoss = document.getElementById('btn-summon-boss-instant');
    if (btnSummonBoss) {
      btnSummonBoss.addEventListener('click', () => {
        const modal = document.getElementById('settings-modal');
        if (modal) modal.classList.add('hidden');
        this.spawnFallingBossBlock();
        this.ui.showCenterAnnouncement('👑 대수신 JO 소환!', '하늘에서 보스 블록이 낙하합니다! 파괴하여 소환하십시오!', 3500);
        this.requestPointerLock();
      });
    }
  }

  getAllShootableTargets() {
    const list = [...this.bots];
    if (this.bossBlock && !this.bossBlock.isDead) {
      list.push(this.bossBlock);
    }
    if (this.giantBoss && !this.giantBoss.isDead) {
      list.push(this.giantBoss);
    }
    return list;
  }

  recordDamage(amount) {
    if (this.isGameCleared) return;
    this.totalDamageDealt += amount;
  }

  spawnFallingBossBlock() {
    // Remove all existing original Junseong bots from scene!
    this.bots.forEach(b => {
      if (b && b.group) this.scene.remove(b.group);
    });
    this.bots = [];

    if (this.bossBlock) {
      this.scene.remove(this.bossBlock.group);
      this.bossBlock = null;
    }
    if (this.giantBoss) {
      this.scene.remove(this.giantBoss.group);
      this.giantBoss = null;
    }
    this.bossBlock = new BossSpawnerBlock(this.scene, {
      position: new THREE.Vector3(0, 0.6, 21),
      dropFromSky: true
    });
  }

  onBossBlockDestroyed(pos) {
    if (this.bossBlock) {
      this.scene.remove(this.bossBlock.group);
      this.bossBlock = null;
    }
    // Remove all existing original Junseong bots completely!
    this.bots.forEach(b => {
      if (b && b.group) this.scene.remove(b.group);
    });
    this.bots = [];

    this.giantBoss = new GiantBoss(this.scene, pos);
    const attackerName = this.currentHero === 'soldier' ? '솔저: 76' : '겐지';
    this.ui.addKillfeedEntry(attackerName, '보스 소환 블록 파괴', false, false);
    this.ui.showCenterAnnouncement('🔥 조인준 보스 강림! 🔥', '원래 있던 준성이들이 모두 사라졌습니다! 조인준 보스의 즉사기를 회피하세요!', 5000);
    this.ui.updateQuest(0, 1, '조인준 보스를 토벌하세요!');
  }

  respawnBossBlock() {
    this.spawnFallingBossBlock();
  }

  getStageRecords() {
    try {
      const data = localStorage.getItem('overwatch_stage_records_v1');
      if (data) return JSON.parse(data);
    } catch (e) {}
    return {
      1: { stars: 0, time: 0 },
      2: { stars: 0, time: 0 },
      3: { stars: 0, time: 0 },
      4: { stars: 0, time: 0 },
      5: { stars: 0, time: 0 }
    };
  }

  saveStageRecord(stage, stars, time) {
    try {
      const recs = this.getStageRecords();
      const prev = recs[stage] || { stars: 0, time: 0 };
      const newStars = Math.max(prev.stars || 0, stars);
      const newTime = (prev.time > 0 && prev.time < time) ? prev.time : time;
      recs[stage] = { stars: newStars, time: newTime };
      localStorage.setItem('overwatch_stage_records_v1', JSON.stringify(recs));
    } catch (e) {}
  }

  spawnStageBots(stageNum) {
    this.bots.forEach(b => this.scene.remove(b.group));
    this.bots = [];

    if (stageNum === 1) {
      // 제 1 장: 용암 지형 & 준성이 10마리 소탕 후 조인준 보스전
      const positions = [
        new THREE.Vector3(-8, 0.6, 12),
        new THREE.Vector3(-4, 0.6, 16),
        new THREE.Vector3(0, 0.6, 14),
        new THREE.Vector3(4, 0.6, 18),
        new THREE.Vector3(8, 0.6, 15),
        new THREE.Vector3(-6, 0.6, 22),
        new THREE.Vector3(-2, 0.6, 26),
        new THREE.Vector3(2, 0.6, 24),
        new THREE.Vector3(6, 0.6, 28),
        new THREE.Vector3(0, 0.6, 32)
      ];
      positions.forEach((pos, i) => {
        this.bots.push(new TrainingBot(this.scene, {
          name: '움직이는 준성',
          type: 'combat',
          position: pos,
          patrolRange: 8,
          patrolAxis: i % 2 === 0 ? 'x' : 'z',
          patrolSpeed: 3.2,
          shootInterval: 2.5,
          customDamage: 10,
          faceIndex: i % 4
        }));
      });

    } else if (stageNum === 2) {
      // 제 2 장: 빙원 지형 & 람머스 가시전차 노윤상 보스전!
      this.yoonSangBoss = new YoonSangBoss(this.scene, new THREE.Vector3(0, 0.6, 21));
      this.giantBoss = this.yoonSangBoss;
      this.bots = [];

    } else if (stageNum === 3) {
      // Stage 1-3: 10 Combat Shooting Bots (Bullet Trial)
      for (let i = 0; i < 10; i++) {
        const x = ((i % 5) - 2) * 6;
        const z = 16 + Math.floor(i / 5) * 12;
        this.bots.push(new TrainingBot(this.scene, {
          type: 'combat',
          position: new THREE.Vector3(x, 0, z),
          patrolRange: 8,
          patrolAxis: 'x',
          patrolSpeed: 2.8,
          shootInterval: 2.2,
          faceIndex: i % 4
        }));
      }

    } else if (stageNum === 4) {
      // Stage 1-4: 12 Elite Bots (High HP 350 + Combat)
      for (let i = 0; i < 12; i++) {
        const x = ((i % 4) - 1.5) * 8;
        const z = 14 + Math.floor(i / 4) * 8;
        const isCombat = i % 2 === 0;
        const b = new TrainingBot(this.scene, {
          type: isCombat ? 'combat' : 'patrol',
          position: new THREE.Vector3(x, 0, z),
          patrolRange: 10,
          patrolAxis: i % 2 === 0 ? 'x' : 'z',
          patrolSpeed: 3.8,
          shootInterval: 2.4,
          faceIndex: i % 4
        });
        b.maxHealth = 350;
        b.health = 350;
        this.bots.push(b);
      }

    } else if (stageNum === 5) {
      // Stage 1-5: Boss Showdown! Spawn falling boss block immediately
      this.spawnFallingBossBlock();
    }
  }

  startStage(stageNum) {
    this.gameMode = 'stage';
    this.currentStage = stageNum;
    this.stageLives = this.maxStageLives;
    this.isGameActive = true;
    this.isGameCleared = false;
    this.isGameOver = false;
    this.playTime = 0;
    this.questKills = 0;
    this.totalDamageDealt = 0;
    this.resetStats();

    if (window.playerController) {
      window.playerController.isDead = false;
      window.playerController.health = window.playerController.maxHealth;
      window.playerController.deaths = 0;
      window.playerController.camera.position.set(0, 1.8, -12);
      window.playerController.camera.rotation.set(0, 0, 0);
      window.playerController.yaw = 0;
      window.playerController.pitch = 0;
      window.playerController.velocity.set(0, 0, 0);
    }

    if (this.bossBlock) {
      this.scene.remove(this.bossBlock.group);
      this.bossBlock = null;
    }
    if (this.giantBoss) {
      if (this.giantBoss.hideBossHUD) this.giantBoss.hideBossHUD();
      this.scene.remove(this.giantBoss.group);
      this.giantBoss = null;
    }
    if (this.yoonSangBoss) {
      if (this.yoonSangBoss.hideBossHUD) this.yoonSangBoss.hideBossHUD();
      this.scene.remove(this.yoonSangBoss.group);
      this.yoonSangBoss = null;
    }

    const cfg = this.stageConfigs[stageNum] || this.stageConfigs[1];
    this.questTarget = cfg.targetKills;

    // Apply Map Theme (제 2 장은 얼음 지형, 그 외는 용암 지형)
    if (stageNum === 2) {
      this.currentMapTheme = 'ice';
      if (this.map && this.map.applyTheme) this.map.applyTheme('ice');
      if (window.playerController) window.playerController.isIceTerrain = true;
    } else {
      this.currentMapTheme = 'lava';
      if (this.map && this.map.applyTheme) this.map.applyTheme('lava');
      if (window.playerController) window.playerController.isIceTerrain = false;
    }

    this.spawnStageBots(stageNum);

    this.ui.updateLives(this.stageLives, this.maxStageLives, true);
    this.ui.updateQuest(0, this.questTarget, cfg.name);
    this.ui.setModeDisplay(`제 ${stageNum} 장: ${cfg.name}`);
    this.ui.showCenterAnnouncement(`⚔️ 제 ${stageNum} 장 작전 개시!`, cfg.desc, 3800);
    this.ui.hideAllModals();
    this.requestPointerLock();
  }

  startPracticeRange() {
    this.gameMode = 'practice';
    this.isGameActive = true;
    this.isGameCleared = false;
    this.isGameOver = false;
    this.playTime = 0;
    this.questKills = 0;
    this.questTarget = 10;
    this.totalDamageDealt = 0;
    this.resetStats();

    if (window.playerController) {
      window.playerController.isDead = false;
      window.playerController.health = window.playerController.maxHealth;
      window.playerController.deaths = 0;
      window.playerController.camera.position.set(0, 1.8, -12);
      window.playerController.camera.rotation.set(0, 0, 0);
    }

    if (this.bossBlock) {
      this.scene.remove(this.bossBlock.group);
      this.bossBlock = null;
    }
    if (this.giantBoss) {
      if (this.giantBoss.hideBossHUD) this.giantBoss.hideBossHUD();
      this.scene.remove(this.giantBoss.group);
      this.giantBoss = null;
    }

    this.spawnDefaultBots();
    this.ui.updateLives(0, 0, false);
    this.ui.updateQuest(0, this.questTarget, '전준성 들을 잡으세요');
    this.ui.setModeDisplay('마인크래프트 주민 자유 훈련장');
    this.ui.showCenterAnnouncement('🎯 주민 훈련장 입장', '자유롭게 사격 및 스킬을 연습하십시오!', 3000);
    this.ui.hideAllModals();
    this.requestPointerLock();
  }

  startNextStage() {
    if (this.currentStage < 5) {
      this.startStage(this.currentStage + 1);
    } else {
      this.exitToMainMenu();
    }
  }

  restartCurrentMode() {
    if (this.gameMode === 'stage') {
      this.startStage(this.currentStage);
    } else {
      this.startPracticeRange();
    }
  }

  exitToMainMenu() {
    try {
      document.exitPointerLock();
    } catch (e) {}
    this.gameMode = 'menu';
    this.isGameActive = false;
    this.isGameCleared = false;
    this.isGameOver = false;
    this.ui.hideGameClear();
    this.ui.hideMissionFailed();
    this.ui.showStageSelect(false);
    this.ui.showStartScreen(true);
  }

  onPlayerDeath() {
    if (this.gameMode === 'stage') {
      this.stageLives--;
      this.ui.updateLives(this.stageLives, this.maxStageLives, true);

      if (this.stageLives <= 0) {
        // 3 deaths -> ELIMINATION (탈락)
        this.triggerStageFailed();
      } else {
        // Respawn after 2 seconds
        this.ui.showElimination(`⚠️ 사망! 남은 목숨: ${this.stageLives}개 (2초 후 리스폰)`);
        setTimeout(() => {
          if (!this.isGameOver && !this.isGameCleared && window.playerController) {
            window.playerController.respawn();
          }
        }, 2000);
      }
    } else {
      // Practice mode: unlimited lives
      this.ui.showElimination('💀 플레이어 사망! (2.5초 후 부활)');
      setTimeout(() => {
        if (window.playerController) window.playerController.respawn();
      }, 2500);
    }
  }

  triggerStageClear() {
    if (this.isGameCleared) return;
    this.isGameCleared = true;
    this.isGameActive = false;

    try {
      document.exitPointerLock();
    } catch (e) {}

    const shotsFired = this.stats.shotsFired;
    const shotsHit = this.stats.shotsHit;
    const acc = shotsFired > 0 ? ((shotsHit / shotsFired) * 100).toFixed(1) : '0.0';
    const hs = shotsHit > 0 ? ((this.stats.headshots / shotsHit) * 100).toFixed(1) : '0.0';
    const deathsUsed = Math.max(0, this.maxStageLives - Math.max(0, this.stageLives));

    // 조인준이 죽으면 모든 전준성(미니언 포함) 즉시 소탕 및 완전 소멸
    if (this.bots && this.bots.length > 0) {
      this.bots.forEach(b => {
        if (b) {
          b.isDead = true;
          if (window.particleSystem && b.group) {
            window.particleSystem.spawnVillagerDeathPoof(b.group.position.clone());
          }
          if (b.group && b.group.parent) {
            b.group.parent.remove(b.group);
          }
        }
      });
      this.bots = [];
    }

    // 남아있는 적 투사체/레이저도 모두 소멸
    if (window.projectileSystem && window.projectileSystem.botLasers) {
      window.projectileSystem.botLasers.forEach(l => {
        if (l.mesh && l.mesh.parent) l.mesh.parent.remove(l.mesh);
      });
      window.projectileSystem.botLasers = [];
    }

    // 별점 측정 기준:
    // 1. 목숨 3개가 모두 무사하면 (0번 사망): 별 3개 (★★★)
    // 2. 한번 죽으면 (1번 사망): 별 2개 (★★☆)
    // 3. 2번 죽으면 (2번 사망): 별 1개 (★☆☆)
    let stars = 1;
    let clearTitle = `제 ${this.currentStage} 장 클리어!`;
    let clearSubtitle = '';

    if (this.currentStage === 1) {
      clearTitle = '제 1 장 클리어! (조인준 토벌)';
      if (deathsUsed <= 0) {
        stars = 3;
        clearSubtitle = '조인준을 처치하고 전준성들을 모두 소탕했습니다! 목숨 3개 모두 무사 (★★★ 별 3개)';
      } else if (deathsUsed === 1) {
        stars = 2;
        clearSubtitle = '조인준을 처치하고 전준성들을 모두 소탕했습니다! 1회 사망 후 극복 (★★☆ 별 2개)';
      } else {
        stars = 1;
        clearSubtitle = '조인준을 처치하고 전준성들을 모두 소탕했습니다! 2회 사망 후 완수 (★☆☆ 별 1개)';
      }
    } else if (this.currentStage === 2) {
      clearTitle = '제 2 장 클리어! (노윤상 토벌)';
      if (deathsUsed <= 0) {
        stars = 3;
        clearSubtitle = '빙원의 가시전차 노윤상을 완전히 제압했습니다! 목숨 3개 모두 무사 (★★★ 별 3개)';
      } else if (deathsUsed === 1) {
        stars = 2;
        clearSubtitle = '빙원의 가시전차 노윤상을 완전히 제압했습니다! 1회 사망 후 극복 (★★☆ 별 2개)';
      } else {
        stars = 1;
        clearSubtitle = '빙원의 가시전차 노윤상을 완전히 제압했습니다! 2회 사망 후 완수 (★☆☆ 별 1개)';
      }
    } else {
      if (deathsUsed <= 0) {
        stars = 3;
        clearSubtitle = `제 ${this.currentStage} 장을 완벽하게 완수했습니다! 목숨 3개 모두 무사 (★★★ 별 3개)`;
      } else if (deathsUsed === 1) {
        stars = 2;
        clearSubtitle = `제 ${this.currentStage} 장을 클리어했습니다! 1회 사망 후 극복 (★★☆ 별 2개)`;
      } else {
        stars = 1;
        clearSubtitle = `제 ${this.currentStage} 장을 클리어했습니다! 2회 사망 후 완수 (★☆☆ 별 1개)`;
      }
    }

    if (this.gameMode === 'stage') {
      this.saveStageRecord(this.currentStage, stars, this.playTime);
    }

    // 오른쪽 퀘스트 목표 완료(100%)로 즉시 갱신
    this.questKills = this.questTarget || 1;
    if (this.currentStage === 1) {
      this.ui.updateQuest(1, 1, '조인준 보스 토벌 완료! (클리어)');
    } else if (this.currentStage === 2) {
      this.ui.updateQuest(1, 1, '노윤상 보스 토벌 완료! (클리어)');
    } else {
      this.ui.updateQuest(this.questTarget, this.questTarget, `제 ${this.currentStage} 장 작전 성공! (클리어)`);
    }

    try {
      if (window.audioEngine) {
        if (typeof window.audioEngine.playVictoryFanfare === 'function') {
          window.audioEngine.playVictoryFanfare();
        } else if (typeof window.audioEngine.playBossDefeat === 'function') {
          window.audioEngine.playBossDefeat();
        }
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }

    // 중앙 대형 안내 배너로 클리어 문구 표시
    this.ui.showCenterAnnouncement(
      `🏆 ${clearTitle} 🏆`,
      clearSubtitle,
      5000
    );

    this.ui.showStageClear({
      stage: this.currentStage,
      time: this.playTime,
      stars: stars,
      deaths: deathsUsed,
      accuracy: acc,
      headshot: hs,
      kills: this.stats.kills,
      damage: this.totalDamageDealt,
      clearTitle: clearTitle,
      clearSubtitle: clearSubtitle
    });
  }

  triggerStageFailed() {
    this.isGameOver = true;
    this.isGameActive = false;

    this.ui.showMissionFailed({
      stage: this.currentStage,
      time: this.playTime,
      kills: this.questKills
    });
  }

  restartGame() {
    this.restartCurrentMode();
  }

  requestPointerLock() {
    try {
      const p = this.renderer.domElement.requestPointerLock();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {});
      }
    } catch (e) {}
  }

  tryPrimaryFire() {
    const targets = this.getAllShootableTargets();
    this.weapons.fire(targets, this.stats, (isHeadshot, isKilled, bot) => {
      this.ui.triggerHitmarker(isHeadshot);
      // Ultimate charge rate: 5x slower than before (crit: 1.4%, normal: 0.7%)
      const chargeGain = isHeadshot ? 1.4 : 0.7;
      this.stats.ultCharge = Math.min(100, this.stats.ultCharge + chargeGain);
      if (isKilled) {
        this.handleBotKill(bot, isHeadshot);
      }
    });
  }

  trySecondaryFire() {
    const targets = this.getAllShootableTargets();
    this.weapons.fireSecondary(targets, this.stats, (isKilled, bot) => {
      // Ultimate charge rate: 5x slower than before (helix/fan hit: 2.0%)
      this.stats.ultCharge = Math.min(100, this.stats.ultCharge + 2.0);
      if (isKilled) {
        this.handleBotKill(bot, false);
      }
    });
  }

  handleBotKill(bot, isHeadshot) {
    this.stats.kills++;
    const targetName = bot && bot.name ? bot.name : '전준성';
    const attackerName = this.currentHero === 'soldier' ? '솔저: 76' : '겐지';

    // Genji Swift strike resets on ANY kill!
    this.weapons.resetSwiftStrikeCooldown();

    const isBoss = (bot === this.giantBoss || bot === this.yoonSangBoss || (bot && bot.name && (bot.name.includes('조인준') || bot.name.includes('JO') || bot.name.includes('노윤상') || bot.name.includes('람머스'))));
    this.ui.addKillfeedEntry(attackerName, targetName, isHeadshot, isBoss);

    if (this.gameMode === 'stage') {
      if (this.currentStage === 1) {
        if (isBoss) {
          // 조인준 보스 처치 완료! 모든 전준성(미니언 포함) 즉시 소멸
          this.bots.forEach(b => {
            if (b) {
              b.isDead = true;
              if (window.particleSystem && b.group) {
                window.particleSystem.spawnVillagerDeathPoof(b.group.position.clone());
              }
              if (b.group && b.group.parent) {
                b.group.parent.remove(b.group);
              }
            }
          });
          this.bots = [];

          if (window.projectileSystem && window.projectileSystem.botLasers) {
            window.projectileSystem.botLasers.forEach(l => {
              if (l.mesh && l.mesh.parent) l.mesh.parent.remove(l.mesh);
            });
            window.projectileSystem.botLasers = [];
          }

          setTimeout(() => {
            this.triggerStageClear();
          }, 800);
          return;
        } else if (!this.giantBoss) {
          this.questKills++;
          this.ui.updateQuest(this.questKills, 10, '준성이 10마리 소탕');
          if (this.questKills >= 10) {
            // Remove all original Junseong bots from scene!
            this.bots.forEach(b => {
              if (b && b.group) this.scene.remove(b.group);
            });
            this.bots = [];

            // 10 Junseong killed! Summon 조인준 보스!
            this.spawnFallingBossBlock();
            this.ui.showCenterAnnouncement(
              '🔥 조인준 보스 강림! 🔥',
              '준성이 10마리 소탕 완료! 조인준 보스의 즉사기를 피하고 용암을 조심하십시오!',
              5000
            );
            this.ui.updateQuest(0, 1, '조인준 보스를 토벌하세요!');
            return;
          }
        }
      } else if (this.currentStage === 2) {
        if (isBoss) {
          // 노윤상 보스 처치 완료!
          if (window.projectileSystem && window.projectileSystem.botLasers) {
            window.projectileSystem.botLasers.forEach(l => {
              if (l.mesh && l.mesh.parent) l.mesh.parent.remove(l.mesh);
            });
            window.projectileSystem.botLasers = [];
          }
          this.triggerStageClear();
          return;
        }
      } else if (this.currentStage === 5) {
        if (isBoss) {
          this.triggerStageClear();
          return;
        }
      } else {
        this.questKills++;
        const cfg = this.stageConfigs[this.currentStage] || { name: '목표 달성' };
        this.ui.updateQuest(this.questKills, this.questTarget, cfg.name);
        if (this.questKills >= this.questTarget) {
          this.triggerStageClear();
          return;
        }
      }
    } else {
      // Practice range mode
      if (isBoss) {
        this.triggerStageClear();
        return;
      }

      if (this.questKills < this.questTarget) {
        this.questKills++;
        this.ui.updateQuest(this.questKills, this.questTarget, '전준성 들을 잡으세요');
        if (this.questKills >= this.questTarget) {
          this.spawnFallingBossBlock();
          this.ui.showCenterAnnouncement('🔥 보스를 잡으세요! 🔥', '하늘에서 보스 블록이 떨어졌습니다! 파괴하여 보스를 소환하십시오!', 4500);
          this.ui.updateQuest(10, 10, '보스를 잡으세요!');
          if (window.audioEngine) {
            if (typeof window.audioEngine.playBossRoar === 'function') {
              window.audioEngine.playBossRoar();
            } else if (typeof window.audioEngine.playTacticalVisor === 'function') {
              window.audioEngine.playTacticalVisor();
            }
          }
        }
      }
    }

    if (this.isChallengeActive) {
      const pts = isHeadshot ? 200 : 100;
      this.challengeScore += pts;
      this.ui.elStatScore.textContent = this.challengeScore;
    }
  }

  setTrainingMode(mode) {
    this.currentMode = mode;
    if (mode === 'flick') {
      this.startChallengeMode();
    } else if (mode === 'tracking') {
      this.isChallengeActive = false;
      this.ui.elTimerBox.style.display = 'none';
      this.ui.elScoreBox.style.display = 'none';
      this.ui.elModeDisplay.textContent = '에임 트래킹 훈련 (TRACKING PRACTICE)';
      this.spawnDefaultBots();
      this.bots.forEach(b => {
        if (b.type === 'patrol') b.patrolSpeed = 5.2;
      });
    } else {
      this.isChallengeActive = false;
      this.ui.elTimerBox.style.display = 'none';
      this.ui.elScoreBox.style.display = 'none';
      this.ui.elModeDisplay.textContent = '마인크래프트 자유 훈련 (FREE PRACTICE)';
      this.spawnDefaultBots();
    }
  }

  startChallengeMode() {
    this.currentMode = 'flick';
    this.isChallengeActive = true;
    this.challengeTimer = 30.0;
    this.challengeScore = 0;
    this.ui.elModeDisplay.textContent = '⚡ 마크 주민 30초 플릭샷 챌린지';
    this.ui.elTimerBox.style.display = 'flex';
    this.ui.elScoreBox.style.display = 'flex';
    this.ui.elStatScore.textContent = '0';
    this.spawnDefaultBots();
  }

  resetStats() {
    this.stats.kills = 0;
    this.stats.shotsFired = 0;
    this.stats.shotsHit = 0;
    this.stats.headshots = 0;
    this.stats.ultCharge = this.infiniteUlt ? 100 : 0;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = Math.min(0.06, this.clock.getDelta());

    // Auto-fire while holding left click (Soldier pulse rifle or Genji shurikens/blade)
    if (this.isMouseDown && document.pointerLockElement === this.renderer.domElement) {
      this.tryPrimaryFire();
    }

    if (this.infiniteUlt) {
      this.stats.ultCharge = 100;
    } else {
      // Passive ult charge rate: 5x slower (was 0.33 -> now 0.066)
      this.stats.ultCharge = Math.min(100, this.stats.ultCharge + delta * 0.066);
    }

    // Live play time timer
    if (this.isGameActive && !this.isGameCleared) {
      this.playTime += delta;
      this.ui.updatePlayTime(this.playTime);
    }

    if (this.isChallengeActive) {
      this.challengeTimer -= delta;
      if (this.challengeTimer <= 0) {
        this.challengeTimer = 0;
        this.isChallengeActive = false;
        alert(`🏁 플릭샷 챌린지 종료!\n최종 점수: ${this.challengeScore}점\n명중률: ${this.stats.shotsFired > 0 ? ((this.stats.shotsHit / this.stats.shotsFired) * 100).toFixed(1) : 0}%`);
        this.setTrainingMode('free');
      }
      this.ui.elStatTimer.innerHTML = `${this.challengeTimer.toFixed(1)}<small>s</small>`;
    }

    window.playerController.update(
      delta,
      this.weapons.bioticBeacon,
      this.weapons.bioticRadius,
      this.weapons.bioticActive,
      this.weapons.bioticHealRate,
      this.map ? this.map.jumpPads : null
    );

    // Lava Hazard & Movement Restriction Check
    if (this.map && typeof this.map.checkLavaContact === 'function' && window.playerController && !window.playerController.isDead) {
      const lava = this.map.checkLavaContact(window.playerController.camera.position, delta);
      if (lava.onLava) {
        // Restrict movement: viscous magma slows player by 55%
        window.playerController.velocity.x *= lava.speedMultiplier;
        window.playerController.velocity.z *= lava.speedMultiplier;

        if (lava.applyDamage) {
          window.playerController.takeDamage(lava.damage);
          if (window.audioEngine) window.audioEngine.playLavaBurn();
          if (window.particleSystem) {
            window.particleSystem.spawnHitSparks(window.playerController.camera.position, true);
          }
        }
      }
    }

    // Update Minecraft clouds & jump pads
    if (this.map && this.map.update) {
      this.map.update(delta);
    }

    const allTargets = this.getAllShootableTargets();

    // Update Boss Block & Giant Boss & Bots
    if (this.bossBlock && !this.bossBlock.isDead) {
      this.bossBlock.update(delta);
    }
    if (this.giantBoss && !this.giantBoss.isDead) {
      this.giantBoss.update(delta, window.playerController.camera.position, this.map ? this.map.jumpPads : null);
    }
    this.bots.forEach(b => b.update(delta, window.playerController.camera.position, this.map ? this.map.jumpPads : null));
    this.weapons.update(delta, window.playerController.camera.position, window.playerController.isSprinting, allTargets);

    window.particleSystem.update(delta);
    window.projectileSystem.update(delta, window.playerController, this.weapons, allTargets);

    this.ui.updateHUD(window.playerController, this.weapons, this.stats, this.camera);
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new OverwatchGame();
});
