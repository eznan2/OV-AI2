/**
 * Hero Weapon System & Abilities (솔저: 76 & 겐지)
 * Includes 3D Viewmodels, Hitscan, Shuriken Projectiles, Swift Strike, Deflect & Dragonblade.
 */

class WeaponSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.currentHero = 'soldier'; // 'soldier' or 'genji'

    // ==========================================
    // SOLDIER: 76 STATS
    // ==========================================
    this.maxAmmo = 30;
    this.ammo = 30;
    this.damage = 19;
    this.fireRate = 0.11;
    this.lastFireTime = 0;
    this.isReloading = false;
    this.reloadDuration = 1.5;
    this.reloadTimer = 0;

    this.spread = 0.0;
    this.maxSpread = 0.038;
    this.spreadRecoverySpeed = 0.08;
    this.continuousShots = 0;

    // Helix
    this.helixCooldown = 6.0;
    this.helixTimer = 0;
    this.helixDamage = 120;
    this.helixSplashRadius = 3.5;
    this.helixSpeed = 55;
    this.rockets = [];

    // Biotic Field
    this.bioticCooldown = 15.0;
    this.bioticTimer = 0;
    this.bioticActive = false;
    this.bioticDuration = 5.0;
    this.bioticRemaining = 0;
    this.bioticBeacon = null;
    this.bioticRadius = 4.5;
    this.bioticHealRate = 40;

    // Tactical Visor
    this.visorActive = false;
    this.visorDuration = 10.0;
    this.visorRemaining = 0;
    this.lockedBot = null;

    // ==========================================
    // GENJI STATS
    // ==========================================
    this.genjiMaxAmmo = 30;
    this.genjiAmmo = 30;
    this.genjiDamage = 27; // 27 dmg per shuriken (54 on headshot)
    this.genjiShurikenSpeed = 65;
    this.genjiLastFireTime = 0;
    this.genjiFireRate = 0.75; // burst interval
    this.shurikens = []; // active flying shurikens
    this.shurikenBurstQueue = []; // 3 shurikens in rapid succession

    // Swift Strike (질풍참)
    this.swiftCooldown = 8.0;
    this.swiftTimer = 0;
    this.swiftDamage = 50;

    // Deflect (튕겨내기)
    this.deflectCooldown = 8.0;
    this.deflectTimer = 0;
    this.isDeflecting = false;
    this.deflectDuration = 2.0;
    this.deflectRemaining = 0;

    // Dragonblade (용검 - Ultimate)
    this.dragonbladeActive = false;
    this.dragonbladeDuration = 6.0;
    this.dragonbladeRemaining = 0;
    this.dragonSlashCooldown = 0.8;
    this.dragonLastSlashTime = 0;
    this.dragonSlashDamage = 110;
    this.dragonSlashRange = 5.5;

    // Viewmodels
    this.activeTracers = [];
    this.createViewmodels();
  }

  setHero(hero) {
    this.currentHero = hero;
    if (hero === 'soldier') {
      this.soldierGunGroup.visible = true;
      this.genjiArmGroup.visible = false;
      this.katanaGroup.visible = false;
    } else {
      this.soldierGunGroup.visible = false;
      this.genjiArmGroup.visible = !this.dragonbladeActive;
      this.katanaGroup.visible = this.dragonbladeActive;
    }
  }

  createViewmodels() {
    this.createSoldierViewmodel();
    this.createGenjiViewmodel();
    this.createKatanaViewmodel();
    this.setHero('soldier');
  }

  // --- SOLDIER VIEWMODEL ---
  createSoldierViewmodel() {
    this.soldierGunGroup = new THREE.Group();
    const gunMetalMat = new THREE.MeshStandardMaterial({ color: 0x1c212d, roughness: 0.4, metalness: 0.8 });
    const gunAccentMat = new THREE.MeshStandardMaterial({ color: 0x3d485f, roughness: 0.3, metalness: 0.6 });
    const blueEnergyMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });

    const bodyGeo = new THREE.BoxGeometry(0.12, 0.18, 0.8);
    const bodyMesh = new THREE.Mesh(bodyGeo, gunMetalMat);
    this.soldierGunGroup.add(bodyMesh);

    const barrelGeo = new THREE.CylinderGeometry(0.04, 0.045, 0.45, 12);
    const barrelMesh = new THREE.Mesh(barrelGeo, gunAccentMat);
    barrelMesh.rotation.x = Math.PI / 2;
    barrelMesh.position.set(0, 0.02, -0.5);
    this.soldierGunGroup.add(barrelMesh);

    const railGeo = new THREE.BoxGeometry(0.06, 0.06, 0.5);
    const railMesh = new THREE.Mesh(railGeo, gunAccentMat);
    railMesh.position.set(0, 0.12, -0.1);
    this.soldierGunGroup.add(railMesh);

    const conduitGeo = new THREE.BoxGeometry(0.015, 0.03, 0.4);
    const conduitMeshL = new THREE.Mesh(conduitGeo, blueEnergyMat);
    conduitMeshL.position.set(-0.065, 0.02, -0.15);
    this.soldierGunGroup.add(conduitMeshL);

    const conduitMeshR = new THREE.Mesh(conduitGeo, blueEnergyMat);
    conduitMeshR.position.set(0.065, 0.02, -0.15);
    this.soldierGunGroup.add(conduitMeshR);

    this.muzzlePos = new THREE.Vector3(0, 0.02, -0.75);
    this.muzzleLight = new THREE.PointLight(0x00e5ff, 0, 8);
    this.muzzleLight.position.copy(this.muzzlePos);
    this.soldierGunGroup.add(this.muzzleLight);

    this.baseGunPos = new THREE.Vector3(0.28, -0.26, -0.55);
    this.soldierGunGroup.position.copy(this.baseGunPos);
    this.camera.add(this.soldierGunGroup);

    this.recoilZ = 0;
    this.recoilRotX = 0;
  }

  // --- GENJI VIEWMODEL (Cybernetic Arm & Shurikens) ---
  createGenjiViewmodel() {
    this.genjiArmGroup = new THREE.Group();
    const cyberArmMat = new THREE.MeshStandardMaterial({ color: 0x252c38, roughness: 0.3, metalness: 0.7 });
    const cyberPlateMat = new THREE.MeshStandardMaterial({ color: 0xd4dbe6, roughness: 0.2, metalness: 0.4 });
    const genjiGreenMat = new THREE.MeshBasicMaterial({ color: 0x38e469 });

    // Forearm
    const armGeo = new THREE.BoxGeometry(0.1, 0.1, 0.5);
    const armMesh = new THREE.Mesh(armGeo, cyberArmMat);
    armMesh.position.set(0, 0, -0.25);
    this.genjiArmGroup.add(armMesh);

    // Armor Plate
    const plateGeo = new THREE.BoxGeometry(0.11, 0.04, 0.35);
    const plateMesh = new THREE.Mesh(plateGeo, cyberPlateMat);
    plateMesh.position.set(0, 0.06, -0.22);
    this.genjiArmGroup.add(plateMesh);

    // Glowing Green Conduits
    const lineGeo = new THREE.BoxGeometry(0.015, 0.02, 0.3);
    const lineMesh = new THREE.Mesh(lineGeo, genjiGreenMat);
    lineMesh.position.set(0, 0.08, -0.22);
    this.genjiArmGroup.add(lineMesh);

    // Cyber Hand & Knuckles
    const handGeo = new THREE.BoxGeometry(0.09, 0.07, 0.12);
    const handMesh = new THREE.Mesh(handGeo, cyberPlateMat);
    handMesh.position.set(0, 0, -0.54);
    this.genjiArmGroup.add(handMesh);

    // Shuriken held in hand
    this.handShuriken = this.createShurikenMesh();
    this.handShuriken.scale.set(0.7, 0.7, 0.7);
    this.handShuriken.position.set(0, 0.05, -0.6);
    this.handShuriken.rotation.x = Math.PI / 2;
    this.genjiArmGroup.add(this.handShuriken);

    this.baseGenjiArmPos = new THREE.Vector3(0.26, -0.28, -0.45);
    this.genjiArmGroup.position.copy(this.baseGenjiArmPos);
    this.camera.add(this.genjiArmGroup);

    this.genjiArmSwing = 0;
  }

  // --- GENJI DRAGONBLADE (Katana) VIEWMODEL ---
  createKatanaViewmodel() {
    this.katanaGroup = new THREE.Group();
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x181e26, roughness: 0.6 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x38e469, roughness: 0.2, metalness: 0.9 });
    const bladeEdgeMat = new THREE.MeshBasicMaterial({ color: 0x5aff8a });

    // Handle (Tsuka)
    const handleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.32, 10);
    const handleMesh = new THREE.Mesh(handleGeo, handleMat);
    handleMesh.rotation.x = Math.PI / 3;
    handleMesh.position.set(0, -0.1, 0.1);
    this.katanaGroup.add(handleMesh);

    // Guard (Tsuba)
    const guardGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12);
    const guardMesh = new THREE.Mesh(guardGeo, bladeMat);
    guardMesh.rotation.x = Math.PI / 3;
    guardMesh.position.set(0, -0.02, 0.0);
    this.katanaGroup.add(guardMesh);

    // Curved Katana Blade
    const bladeGeo = new THREE.BoxGeometry(0.015, 0.045, 1.1);
    const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
    bladeMesh.position.set(0, 0.22, -0.48);
    bladeMesh.rotation.x = -Math.PI / 6;
    this.katanaGroup.add(bladeMesh);

    // Glowing Katana Edge Light
    const edgeLight = new THREE.PointLight(0x38e469, 1.8, 4);
    edgeLight.position.set(0, 0.3, -0.5);
    this.katanaGroup.add(edgeLight);

    this.baseKatanaPos = new THREE.Vector3(0.18, -0.22, -0.45);
    this.katanaGroup.position.copy(this.baseKatanaPos);
    this.katanaGroup.rotation.y = -0.3;
    this.katanaGroup.rotation.z = -0.2;
    this.camera.add(this.katanaGroup);

    this.katanaSlashAnim = 0;
  }

  createShurikenMesh() {
    const group = new THREE.Group();
    const starMat = new THREE.MeshStandardMaterial({ color: 0xc8d4e2, metalness: 0.8, roughness: 0.2 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x38e469 });

    const coreGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.015, 8);
    const core = new THREE.Mesh(coreGeo, glowMat);
    group.add(core);

    // 4 Shuriken blades
    for (let i = 0; i < 4; i++) {
      const bladeGeo = new THREE.ConeGeometry(0.045, 0.14, 4);
      const blade = new THREE.Mesh(bladeGeo, starMat);
      blade.rotation.z = (Math.PI / 2) * i;
      blade.position.x = Math.cos((Math.PI / 2) * i) * 0.1;
      blade.position.y = Math.sin((Math.PI / 2) * i) * 0.1;
      group.add(blade);
    }
    return group;
  }

  // ==========================================
  // ACTIONS: PRIMARY & SECONDARY FIRE
  // ==========================================
  canFire() {
    if (this.currentHero === 'soldier') {
      const now = performance.now() / 1000;
      return !this.isReloading && this.ammo > 0 && (now - this.lastFireTime >= this.fireRate);
    } else {
      // Genji
      if (this.isDeflecting) return false;
      if (this.dragonbladeActive) {
        const now = performance.now() / 1000;
        return (now - this.dragonLastSlashTime >= this.dragonSlashCooldown);
      } else {
        const now = performance.now() / 1000;
        // Primary fire 3-shuriken burst: 3 shurikens shoot, then wait (burst pause) before next burst
        const burstInterval = 0.95;
        return !this.isReloading && 
               this.genjiAmmo > 0 && 
               this.shurikenBurstQueue.length === 0 && 
               (now - this.genjiLastFireTime >= burstInterval);
      }
    }
  }

  fire(bots, playerStats, onHitCallback) {
    if (this.currentHero === 'soldier') {
      return this.fireSoldier(bots, playerStats, onHitCallback);
    } else {
      if (this.dragonbladeActive) {
        return this.slashDragonblade(bots, playerStats, onHitCallback);
      } else {
        return this.fireGenjiBurst(bots, playerStats, onHitCallback);
      }
    }
  }

  fireSecondary(bots, playerStats, onHitCallback) {
    if (this.currentHero === 'soldier') {
      return this.fireHelix(bots, window.playerController.camera.position, onHitCallback);
    } else {
      // Genji: Right click = Fan of 3 shurikens (부채꼴)
      if (!this.dragonbladeActive) {
        return this.fireGenjiFan(bots, playerStats, onHitCallback);
      }
      return false;
    }
  }

  // --- SOLDIER PRIMARY FIRE ---
  fireSoldier(bots, playerStats, onHitCallback) {
    if (!this.canFire()) {
      if (this.ammo === 0 && !this.isReloading) this.reload();
      return false;
    }

    const now = performance.now() / 1000;
    this.lastFireTime = now;
    this.ammo--;
    this.continuousShots++;

    if (this.continuousShots > 3) {
      this.spread = Math.min(this.maxSpread, this.spread + 0.007);
    }

    this.recoilZ = 0.08;
    this.recoilRotX = 0.05;
    this.muzzleLight.intensity = 2.5;
    setTimeout(() => { this.muzzleLight.intensity = 0; }, 40);

    window.audioEngine.playPulseRifleShot();
    this.processHitscan(bots, playerStats, onHitCallback);
    return true;
  }

  processHitscan(bots, playerStats, onHitCallback) {
    playerStats.shotsFired++;
    let targetDir = new THREE.Vector3();

    if (this.visorActive && this.lockedBot && !this.lockedBot.isDead) {
      const botCenter = this.lockedBot.group.position.clone().add(new THREE.Vector3(0, 1.3, 0));
      targetDir.subVectors(botCenter, this.camera.position).normalize();
    } else {
      this.camera.getWorldDirection(targetDir);
      if (this.spread > 0) {
        targetDir.x += (Math.random() - 0.5) * this.spread;
        targetDir.y += (Math.random() - 0.5) * this.spread;
        targetDir.normalize();
      }
    }

    const hitboxes = [];
    bots.forEach(b => {
      if (!b.isDead) hitboxes.push(...b.hitboxes);
    });

    const raycaster = new THREE.Raycaster(this.camera.position, targetDir, 0.1, 100);
    const intersects = raycaster.intersectObjects(hitboxes, false);

    let hitPoint = this.camera.position.clone().add(targetDir.clone().multiplyScalar(60));

    if (intersects.length > 0) {
      const hit = intersects[0];
      hitPoint = hit.point.clone();
      const bot = hit.object.userData.bot;
      const isHead = hit.object.userData.isHead;

      playerStats.shotsHit++;
      if (isHead) playerStats.headshots++;

      const result = bot.takeDamage(this.damage, isHead);
      if (window.particleSystem) {
        window.particleSystem.spawnHitSparks(hitPoint, isHead);
      }
      if (onHitCallback) onHitCallback(isHead, result.killed, bot);
    }

    const worldMuzzle = new THREE.Vector3();
    this.soldierGunGroup.localToWorld(worldMuzzle.copy(this.muzzlePos));
    this.spawnTracer(worldMuzzle, hitPoint);
  }

  spawnTracer(start, end) {
    const points = [start, end];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0x00e5ff, linewidth: 2, transparent: true, opacity: 0.95 });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.activeTracers.push({ line, life: 0.08 });
  }

  // --- GENJI PRIMARY FIRE (3 Linear Shurikens: 3발 발사 후 대기 주기) ---
  fireGenjiBurst(bots, playerStats, onHitCallback) {
    if (!this.canFire()) {
      if (this.genjiAmmo === 0 && !this.isReloading) this.reload();
      return false;
    }

    const now = performance.now() / 1000;
    this.genjiLastFireTime = now;
    const count = Math.min(3, this.genjiAmmo);
    this.genjiAmmo -= count;

    // Queue 3 consecutive shurikens (0.11s apart)
    for (let i = 0; i < count; i++) {
      this.shurikenBurstQueue.push({
        delay: i * 0.11,
        bots,
        playerStats,
        onHitCallback,
        isFan: false,
        angleOffset: 0
      });
    }

    this.genjiArmSwing = 0.35;
    return true;
  }

  // --- GENJI SECONDARY FIRE (Fan of 3 Shurikens) ---
  fireGenjiFan(bots, playerStats, onHitCallback) {
    if (this.isReloading || this.genjiAmmo <= 0 || this.isDeflecting) {
      if (this.genjiAmmo === 0 && !this.isReloading) this.reload();
      return false;
    }
    if (this.shurikenBurstQueue.length > 0) return false;
    const now = performance.now() / 1000;
    if (now - this.genjiLastFireTime < 0.72) return false;
    this.genjiLastFireTime = now;

    const count = Math.min(3, this.genjiAmmo);
    this.genjiAmmo -= count;

    window.audioEngine.playShurikenThrow(true);
    this.genjiArmSwing = 0.3;

    // Launch 3 shurikens spread out horizontally (-8 deg, 0 deg, +8 deg)
    const angles = [-0.12, 0, 0.12];
    for (let i = 0; i < count; i++) {
      this.spawnShurikenProjectile(bots, playerStats, onHitCallback, angles[i]);
    }
    return true;
  }

  spawnShurikenProjectile(bots, playerStats, onHitCallback, angleOffset = 0) {
    playerStats.shotsFired++;
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);

    // Horizontal spread rotation
    if (angleOffset !== 0) {
      camDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOffset);
    }

    const spawnPos = this.camera.position.clone().add(camDir.clone().multiplyScalar(0.4));
    spawnPos.y -= 0.15;

    const mesh = this.createShurikenMesh();
    mesh.position.copy(spawnPos);
    mesh.scale.set(0.65, 0.65, 0.65);
    this.scene.add(mesh);

    this.shurikens.push({
      mesh,
      dir: camDir.clone(),
      speed: this.genjiShurikenSpeed,
      origin: spawnPos.clone(),
      life: 2.5,
      bots,
      playerStats,
      onHitCallback
    });
  }

  // --- GENJI DRAGONBLADE MELEE SLASH ---
  slashDragonblade(bots, playerStats, onHitCallback) {
    if (!this.canFire()) return false;

    const now = performance.now() / 1000;
    this.dragonLastSlashTime = now;
    this.katanaSlashAnim = 0.45; // Trigger dynamic swing
    playerStats.shotsFired++;

    window.audioEngine.playDragonSlash();

    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    const camPos = this.camera.position;

    let hitAny = false;
    bots.forEach(b => {
      if (b.isDead) return;
      const botPos = b.group.position.clone().add(new THREE.Vector3(0, 1.2, 0));
      const dist = camPos.distanceTo(botPos);
      if (dist <= this.dragonSlashRange) {
        const toBot = botPos.clone().sub(camPos).normalize();
        const angle = camDir.angleTo(toBot);
        if (angle < 0.95) { // ~55 degree forward cleave arc
          hitAny = true;
          playerStats.shotsHit++;
          const res = b.takeDamage(this.dragonSlashDamage, false);
          if (window.particleSystem) {
            window.particleSystem.spawnHitSparks(botPos, true);
          }
          if (onHitCallback) onHitCallback(false, res.killed, b);
        }
      }
    });

    if (hitAny) {
      window.audioEngine.playHitmarker();
    }
    return true;
  }

  // --- GENJI SWIFT STRIKE (질풍참 - Shift) ---
  canUseSwiftStrike() {
    return this.swiftTimer <= 0;
  }

  useSwiftStrike(bots, playerController, onKillCallback) {
    if (!this.canUseSwiftStrike()) return false;
    this.swiftTimer = this.swiftCooldown;

    window.audioEngine.playSwiftStrike();

    // Dash 15 meters forward
    const dashResult = playerController.performDash(15);
    const start = dashResult.start;
    const end = dashResult.end;

    // Swift Strike Damage Line Segment Collision (50 dmg)
    const lineDir = end.clone().sub(start);
    const lineLen = lineDir.length();
    lineDir.normalize();

    bots.forEach(b => {
      if (b.isDead) return;
      const botPos = b.group.position.clone().add(new THREE.Vector3(0, 1.2, 0));
      // Closest point on dash line
      const toBot = botPos.clone().sub(start);
      const proj = toBot.dot(lineDir);
      if (proj >= 0 && proj <= lineLen) {
        const closestPoint = start.clone().add(lineDir.clone().multiplyScalar(proj));
        if (closestPoint.distanceTo(botPos) <= 2.4) {
          const res = b.takeDamage(this.swiftDamage, false);
          if (res.killed) {
            this.resetSwiftStrikeCooldown();
            if (onKillCallback) onKillCallback(b);
          }
        }
      }
    });

    return true;
  }

  // Passive Reset: Whenever Genji eliminates any bot, Swift Strike resets!
  resetSwiftStrikeCooldown() {
    this.swiftTimer = 0;
  }

  // --- GENJI DEFLECT (튕겨내기 - E) ---
  canUseDeflect() {
    return this.deflectTimer <= 0;
  }

  useDeflect() {
    if (!this.canUseDeflect()) return false;
    this.deflectTimer = this.deflectCooldown;
    this.isDeflecting = true;
    this.deflectRemaining = this.deflectDuration;
    window.audioEngine.playDeflect();
    return true;
  }

  // --- ULTIMATE: TACTICAL VISOR (SOLDIER) / DRAGONBLADE (GENJI) ---
  activateUltimate() {
    if (this.currentHero === 'soldier') {
      this.visorActive = true;
      this.visorRemaining = this.visorDuration;
      window.audioEngine.playTacticalVisor();
      this.ammo = this.maxAmmo;
    } else {
      // Genji Dragonblade
      this.dragonbladeActive = true;
      this.dragonbladeRemaining = this.dragonbladeDuration;
      window.audioEngine.playDragonblade();
      this.resetSwiftStrikeCooldown(); // Swift strike resets on Dragonblade cast!
      this.genjiArmGroup.visible = false;
      this.katanaGroup.visible = true;
    }
  }

  // --- RELOAD ---
  reload() {
    if (this.isReloading) return;
    const currentUlt = (window.gameInstance && window.gameInstance.stats) ? window.gameInstance.stats.ultCharge : null;
    if (this.currentHero === 'soldier') {
      if (this.ammo === this.maxAmmo) return;
      this.isReloading = true;
      this.reloadDuration = this.visorActive ? 0.75 : 1.5;
      this.reloadTimer = this.reloadDuration;
      window.audioEngine.playReload();
    } else {
      if (this.genjiAmmo === this.genjiMaxAmmo || this.dragonbladeActive) return;
      this.isReloading = true;
      this.reloadDuration = 1.2;
      this.reloadTimer = this.reloadDuration;
      window.audioEngine.playShurikenThrow(false);
    }
    if (currentUlt !== null && window.gameInstance && window.gameInstance.stats) {
      window.gameInstance.stats.ultCharge = currentUlt;
    }
  }

  // --- SOLDIER HELIX & BIOTIC ---
  canFireHelix() { return this.helixTimer <= 0 && !this.isReloading; }

  fireHelix(bots, playerPos, onExplodeCallback) {
    if (!this.canFireHelix()) return false;
    this.helixTimer = this.helixCooldown;
    window.audioEngine.playHelixLaunch();

    const worldMuzzle = new THREE.Vector3();
    this.soldierGunGroup.localToWorld(worldMuzzle.copy(this.muzzlePos));
    let dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);

    for (let i = 0; i < 3; i++) {
      const rocketMesh = this.createHelixMesh();
      rocketMesh.position.copy(worldMuzzle);
      this.scene.add(rocketMesh);
      this.rockets.push({
        mesh: rocketMesh,
        origin: worldMuzzle.clone(),
        dir: dir.clone(),
        speed: this.helixSpeed,
        timeAlive: 0,
        bots: bots,
        onExplode: onExplodeCallback
      });
    }
    return true;
  }

  createHelixMesh() {
    const group = new THREE.Group();
    const coreGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.rotation.x = Math.PI / 2;
    group.add(core);
    const glowLight = new THREE.PointLight(0x00e5ff, 1.2, 4);
    group.add(glowLight);
    return group;
  }

  canDeployBiotic() { return this.bioticTimer <= 0; }

  deployBiotic(playerPos) {
    if (!this.canDeployBiotic()) return false;
    this.bioticTimer = this.bioticCooldown;
    this.bioticActive = true;
    this.bioticRemaining = this.bioticDuration;

    window.audioEngine.playBioticDeploy();
    window.audioEngine.startHealLoop();

    if (this.bioticBeacon) this.scene.remove(this.bioticBeacon);

    this.bioticBeacon = new THREE.Group();
    this.bioticBeacon.position.set(playerPos.x, 0.05, playerPos.z);

    const coreGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.15, 12);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x2b3447, metalness: 0.8 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    this.bioticBeacon.add(core);

    const ringGeo = new THREE.RingGeometry(this.bioticRadius - 0.1, this.bioticRadius, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    this.bioticBeacon.add(ring);

    const discGeo = new THREE.CircleGeometry(this.bioticRadius, 32);
    const discMat = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide, transparent: true, opacity: 0.12 });
    this.innerDisc = new THREE.Mesh(discGeo, discMat);
    this.innerDisc.rotation.x = -Math.PI / 2;
    this.bioticBeacon.add(this.innerDisc);

    this.scene.add(this.bioticBeacon);
    return true;
  }

  // ==========================================
  // UPDATE LOOP
  // ==========================================
  update(delta, playerPos, isSprinting, bots) {
    // 1. Reload Timers
    if (this.isReloading) {
      this.reloadTimer -= delta;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        if (this.currentHero === 'soldier') {
          this.ammo = this.maxAmmo;
        } else {
          this.genjiAmmo = this.genjiMaxAmmo;
        }
      }
    }

    // 2. Spread Decay
    if (this.spread > 0) {
      this.spread = Math.max(0, this.spread - this.spreadRecoverySpeed * delta);
      if (this.spread === 0) this.continuousShots = 0;
    }

    // 3. Soldier Abilities Timers
    if (this.helixTimer > 0) this.helixTimer = Math.max(0, this.helixTimer - delta);
    if (this.bioticTimer > 0) this.bioticTimer = Math.max(0, this.bioticTimer - delta);
    if (this.bioticActive) {
      this.bioticRemaining -= delta;
      if (this.innerDisc) this.innerDisc.material.opacity = 0.1 + Math.sin(this.bioticRemaining * 6) * 0.05;
      if (this.bioticRemaining <= 0) {
        this.bioticActive = false;
        window.audioEngine.stopHealLoop();
        if (this.bioticBeacon) {
          this.scene.remove(this.bioticBeacon);
          this.bioticBeacon = null;
        }
      }
    }

    if (this.visorActive) {
      this.visorRemaining -= delta;
      if (this.visorRemaining <= 0) {
        this.visorActive = false;
        this.lockedBot = null;
      } else {
        this.updateVisorLock(bots);
      }
    }

    // 4. Genji Abilities Timers
    if (this.swiftTimer > 0) this.swiftTimer = Math.max(0, this.swiftTimer - delta);
    if (this.deflectTimer > 0) this.deflectTimer = Math.max(0, this.deflectTimer - delta);
    if (this.isDeflecting) {
      this.deflectRemaining -= delta;
      if (this.deflectRemaining <= 0) {
        this.isDeflecting = false;
      }
    }

    if (this.dragonbladeActive) {
      this.dragonbladeRemaining -= delta;
      if (this.dragonbladeRemaining <= 0) {
        this.dragonbladeActive = false;
        this.katanaGroup.visible = false;
        this.genjiArmGroup.visible = (this.currentHero === 'genji');
      }
    }

    // 5. Genji Shuriken Burst Queue (linear 3-burst)
    if (this.shurikenBurstQueue.length > 0) {
      for (let i = this.shurikenBurstQueue.length - 1; i >= 0; i--) {
        const item = this.shurikenBurstQueue[i];
        item.delay -= delta;
        if (item.delay <= 0) {
          window.audioEngine.playShurikenThrow(false);
          this.spawnShurikenProjectile(item.bots, item.playerStats, item.onHitCallback, 0);
          this.shurikenBurstQueue.splice(i, 1);
        }
      }
    }

    // 6. Flying Shurikens Update
    this.updateShurikens(delta, bots);

    // 7. Flying Rockets Update
    this.updateRockets(delta, playerPos);

    // 8. Bullet Tracers Decay
    for (let i = this.activeTracers.length - 1; i >= 0; i--) {
      const tr = this.activeTracers[i];
      tr.life -= delta;
      tr.line.material.opacity = (tr.life / 0.08) * 0.95;
      if (tr.life <= 0) {
        this.scene.remove(tr.line);
        this.activeTracers.splice(i, 1);
      }
    }

    // 9. Viewmodels Animation
    this.updateViewmodelsAnim(delta, isSprinting);
  }

  updateShurikens(delta, bots) {
    // Collect all active bot hitboxes
    const allHitboxes = [];
    const targetBots = bots || (this.shurikens.length > 0 ? this.shurikens[0].bots : null);
    if (targetBots) {
      for (const b of targetBots) {
        if (!b.isDead && b.hitboxes) allHitboxes.push(...b.hitboxes);
      }
    }

    for (let i = this.shurikens.length - 1; i >= 0; i--) {
      const s = this.shurikens[i];
      s.life -= delta;
      s.mesh.rotation.z += delta * 30; // spinning star

      const stepDist = s.speed * delta;
      // Continuous line segment raycast from current position to next position
      const ray = new THREE.Raycaster(s.mesh.position, s.dir, 0, stepDist + 0.15);
      const hits = ray.intersectObjects(allHitboxes, false);

      if (hits.length > 0) {
        const hit = hits[0];
        const bot = hit.object.userData.bot;
        const isHead = hit.object.userData.isHead;

        s.playerStats.shotsHit++;
        if (isHead) s.playerStats.headshots++;

        const res = bot.takeDamage(this.genjiDamage, isHead);
        if (window.particleSystem) {
          window.particleSystem.spawnHitSparks(hit.point, isHead);
        }
        if (s.onHitCallback) s.onHitCallback(isHead, res.killed, bot);

        this.scene.remove(s.mesh);
        this.shurikens.splice(i, 1);
        continue;
      }

      // No hit along this step: advance position
      s.mesh.position.addScaledVector(s.dir, stepDist);

      if (s.life <= 0 || s.mesh.position.y <= 0) {
        this.scene.remove(s.mesh);
        this.shurikens.splice(i, 1);
      }
    }
  }

  updateVisorLock(bots) {
    let closestBot = null;
    let minAngle = 0.65;
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);

    bots.forEach(b => {
      if (b.isDead) return;
      const botPos = b.group.position.clone().add(new THREE.Vector3(0, 1.2, 0));
      const toBot = botPos.clone().sub(this.camera.position).normalize();
      const angle = camDir.angleTo(toBot);
      if (angle < minAngle) {
        minAngle = angle;
        closestBot = b;
      }
    });
    this.lockedBot = closestBot;
  }

  updateRockets(delta, playerPos) {
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.timeAlive += delta;
      r.mesh.position.addScaledVector(r.dir, r.speed * delta);

      let exploded = false;
      let explodePos = r.mesh.position.clone();

      if (r.mesh.position.y <= 0.1) {
        exploded = true;
        explodePos.y = 0.1;
      }

      if (!exploded) {
        for (const b of r.bots) {
          if (b.isDead) continue;
          if (r.mesh.position.distanceTo(b.group.position.clone().add(new THREE.Vector3(0, 1, 0))) < 1.2) {
            exploded = true;
            break;
          }
        }
      }

      if (r.mesh.position.distanceTo(r.origin) > 70) exploded = true;

      if (exploded) {
        this.explodeHelix(explodePos, r.bots, playerPos, r.onExplode);
        this.scene.remove(r.mesh);
        this.rockets.splice(i, 1);
      }
    }
  }

  explodeHelix(pos, bots, playerPos, onExplode) {
    window.audioEngine.playHelixExplosion();
    if (window.particleSystem) window.particleSystem.spawnHelixExplosion(pos);

    bots.forEach(b => {
      if (b.isDead) return;
      const botPos = b.group.position.clone().add(new THREE.Vector3(0, 1, 0));
      const dist = pos.distanceTo(botPos);
      if (dist <= this.helixSplashRadius) {
        const falloff = 1 - (dist / this.helixSplashRadius);
        const dmg = Math.round(this.helixDamage * Math.max(0.3, falloff));
        const res = b.takeDamage(dmg, false);
        if (onExplode) onExplode(res.killed, b);
      }
    });

    const distToPlayer = pos.distanceTo(playerPos);
    if (distToPlayer < 3.0 && window.playerController) {
      const boost = (3.0 - distToPlayer) * 5.5;
      window.playerController.applyExplosionBoost(boost);
    }
  }

  updateViewmodelsAnim(delta, isSprinting) {
    if (this.currentHero === 'soldier') {
      this.recoilZ = THREE.MathUtils.lerp(this.recoilZ, 0, delta * 20);
      this.recoilRotX = THREE.MathUtils.lerp(this.recoilRotX, 0, delta * 20);

      let targetX = this.baseGunPos.x;
      let targetY = this.baseGunPos.y;
      let targetZ = this.baseGunPos.z + this.recoilZ;
      let targetRotX = this.recoilRotX;
      let targetRotY = 0;

      if (this.isReloading) {
        targetY -= 0.18;
        targetRotX -= 0.4;
        targetRotY += 0.2;
      }
      if (isSprinting) {
        targetY -= 0.14;
        targetRotX += 0.35;
        targetRotY += 0.25;
      }

      this.soldierGunGroup.position.x = THREE.MathUtils.lerp(this.soldierGunGroup.position.x, targetX, delta * 15);
      this.soldierGunGroup.position.y = THREE.MathUtils.lerp(this.soldierGunGroup.position.y, targetY, delta * 15);
      this.soldierGunGroup.position.z = THREE.MathUtils.lerp(this.soldierGunGroup.position.z, targetZ, delta * 15);
      this.soldierGunGroup.rotation.x = THREE.MathUtils.lerp(this.soldierGunGroup.rotation.x, targetRotX, delta * 15);
      this.soldierGunGroup.rotation.y = THREE.MathUtils.lerp(this.soldierGunGroup.rotation.y, targetRotY, delta * 15);
    } else {
      // Genji Shuriken Arm Animation
      if (!this.dragonbladeActive) {
        this.genjiArmSwing = THREE.MathUtils.lerp(this.genjiArmSwing, 0, delta * 12);
        let targetX = this.baseGenjiArmPos.x;
        let targetY = this.baseGenjiArmPos.y + this.genjiArmSwing * 0.2;
        let targetZ = this.baseGenjiArmPos.z - this.genjiArmSwing * 0.3;
        this.genjiArmGroup.position.set(targetX, targetY, targetZ);
        this.genjiArmGroup.rotation.x = this.genjiArmSwing * 0.8;
      } else {
        // Katana Dynamic Slashing
        this.katanaSlashAnim = THREE.MathUtils.lerp(this.katanaSlashAnim, 0, delta * 10);
        let targetX = this.baseKatanaPos.x - this.katanaSlashAnim * 0.4;
        let targetY = this.baseKatanaPos.y + this.katanaSlashAnim * 0.2;
        let targetZ = this.baseKatanaPos.z - this.katanaSlashAnim * 0.2;
        this.katanaGroup.position.set(targetX, targetY, targetZ);
        this.katanaGroup.rotation.z = -0.2 - this.katanaSlashAnim * 2.2; // deep slash arc!
        this.katanaGroup.rotation.x = this.katanaSlashAnim * 1.5;
      }
    }
  }
}
