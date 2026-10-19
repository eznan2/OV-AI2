/**
 * ============================================================================
 * Overwatch X Monster Hunter: Colossal Boss System (조인준 보스 / 대수신 JO)
 * ============================================================================
 * Features:
 * 1. BossSpawnerBlock: HP 100, drops from sky, summons 조인준 보스 upon destruction.
 * 2. GiantBoss (수렵 대상: 조인준 보스):
 *    - Colossal Monster Hunter titan featuring JO.jpg with crystal-clear aspect ratio (666x1440).
 *    - 3D articulated dragon/demon limbs (animated claws, horned crest, heavy talons, chest glow).
 *    - ALL ATTACKS ARE INSTANT KILL (즉사기: 999 피해!):
 *        Pattern 1: [맹렬한 대지 돌진 (Cataclysmic Rush)] - 28m Red rectangular corridor.
 *        Pattern 2: [대지 분쇄 강타 (Earthquake Slam)] - 9m Red circular impact zone.
 *        Pattern 3: [연속 유성 폭격 (Celestial Meteor Barrage)] - 4 Sequential targeted red circles.
 *        Pattern 4: [전방 화염 브레스 (Infernal Cone Breath)] - 90-degree Red sector / fan cone.
 *        Pattern 5: [궁극기: 파멸의 전방위 대폭발 (Cataclysmic Supernova)] - Outer donut red zone with inner safe pocket!
 *    - HP Milestone Minion Summon (보스 피 100씩 깎일 때마다 움직이는 준성이 소환, 데미지: 10).
 *    - Full damage calculation, player knockback, screen shake, audio synthesis, and HUD warnings.
 */

class BossSpawnerBlock {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.id = 'boss_spawner_block';
    this.name = '보스 소환 블록';
    this.basePos = options.position ? options.position.clone() : new THREE.Vector3(0, 0, 22);
    this.currentPos = this.basePos.clone();
    this.maxHealth = 100;
    this.health = 100;
    this.isDead = false;
    this.hitboxes = [];
    this.flinchTimer = 0;
    this.animTime = 0;

    this.isFalling = options.dropFromSky || false;
    this.fallVelY = 0;

    this.group = new THREE.Group();
    if (this.isFalling) {
      this.group.position.set(this.basePos.x, 38, this.basePos.z);
    } else {
      this.group.position.copy(this.basePos);
    }
    this.scene.add(this.group);

    this.createModel();
    this.createHealthBar();
  }

  createModel() {
    const size = 1.7;

    // Dark Crying Obsidian Cage Frame
    const cageGeo = new THREE.BoxGeometry(size, size, size);
    this.matCage = new THREE.MeshStandardMaterial({
      color: 0x1a0f26,
      roughness: 0.45,
      metalness: 0.65,
      emissive: 0x13071f
    });
    this.cageMesh = new THREE.Mesh(cageGeo, this.matCage);
    this.cageMesh.position.set(0, size / 2, 0);
    this.cageMesh.castShadow = true;
    this.cageMesh.receiveShadow = true;
    this.group.add(this.cageMesh);

    this.cageMesh.userData = { bot: this, isHead: false };
    this.hitboxes.push(this.cageMesh);

    // Glowing Inner Flame Core (Spinning Octahedron)
    const coreGeo = new THREE.OctahedronGeometry(0.55);
    this.matCore = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    this.coreMesh = new THREE.Mesh(coreGeo, this.matCore);
    this.coreMesh.position.set(0, size / 2, 0);
    this.group.add(this.coreMesh);

    // Corner Rods
    const rodGeo = new THREE.BoxGeometry(0.12, size + 0.3, 0.12);
    this.matRod = new THREE.MeshBasicMaterial({ color: 0xd500f9 });
    const corners = [
      { x: -size / 2, z: size / 2 },
      { x: size / 2, z: size / 2 },
      { x: -size / 2, z: -size / 2 },
      { x: size / 2, z: -size / 2 }
    ];
    corners.forEach(c => {
      const rod = new THREE.Mesh(rodGeo, this.matRod);
      rod.position.set(c.x, size / 2, c.z);
      this.group.add(rod);
    });

    // Base Pedestal
    const pedGeo = new THREE.CylinderGeometry(1.4, 1.6, 0.25, 8);
    const pedMat = new THREE.MeshStandardMaterial({ color: 0x0f0b18, roughness: 0.7 });
    const ped = new THREE.Mesh(pedGeo, pedMat);
    ped.position.set(0, 0.12, 0);
    this.group.add(ped);
  }

  createHealthBar() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 40;
    this.hpCanvas = canvas;
    this.hpCtx = canvas.getContext('2d');

    this.hpTexture = new THREE.CanvasTexture(canvas);
    this.hpTexture.magFilter = THREE.NearestFilter;
    this.hpTexture.minFilter = THREE.NearestFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: this.hpTexture,
      transparent: true,
      depthTest: false
    });
    this.hpSprite = new THREE.Sprite(spriteMat);
    this.hpSprite.scale.set(2.6, 0.52, 1);
    this.hpSprite.position.set(0, 2.5, 0);
    this.group.add(this.hpSprite);

    this.updateHealthBarTexture();
  }

  updateHealthBarTexture() {
    const ctx = this.hpCtx;
    ctx.clearRect(0, 0, 200, 40);

    if (this.isDead) {
      this.hpTexture.needsUpdate = true;
      return;
    }

    ctx.fillStyle = 'rgba(12, 8, 18, 0.92)';
    ctx.fillRect(0, 0, 200, 40);
    ctx.strokeStyle = '#ff1744';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(2, 2, 196, 36);

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#ff5252';
    ctx.textAlign = 'center';
    ctx.fillText(`💥 보스 소환 블록 [${Math.max(0, this.health)} / 100]`, 100, 16);

    const pct = Math.max(0, this.health / this.maxHealth);
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(8, 22, Math.floor(184 * pct), 12);

    this.hpTexture.needsUpdate = true;
  }

  takeDamage(amount, isHeadshot = false) {
    if (this.isDead) return { killed: false, actualDamage: 0 };

    if (window.gameInstance && typeof window.gameInstance.recordDamage === 'function') {
      window.gameInstance.recordDamage(amount);
    }
    this.health -= amount;
    this.flinchTimer = 0.15;
    if (this.matCage) this.matCage.color.setHex(0xff3333);
    if (this.matCore) this.matCore.color.setHex(0xffffff);

    if (window.audioEngine) {
      window.audioEngine.playHitmarker();
    }

    if (this.health <= 0) {
      this.die();
      return { killed: true, actualDamage: amount, isHeadshot: false };
    }

    this.updateHealthBarTexture();
    return { killed: false, actualDamage: amount, isHeadshot: false };
  }

  die() {
    this.isDead = true;
    this.health = 0;
    this.group.visible = false;
    this.updateHealthBarTexture();

    if (window.audioEngine) {
      window.audioEngine.playExplosion();
      setTimeout(() => window.audioEngine.playBossRoar(), 200);
    }
    if (window.particleSystem) {
      window.particleSystem.spawnVillagerDeathPoof(this.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)));
      window.particleSystem.spawnJumpPadBurst(this.group.position.clone());
    }

    if (window.gameInstance) {
      window.gameInstance.onBossBlockDestroyed(this.group.position.clone());
    }
  }

  update(delta) {
    if (this.isDead) return;

    this.animTime += delta;

    if (this.isFalling) {
      this.fallVelY -= 52.0 * delta;
      this.group.position.y += this.fallVelY * delta;
      if (this.group.position.y <= this.basePos.y) {
        this.group.position.y = this.basePos.y;
        this.isFalling = false;
        if (window.audioEngine) {
          window.audioEngine.playExplosion();
          window.audioEngine.playBossRoar();
        }
        if (window.particleSystem) {
          window.particleSystem.spawnJumpPadBurst(this.group.position.clone());
          window.particleSystem.spawnVillagerDeathPoof(this.group.position.clone());
        }
        if (window.playerController) {
          window.playerController.pitch += (Math.random() - 0.5) * 0.14;
        }
      }
    }

    if (this.flinchTimer > 0) {
      this.flinchTimer -= delta;
      if (this.flinchTimer <= 0) {
        if (this.matCage) this.matCage.color.setHex(0x1a0f26);
        if (this.matCore) this.matCore.color.setHex(0xff1744);
      }
    }

    if (this.coreMesh) {
      this.coreMesh.rotation.x += delta * 2.5;
      this.coreMesh.rotation.y += delta * 3.5;
      const pulse = 1.0 + Math.sin(this.animTime * 6) * 0.12;
      this.coreMesh.scale.set(pulse, pulse, pulse);
    }
  }
}

// ============================================================================
// GIANT BOSS: MONSTER HUNTER COLOSSAL TITAN (조인준 보스)
// ============================================================================
class GiantBoss {
  constructor(scene, spawnPos) {
    this.scene = scene;
    this.id = 'giant_boss';
    this.name = '조인준 (대수신 JO)';
    this.basePos = spawnPos ? spawnPos.clone() : new THREE.Vector3(0, 0.6, 21);
    this.currentPos = this.basePos.clone();
    this.maxHealth = 3500;
    this.health = 3500;
    this.isDead = false;
    this.hitboxes = [];
    this.flinchTimer = 0;
    this.walkAnimTime = 0;
    this.velY = 0;

    // Movement & Combat State
    this.speed = 3.2;
    this.patrolRange = 17;
    this.patrolDirection = 1;
    // Strict Arena Clamping Bounds (keeps boss on Central Obsidian Battle Platform)
    this.arenaMinX = -8.5;
    this.arenaMaxX = 8.5;
    this.arenaMinZ = 9.0;
    this.arenaMaxZ = 30.0;

    // Attack State Machine: 'idle', 'patrol', 'telegraphing', 'executing', 'recovering'
    this.combatState = 'idle';
    this.stateTimer = 1.0;
    this.patternCooldown = 2.4;
    this.lastPatternTime = performance.now() / 1000;
    this.currentPattern = null;
    this.patternIndex = 0; // Cycles 1 to 5

    // Cumulative damage counter for summoning moving Junseong minion every 100 damage (최대 10마리 제한)
    this.damageSinceLastSummon = 0;
    this.minionsSpawnedCount = 0;
    this.maxMinionsTotal = 10;

    // Active telegraph indicators on ground
    this.activeTelegraphs = [];

    // Falling meteors for pattern 3
    this.activeMeteors = [];

    this.group = new THREE.Group();
    this.group.position.copy(this.basePos);
    this.scene.add(this.group);

    this.createColossalModel();
    this.showBossHUD();

    if (window.audioEngine) {
      window.audioEngine.playBossRoar();
    }
  }

  createColossalModel() {
    // Aspect Ratio of JO.jpg: 666 x 1440 => 1 : 2.162
    // Scaled dimensions: width = 3.2m, height = 6.9m, depth = 1.4m
    const width = 3.2;
    const height = 6.9;
    const depth = 1.4;
    this.bossWidth = width;
    this.bossHeight = height;

    // 1. Texture Loading (JO.jpg with fallback to JO_DATA_URL)
    const loader = new THREE.TextureLoader();
    const joSrc = (typeof window !== 'undefined' && window.JO_DATA_URL)
      ? window.JO_DATA_URL
      : 'JO.jpg';
    this.joTexture = loader.load(joSrc);
    this.joTexture.generateMipmaps = true;
    this.joTexture.minFilter = THREE.LinearMipmapLinearFilter;
    this.joTexture.magFilter = THREE.LinearFilter;

    // 2. Colossal Dark Netherite Armored Torso / Shell
    const casingGeo = new THREE.BoxGeometry(width, height, depth);
    this.matCasing = new THREE.MeshStandardMaterial({
      color: 0x140e1c,
      roughness: 0.5,
      metalness: 0.65,
      emissive: 0x0a0414
    });
    this.casingMesh = new THREE.Mesh(casingGeo, this.matCasing);
    this.casingMesh.position.set(0, height / 2, 0);
    this.casingMesh.castShadow = true;
    this.casingMesh.receiveShadow = true;
    this.group.add(this.casingMesh);

    // 3. High-Definition Front JO Photo Plate (+Z Face)
    const photoGeo = new THREE.PlaneGeometry(width - 0.08, height - 0.08);
    this.matPhotoFront = new THREE.MeshBasicMaterial({
      map: this.joTexture,
      transparent: false,
      toneMapped: false
    });
    this.photoFront = new THREE.Mesh(photoGeo, this.matPhotoFront);
    this.photoFront.position.set(0, height / 2, depth / 2 + 0.02);
    this.group.add(this.photoFront);

    // 4. Back Photo Plate (-Z Face)
    this.matPhotoBack = new THREE.MeshBasicMaterial({
      map: this.joTexture,
      transparent: false,
      toneMapped: false
    });
    this.photoBack = new THREE.Mesh(photoGeo, this.matPhotoBack);
    this.photoBack.position.set(0, height / 2, -depth / 2 - 0.02);
    this.photoBack.rotation.y = Math.PI;
    this.group.add(this.photoBack);

    // 5. Headshot Zone (Upper 35% of body where JO's face is prominently situated)
    const headHeight = 2.4;
    const headGeo = new THREE.BoxGeometry(width + 0.2, headHeight, depth + 0.3);
    const invisMat1 = new THREE.MeshBasicMaterial({ visible: false });
    this.headMesh = new THREE.Mesh(headGeo, invisMat1);
    this.headMesh.position.set(0, height - headHeight / 2, 0);
    this.headMesh.userData = { bot: this, isHead: true };
    this.group.add(this.headMesh);
    this.hitboxes.push(this.headMesh);

    // Body Zone (Lower 65%)
    const bodyHeight = height - headHeight;
    const bodyGeo = new THREE.BoxGeometry(width + 0.2, bodyHeight, depth + 0.3);
    const invisMat2 = new THREE.MeshBasicMaterial({ visible: false });
    this.bodyMesh = new THREE.Mesh(bodyGeo, invisMat2);
    this.bodyMesh.position.set(0, bodyHeight / 2, 0);
    this.bodyMesh.userData = { bot: this, isHead: false };
    this.group.add(this.bodyMesh);
    this.hitboxes.push(this.bodyMesh);

    // 6. Monster Hunter 3D Horns & Crown on Top of Head
    this.createMonsterHorns(width, height);

    // 7. Articulated Monster Arms & Claws
    this.createMonsterArms(width, height, depth);

    // 8. Demonic Shoulder Spikes & Fiery Energy Orbs
    this.createShoulderSpikes(width, height, depth);
  }

  createMonsterHorns(width, height) {
    const hornMat = new THREE.MeshStandardMaterial({
      color: 0x220526,
      roughness: 0.3,
      metalness: 0.5,
      emissive: 0x120215
    });

    // Massive curved Left Horn
    const leftHornGroup = new THREE.Group();
    leftHornGroup.position.set(-width / 2 + 0.4, height - 0.2, 0);
    const horn1 = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.8, 6), hornMat);
    horn1.rotation.z = 0.45;
    horn1.rotation.y = 0.2;
    horn1.position.set(-0.5, 0.9, 0);
    leftHornGroup.add(horn1);
    this.group.add(leftHornGroup);

    // Massive curved Right Horn
    const rightHornGroup = new THREE.Group();
    rightHornGroup.position.set(width / 2 - 0.4, height - 0.2, 0);
    const horn2 = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.8, 6), hornMat);
    horn2.rotation.z = -0.45;
    horn2.rotation.y = -0.2;
    horn2.position.set(0.5, 0.9, 0);
    rightHornGroup.add(horn2);
    this.group.add(rightHornGroup);

    // Center Demon Crown Spike
    const centerSpike = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.4, 6), hornMat);
    centerSpike.position.set(0, height + 0.65, 0);
    this.group.add(centerSpike);
  }

  createMonsterArms(width, height, depth) {
    const armMat = new THREE.MeshStandardMaterial({
      color: 0x1c1224,
      roughness: 0.5,
      metalness: 0.6
    });
    const clawMat = new THREE.MeshStandardMaterial({
      color: 0x3d0b1a,
      roughness: 0.25,
      metalness: 0.7,
      emissive: 0x24020a
    });

    // Left Arm Pivot
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-width / 2 - 0.35, height - 2.0, 0);
    const lUpper = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.6, 0.7), armMat);
    lUpper.position.set(-0.25, -1.1, 0);
    this.leftArmPivot.add(lUpper);
    const lClaw = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.3, 4), clawMat);
    lClaw.position.set(-0.25, -2.7, 0.1);
    lClaw.rotation.x = 0.3;
    this.leftArmPivot.add(lClaw);
    this.group.add(this.leftArmPivot);

    // Right Arm Pivot
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(width / 2 + 0.35, height - 2.0, 0);
    const rUpper = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.6, 0.7), armMat);
    rUpper.position.set(0.25, -1.1, 0);
    this.rightArmPivot.add(rUpper);
    const rClaw = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.3, 4), clawMat);
    rClaw.position.set(0.25, -2.7, 0.1);
    rClaw.rotation.x = 0.3;
    this.rightArmPivot.add(rClaw);
    this.group.add(this.rightArmPivot);
  }

  createShoulderSpikes(width, height, depth) {
    const spikeGeo = new THREE.ConeGeometry(0.25, 0.9, 4);
    const spikeMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });

    const posList = [
      { x: -width / 2, y: height - 1.2, z: depth / 2 + 0.1 },
      { x: width / 2, y: height - 1.2, z: depth / 2 + 0.1 },
      { x: -width / 2, y: height - 1.2, z: -depth / 2 - 0.1 },
      { x: width / 2, y: height - 1.2, z: -depth / 2 - 0.1 }
    ];

    posList.forEach(p => {
      const s = new THREE.Mesh(spikeGeo, spikeMat);
      s.position.set(p.x, p.y, p.z);
      this.group.add(s);
    });

    // Glowing Chest Core Eye
    const eyeGeo = new THREE.OctahedronGeometry(0.45);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    this.chestEye = new THREE.Mesh(eyeGeo, eyeMat);
    this.chestEye.position.set(0, height * 0.42, depth / 2 + 0.08);
    this.group.add(this.chestEye);
  }

  showBossHUD() {
    const hudBar = document.getElementById('boss-hud-bar');
    if (hudBar) hudBar.classList.remove('hidden');

    const titleEl = document.getElementById('boss-title-text');
    if (titleEl) titleEl.textContent = '👑 몬스터 헌터: 조인준 보스 (즉사 공격 주의!)';

    this.updateHUD();
  }

  hideBossHUD() {
    const hudBar = document.getElementById('boss-hud-bar');
    if (hudBar) hudBar.classList.add('hidden');
    this.hideWarningHUD();
  }

  showWarningHUD(title, desc) {
    const warnHud = document.getElementById('boss-warning-hud');
    const titleEl = document.getElementById('boss-warning-title');
    const descEl = document.getElementById('boss-warning-desc');

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (warnHud) warnHud.classList.remove('hidden');
  }

  hideWarningHUD() {
    const warnHud = document.getElementById('boss-warning-hud');
    if (warnHud) warnHud.classList.add('hidden');
  }

  updateHUD() {
    const elCounter = document.getElementById('boss-hp-counter');
    const elFill = document.getElementById('boss-bar-fill');
    const elGhost = document.getElementById('boss-bar-ghost');

    const curHp = Math.max(0, Math.round(this.health));
    if (elCounter) elCounter.textContent = `${curHp} / ${this.maxHealth}`;

    const pct = Math.max(0, curHp / this.maxHealth) * 100;
    if (elFill) elFill.style.width = `${pct}%`;
    if (elGhost) {
      setTimeout(() => {
        elGhost.style.width = `${pct}%`;
      }, 150);
    }
  }

  takeDamage(amount, isHeadshot = false) {
    if (this.isDead) return { killed: false, actualDamage: 0 };

    const actualDamage = isHeadshot ? amount * 2 : amount;
    if (window.gameInstance && typeof window.gameInstance.recordDamage === 'function') {
      window.gameInstance.recordDamage(actualDamage);
    }
    this.health -= actualDamage;

    // Check 100 HP Milestone damage to summon a moving Junseong bot with 10 damage! (최대 10마리 상한)
    this.damageSinceLastSummon += actualDamage;
    while (this.damageSinceLastSummon >= 100 && this.minionsSpawnedCount < this.maxMinionsTotal) {
      this.damageSinceLastSummon -= 100;
      this.spawnMinionJunseong();
    }

    // Red Damage Flinch Flash
    this.flinchTimer = 0.18;
    if (this.matPhotoFront) this.matPhotoFront.color.setHex(0xff6666);
    if (this.matPhotoBack) this.matPhotoBack.color.setHex(0xff6666);
    if (this.matCasing) this.matCasing.color.setHex(0xff2222);

    if (isHeadshot) {
      if (window.audioEngine) window.audioEngine.playHeadshotDink();
    } else {
      if (window.audioEngine) window.audioEngine.playHitmarker();
    }

    this.updateHUD();

    if (this.health <= 0) {
      this.die();
      return { killed: true, actualDamage, isHeadshot };
    }

    return { killed: false, actualDamage, isHeadshot };
  }

  // Summon moving Junseong bot on 100 HP damage with 10 attack damage (준성이는 최대 10마리까지만 소환)
  spawnMinionJunseong() {
    if (!window.gameInstance) return;

    // 준성이는 최대 10마리까지만 나오도록 제한
    if (this.minionsSpawnedCount >= this.maxMinionsTotal) return;

    // 필드 위에 생존 중인 준성이 수도 최대 10마리로 제한
    const aliveBots = (window.gameInstance.bots || []).filter(b => b && !b.isDead);
    if (aliveBots.length >= 10) return;

    this.minionsSpawnedCount++;

    // Pick random position on central battle arena platform
    const x = (Math.random() - 0.5) * 16;
    const z = 12 + Math.random() * 18;

    const bot = new TrainingBot(this.scene, {
      name: `움직이는 준성 #${this.minionsSpawnedCount}`,
      type: 'combat',
      position: new THREE.Vector3(x, 0.6, z),
      patrolRange: 10,
      patrolAxis: Math.random() > 0.5 ? 'x' : 'z',
      patrolSpeed: 3.8,
      shootInterval: 2.2,
      customDamage: 10, // Exactly 10 Damage as requested!
      faceIndex: Math.floor(Math.random() * 4)
    });
    bot.maxHealth = 120;
    bot.health = 120;

    window.gameInstance.bots.push(bot);

    if (window.audioEngine) {
      window.audioEngine.playVillagerHurt();
    }
    if (window.particleSystem) {
      window.particleSystem.spawnJumpPadBurst(bot.group.position);
    }
    if (window.gameInstance.ui) {
      window.gameInstance.ui.addKillfeedEntry(
        '조인준 보스',
        `움직이는 준성 소환 (${this.minionsSpawnedCount}/10)`,
        false,
        true
      );
    }
  }

  die() {
    this.isDead = true;
    this.health = 0;
    this.group.visible = false;
    this.updateHUD();
    this.clearAllTelegraphs();
    this.hideWarningHUD();

    if (window.audioEngine) {
      window.audioEngine.playBossDefeat();
    }

    // 조인준이 죽으면 모든 전준성(미니언 포함)들도 다 즉시 사라지게 처리!
    if (window.gameInstance && window.gameInstance.bots) {
      window.gameInstance.bots.forEach(b => {
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
      window.gameInstance.bots = [];
    }

    // 남아있는 투사체/레이저도 모두 소멸
    if (window.projectileSystem && window.projectileSystem.botLasers) {
      window.projectileSystem.botLasers.forEach(l => {
        if (l.mesh && l.mesh.parent) l.mesh.parent.remove(l.mesh);
      });
      window.projectileSystem.botLasers = [];
    }

    // Grand fireworks & particle poofs
    if (window.particleSystem) {
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 6,
            1 + i * 1.4,
            (Math.random() - 0.5) * 6
          );
          window.particleSystem.spawnVillagerDeathPoof(this.group.position.clone().add(offset));
          window.particleSystem.spawnJumpPadBurst(this.group.position.clone().add(offset));
        }, i * 180);
      }
    }

    if (window.gameInstance && window.gameInstance.ui) {
      window.gameInstance.ui.showElimination('🏆 조인준 보스 토벌 완료! [VICTORY]');
    }

    setTimeout(() => {
      this.hideBossHUD();
    }, 1800);

    // Trigger Game Clear modal with cl.jpg
    if (window.gameInstance && typeof window.gameInstance.triggerStageClear === 'function') {
      setTimeout(() => {
        window.gameInstance.triggerStageClear();
      }, 1000);
    }
  }

  // ==========================================================================
  // RED TELEGRAPH WARNING SYSTEM (빨간색 장판 시스템)
  // ==========================================================================
  createTelegraphMarker(config) {
    const group = new THREE.Group();
    group.position.set(config.pos.x, 0.68, config.pos.z);

    let mesh, outlineMesh;
    const redMat = new THREE.MeshBasicMaterial({
      color: 0xff0025,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const borderMat = new THREE.MeshBasicMaterial({
      color: 0xff1744,
      transparent: true,
      opacity: 0.95,
      wireframe: true,
      depthWrite: false
    });

    if (config.type === 'rect') {
      const geo = new THREE.PlaneGeometry(config.width, config.length);
      mesh = new THREE.Mesh(geo, redMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, 0, config.length / 2);
      group.add(mesh);

      outlineMesh = new THREE.Mesh(geo, borderMat);
      outlineMesh.rotation.x = -Math.PI / 2;
      outlineMesh.position.set(0, 0.01, config.length / 2);
      group.add(outlineMesh);

      group.rotation.y = config.rotY || 0;

    } else if (config.type === 'circle') {
      const geo = new THREE.CircleGeometry(config.radius, 32);
      mesh = new THREE.Mesh(geo, redMat);
      mesh.rotation.x = -Math.PI / 2;
      group.add(mesh);

      const ringGeo = new THREE.RingGeometry(config.radius * 0.92, config.radius, 32);
      outlineMesh = new THREE.Mesh(ringGeo, borderMat);
      outlineMesh.rotation.x = -Math.PI / 2;
      outlineMesh.position.y = 0.01;
      group.add(outlineMesh);

    } else if (config.type === 'cone') {
      const angle = config.angle || Math.PI / 2;
      const geo = new THREE.RingGeometry(0.4, config.radius, 32, 1, -angle / 2, angle);
      mesh = new THREE.Mesh(geo, redMat);
      mesh.rotation.x = -Math.PI / 2;
      group.add(mesh);

      outlineMesh = new THREE.Mesh(geo, borderMat);
      outlineMesh.rotation.x = -Math.PI / 2;
      outlineMesh.position.y = 0.01;
      group.add(outlineMesh);

      group.rotation.y = config.rotY || 0;

    } else if (config.type === 'donut') {
      const geo = new THREE.RingGeometry(config.innerRadius, config.outerRadius, 40);
      mesh = new THREE.Mesh(geo, redMat);
      mesh.rotation.x = -Math.PI / 2;
      group.add(mesh);

      // Safe zone inner green ring
      const safeMat = new THREE.MeshBasicMaterial({
        color: 0x38e469,
        transparent: true,
        opacity: 0.9,
        wireframe: true,
        depthWrite: false
      });
      const safeRing = new THREE.Mesh(
        new THREE.RingGeometry(config.innerRadius - 0.2, config.innerRadius, 32),
        safeMat
      );
      safeRing.rotation.x = -Math.PI / 2;
      safeRing.position.y = 0.02;
      group.add(safeRing);
    }

    this.scene.add(group);

    const marker = {
      group,
      mesh,
      config,
      elapsed: 0,
      duration: config.duration,
      pulseTime: 0
    };
    this.activeTelegraphs.push(marker);
    return marker;
  }

  clearAllTelegraphs() {
    this.activeTelegraphs.forEach(t => {
      this.scene.remove(t.group);
    });
    this.activeTelegraphs = [];
  }

  // ==========================================================================
  // 5 MONSTER HUNTER ATTACK PATTERNS (모두 즉사기: ONE-HIT KILL 999 DMG)
  // ==========================================================================

  // Pattern 1: 맹렬한 대지 돌진 (즉사기!)
  startPattern1_Charge(playerPos) {
    this.combatState = 'telegraphing';
    this.currentPattern = 'charge';
    const telegraphTime = 1.3;

    const bossPos = this.group.position.clone();
    const toPlayer = new THREE.Vector3().subVectors(playerPos, bossPos);
    toPlayer.y = 0;
    const yaw = Math.atan2(-toPlayer.x, -toPlayer.z);
    this.group.rotation.y = yaw;

    const chargeDir = toPlayer.clone().normalize();
    const chargeWidth = 4.5;

    // Calculate clamped endPos so boss NEVER charges out of the arena bounds
    const maxChargeDist = Math.min(20.0, bossPos.distanceTo(playerPos) + 3.0);
    const rawEnd = bossPos.clone().addScaledVector(chargeDir, maxChargeDist);
    const endPos = new THREE.Vector3(
      THREE.MathUtils.clamp(rawEnd.x, this.arenaMinX, this.arenaMaxX),
      this.basePos.y,
      THREE.MathUtils.clamp(rawEnd.z, this.arenaMinZ, this.arenaMaxZ)
    );
    const actualChargeLength = Math.max(6.0, bossPos.distanceTo(endPos));

    if (this.leftArmPivot) this.leftArmPivot.rotation.x = 0.8;
    if (this.rightArmPivot) this.rightArmPivot.rotation.x = 0.8;

    this.showWarningHUD(
      '💀 [즉사 공격 경고] 맹렬한 대지 돌진 (피격 시 즉사!)',
      '붉은 직사각형 구역을 즉시 측면으로 벗어나십시오!'
    );
    if (window.audioEngine) {
      window.audioEngine.playTelegraphWarning();
      setTimeout(() => window.audioEngine.playBossChargeRoar(), 300);
    }

    this.createTelegraphMarker({
      type: 'rect',
      pos: bossPos,
      rotY: yaw,
      width: chargeWidth,
      length: actualChargeLength,
      duration: telegraphTime,
      onDetonate: () => {
        this.combatState = 'executing';
        const startPos = bossPos.clone();
        let progress = 0;
        const rushDuration = 0.65;

        if (window.audioEngine) window.audioEngine.playBossRoar();

        const chargeInterval = setInterval(() => {
          if (this.isDead) {
            clearInterval(chargeInterval);
            return;
          }
          progress += 0.05 / rushDuration;
          if (progress >= 1.0) {
            progress = 1.0;
            clearInterval(chargeInterval);
            this.group.position.copy(endPos);
            this.currentPos.copy(endPos);
            this.finishPattern(1.2);
            return;
          }

          this.group.position.lerpVectors(startPos, endPos, progress);
          // Strictly clamp within arena
          this.group.position.x = THREE.MathUtils.clamp(this.group.position.x, this.arenaMinX, this.arenaMaxX);
          this.group.position.z = THREE.MathUtils.clamp(this.group.position.z, this.arenaMinZ, this.arenaMaxZ);
          this.currentPos.copy(this.group.position);

          if (window.particleSystem) {
            window.particleSystem.spawnJumpPadBurst(this.group.position);
          }

          // Damage Check against Player during charge: INSTANT KILL!
          if (window.playerController) {
            const pCam = window.playerController.camera.position;
            const distToBoss = this.group.position.distanceTo(pCam);
            if (distToBoss < 3.8) {
              window.playerController.takeDamage(999); // INSTANT KILL!
              window.playerController.velocity.addScaledVector(chargeDir, 35.0);
              if (window.audioEngine) window.audioEngine.playExplosion();
            }
          }
        }, 50);
      }
    });
  }

  // Pattern 2: 대지 분쇄 강타 (즉사기!)
  startPattern2_GroundSlam(playerPos) {
    this.combatState = 'telegraphing';
    this.currentPattern = 'slam';
    const telegraphTime = 1.4;

    const slamRadius = 9.0;
    const targetPos = this.group.position.clone();

    if (this.leftArmPivot) this.leftArmPivot.rotation.x = -2.2;
    if (this.rightArmPivot) this.rightArmPivot.rotation.x = -2.2;
    this.velY = 19.0; // Same height as slime block!

    // Trigger player earthquake launch: launched up at slime block height (19.0), screen shakes like earthquake, 40 fall damage on landing!
    if (window.playerController && typeof window.playerController.triggerBossEarthquakeLaunch === 'function') {
      window.playerController.triggerBossEarthquakeLaunch(19.0, 40);
    }

    this.showWarningHUD(
      '💀 [즉사 공격 경고] 대지 분쇄 강타 (피격 시 즉사!)',
      '보스 착지 지점의 붉은 원형 구역에서 즉시 이탈하십시오!'
    );
    if (window.audioEngine) {
      window.audioEngine.playTelegraphWarning();
    }

    this.createTelegraphMarker({
      type: 'circle',
      pos: targetPos,
      radius: slamRadius,
      duration: telegraphTime,
      onDetonate: () => {
        this.combatState = 'executing';
        this.group.position.y = this.basePos.y;
        this.velY = 0;

        if (this.leftArmPivot) this.leftArmPivot.rotation.x = 1.2;
        if (this.rightArmPivot) this.rightArmPivot.rotation.x = 1.2;

        if (window.audioEngine) {
          window.audioEngine.playBossSlam();
        }

        if (window.particleSystem) {
          window.particleSystem.spawnJumpPadBurst(targetPos);
          for (let i = 0; i < 4; i++) {
            const poofOffset = new THREE.Vector3((Math.random() - 0.5) * 6, 0.2, (Math.random() - 0.5) * 6);
            window.particleSystem.spawnVillagerDeathPoof(targetPos.clone().add(poofOffset));
          }
        }

        // Damage Check: INSTANT KILL!
        if (window.playerController) {
          const pCam = window.playerController.camera.position;
          const flatDist = Math.sqrt((pCam.x - targetPos.x) ** 2 + (pCam.z - targetPos.z) ** 2);
          if (flatDist <= slamRadius && pCam.y < 3.5) {
            window.playerController.takeDamage(999); // INSTANT KILL!
          }
        }

        this.finishPattern(1.4);
      }
    });
  }

  // Pattern 3: 연속 유성 폭격 (즉사기!)
  startPattern3_Meteors(playerPos) {
    this.combatState = 'telegraphing';
    this.currentPattern = 'meteors';

    this.showWarningHUD(
      '💀 [즉사 공격 경고] 연속 유성 폭격 (피격 시 즉사!)',
      '발밑에 생성되는 4개의 연속 붉은 원형 표적에서 질주하여 탈출하세요!'
    );
    if (window.audioEngine) {
      window.audioEngine.playTelegraphWarning();
      window.audioEngine.playBossRoar();
    }

    if (this.leftArmPivot) this.leftArmPivot.rotation.x = -2.4;
    if (this.rightArmPivot) this.rightArmPivot.rotation.x = -2.4;

    const count = 4;
    const interval = 450;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (this.isDead || !window.playerController) return;

        const targetP = window.playerController.camera.position.clone();
        const vel = window.playerController.velocity || new THREE.Vector3();
        targetP.addScaledVector(vel, 0.4);
        targetP.y = 0;

        this.createTelegraphMarker({
          type: 'circle',
          pos: targetP,
          radius: 3.6,
          duration: 1.1,
          onDetonate: () => {
            this.spawnFallingMeteor(targetP, 3.6);
          }
        });

        if (window.audioEngine) {
          window.audioEngine.playMeteorFall();
        }
      }, i * interval);
    }

    setTimeout(() => {
      this.finishPattern(1.0);
    }, count * interval + 1200);
  }

  spawnFallingMeteor(targetPos, radius) {
    const geo = new THREE.DodecahedronGeometry(1.2);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(targetPos.x, 26, targetPos.z);
    this.scene.add(mesh);

    let meteorY = 26;
    const fallInterval = setInterval(() => {
      if (this.isDead) {
        clearInterval(fallInterval);
        this.scene.remove(mesh);
        return;
      }

      meteorY -= 48.0 * 0.03;
      mesh.position.y = meteorY;
      mesh.rotation.x += 0.2;
      mesh.rotation.y += 0.3;

      if (meteorY <= 0.6) {
        clearInterval(fallInterval);
        this.scene.remove(mesh);

        if (window.audioEngine) window.audioEngine.playExplosion();
        if (window.particleSystem) {
          window.particleSystem.spawnHelixExplosion(targetPos);
          window.particleSystem.spawnVillagerDeathPoof(targetPos);
        }

        // Damage check: INSTANT KILL!
        if (window.playerController) {
          const pCam = window.playerController.camera.position;
          const dist = Math.sqrt((pCam.x - targetPos.x) ** 2 + (pCam.z - targetPos.z) ** 2);
          if (dist <= radius) {
            window.playerController.takeDamage(999); // INSTANT KILL!
          }
        }
      }
    }, 30);
  }

  // Pattern 4: 전방 부채꼴 화염 브레스 (즉사기!)
  startPattern4_FlameBreath(playerPos) {
    this.combatState = 'telegraphing';
    this.currentPattern = 'breath';
    const telegraphTime = 1.3;

    const bossPos = this.group.position.clone();
    const toPlayer = new THREE.Vector3().subVectors(playerPos, bossPos);
    toPlayer.y = 0;
    const yaw = Math.atan2(-toPlayer.x, -toPlayer.z);
    this.group.rotation.y = yaw;

    const coneRadius = 18.0;
    const coneAngle = Math.PI / 2;

    if (this.casingMesh) this.casingMesh.rotation.x = 0.25;
    if (this.photoFront) this.photoFront.rotation.x = 0.25;
    if (this.leftArmPivot) this.leftArmPivot.rotation.x = 0.5;
    if (this.rightArmPivot) this.rightArmPivot.rotation.x = 0.5;

    this.showWarningHUD(
      '💀 [즉사 공격 경고] 전방 화염 브레스 (피격 시 즉사!)',
      '보스 전방 90도 부채꼴 화염 구역을 벗어나 후방이나 측면으로 회피하세요!'
    );
    if (window.audioEngine) {
      window.audioEngine.playTelegraphWarning();
    }

    this.createTelegraphMarker({
      type: 'cone',
      pos: bossPos,
      rotY: yaw,
      radius: coneRadius,
      angle: coneAngle,
      duration: telegraphTime,
      onDetonate: () => {
        this.combatState = 'executing';
        if (window.audioEngine) window.audioEngine.playBossBreath();

        let streamCount = 0;
        const breathInterval = setInterval(() => {
          if (this.isDead || streamCount >= 8) {
            clearInterval(breathInterval);
            this.finishPattern(1.2);
            return;
          }
          streamCount++;

          if (window.particleSystem) {
            const spreadAngle = (Math.random() - 0.5) * (coneAngle * 0.8);
            const fireDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw + spreadAngle);
            const origin = bossPos.clone().add(new THREE.Vector3(0, 3.2, 0)).addScaledVector(fireDir, 2.5);
            window.particleSystem.spawnHelixExplosion(origin.addScaledVector(fireDir, streamCount * 1.8));
          }

          // Damage check: INSTANT KILL!
          if (window.playerController) {
            const pCam = window.playerController.camera.position;
            const dist = Math.sqrt((pCam.x - bossPos.x) ** 2 + (pCam.z - bossPos.z) ** 2);
            if (dist <= coneRadius) {
              const vecToPlayer = new THREE.Vector3(pCam.x - bossPos.x, 0, pCam.z - bossPos.z).normalize();
              const facingDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
              const dot = facingDir.dot(vecToPlayer);
              if (dot >= Math.cos(coneAngle / 2)) {
                window.playerController.takeDamage(999); // INSTANT KILL!
              }
            }
          }
        }, 120);
      }
    });
  }

  // Pattern 5: [궁극기] 파멸의 전방위 대폭발 - 안전구역 도넛 (외곽 즉사기!)
  startPattern5_CataclysmNova(playerPos) {
    this.combatState = 'telegraphing';
    this.currentPattern = 'nova';
    const telegraphTime = 2.2;

    const safeRadius = 5.5;
    const outerRadius = 34.0;
    const bossPos = this.group.position.clone();

    if (this.leftArmPivot) this.leftArmPivot.rotation.x = -1.8;
    if (this.rightArmPivot) this.rightArmPivot.rotation.x = -1.8;
    if (this.chestEye) this.chestEye.scale.set(2.2, 2.2, 2.2);

    this.showWarningHUD(
      '🚨 [즉사 궁극기] 파멸의 슈퍼노바 (외곽 전역 즉사!)',
      '보스 바로 앞 [초록색 원형 안전구역] 안으로 즉시 집결하십시오!'
    );
    if (window.audioEngine) {
      window.audioEngine.playTelegraphWarning();
      window.audioEngine.playSupernovaCharge();
    }

    this.createTelegraphMarker({
      type: 'donut',
      pos: bossPos,
      innerRadius: safeRadius,
      outerRadius: outerRadius,
      duration: telegraphTime,
      onDetonate: () => {
        this.combatState = 'executing';
        if (window.audioEngine) {
          window.audioEngine.playExplosion();
          window.audioEngine.playBossSlam();
        }

        if (window.particleSystem) {
          for (let r = 8; r <= 28; r += 6) {
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
              const ringP = bossPos.clone().add(new THREE.Vector3(Math.cos(a) * r, 0.4, Math.sin(a) * r));
              window.particleSystem.spawnHelixExplosion(ringP);
            }
          }
        }

        // Damage check: Outside safe pocket takes 999 Instant Kill! Inside takes 0!
        if (window.playerController) {
          const pCam = window.playerController.camera.position;
          const dist = Math.sqrt((pCam.x - bossPos.x) ** 2 + (pCam.z - bossPos.z) ** 2);
          if (dist > safeRadius && dist <= outerRadius) {
            window.playerController.takeDamage(999); // INSTANT KILL!
          } else {
            if (window.gameInstance && window.gameInstance.ui) {
              window.gameInstance.ui.showElimination('🛡️ 안전 구역 완벽 회피 성공! [PERFECT DODGE]');
            }
          }
        }

        this.finishPattern(1.8);
      }
    });
  }

  finishPattern(recoveryTime = 1.0) {
    this.combatState = 'recovering';
    this.stateTimer = recoveryTime;
    this.hideWarningHUD();

    if (this.leftArmPivot) this.leftArmPivot.rotation.set(0, 0, 0);
    if (this.rightArmPivot) this.rightArmPivot.rotation.set(0, 0, 0);
    if (this.casingMesh) this.casingMesh.rotation.set(0, 0, 0);
    if (this.photoFront) this.photoFront.rotation.set(0, 0, 0);
    if (this.chestEye) this.chestEye.scale.set(1, 1, 1);
  }

  // ==========================================================================
  // UPDATE LOOP & ANIMATION
  // ==========================================================================
  update(delta, playerPos, jumpPads) {
    if (this.isDead) return;

    const now = performance.now() / 1000;

    // Flinch Decay
    if (this.flinchTimer > 0) {
      this.flinchTimer -= delta;
      if (this.flinchTimer <= 0) {
        if (this.matPhotoFront) this.matPhotoFront.color.setHex(0xffffff);
        if (this.matPhotoBack) this.matPhotoBack.color.setHex(0xffffff);
        if (this.matCasing) this.matCasing.color.setHex(0x140e1c);
      }
    }

    if (this.chestEye) {
      this.chestEye.rotation.x += delta * 3;
      this.chestEye.rotation.y += delta * 4;
    }

    // Update active red telegraph markers
    for (let i = this.activeTelegraphs.length - 1; i >= 0; i--) {
      const t = this.activeTelegraphs[i];
      t.elapsed += delta;
      t.pulseTime += delta * 12;

      if (t.mesh && t.mesh.material) {
        t.mesh.material.opacity = 0.5 + Math.sin(t.pulseTime) * 0.28;
      }

      if (t.elapsed >= t.duration) {
        this.scene.remove(t.group);
        this.activeTelegraphs.splice(i, 1);
        if (typeof t.config.onDetonate === 'function') {
          t.config.onDetonate();
        }
      }
    }

    // Jump pad interaction
    if (jumpPads && this.combatState !== 'telegraphing') {
      const bx = this.group.position.x;
      const bz = this.group.position.z;
      const by = this.group.position.y;
      for (const pad of jumpPads) {
        if (pad.cooldown > 0) continue;
        const dist = Math.sqrt((bx - pad.position.x) ** 2 + (bz - pad.position.z) ** 2);
        if (dist <= pad.radius + 1.4 && Math.abs(by - pad.position.y) < 1.6) {
          pad.cooldown = 0.8;
          pad.bounceAnim = 1.0;
          this.velY = 19.0;
          if (window.audioEngine) {
            window.audioEngine.playJumpPadLaunch();
            window.audioEngine.playBossRoar();
          }
          if (window.particleSystem) {
            window.particleSystem.spawnJumpPadBurst(pad.position);
          }
          // Boss jump triggers player earthquake launch and 40 fall damage
          if (window.playerController && typeof window.playerController.triggerBossEarthquakeLaunch === 'function') {
            window.playerController.triggerBossEarthquakeLaunch(19.0, 40);
          }
          break;
        }
      }
    }

    // Gravity
    let currentY = this.basePos.y;
    if (this.velY !== 0 || this.group.position.y > this.basePos.y) {
      this.velY -= 30.0 * delta;
      currentY = Math.max(this.basePos.y, this.group.position.y + this.velY * delta);
      if (currentY <= this.basePos.y) {
        currentY = this.basePos.y;
        this.velY = 0;
      }
    }

    // Walking / Stomp Animations
    this.walkAnimTime += delta * 3.5;
    const isGrounded = (this.velY === 0);
    const hop = (isGrounded && (this.combatState === 'idle' || this.combatState === 'patrol'))
      ? Math.abs(Math.sin(this.walkAnimTime * 1.8)) * 0.32
      : 0;
    const tilt = (isGrounded && (this.combatState === 'idle' || this.combatState === 'patrol'))
      ? Math.sin(this.walkAnimTime * 1.8) * 0.05
      : 0;

    if (this.casingMesh && this.combatState === 'idle') this.casingMesh.rotation.z = tilt;
    if (this.photoFront && this.combatState === 'idle') this.photoFront.rotation.z = tilt;
    if (this.photoBack && this.combatState === 'idle') this.photoBack.rotation.z = -tilt;

    if (this.leftArmPivot && this.combatState === 'idle') {
      this.leftArmPivot.rotation.x = Math.sin(this.walkAnimTime) * 0.35;
    }
    if (this.rightArmPivot && this.combatState === 'idle') {
      this.rightArmPivot.rotation.x = -Math.sin(this.walkAnimTime) * 0.35;
    }

    // State Machine & Combat Pattern Triggering
    if (this.combatState === 'recovering') {
      this.stateTimer -= delta;
      if (this.stateTimer <= 0) {
        this.combatState = 'idle';
        this.lastPatternTime = now;
      }
    } else if (this.combatState === 'idle') {
      const moveDelta = this.speed * this.patrolDirection * delta;
      this.currentPos.x += moveDelta;
      if (this.currentPos.x >= this.arenaMaxX) {
        this.currentPos.x = this.arenaMaxX;
        this.patrolDirection = -1;
      } else if (this.currentPos.x <= this.arenaMinX) {
        this.currentPos.x = this.arenaMinX;
        this.patrolDirection = 1;
      }
      this.currentPos.z = THREE.MathUtils.clamp(this.currentPos.z, this.arenaMinZ, this.arenaMaxZ);
      this.group.position.set(this.currentPos.x, currentY + hop, this.currentPos.z);

      if (playerPos) {
        const lookTarget = new THREE.Vector3(playerPos.x, this.group.position.y, playerPos.z);
        this.group.lookAt(lookTarget);
      }

      if (playerPos && (now - this.lastPatternTime > this.patternCooldown)) {
        this.patternIndex = (this.patternIndex % 5) + 1;
        this.triggerPatternByIndex(this.patternIndex, playerPos);
      }
    }

    // Absolute Arena Boundary Constraint: Boss can NEVER leave the central battleground
    this.group.position.x = THREE.MathUtils.clamp(this.group.position.x, this.arenaMinX, this.arenaMaxX);
    this.group.position.z = THREE.MathUtils.clamp(this.group.position.z, this.arenaMinZ, this.arenaMaxZ);
    this.currentPos.x = this.group.position.x;
    this.currentPos.z = this.group.position.z;
  }

  triggerPatternByIndex(index, playerPos) {
    switch (index) {
      case 1:
        this.startPattern1_Charge(playerPos);
        break;
      case 2:
        this.startPattern2_GroundSlam(playerPos);
        break;
      case 3:
        this.startPattern3_Meteors(playerPos);
        break;
      case 4:
        this.startPattern4_FlameBreath(playerPos);
        break;
      case 5:
        this.startPattern5_CataclysmNova(playerPos);
        break;
      default:
        this.startPattern1_Charge(playerPos);
        break;
    }
  }
}

// ============================================================================
// CHAPTER 2 BOSS: 노윤상 (RAMMUS TANK BOSS: sang1 -> sang2)
// ============================================================================
class YoonSangBoss {
  constructor(scene, spawnPos) {
    this.scene = scene;
    this.id = 'yoonsang_boss';
    this.name = '노윤상 (람머스 모드)';
    this.basePos = spawnPos ? spawnPos.clone() : new THREE.Vector3(0, 0.6, 21);
    this.currentPos = this.basePos.clone();
    this.maxHealth = 4000;
    this.health = 4000;
    this.phase = 1; // Phase 1: sang1, Phase 2: sang2
    this.isDead = false;
    this.hitboxes = [];
    this.flinchTimer = 0;
    this.walkAnimTime = 0;
    this.velY = 0;

    // Movement & Arena Clamping Bounds
    this.speed = 3.8;
    this.patrolDirection = 1;
    this.arenaMinX = -9.5;
    this.arenaMaxX = 9.5;
    this.arenaMinZ = 9.0;
    this.arenaMaxZ = 31.0;

    // Combat State Machine: 'idle', 'patrol', 'telegraphing', 'rolling', 'recovering'
    this.combatState = 'idle';
    this.stateTimer = 1.0;
    this.skillCooldown = 2.6;
    this.lastSkillTime = performance.now() / 1000;
    this.skillIndex = 0;

    // Skill 1: Spiked Shell Reflection (반사 스킬)
    this.isReflecting = false;
    this.reflectTimer = 0;

    // Skill 2: Powerball Roll Charge (구르기 돌격)
    this.isRolling = false;
    this.rollSpeed = 20.0;
    this.rollDir = new THREE.Vector3();
    this.rollDuration = 0;

    // Skill 3: Hair Needle Projectiles (머리카락 가시 뿌리기)
    this.activeNeedles = [];

    // Active telegraph markers
    this.activeTelegraphs = [];

    this.group = new THREE.Group();
    this.group.position.copy(this.basePos);
    this.scene.add(this.group);

    // Preload sang1 and sang2 textures with Base64 data URL support
    const loader = new THREE.TextureLoader();
    const sang1Src = (typeof window !== 'undefined' && window.SANG1_DATA_URL) ? window.SANG1_DATA_URL : 'sang1.jpg';
    const sang2Src = (typeof window !== 'undefined' && window.SANG2_DATA_URL) ? window.SANG2_DATA_URL : 'sang2.jpg';

    this.texSang1 = loader.load(sang1Src, (tex) => {
      tex.needsUpdate = true;
      if (this.matPhotoFront) { this.matPhotoFront.map = tex; this.matPhotoFront.needsUpdate = true; }
      if (this.matPhotoBack) { this.matPhotoBack.map = tex; this.matPhotoBack.needsUpdate = true; }
      if (this.matPhotoLeft) { this.matPhotoLeft.map = tex; this.matPhotoLeft.needsUpdate = true; }
      if (this.matPhotoRight) { this.matPhotoRight.map = tex; this.matPhotoRight.needsUpdate = true; }
    });
    this.texSang1.generateMipmaps = true;
    this.texSang1.minFilter = THREE.LinearFilter;
    this.texSang1.magFilter = THREE.LinearFilter;

    this.texSang2 = loader.load(sang2Src, (tex) => {
      tex.needsUpdate = true;
      if (this.phase === 2) {
        if (this.matPhotoFront) { this.matPhotoFront.map = tex; this.matPhotoFront.needsUpdate = true; }
        if (this.matPhotoBack) { this.matPhotoBack.map = tex; this.matPhotoBack.needsUpdate = true; }
        if (this.matPhotoLeft) { this.matPhotoLeft.map = tex; this.matPhotoLeft.needsUpdate = true; }
        if (this.matPhotoRight) { this.matPhotoRight.map = tex; this.matPhotoRight.needsUpdate = true; }
      }
    });
    this.texSang2.generateMipmaps = true;
    this.texSang2.minFilter = THREE.LinearFilter;
    this.texSang2.magFilter = THREE.LinearFilter;

    this.createRammusModel();
    this.createHealthBar();
    this.showBossHUD();

    if (window.audioEngine) {
      window.audioEngine.playBossRoar();
    }
  }

  createRammusModel() {
    this.ballGroup = new THREE.Group();
    this.group.add(this.ballGroup);

    // 1. Spiked Armored Turtle / Armadillo Shell (람머스 원형 등껍질 돔)
    const shellGeo = new THREE.SphereGeometry(2.45, 32, 24);
    this.matShell = new THREE.MeshStandardMaterial({
      color: 0x4e342e,
      roughness: 0.35,
      metalness: 0.7,
      emissive: 0x271306
    });
    this.shellMesh = new THREE.Mesh(shellGeo, this.matShell);
    this.shellMesh.position.set(0, 2.5, 0);
    this.shellMesh.castShadow = true;
    this.ballGroup.add(this.shellMesh);

    this.shellMesh.userData = { bot: this, isHead: false };
    this.hitboxes.push(this.shellMesh);

    // 2. Large Spiked Horns radiating from carapace (등껍질 대형 가시 6개)
    const spikeGeo = new THREE.ConeGeometry(0.42, 2.2, 8);
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0xffb300,
      roughness: 0.25,
      metalness: 0.85
    });
    const spikeOffsets = [
      { x: 0, y: 4.1, z: -0.6, rx: -0.4, rz: 0 },
      { x: -1.5, y: 3.4, z: -0.3, rx: -0.2, rz: 0.7 },
      { x: 1.5, y: 3.4, z: -0.3, rx: -0.2, rz: -0.7 },
      { x: -1.3, y: 2.2, z: -1.5, rx: -0.8, rz: 0.6 },
      { x: 1.3, y: 2.2, z: -1.5, rx: -0.8, rz: -0.6 },
      { x: 0, y: 2.6, z: -2.0, rx: -1.0, rz: 0 }
    ];
    spikeOffsets.forEach(sp => {
      const spMesh = new THREE.Mesh(spikeGeo, spikeMat);
      spMesh.position.set(sp.x, sp.y, sp.z);
      spMesh.rotation.x = sp.rx;
      spMesh.rotation.z = sp.rz;
      spMesh.castShadow = true;
      this.ballGroup.add(spMesh);
      spMesh.userData = { bot: this, isHead: false };
      this.hitboxes.push(spMesh);
    });

    // 3. High-Definition 360-degree Photo Head on TOP OF THE BALL (공 상단 위쪽에 완전히 돌출 배치!)
    // 구체 최상단(y=4.95) 바로 위(y=5.85)에 머리 베이스 블록을 높게 설치하여 구체에 절대 가려지지 않음!
    const headBracketGeo = new THREE.BoxGeometry(2.8, 2.9, 2.5);
    const headBracketMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723,
      roughness: 0.4,
      metalness: 0.75
    });
    this.headBracket = new THREE.Mesh(headBracketGeo, headBracketMat);
    this.headBracket.position.set(0, 5.85, 0);
    this.ballGroup.add(this.headBracket);
    this.headBracket.userData = { bot: this, isHead: true };
    this.hitboxes.push(this.headBracket);

    // sang1 / sang2 정면, 후면, 좌우 얼굴 사진 플레이트 (어느 방향에서 보아도 100% 선명하게 얼굴 노출!)
    const faceGeo = new THREE.PlaneGeometry(2.7, 2.8);
    this.matPhotoFront = new THREE.MeshBasicMaterial({
      map: this.texSang1,
      side: THREE.DoubleSide,
      transparent: false,
      toneMapped: false
    });
    this.photoMeshFront = new THREE.Mesh(faceGeo, this.matPhotoFront);
    this.photoMeshFront.position.set(0, 5.85, 1.28); // 전면 (+Z)
    this.ballGroup.add(this.photoMeshFront);
    this.photoMeshFront.userData = { bot: this, isHead: true };
    this.hitboxes.push(this.photoMeshFront);

    this.matPhotoBack = new THREE.MeshBasicMaterial({
      map: this.texSang1,
      side: THREE.DoubleSide,
      transparent: false,
      toneMapped: false
    });
    this.photoMeshBack = new THREE.Mesh(faceGeo, this.matPhotoBack);
    this.photoMeshBack.position.set(0, 5.85, -1.28); // 후면 (-Z)
    this.photoMeshBack.rotation.y = Math.PI;
    this.ballGroup.add(this.photoMeshBack);
    this.photoMeshBack.userData = { bot: this, isHead: true };
    this.hitboxes.push(this.photoMeshBack);

    // 측면 플레이트 (좌/우 360도 가시성 완벽 보장)
    const sideGeo = new THREE.PlaneGeometry(2.4, 2.8);
    this.matPhotoLeft = new THREE.MeshBasicMaterial({
      map: this.texSang1,
      side: THREE.DoubleSide,
      transparent: false,
      toneMapped: false
    });
    this.photoMeshLeft = new THREE.Mesh(sideGeo, this.matPhotoLeft);
    this.photoMeshLeft.position.set(-1.42, 5.85, 0);
    this.photoMeshLeft.rotation.y = -Math.PI / 2;
    this.ballGroup.add(this.photoMeshLeft);
    this.photoMeshLeft.userData = { bot: this, isHead: true };
    this.hitboxes.push(this.photoMeshLeft);

    this.matPhotoRight = new THREE.MeshBasicMaterial({
      map: this.texSang1,
      side: THREE.DoubleSide,
      transparent: false,
      toneMapped: false
    });
    this.photoMeshRight = new THREE.Mesh(sideGeo, this.matPhotoRight);
    this.photoMeshRight.position.set(1.42, 5.85, 0);
    this.photoMeshRight.rotation.y = Math.PI / 2;
    this.ballGroup.add(this.photoMeshRight);
    this.photoMeshRight.userData = { bot: this, isHead: true };
    this.hitboxes.push(this.photoMeshRight);

    // 4. Head Horn Crest / Hair Spikes (머리카락 가시 돌기 - 머리 정수리에 배치)
    this.hairCrestGroup = new THREE.Group();
    this.hairCrestGroup.position.set(0, 7.35, 0);
    for (let h = -3; h <= 3; h++) {
      const hairSpikeGeo = new THREE.ConeGeometry(0.14, 1.45 + Math.abs(h) * 0.15, 6);
      const hairSpikeMat = new THREE.MeshStandardMaterial({
        color: 0x1a0f1f,
        roughness: 0.5,
        metalness: 0.8
      });
      const hairMesh = new THREE.Mesh(hairSpikeGeo, hairSpikeMat);
      hairMesh.position.set(h * 0.32, 0, -Math.abs(h) * 0.15);
      hairMesh.rotation.x = 0.45;
      hairMesh.rotation.z = -h * 0.18;
      this.hairCrestGroup.add(hairMesh);
      hairMesh.userData = { bot: this, isHead: true };
      this.hitboxes.push(hairMesh);
    }
    this.ballGroup.add(this.hairCrestGroup);

    // 5. Armored Heavy Claws (좌우 중장갑 발톱)
    const armGeo = new THREE.BoxGeometry(0.85, 1.6, 0.85);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.5 });
    
    this.leftArm = new THREE.Mesh(armGeo, armMat);
    this.leftArm.position.set(-2.0, 1.3, 0.6);
    this.ballGroup.add(this.leftArm);
    this.leftArm.userData = { bot: this, isHead: false };
    this.hitboxes.push(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, armMat);
    this.rightArm.position.set(2.0, 1.3, 0.6);
    this.ballGroup.add(this.rightArm);
    this.rightArm.userData = { bot: this, isHead: false };
    this.hitboxes.push(this.rightArm);

    // 6. Spiked Reflection Barrier Sphere (가시 반사 방어막)
    const reflectGeo = new THREE.IcosahedronGeometry(3.3, 2);
    this.matReflectShield = new THREE.MeshBasicMaterial({
      color: 0xff5722,
      wireframe: true,
      transparent: true,
      opacity: 0.0
    });
    this.reflectShieldMesh = new THREE.Mesh(reflectGeo, this.matReflectShield);
    this.reflectShieldMesh.position.set(0, 2.5, 0);
    this.reflectShieldMesh.visible = false;
    this.group.add(this.reflectShieldMesh);
  }

  // 3D In-World Floating Health Bar Billboard (보스 머리 바로 위에 체력바 표시)
  createHealthBar() {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 68;
    this.hpCanvas = canvas;
    this.hpCtx = canvas.getContext('2d');

    this.hpTexture = new THREE.CanvasTexture(canvas);
    this.hpTexture.magFilter = THREE.LinearFilter;
    this.hpTexture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: this.hpTexture,
      transparent: true,
      depthTest: false
    });
    this.hpSprite = new THREE.Sprite(spriteMat);
    this.hpSprite.scale.set(4.6, 0.98, 1);
    this.hpSprite.position.set(0, 8.8, 0); // 보스 몸체 및 머리 바로 위 공중에 상시 배치
    this.group.add(this.hpSprite);

    this.updateHealthBarTexture();
  }

  updateHealthBarTexture() {
    if (!this.hpCtx) return;
    const ctx = this.hpCtx;
    ctx.clearRect(0, 0, 320, 68);

    if (this.isDead) {
      this.hpTexture.needsUpdate = true;
      return;
    }

    // Outer dark container
    ctx.fillStyle = 'rgba(10, 15, 28, 0.92)';
    ctx.fillRect(0, 0, 320, 68);

    // Border (Gold for Phase 1 sang1, Cyan for Phase 2 노윤상)
    ctx.strokeStyle = this.phase === 2 ? '#00e5ff' : '#ff9100';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(2, 2, 316, 64);

    // Name & HP Text
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = this.phase === 2 ? '#00e5ff' : '#ffd700';
    ctx.textAlign = 'center';
    const curHp = Math.max(0, Math.round(this.health));
    const title = this.phase === 2 ? '👑 노윤상 (거대 각성)' : '❄️ sang1 (람머스)';
    ctx.fillText(`${title} [${curHp} / ${this.maxHealth}]`, 160, 22);

    // Health Bar Fill
    const pct = Math.max(0, Math.min(1.0, this.health / this.maxHealth));
    ctx.fillStyle = this.phase === 2 ? '#00e676' : '#ff1744';
    ctx.fillRect(10, 32, Math.floor(300 * pct), 22);

    // 50% Phase Marker
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(158, 30, 4, 26);

    this.hpTexture.needsUpdate = true;
  }

  showBossHUD() {
    const hudBar = document.getElementById('boss-hud-bar');
    if (hudBar) hudBar.classList.remove('hidden');

    const badgeEl = document.getElementById('boss-hud-badge');
    if (badgeEl) badgeEl.textContent = '❄️ BOSS ❄️';

    const titleEl = document.getElementById('boss-title-text');
    if (titleEl) titleEl.textContent = `❄️ ${this.name}`;

    this.updateHUD();
  }

  hideBossHUD() {
    const hudBar = document.getElementById('boss-hud-bar');
    if (hudBar) hudBar.classList.add('hidden');
    this.hideWarningHUD();
  }

  showWarningHUD(title, desc) {
    const warnHud = document.getElementById('boss-warning-hud');
    const titleEl = document.getElementById('boss-warning-title');
    const descEl = document.getElementById('boss-warning-desc');

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (warnHud) warnHud.classList.remove('hidden');
  }

  hideWarningHUD() {
    const warnHud = document.getElementById('boss-warning-hud');
    if (warnHud) warnHud.classList.add('hidden');
  }

  updateHUD() {
    const elCounter = document.getElementById('boss-hp-counter');
    const elFill = document.getElementById('boss-bar-fill');
    const elGhost = document.getElementById('boss-bar-ghost');
    const elTitle = document.getElementById('boss-title-text');

    const curHp = Math.max(0, Math.round(this.health));
    if (elCounter) elCounter.textContent = `${curHp} / ${this.maxHealth}`;

    if (elTitle) {
      if (this.phase === 2) {
        elTitle.textContent = `⚡ ${this.name} [가시 난사 & 방어력 증가]`;
      } else {
        elTitle.textContent = `❄️ ${this.name} [반사 & 구르기 돌격]`;
      }
    }

    const pct = Math.max(0, Math.min(100, (curHp / this.maxHealth) * 100));
    if (elFill) {
      elFill.style.width = `${pct}%`;
      if (this.phase === 2) {
        elFill.style.background = 'linear-gradient(90deg, #00e5ff 0%, #00e676 100%)';
      } else {
        elFill.style.background = 'linear-gradient(90deg, #ff9100 0%, #ff1744 100%)';
      }
    }
    if (elGhost) {
      setTimeout(() => {
        if (elGhost) elGhost.style.width = `${pct}%`;
      }, 150);
    }

    this.updateHealthBarTexture();
  }

  // Damage Application & Reflection Logic
  takeDamage(amount, isHeadshot = false) {
    if (this.isDead) return { killed: false, actualDamage: 0, isHeadshot: false };

    // 1. Spiked Shell Reflection (반사 스킬):
    // "보스 스킬중 반사 스킬이 있어서 내가 데미지를 넣으면 내가 데미지를 받게 해줘"
    if (this.isReflecting) {
      const reflectDamage = Math.round(amount * 0.9);
      if (window.playerController && !window.playerController.isDead) {
        window.playerController.takeDamage(reflectDamage);
        if (window.audioEngine) window.audioEngine.playHitmarker();
        if (window.particleSystem) {
          window.particleSystem.spawnHitSparks(window.playerController.camera.position, true);
        }
      }
      if (window.gameInstance && window.gameInstance.ui) {
        window.gameInstance.ui.showElimination(`⚡ [가시 껍질 반사!] 공격이 튕겨져 ${reflectDamage} 피해를 입었습니다!`);
      }
      if (window.audioEngine && typeof window.audioEngine.playDeflectHit === 'function') {
        window.audioEngine.playDeflectHit();
      }
      return { killed: false, actualDamage: 0, isHeadshot: false };
    }

    // Normal Damage
    let actualDamage = isHeadshot ? amount * 2.0 : amount;
    // In Phase 2: more armored ("더 단단하고") -> 35% damage reduction!
    if (this.phase === 2) {
      actualDamage = Math.round(actualDamage * 0.65);
    }

    if (window.gameInstance && typeof window.gameInstance.recordDamage === 'function') {
      window.gameInstance.recordDamage(actualDamage);
    }
    this.health -= actualDamage;

    this.flinchTimer = 0.18;
    if (this.matShell) this.matShell.color.setHex(0xff4444);

    if (isHeadshot) {
      if (window.audioEngine) window.audioEngine.playHeadshotDink();
    } else {
      if (window.audioEngine) window.audioEngine.playHitmarker();
    }

    this.updateHUD();

    // Check Phase 2 Awakening Transition (HP <= 50% / <= 2000)
    // "보스의 HP가 절반 이하가 되면 sang2로 바뀌면서 더 단단하고 커진 노윤상이란 이름의 보스로 자연스럽게 바꿔줘"
    if (this.health <= this.maxHealth * 0.5 && this.phase === 1) {
      this.triggerPhase2Awakening();
    }

    if (this.health <= 0) {
      this.die();
      return { killed: true, actualDamage, isHeadshot };
    }

    return { killed: false, actualDamage, isHeadshot };
  }

  // Phase 2 Awakening: sang1 -> sang2 (더 단단하고 커진 노윤상)
  triggerPhase2Awakening() {
    this.phase = 2;
    this.name = '노윤상 (거대 각성)';
    this.updateHUD();

    if (window.audioEngine) {
      window.audioEngine.playBossRoar();
      window.audioEngine.playExplosion();
    }

    if (window.particleSystem) {
      for (let i = 0; i < 8; i++) {
        const offset = new THREE.Vector3((Math.random() - 0.5) * 6, 1 + i * 0.8, (Math.random() - 0.5) * 6);
        window.particleSystem.spawnJumpPadBurst(this.group.position.clone().add(offset));
        window.particleSystem.spawnVillagerDeathPoof(this.group.position.clone().add(offset));
      }
    }

    // Switch photo texture to sang2.jpg!
    if (this.texSang2) {
      if (this.matPhotoFront) { this.matPhotoFront.map = this.texSang2; this.matPhotoFront.needsUpdate = true; }
      if (this.matPhotoBack) { this.matPhotoBack.map = this.texSang2; this.matPhotoBack.needsUpdate = true; }
      if (this.matPhotoLeft) { this.matPhotoLeft.map = this.texSang2; this.matPhotoLeft.needsUpdate = true; }
      if (this.matPhotoRight) { this.matPhotoRight.map = this.texSang2; this.matPhotoRight.needsUpdate = true; }
    }

    // Grow in size smoothly from 1.0 to 1.55x ("더 커진 노윤상")!
    let targetScale = 1.55;
    let curScale = 1.0;
    const growInterval = setInterval(() => {
      if (this.isDead) { clearInterval(growInterval); return; }
      curScale += 0.04;
      if (curScale >= targetScale) {
        curScale = targetScale;
        clearInterval(growInterval);
      }
      this.group.scale.set(curScale, curScale, curScale);
    }, 30);

    const hudName = document.getElementById('boss-hud-name');
    if (hudName) {
      hudName.textContent = '👑 노윤상 (거대 각성)';
      hudName.style.color = '#00e5ff';
      hudName.style.textShadow = '0 0 15px rgba(0, 229, 255, 0.9)';
    }

    if (window.gameInstance && window.gameInstance.ui) {
      window.gameInstance.ui.showCenterAnnouncement(
        '❄️ [보스 각성] 노윤상 거대화! ❄️',
        '체력이 50% 이하로 떨어져 더 단단해지고 거대해졌습니다! 머리카락 가시 뿌리기를 주의하십시오!',
        4500
      );
    }
  }

  // Skill 1: 가시 껍질 웅크리기 (Spiked Shell Reflect)
  startSkill1_Reflect() {
    this.combatState = 'reflecting';
    this.isReflecting = true;
    this.reflectTimer = 3.6;

    this.showWarningHUD(
      '🛡️ [가시 껍질 반사] 노윤상이 웅크려 공격을 100% 반사합니다!',
      '방어막이 유지되는 동안 사격을 즉시 중단하십시오! (자해 피해)'
    );

    if (this.reflectShieldMesh) {
      this.reflectShieldMesh.visible = true;
      this.matReflectShield.opacity = 0.85;
    }

    if (window.audioEngine) {
      window.audioEngine.playTelegraphWarning();
    }
  }

  // Skill 2: 대회전 람머스 초광범위 구르기 돌격 (Powerball Rolling Charge - 피격 시 즉사!)
  startSkill2_RollingCharge(playerPos) {
    this.combatState = 'telegraphing';
    const telegraphTime = 1.1;

    const bossPos = this.group.position.clone();
    const toPlayer = new THREE.Vector3().subVectors(playerPos, bossPos);
    toPlayer.y = 0;
    const chargeDir = toPlayer.clone().normalize();
    const yaw = Math.atan2(-chargeDir.x, -chargeDir.z);
    this.group.rotation.y = yaw;

    const chargeDist = Math.min(26.0, bossPos.distanceTo(playerPos) + 6.0);
    const endPos = bossPos.clone().addScaledVector(chargeDir, chargeDist);
    endPos.x = THREE.MathUtils.clamp(endPos.x, this.arenaMinX, this.arenaMaxX);
    endPos.z = THREE.MathUtils.clamp(endPos.z, this.arenaMinZ, this.arenaMaxZ);

    this.showWarningHUD(
      '⚠️ [초광역 구르기 돌격 경고] 람머스 대회전 구르기 (피격 시 즉사!)',
      '넓은 붉은색 돌격 궤도를 즉시 피하십시오! (스치면 즉사)'
    );

    if (window.audioEngine) {
      window.audioEngine.playBossChargeRoar();
    }

    // 초광범위 붉은색 직사각형 예고 장판 (폭 14m!)
    this.createTelegraphMarker({
      type: 'rect',
      pos: bossPos,
      rotY: yaw,
      width: 14.0, // 광역 폭 14미터!
      length: bossPos.distanceTo(endPos),
      duration: telegraphTime,
      onDetonate: () => {
        this.combatState = 'rolling';
        this.isRolling = true;
        this.rollDir.copy(chargeDir);
        this.rollDuration = 1.4;

        const startP = bossPos.clone();
        let progress = 0;
        const rollInt = setInterval(() => {
          if (this.isDead || !this.isRolling) {
            clearInterval(rollInt);
            return;
          }
          progress += 0.05 / 1.1;
          if (progress >= 1.0) {
            progress = 1.0;
            clearInterval(rollInt);
            this.isRolling = false;
            if (this.ballGroup) this.ballGroup.rotation.x = 0;
            this.combatState = 'recovering';
            this.stateTimer = 1.2;
            this.hideWarningHUD();
            return;
          }

          this.group.position.lerpVectors(startP, endPos, progress);
          this.currentPos.copy(this.group.position);

          // Fast forward rolling rotation around X axis!
          if (this.ballGroup) {
            this.ballGroup.rotation.x += 1.2;
          }

          if (window.particleSystem) {
            window.particleSystem.spawnJumpPadBurst(this.group.position);
          }

          // Player Collision Check: 초광역 반경 7.5m 및 14m 돌격 경로 내 피격 시 즉사(9999 데미지) + 초강력 넉백!
          if (window.playerController && !window.playerController.isDead) {
            const pCam = window.playerController.camera.position;
            const distCenter = new THREE.Vector2(this.group.position.x - pCam.x, this.group.position.z - pCam.z).length();
            const toP = new THREE.Vector2(pCam.x - startP.x, pCam.z - startP.z);
            const dir2D = new THREE.Vector2(chargeDir.x, chargeDir.z).normalize();
            const proj = toP.dot(dir2D);
            const perp = Math.abs(toP.x * dir2D.y - toP.y * dir2D.x);

            const isHit = (distCenter < 7.5) || (proj >= -2.0 && proj <= chargeDist + 2.0 && perp < 7.0 && progress >= 0.05);
            if (isHit) {
              window.playerController.takeDamage(9999); // 피격 시 즉사!
              window.playerController.velocity.addScaledVector(chargeDir, 45.0);
              window.playerController.pitch += (Math.random() - 0.5) * 0.3;
              if (window.audioEngine) window.audioEngine.playExplosion();
              if (window.gameInstance && window.gameInstance.ui) {
                window.gameInstance.ui.showElimination('💀 [람머스 대회전 구르기 피격] 즉사했습니다!');
              }
            }
          }
        }, 45);
      }
    });
  }

  // Skill 3 (Phase 2): 머리카락 가시 뿌리기 (Hair Needle Barrage)
  startSkill3_HairNeedles(playerPos) {
    this.combatState = 'needles';
    this.showWarningHUD(
      '⚡ [머리카락 가시 뿌리기] 고속 침 발사!',
      '노윤상이 머리카락 가시들을 연속 발사합니다! 겐지 튕겨내기 또는 엄폐물 활용!'
    );

    if (window.audioEngine) {
      window.audioEngine.playBossRoar();
    }

    const needleCount = 8;
    for (let i = 0; i < needleCount; i++) {
      setTimeout(() => {
        if (this.isDead || !window.playerController) return;

        const headPos = this.group.position.clone().add(new THREE.Vector3(0, 5.85, 0));
        const pCam = window.playerController.camera.position.clone();
        pCam.y -= 0.3;

        const dir = new THREE.Vector3().subVectors(pCam, headPos);
        dir.x += (Math.random() - 0.5) * 0.12;
        dir.y += (Math.random() - 0.5) * 0.08;
        dir.z += (Math.random() - 0.5) * 0.12;
        dir.normalize();

        this.spawnHairNeedle(headPos, dir);

        if (window.audioEngine && typeof window.audioEngine.playVillagerHurt === 'function') {
          window.audioEngine.playVillagerHurt();
        }
      }, i * 90);
    }

    setTimeout(() => {
      this.combatState = 'recovering';
      this.stateTimer = 1.3;
      this.hideWarningHUD();
    }, needleCount * 90 + 600);
  }

  spawnHairNeedle(origin, dir) {
    const geo = new THREE.CylinderGeometry(0.06, 0.12, 1.4, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(origin);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    this.scene.add(mesh);

    const needle = {
      mesh,
      dir,
      speed: 36.0, // High velocity!
      life: 2.2,
      damage: 25,
      isReflected: false
    };
    this.activeNeedles.push(needle);
  }

  // Skill: 하늘에서 고드름 낙하 (Icicle Rain - 빨간색 경고 장판 & 거대 고드름 폭격)
  startSkill_FallingIcicles(playerPos) {
    this.combatState = 'telegraphing';
    this.showWarningHUD(
      '❄️ [고드름 폭격 경고] 하늘에서 거대 고드름 낙하!',
      '바닥의 붉은 경고 원형 구역에서 즉시 벗어나십시오!'
    );

    if (window.audioEngine) {
      window.audioEngine.playTelegraphWarning();
    }

    // 5 target locations across arena: 1 at player, 4 surrounding
    const targetPositions = [];
    const pPos = playerPos ? playerPos.clone() : this.group.position.clone();
    pPos.y = 0.6;
    targetPositions.push(pPos.clone());

    const offsets = [
      { x: -7.0, z: -6.0 },
      { x: 7.0, z: -6.0 },
      { x: -7.5, z: 6.5 },
      { x: 7.5, z: 6.5 }
    ];
    offsets.forEach(off => {
      const pos = new THREE.Vector3(
        THREE.MathUtils.clamp(pPos.x + off.x, this.arenaMinX, this.arenaMaxX),
        0.6,
        THREE.MathUtils.clamp(pPos.z + off.z, this.arenaMinZ, this.arenaMaxZ)
      );
      targetPositions.push(pos);
    });

    const telegraphDuration = 1.7;
    const telegraphMeshes = [];

    // 바닥에 선명한 붉은색 원형 경고 장판 생성
    targetPositions.forEach(pos => {
      const ringGeo = new THREE.RingGeometry(0.3, 3.8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff1744,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(pos.x, 0.63, pos.z);
      this.scene.add(ring);

      const discGeo = new THREE.CircleGeometry(3.6, 24);
      const discMat = new THREE.MeshBasicMaterial({
        color: 0xff0033,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.38
      });
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(pos.x, 0.62, pos.z);
      this.scene.add(disc);

      telegraphMeshes.push({ ring, disc });
    });

    let elapsed = 0;
    const pulseTimer = setInterval(() => {
      if (this.isDead) {
        clearInterval(pulseTimer);
        telegraphMeshes.forEach(m => {
          this.scene.remove(m.ring);
          this.scene.remove(m.disc);
        });
        return;
      }
      elapsed += 0.05;
      const pulse = 0.5 + Math.sin(elapsed * 14) * 0.35;
      telegraphMeshes.forEach(m => {
        if (m.ring && m.ring.material) m.ring.material.opacity = pulse;
        if (m.disc && m.disc.material) m.disc.material.opacity = pulse * 0.5;
      });

      if (elapsed >= telegraphDuration) {
        clearInterval(pulseTimer);
        telegraphMeshes.forEach(m => {
          this.scene.remove(m.ring);
          this.scene.remove(m.disc);
        });

        // 하늘에서 뾰족한 거대 고드름 투하!
        this.spawnFallingIcicleBarrage(targetPositions);
      }
    }, 50);
  }

  spawnFallingIcicleBarrage(targetPositions) {
    if (this.isDead) return;

    if (window.audioEngine) {
      window.audioEngine.playTelegraphWarning();
    }

    targetPositions.forEach((pos, idx) => {
      setTimeout(() => {
        if (this.isDead) return;

        // 거대 고드름 모델 (끝이 아래를 향하는 원뿔)
        const icicleGeo = new THREE.ConeGeometry(0.8, 5.5, 8);
        const icicleMat = new THREE.MeshStandardMaterial({
          color: 0x80d8ff,
          emissive: 0x0091ea,
          roughness: 0.1,
          metalness: 0.85
        });
        const icicle = new THREE.Mesh(icicleGeo, icicleMat);
        icicle.rotation.x = Math.PI; // 뾰족한 첨단이 아래를 향하도록 회전
        icicle.position.set(pos.x, 34.0, pos.z);
        this.scene.add(icicle);

        const fallSpeed = 48.0;
        let curY = 34.0;

        const fallInterval = setInterval(() => {
          if (this.isDead) {
            clearInterval(fallInterval);
            this.scene.remove(icicle);
            return;
          }
          curY -= fallSpeed * 0.035;
          icicle.position.y = curY;

          // 지면 강타 폭발!
          if (curY <= 1.0) {
            clearInterval(fallInterval);
            this.scene.remove(icicle);

            if (window.particleSystem) {
              window.particleSystem.spawnJumpPadBurst(pos);
              window.particleSystem.spawnHitSparks(pos, true);
            }
            if (window.audioEngine) {
              window.audioEngine.playExplosion();
            }

            if (window.playerController) {
              window.playerController.pitch += (Math.random() - 0.5) * 0.15;
            }

            // 플레이어가 붉은 낙하 구역(반경 3.8m) 내에 있으면 큰 피해 + 둔화!
            if (window.playerController && !window.playerController.isDead) {
              const pCam = window.playerController.camera.position;
              const dist = new THREE.Vector2(pCam.x - pos.x, pCam.z - pos.z).length();
              if (dist <= 3.8) {
                const dmg = dist <= 1.6 ? 9999 : 120;
                window.playerController.takeDamage(dmg);
                window.playerController.velocity.x *= 0.35;
                window.playerController.velocity.z *= 0.35;
                if (window.gameInstance && window.gameInstance.ui) {
                  window.gameInstance.ui.showElimination(`❄️ [고드름 폭격 피격] ${dmg > 1000 ? '즉사' : '120 피해'} 및 동상 둔화!`);
                }
              }
            }
          }
        }, 35);
      }, idx * 110);
    });

    this.combatState = 'recovering';
    this.stateTimer = 1.4;
    setTimeout(() => {
      this.hideWarningHUD();
    }, 2200);
  }

  createTelegraphMarker(config) {
    const group = new THREE.Group();
    group.position.set(config.pos.x, 0.68, config.pos.z);

    const redMat = new THREE.MeshBasicMaterial({
      color: 0xff0025,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const borderMat = new THREE.MeshBasicMaterial({
      color: 0xffeb3b,
      wireframe: true,
      depthWrite: false
    });

    let mesh;
    if (config.type === 'rect') {
      const geo = new THREE.PlaneGeometry(config.width, config.length);
      mesh = new THREE.Mesh(geo, redMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.z = -config.length / 2;
      group.add(mesh);

      const outlineMesh = new THREE.Mesh(geo, borderMat);
      outlineMesh.rotation.x = -Math.PI / 2;
      outlineMesh.position.z = -config.length / 2;
      outlineMesh.position.y = 0.01;
      group.add(outlineMesh);

      group.rotation.y = config.rotY || 0;
    }
    this.scene.add(group);

    const marker = {
      group,
      mesh,
      config,
      elapsed: 0,
      duration: config.duration,
      pulseTime: 0
    };
    this.activeTelegraphs.push(marker);
    return marker;
  }

  update(delta, playerPos) {
    if (this.isDead) return;

    const now = performance.now() / 1000;

    // Flinch Decay
    if (this.flinchTimer > 0) {
      this.flinchTimer -= delta;
      if (this.flinchTimer <= 0) {
        if (this.matShell) this.matShell.color.setHex(0x4e342e);
      }
    }

    // Active Telegraph Markers
    for (let i = this.activeTelegraphs.length - 1; i >= 0; i--) {
      const t = this.activeTelegraphs[i];
      t.elapsed += delta;
      t.pulseTime += delta * 12;
      if (t.mesh && t.mesh.material) {
        t.mesh.material.opacity = 0.5 + Math.sin(t.pulseTime) * 0.28;
      }
      if (t.elapsed >= t.duration) {
        this.scene.remove(t.group);
        this.activeTelegraphs.splice(i, 1);
        if (typeof t.config.onDetonate === 'function') {
          t.config.onDetonate();
        }
      }
    }

    // Spiked Shell Reflection Timer
    if (this.isReflecting) {
      this.reflectTimer -= delta;
      if (this.reflectShieldMesh) {
        this.reflectShieldMesh.rotation.y += delta * 4;
        this.reflectShieldMesh.rotation.x += delta * 2;
      }
      if (this.reflectTimer <= 0) {
        this.isReflecting = false;
        if (this.reflectShieldMesh) this.reflectShieldMesh.visible = false;
        this.hideWarningHUD();
        this.combatState = 'recovering';
        this.stateTimer = 1.0;
      }
    }

    // Update Hair Needles
    for (let i = this.activeNeedles.length - 1; i >= 0; i--) {
      const n = this.activeNeedles[i];
      n.life -= delta;
      n.mesh.position.addScaledVector(n.dir, n.speed * delta);

      if (n.life <= 0) {
        this.scene.remove(n.mesh);
        this.activeNeedles.splice(i, 1);
        continue;
      }

      // Check Genji Deflect
      if (!n.isReflected && window.playerController && window.playerController.currentHero === 'genji') {
        if (window.gameInstance && window.gameInstance.weapons && window.gameInstance.weapons.isDeflecting) {
          const pCam = window.playerController.camera.position;
          if (n.mesh.position.distanceTo(pCam) < 2.5) {
            n.isReflected = true;
            n.dir.negate();
            n.speed *= 1.4;
            n.damage *= 2;
            n.mesh.material.color.setHex(0x38e469);
            if (window.audioEngine) window.audioEngine.playDeflect();
            continue;
          }
        }
      }

      // Check Player Collision
      if (!n.isReflected && window.playerController && !window.playerController.isDead) {
        const pCam = window.playerController.camera.position;
        if (n.mesh.position.distanceTo(pCam) < 1.3) {
          window.playerController.takeDamage(n.damage);
          if (window.particleSystem) {
            window.particleSystem.spawnHitSparks(pCam, true);
          }
          this.scene.remove(n.mesh);
          this.activeNeedles.splice(i, 1);
          continue;
        }
      }

      // If reflected by Genji, damage Yoon-sang!
      if (n.isReflected) {
        if (n.mesh.position.distanceTo(this.group.position) < 3.0) {
          this.takeDamage(n.damage, false);
          this.scene.remove(n.mesh);
          this.activeNeedles.splice(i, 1);
          continue;
        }
      }
    }

    // State Machine
    if (this.combatState === 'recovering') {
      this.stateTimer -= delta;
      if (this.stateTimer <= 0) {
        this.combatState = 'idle';
        this.lastSkillTime = now;
        if (this.ballGroup) this.ballGroup.rotation.x = 0;
      }
    } else if (this.combatState === 'idle') {
      // Normal Patrol Movement
      const moveDelta = this.speed * this.patrolDirection * delta;
      this.currentPos.x += moveDelta;
      if (this.currentPos.x >= this.arenaMaxX) {
        this.currentPos.x = this.arenaMaxX;
        this.patrolDirection = -1;
      } else if (this.currentPos.x <= this.arenaMinX) {
        this.currentPos.x = this.arenaMinX;
        this.patrolDirection = 1;
      }
      this.group.position.set(this.currentPos.x, this.basePos.y, this.currentPos.z);

      if (playerPos) {
        const lookTarget = new THREE.Vector3(playerPos.x, this.group.position.y, playerPos.z);
        this.group.lookAt(lookTarget);
      }

      // Skill trigger cycle (구르기 돌격, 하늘에서 고드름 폭격, 가시 반사, 머리카락 가시)
      if (playerPos && (now - this.lastSkillTime > this.skillCooldown)) {
        this.skillIndex++;
        if (this.phase === 1) {
          const mod = this.skillIndex % 3;
          if (mod === 1) {
            this.startSkill2_RollingCharge(playerPos);
          } else if (mod === 2) {
            this.startSkill_FallingIcicles(playerPos);
          } else {
            this.startSkill1_Reflect();
          }
        } else {
          const mod = this.skillIndex % 4;
          if (mod === 1) {
            this.startSkill3_HairNeedles(playerPos);
          } else if (mod === 2) {
            this.startSkill_FallingIcicles(playerPos);
          } else if (mod === 3) {
            this.startSkill2_RollingCharge(playerPos);
          } else {
            this.startSkill1_Reflect();
          }
        }
      }
    }

    // Arena boundary clamp
    this.group.position.x = THREE.MathUtils.clamp(this.group.position.x, this.arenaMinX, this.arenaMaxX);
    this.group.position.z = THREE.MathUtils.clamp(this.group.position.z, this.arenaMinZ, this.arenaMaxZ);
    this.currentPos.copy(this.group.position);
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.health = 0;
    this.isRolling = false;
    this.isReflecting = false;
    this.combatState = 'dead';
    this.group.visible = false;
    this.updateHUD();
    this.hideWarningHUD();
    this.hideBossHUD();

    try {
      document.exitPointerLock();
    } catch (e) {}

    if (window.audioEngine) {
      if (typeof window.audioEngine.playBossDefeat === 'function') {
        window.audioEngine.playBossDefeat();
      } else if (typeof window.audioEngine.playExplosion === 'function') {
        window.audioEngine.playExplosion();
      }
    }

    // Clean up all needles
    this.activeNeedles.forEach(n => {
      if (n.mesh && n.mesh.parent) n.mesh.parent.remove(n.mesh);
    });
    this.activeNeedles = [];

    // Grand fireworks
    if (window.particleSystem) {
      for (let i = 0; i < 7; i++) {
        setTimeout(() => {
          const offset = new THREE.Vector3((Math.random() - 0.5) * 6, 1 + i * 1.2, (Math.random() - 0.5) * 6);
          window.particleSystem.spawnVillagerDeathPoof(this.group.position.clone().add(offset));
          window.particleSystem.spawnJumpPadBurst(this.group.position.clone().add(offset));
        }, i * 120);
      }
    }

    if (window.gameInstance && window.gameInstance.ui) {
      window.gameInstance.ui.showElimination('🏆 노윤상 보스 토벌 완료! [VICTORY]');
    }

    // 윤상이 처치 시 즉시 게임 클리어 처리!
    if (window.gameInstance && typeof window.gameInstance.triggerStageClear === 'function') {
      window.gameInstance.triggerStageClear();
    }
  }
}

