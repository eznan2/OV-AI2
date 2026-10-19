/**
 * Minecraft Villager Mob (마인크래프트 주민 AI)
 * Authentic blocky 3D model with unibrow, emerald eyes, big nose, folded arms,
 * Minecraft damage red-flash, walking leg swing animation, and "Hrmm!" sounds.
 */

// Preload the 4 user face textures using Base64 data URLs for 100% guaranteed immediate loading
const faceSources = (typeof window !== 'undefined' && window.FACE_DATA_URLS && window.FACE_DATA_URLS.length === 4)
  ? window.FACE_DATA_URLS
  : [
      'assets/faces/face_0.jpg',
      'assets/faces/face_1.jpg',
      'assets/faces/face_2.jpg',
      'assets/faces/face_3.jpg'
    ];

const faceTextureLoader = new THREE.TextureLoader();
const VILLAGER_FACE_TEXTURES = faceSources.map(src => {
  const tex = faceTextureLoader.load(src);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
});

class TrainingBot {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.id = options.id || Math.random().toString(36).substring(7);
    this.name = options.name || '전준성';
    this.type = options.type || 'patrol'; // 'stationary', 'patrol', 'combat', 'flick'
    this.basePos = options.position ? options.position.clone() : new THREE.Vector3(0, 0, 0);
    this.currentPos = this.basePos.clone();
    this.patrolRange = options.patrolRange || 8;
    this.patrolAxis = options.patrolAxis || 'x';
    this.patrolSpeed = options.patrolSpeed || 2.4;
    this.patrolDirection = 1;
    this.maxHealth = 200;
    this.health = 200;
    this.isDead = false;
    this.respawnTimer = 0;
    this.respawnDuration = 1.8;
    this.immortal = false;

    // Custom Face Photo Index (0, 1, 2, 3)
    this.faceIndex = options.faceIndex !== undefined ? options.faceIndex : Math.floor(Math.random() * VILLAGER_FACE_TEXTURES.length);
    this.faceTexture = VILLAGER_FACE_TEXTURES[this.faceIndex % VILLAGER_FACE_TEXTURES.length];

    // Combat Villager Emerald throw
    this.lastShootTime = 0;
    this.shootInterval = options.shootInterval || 3.0;
    this.customDamage = options.customDamage; // e.g. 10 for spawned Junseong bots

    // Visual Mesh Group
    this.group = new THREE.Group();
    this.group.position.copy(this.basePos);
    this.scene.add(this.group);

    // Hitbox references
    this.headMesh = null;
    this.bodyMesh = null;
    this.hitboxes = [];

    // Animation & Hurt
    this.flinchTimer = 0;
    this.walkAnimTime = Math.random() * Math.PI * 2;
    this.meshesToColor = []; // for Minecraft red hurt flash
    this.velY = 0;

    this.createPhotoCubeModel();
    this.createHealthBar();
  }

  createPhotoCubeModel() {
    // 3D Photo Cube Dimensions: 1.5m wide, 1.75m high, 0.42m depth
    const width = 1.5;
    const height = 1.75;
    const depth = 0.42;

    // 1. Dark Minecraft Obsidian Outer Casing
    const casingGeo = new THREE.BoxGeometry(width, height, depth);
    this.matCasing = new THREE.MeshStandardMaterial({
      color: 0x1c1e28,
      roughness: 0.6,
      metalness: 0.3
    });
    this.casingMesh = new THREE.Mesh(casingGeo, this.matCasing);
    this.casingMesh.position.set(0, height / 2, 0);
    this.casingMesh.castShadow = true;
    this.casingMesh.receiveShadow = true;
    this.group.add(this.casingMesh);
    this.meshesToColor.push(this.casingMesh);

    // 2. Full Front Photo Plate (Facing +Z) - MeshBasicMaterial with toneMapped: false for bright vibrant photo
    const photoGeo = new THREE.PlaneGeometry(width - 0.06, height - 0.06);
    this.matPhotoFront = new THREE.MeshBasicMaterial({
      map: this.faceTexture,
      transparent: false,
      toneMapped: false
    });
    this.photoFront = new THREE.Mesh(photoGeo, this.matPhotoFront);
    this.photoFront.position.set(0, height / 2, depth / 2 + 0.01);
    this.group.add(this.photoFront);
    this.meshesToColor.push(this.photoFront);

    // 3. Full Back Photo Plate (Facing -Z) - MeshBasicMaterial with toneMapped: false
    this.matPhotoBack = new THREE.MeshBasicMaterial({
      map: this.faceTexture,
      transparent: false,
      toneMapped: false
    });
    this.photoBack = new THREE.Mesh(photoGeo, this.matPhotoBack);
    this.photoBack.position.set(0, height / 2, -depth / 2 - 0.01);
    this.photoBack.rotation.y = Math.PI;
    this.group.add(this.photoBack);
    this.meshesToColor.push(this.photoBack);

    // 4. Hitboxes (Critical Headshot top 35% vs Body lower 65%)
    // Head Hitbox: Upper 0.6m of the 1.75m cube (y: 1.15m ~ 1.75m)
    const headHeight = 0.6;
    const headGeo = new THREE.BoxGeometry(width + 0.02, headHeight, depth + 0.04);
    const invisMat1 = new THREE.MeshBasicMaterial({ visible: false });
    this.headMesh = new THREE.Mesh(headGeo, invisMat1);
    this.headMesh.position.set(0, height - headHeight / 2, 0);
    this.headMesh.userData = { bot: this, isHead: true };
    this.group.add(this.headMesh);
    this.hitboxes.push(this.headMesh);

    // Body Hitbox: Lower 1.15m (y: 0.0m ~ 1.15m)
    const bodyHeight = height - headHeight;
    const bodyGeo = new THREE.BoxGeometry(width + 0.02, bodyHeight, depth + 0.04);
    const invisMat2 = new THREE.MeshBasicMaterial({ visible: false });
    this.bodyMesh = new THREE.Mesh(bodyGeo, invisMat2);
    this.bodyMesh.position.set(0, bodyHeight / 2, 0);
    this.bodyMesh.userData = { bot: this, isHead: false };
    this.group.add(this.bodyMesh);
    this.hitboxes.push(this.bodyMesh);

    // 5. Glowing Emerald Corner Neon Pillars
    const rodGeo = new THREE.BoxGeometry(0.08, height + 0.04, 0.08);
    this.matGlow = new THREE.MeshBasicMaterial({ color: 0x38e469 });
    const corners = [
      { x: -width / 2 + 0.03, z: depth / 2 + 0.01 },
      { x: width / 2 - 0.03, z: depth / 2 + 0.01 },
      { x: -width / 2 + 0.03, z: -depth / 2 - 0.01 },
      { x: width / 2 - 0.03, z: -depth / 2 - 0.01 }
    ];
    corners.forEach(c => {
      const rod = new THREE.Mesh(rodGeo, this.matGlow);
      rod.position.set(c.x, height / 2, c.z);
      this.group.add(rod);
    });

    // Special Wizard Hat for Combat Shooter Cube
    if (this.type === 'combat') {
      const hatGeo = new THREE.ConeGeometry(0.35, 0.5, 4);
      const hatMat = new THREE.MeshLambertMaterial({ color: 0x1f1f2e });
      const hat = new THREE.Mesh(hatGeo, hatMat);
      hat.position.set(0, height + 0.25, 0);
      this.group.add(hat);
    }
  }

  createHealthBar() {
    const canvas = document.createElement('canvas');
    canvas.width = 140;
    canvas.height = 28;
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
    this.hpSprite.scale.set(1.5, 0.3, 1);
    this.hpSprite.position.set(0, 2.3, 0);
    this.group.add(this.hpSprite);

    this.updateHealthBarTexture();
  }

  updateHealthBarTexture() {
    const ctx = this.hpCtx;
    ctx.clearRect(0, 0, 140, 28);

    if (this.isDead) {
      this.hpTexture.needsUpdate = true;
      return;
    }

    // Minecraft dark frame
    ctx.fillStyle = 'rgba(20, 15, 10, 0.9)';
    ctx.fillRect(0, 2, 140, 24);

    // Minecraft pixel border
    ctx.strokeStyle = '#38e469';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 3, 138, 22);

    // Health Fill (Minecraft Emerald green)
    const pct = Math.max(0, this.health / this.maxHealth);
    ctx.fillStyle = pct > 0.3 ? '#38e469' : '#ff2a4b';
    ctx.fillRect(4, 6, Math.floor(132 * pct), 16);

    // Segment lines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    for (let i = 1; i < 8; i++) {
      ctx.fillRect(4 + (132 / 8) * i - 1, 6, 2, 16);
    }

    this.hpTexture.needsUpdate = true;
  }

  takeDamage(amount, isHeadshot = false) {
    if (this.isDead) return { killed: false, actualDamage: 0 };

    const actualDamage = isHeadshot ? amount * 2 : amount;
    if (window.gameInstance && typeof window.gameInstance.recordDamage === 'function') {
      window.gameInstance.recordDamage(actualDamage);
    }
    if (!this.immortal) {
      this.health -= actualDamage;
    }

    // Minecraft Hurt Red Flash on Photo Cube
    this.flinchTimer = 0.18;
    if (this.matPhotoFront) this.matPhotoFront.color.setHex(0xff5555);
    if (this.matPhotoBack) this.matPhotoBack.color.setHex(0xff5555);
    if (this.matCasing) this.matCasing.color.setHex(0xff2222);

    // Sound effects
    if (isHeadshot) {
      window.audioEngine.playHeadshotDink();
    } else {
      window.audioEngine.playHitmarker();
    }
    // Authentic Minecraft hurt sound!
    window.audioEngine.playVillagerHurt();

    if (this.health <= 0 && !this.immortal) {
      this.die();
      return { killed: true, actualDamage, isHeadshot };
    }

    this.updateHealthBarTexture();
    return { killed: false, actualDamage, isHeadshot };
  }

  die() {
    this.isDead = true;
    this.health = 0;
    this.respawnTimer = this.respawnDuration;
    this.group.visible = false;
    this.updateHealthBarTexture();

    // Elimination sound + death sound
    window.audioEngine.playElimination();
    window.audioEngine.playVillagerDeath();

    // Minecraft white smoke poof cloud particles!
    if (window.particleSystem) {
      window.particleSystem.spawnVillagerDeathPoof(this.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)));
    }
  }

  respawn() {
    this.isDead = false;
    this.health = this.maxHealth;
    this.group.visible = true;
    this.group.position.copy(this.basePos);
    this.currentPos.copy(this.basePos);
    this.updateHealthBarTexture();

    // Reset photo cube colors to natural original
    if (this.matPhotoFront) this.matPhotoFront.color.setHex(0xffffff);
    if (this.matPhotoBack) this.matPhotoBack.color.setHex(0xffffff);
    if (this.matCasing) this.matCasing.color.setHex(0x1c1e28);

    if (window.particleSystem) {
      window.particleSystem.spawnHoloSpawnEffect(this.basePos.clone().add(new THREE.Vector3(0, 0.8, 0)));
    }
  }

  update(delta, playerPos, jumpPads) {
    if (this.isDead) {
      this.respawnTimer -= delta;
      if (this.respawnTimer <= 0) {
        this.respawn();
      }
      return;
    }

    // Hurt red-flash decay
    if (this.flinchTimer > 0) {
      this.flinchTimer -= delta;
      if (this.flinchTimer <= 0) {
        if (this.matPhotoFront) this.matPhotoFront.color.setHex(0xffffff);
        if (this.matPhotoBack) this.matPhotoBack.color.setHex(0xffffff);
        if (this.matCasing) this.matCasing.color.setHex(0x1c1e28);
      }
    }

    // Check Jump Pads for Photo Cube bounce!
    if (jumpPads && !this.isDead) {
      const bx = this.group.position.x;
      const bz = this.group.position.z;
      const by = this.group.position.y;
      for (const pad of jumpPads) {
        if (pad.cooldown > 0) continue;
        const dist = Math.sqrt((bx - pad.position.x) ** 2 + (bz - pad.position.z) ** 2);
        if (dist <= pad.radius && Math.abs(by - pad.position.y) < 1.0) {
          pad.cooldown = 0.5;
          pad.bounceAnim = 1.0;
          this.velY = 18.0;
          if (window.audioEngine) {
            window.audioEngine.playJumpPadLaunch();
            window.audioEngine.playVillagerHurt();
          }
          if (window.particleSystem) {
            window.particleSystem.spawnJumpPadBurst(pad.position);
          }
          break;
        }
      }
    }

    // Vertical gravity & Jump pad arc
    let currentY = this.basePos.y;
    if (this.velY !== 0 || this.group.position.y > this.basePos.y) {
      this.velY -= 26.0 * delta;
      currentY = Math.max(this.basePos.y, this.group.position.y + this.velY * delta);
      if (currentY <= this.basePos.y) {
        currentY = this.basePos.y;
        this.velY = 0;
      }
    }

    // Active Photo Cube Nextbot Movement & Animation
    this.walkAnimTime += delta * 5.5;
    const isGrounded = (this.velY === 0);
    const hop = isGrounded ? Math.abs(Math.sin(this.walkAnimTime * 2.5)) * 0.16 : 0;
    const tilt = isGrounded ? Math.sin(this.walkAnimTime * 2.5) * 0.08 : 0;

    if (this.casingMesh) this.casingMesh.rotation.z = tilt;
    if (this.photoFront) this.photoFront.rotation.z = tilt;
    if (this.photoBack) this.photoBack.rotation.z = -tilt;

    if (this.type === 'patrol' || this.type === 'combat') {
      const moveDelta = this.patrolSpeed * this.patrolDirection * delta;
      if (this.patrolAxis === 'x') {
        this.currentPos.x += moveDelta;
        if (Math.abs(this.currentPos.x - this.basePos.x) > this.patrolRange / 2) {
          this.patrolDirection *= -1;
        }
      } else {
        this.currentPos.z += moveDelta;
        if (Math.abs(this.currentPos.z - this.basePos.z) > this.patrolRange / 2) {
          this.patrolDirection *= -1;
        }
      }
      this.group.position.set(this.currentPos.x, currentY + hop, this.currentPos.z);
    } else {
      // Gentle idle breathing bob
      const idleBob = isGrounded ? Math.sin(this.walkAnimTime * 1.5) * 0.06 : 0;
      this.group.position.set(this.basePos.x, currentY + idleBob, this.basePos.z);
    }

    // Face toward player so the photo is clearly visible facing the player
    if (playerPos) {
      const lookTarget = new THREE.Vector3(playerPos.x, this.group.position.y, playerPos.z);
      this.group.lookAt(lookTarget);
    }

    // Combat Photo Cube throws Emeralds!
    if (this.type === 'combat' && playerPos) {
      const now = performance.now() / 1000;
      if (now - this.lastShootTime > this.shootInterval) {
        this.lastShootTime = now;
        this.shootAtPlayer(playerPos);
      }
    }
  }

  shootAtPlayer(playerPos) {
    if (!window.projectileSystem) return;
    const origin = this.group.position.clone().add(new THREE.Vector3(0, 1.2, 0.4));
    const dir = new THREE.Vector3().subVectors(playerPos, origin).normalize();
    const dmg = this.customDamage !== undefined ? this.customDamage : 20;
    window.projectileSystem.spawnEmerald(origin, dir, dmg);
    window.audioEngine.playEmeraldToss();
  }
}
