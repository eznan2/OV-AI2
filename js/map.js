/**
 * ============================================================================
 * Overwatch X Monster Hunter: Volcanic Lava Arena Map (용암 지형)
 * ============================================================================
 * Features:
 * 1. Molten Lava Sea & Gorges: Glowing, boiling magma restricting player movement.
 * 2. Tactical Obsidian & Basalt Battle Platforms: Safe walkable islands & bridges.
 * 3. Lava Hazard System: Stepping into lava slows player by 55% and burns rapidly!
 * 4. Jump Pads, High Ground Watchtower Fortress & Volcanic Atmosphere.
 */

class PracticeRangeMap {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    const originalAdd = this.scene.add.bind(this.scene);
    this.scene.add = (...objs) => {
      this.group.add(...objs);
    };

    this.colliders = [];
    this.clouds = [];
    this.jumpPads = [];
    this.lavaBurnTimer = 0;
    this.animTime = 0;

    // Define safe platform bounding boxes: { minX, maxX, minZ, maxZ, minY, maxY }
    this.safeZones = [
      // Spawn Deck (South)
      { minX: -10, maxX: 10, minZ: -17, maxZ: -6, minY: 0, maxY: 3.5 },
      // Main Center Battle Platform
      { minX: -13, maxX: 13, minZ: 6, maxZ: 36, minY: 0, maxY: 3.5 },
      // Connecting Bridge (Between Spawn & Center)
      { minX: -3.5, maxX: 3.5, minZ: -7, maxZ: 7, minY: 0, maxY: 3.5 },
      // East Flank Stepping Stone 1
      { minX: 13.5, maxX: 18.5, minZ: 10, maxZ: 15, minY: 0, maxY: 3.5 },
      // East Flank Stepping Stone 2
      { minX: 13.5, maxX: 18.5, minZ: 20, maxZ: 25, minY: 0, maxY: 3.5 },
      // East Flank Stepping Stone 3
      { minX: 13.5, maxX: 18.5, minZ: 30, maxZ: 35, minY: 0, maxY: 3.5 }
    ];

    this.createTextures();
    this.buildMap();
    this.setupLighting();
    this.spawnMinecraftClouds();
    this.spawnJumpPads();
    this.scene.add = originalAdd;
  }

  createTextures() {
    // 1. Procedural Molten Lava Texture (32x32) with vibrant magma veins
    const lavaCanvas = document.createElement('canvas');
    lavaCanvas.width = 32;
    lavaCanvas.height = 32;
    const lCtx = lavaCanvas.getContext('2d');
    for (let x = 0; x < 32; x++) {
      for (let y = 0; y < 32; y++) {
        const n = Math.sin(x * 0.4) * Math.cos(y * 0.4) + Math.sin((x + y) * 0.25);
        if (n > 0.4) {
          // Yellow-orange hotspot
          lCtx.fillStyle = '#ffcc00';
        } else if (n > -0.2) {
          // Vivid fiery red-orange
          lCtx.fillStyle = '#ff4500';
        } else {
          // Dark crust magma
          lCtx.fillStyle = '#b71c1c';
        }
        lCtx.fillRect(x, y, 1, 1);
      }
    }
    this.texLava = new THREE.CanvasTexture(lavaCanvas);
    this.texLava.magFilter = THREE.NearestFilter;
    this.texLava.minFilter = THREE.NearestFilter;
    this.texLava.wrapS = THREE.RepeatWrapping;
    this.texLava.wrapT = THREE.RepeatWrapping;
    this.texLava.repeat.set(20, 26);

    // 2. Dark Crying Obsidian Block Texture (16x16)
    const obsCanvas = document.createElement('canvas');
    obsCanvas.width = 16;
    obsCanvas.height = 16;
    const oCtx = obsCanvas.getContext('2d');
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const rand = Math.random();
        if (rand > 0.88) {
          oCtx.fillStyle = '#9c27b0'; // Purple crying vein
        } else {
          const shade = 18 + Math.floor(rand * 22);
          oCtx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.8)}, ${shade + 10})`;
        }
        oCtx.fillRect(x, y, 1, 1);
      }
    }
    this.texObsidian = new THREE.CanvasTexture(obsCanvas);
    this.texObsidian.magFilter = THREE.NearestFilter;
    this.texObsidian.minFilter = THREE.NearestFilter;
    this.texObsidian.wrapS = THREE.RepeatWrapping;
    this.texObsidian.wrapT = THREE.RepeatWrapping;
    this.texObsidian.repeat.set(10, 14);

    // 3. Basalt / Netherite Plate Texture (16x16)
    const basaltCanvas = document.createElement('canvas');
    basaltCanvas.width = 16;
    basaltCanvas.height = 16;
    const bCtx = basaltCanvas.getContext('2d');
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const val = 42 + Math.floor(Math.random() * 24);
        bCtx.fillStyle = `rgb(${val + 10}, ${val}, ${val})`;
        bCtx.fillRect(x, y, 1, 1);
      }
    }
    this.texBasalt = new THREE.CanvasTexture(basaltCanvas);
    this.texBasalt.magFilter = THREE.NearestFilter;
    this.texBasalt.minFilter = THREE.NearestFilter;
    this.texBasalt.wrapS = THREE.RepeatWrapping;
    this.texBasalt.wrapT = THREE.RepeatWrapping;
    this.texBasalt.repeat.set(6, 6);

    // 4. Magma Crust Texture (16x16)
    const magmaCanvas = document.createElement('canvas');
    magmaCanvas.width = 16;
    magmaCanvas.height = 16;
    const mCtx = magmaCanvas.getContext('2d');
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        if ((x + y) % 5 === 0 || (x * 3) % 7 === 0) {
          mCtx.fillStyle = '#ff5722';
        } else {
          mCtx.fillStyle = '#2d0e0e';
        }
        mCtx.fillRect(x, y, 1, 1);
      }
    }
    this.texMagma = new THREE.CanvasTexture(magmaCanvas);
    this.texMagma.magFilter = THREE.NearestFilter;
    this.texMagma.minFilter = THREE.NearestFilter;

    // 5. Crystalline Glacial Blue Ice Texture (32x32)
    const iceCanvas = document.createElement('canvas');
    iceCanvas.width = 32;
    iceCanvas.height = 32;
    const iCtx = iceCanvas.getContext('2d');
    for (let x = 0; x < 32; x++) {
      for (let y = 0; y < 32; y++) {
        const val = Math.sin(x * 0.35) * Math.cos(y * 0.35) + Math.sin((x - y) * 0.2);
        if (val > 0.35) {
          iCtx.fillStyle = '#b3e5fc'; // bright frost crystal
        } else if (val > -0.25) {
          iCtx.fillStyle = '#4fc3f7'; // shimmering glacial ice
        } else {
          iCtx.fillStyle = '#0288d1'; // deep blue packed ice
        }
        iCtx.fillRect(x, y, 1, 1);
      }
    }
    this.texIce = new THREE.CanvasTexture(iceCanvas);
    this.texIce.magFilter = THREE.NearestFilter;
    this.texIce.minFilter = THREE.NearestFilter;
    this.texIce.wrapS = THREE.RepeatWrapping;
    this.texIce.wrapT = THREE.RepeatWrapping;
    this.texIce.repeat.set(16, 20);

    // 6. Frost Snow Texture (16x16)
    const snowCanvas = document.createElement('canvas');
    snowCanvas.width = 16;
    snowCanvas.height = 16;
    const snCtx = snowCanvas.getContext('2d');
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const shade = 230 + Math.floor(Math.random() * 25);
        snCtx.fillStyle = `rgb(${shade}, ${shade}, 255)`;
        snCtx.fillRect(x, y, 1, 1);
      }
    }
    this.texSnow = new THREE.CanvasTexture(snowCanvas);
    this.texSnow.magFilter = THREE.NearestFilter;
    this.texSnow.minFilter = THREE.NearestFilter;
    this.texSnow.wrapS = THREE.RepeatWrapping;
    this.texSnow.wrapT = THREE.RepeatWrapping;
    this.texSnow.repeat.set(8, 8);
  }

  buildMap() {
    // --- Lava Materials ---
    this.matLava = new THREE.MeshBasicMaterial({
      map: this.texLava,
      color: 0xff3d00
    });

    this.matObsidian = new THREE.MeshStandardMaterial({
      map: this.texObsidian,
      roughness: 0.4,
      metalness: 0.7
    });

    this.matBasalt = new THREE.MeshStandardMaterial({
      map: this.texBasalt,
      roughness: 0.6,
      metalness: 0.4
    });

    this.matMagma = new THREE.MeshBasicMaterial({
      map: this.texMagma
    });

    // --- Ice Materials (제 2 장 얼음 지형) ---
    this.matIceLake = new THREE.MeshStandardMaterial({
      map: this.texIce,
      color: 0x80d8ff,
      roughness: 0.08,
      metalness: 0.25,
      transparent: true,
      opacity: 0.94
    });

    this.matIcePlatform = new THREE.MeshStandardMaterial({
      map: this.texIce,
      color: 0x0277bd,
      roughness: 0.15,
      metalness: 0.45
    });

    this.matIceBasalt = new THREE.MeshStandardMaterial({
      map: this.texSnow,
      color: 0x4fc3f7,
      roughness: 0.35,
      metalness: 0.3
    });

    this.matSnowRim = new THREE.MeshBasicMaterial({
      color: 0xe1f5fe
    });

    const matLava = this.matLava;
    const matObsidian = this.matObsidian;
    const matBasalt = this.matBasalt;
    const matMagma = this.matMagma;

    // 1. BASE MOLTEN LAVA LAKE (56m x 78m at y = -0.55)
    // Stepping into this lake severely restricts speed and burns!
    const lavaGeo = new THREE.BoxGeometry(56, 1.2, 78);
    this.lavaMesh = new THREE.Mesh(lavaGeo, matLava);
    this.lavaMesh.position.set(0, -0.6, 12);
    this.scene.add(this.lavaMesh);

    // 2. SPAWN DECK (South Obsidian Platform: 18m x 10m)
    const spawnDeckGeo = new THREE.BoxGeometry(18, 1.2, 10);
    const spawnDeck = new THREE.Mesh(spawnDeckGeo, matObsidian);
    spawnDeck.position.set(0, 0, -11.5);
    spawnDeck.receiveShadow = true;
    this.scene.add(spawnDeck);
    this.colliders.push(spawnDeck);

    // Spawn Deck Border Rim
    const rimGeo = new THREE.BoxGeometry(18.4, 0.3, 0.4);
    const rimMesh = new THREE.Mesh(rimGeo, matMagma);
    rimMesh.position.set(0, 0.65, -6.3);
    this.scene.add(rimMesh);

    // 3. MAIN CENTRAL BATTLE ARENA (Obsidian & Netherite: 24m x 28m)
    const arenaGeo = new THREE.BoxGeometry(24, 1.2, 28);
    const arena = new THREE.Mesh(arenaGeo, matObsidian);
    arena.position.set(0, 0, 21);
    arena.receiveShadow = true;
    this.scene.add(arena);
    this.colliders.push(arena);

    // Magma Inlaid Runes & Battle Ring Lines
    const ringGeo = new THREE.RingGeometry(5.2, 5.8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff3d00, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.62, 21);
    this.scene.add(ring);

    // Distance Lines (10m, 20m, 30m, 40m)
    const distData = [
      { z: 10, col: 0xffffff, label: '10m' },
      { z: 20, col: 0xffeb3b, label: '20m' },
      { z: 30, col: 0xff9800, label: '30m' }
    ];
    distData.forEach(d => {
      const lineGeo = new THREE.BoxGeometry(22, 0.1, 0.6);
      const lineMat = new THREE.MeshBasicMaterial({ color: d.col });
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.position.set(0, 0.62, d.z);
      this.scene.add(lineMesh);
      this.createMinecraftSign(-11, d.z, d.label);
      this.createMinecraftSign(11, d.z, d.label);
    });

    // 4. CONNECTING OBSIDIAN BRIDGE (Between Spawn Deck & Battle Arena: 6m wide x 12m long)
    const bridgeGeo = new THREE.BoxGeometry(6, 1.2, 12);
    const bridge = new THREE.Mesh(bridgeGeo, matBasalt);
    bridge.position.set(0, 0, 0);
    bridge.receiveShadow = true;
    this.scene.add(bridge);
    this.colliders.push(bridge);

    // Bridge Safety Guard Rails (Low Magma pillars)
    [-3.2, 3.2].forEach(bx => {
      for (let bz = -5; bz <= 5; bz += 2.5) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.3), matMagma);
        post.position.set(bx, 0.7, bz);
        this.scene.add(post);
      }
    });

    // (2층 고지대 및 경사로는 전면 삭제하여 평지 전투 지형으로 통일)

    // 6. EAST STEPPING STONES (Across the boiling lava gorge)
    const stoneGeo = new THREE.CylinderGeometry(2.2, 2.6, 1.4, 8);
    [12, 22, 32].forEach(sz => {
      const stone = new THREE.Mesh(stoneGeo, matBasalt);
      stone.position.set(16, 0, sz);
      stone.receiveShadow = true;
      this.scene.add(stone);
      this.colliders.push(stone);

      // Glowing Magma Cap on stepping stone
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.1, 8), matMagma);
      cap.position.set(16, 0.72, sz);
      this.scene.add(cap);
    });

    // 7. TACTICAL COVER OBSTACLES (Basalt Columns with Nether Fire)
    const covers = [
      { x: -6, z: 12, w: 2.2, h: 2.8, d: 2.2 },
      { x: 6, z: 12, w: 2.2, h: 2.8, d: 2.2 },
      { x: -6, z: 28, w: 2.2, h: 2.8, d: 2.2 },
      { x: 6, z: 28, w: 2.2, h: 2.8, d: 2.2 }
    ];
    covers.forEach(c => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(c.w, c.h, c.d), matObsidian);
      m.position.set(c.x, c.h / 2, c.z);
      m.castShadow = true;
      m.receiveShadow = true;
      this.scene.add(m);
      this.colliders.push(m);

      // Flame torch on top
      this.createTorch(c.x, c.h + 0.4, c.z);
    });

    // 8. PERIMETER BOUNDARY WALLS (Dark Netherite Ramparts)
    const wallH = 12;
    const walls = [
      { x: 0, z: 51, w: 56, d: 2 },
      { x: 0, z: -20, w: 56, d: 2 },
      { x: -28, z: 15, w: 2, d: 74 },
      { x: 28, z: 15, w: 2, d: 74 }
    ];
    walls.forEach(bw => {
      const wMesh = new THREE.Mesh(new THREE.BoxGeometry(bw.w, wallH, bw.d), matObsidian);
      wMesh.position.set(bw.x, wallH / 2 - 1, bw.z);
      this.scene.add(wMesh);
      this.colliders.push(wMesh);
    });

    // 9. VOLCANIC CRIMSON / ARCTIC AURORA SKY SPHERE
    const skyGeo = new THREE.SphereGeometry(150, 32, 24);
    this.skyMat = new THREE.MeshBasicMaterial({ color: 0x220505, side: THREE.BackSide });
    this.skyMesh = new THREE.Mesh(skyGeo, this.skyMat);
    this.scene.add(this.skyMesh);
  }

  // Check if player position is on safe platform or burning in lava!
  isPositionSafe(pos) {
    // If high up on watchtower or jumping
    if (pos.y > 2.2) return true;

    // Check each safe platform bounding box
    for (const z of this.safeZones) {
      if (pos.x >= z.minX && pos.x <= z.maxX &&
          pos.z >= z.minZ && pos.z <= z.maxZ) {
        return true;
      }
    }
    return false;
  }

  checkLavaContact(playerPos, delta) {
    const isSafe = this.isPositionSafe(playerPos);
    this.lavaBurnTimer -= delta;

    if (!isSafe && playerPos.y <= 1.85) {
      const isIce = (this.currentTheme === 'ice');
      const shouldApplyDmg = this.lavaBurnTimer <= 0;
      if (shouldApplyDmg) {
        this.lavaBurnTimer = isIce ? 0.45 : 0.35;
      }
      return {
        onLava: true,
        speedMultiplier: isIce ? 0.35 : 0.45,
        applyDamage: shouldApplyDmg,
        damage: isIce ? 12 : 18
      };
    }

    return {
      onLava: false,
      speedMultiplier: 1.0,
      applyDamage: false,
      damage: 0
    };
  }

  createMinecraftSign(x, z, text) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 1.4, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x140e1f, roughness: 0.6 })
    );
    post.position.y = 0.7;
    group.add(post);

    const signCanvas = document.createElement('canvas');
    signCanvas.width = 256;
    signCanvas.height = 128;
    const sCtx = signCanvas.getContext('2d');
    sCtx.fillStyle = '#1c0c14';
    sCtx.fillRect(0, 0, 256, 128);
    sCtx.strokeStyle = '#ff3d00';
    sCtx.lineWidth = 6;
    sCtx.strokeRect(4, 4, 248, 120);

    sCtx.font = 'bold 36px "Rajdhani", sans-serif';
    sCtx.fillStyle = '#ff6e40';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText(text, 128, 64);

    const sTex = new THREE.CanvasTexture(signCanvas);
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.7, 0.1),
      new THREE.MeshBasicMaterial({ map: sTex })
    );
    board.position.y = 1.4;
    group.add(board);

    this.scene.add(group);
  }

  createTorch(x, y, z) {
    const torchGeo = new THREE.BoxGeometry(0.16, 0.6, 0.16);
    const torchMat = new THREE.MeshStandardMaterial({ color: 0x4a1414 });
    const torch = new THREE.Mesh(torchGeo, torchMat);
    torch.position.set(x, y, z);
    this.scene.add(torch);

    // Fiery Flame Core
    const flameGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff7043 });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, y + 0.35, z);
    this.scene.add(flame);

    const light = new THREE.PointLight(0xff5722, 1.4, 12);
    light.position.set(x, y + 0.5, z);
    this.scene.add(light);
  }

  spawnJumpPads() {
    const padLocations = [
      { x: -8, y: 0.6, z: 14 },
      { x: 8, y: 0.6, z: 14 },
      { x: 0, y: 0.6, z: 8 }
    ];

    padLocations.forEach((loc, i) => {
      const padGroup = new THREE.Group();
      padGroup.position.set(loc.x, loc.y, loc.z);

      const frameGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.2, 16);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x1f142b, roughness: 0.5 });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      padGroup.add(frameMesh);

      const padGeo = new THREE.CylinderGeometry(1.35, 1.35, 0.15, 16);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0x38e469,
        emissive: 0x1faa46,
        transparent: true,
        opacity: 0.9
      });
      const padMesh = new THREE.Mesh(padGeo, padMat);
      padMesh.position.y = 0.08;
      padGroup.add(padMesh);

      this.scene.add(padGroup);
      this.jumpPads.push({
        position: new THREE.Vector3(loc.x, loc.y, loc.z),
        radius: 1.5,
        verticalForce: 19.0, // Super vertical launch force!
        cooldown: 0,
        mesh: padMesh,
        bounceAnim: 0
      });
    });
  }

  spawnMinecraftClouds() {
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0x5a1818,
      transparent: true,
      opacity: 0.65
    });
    for (let i = 0; i < 5; i++) {
      const cg = new THREE.BoxGeometry(22 + Math.random() * 14, 2.5, 16 + Math.random() * 12);
      const cm = new THREE.Mesh(cg, cloudMat);
      cm.position.set((Math.random() - 0.5) * 80, 38 + i * 2, (Math.random() - 0.5) * 80);
      this.scene.add(cm);
      this.clouds.push(cm);
    }
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xff6644, 0.65);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xff8866, 1.1);
    this.dirLight.position.set(25, 45, 15);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 100;
    this.dirLight.shadow.camera.left = -35;
    this.dirLight.shadow.camera.right = 35;
    this.dirLight.shadow.camera.top = 45;
    this.dirLight.shadow.camera.bottom = -35;
    this.scene.add(this.dirLight);
  }

  // Apply Map Theme: 'lava' (제 1 장) vs 'ice' (제 2 장 얼음 지형)
  applyTheme(theme = 'lava') {
    this.currentTheme = theme;
    if (theme === 'ice') {
      // Frozen Ice Sea
      if (this.lavaMesh) {
        this.lavaMesh.material = this.matIceLake;
      }
      // Frozen Ice Platforms
      if (this.colliders) {
        this.colliders.forEach(c => {
          if (c && c.material) {
            c.material = this.matIcePlatform;
          }
        });
      }
      // Deep Polar Night Sky
      if (this.skyMat) {
        this.skyMat.color.setHex(0x041326);
      }
      // Pale Glacial Sunlight & Cyan Ambient
      if (this.dirLight) {
        this.dirLight.color.setHex(0xcbefff);
        this.dirLight.intensity = 1.35;
      }
      if (this.ambientLight) {
        this.ambientLight.color.setHex(0x81d4fa);
        this.ambientLight.intensity = 0.75;
      }
    } else {
      // Lava Theme
      if (this.lavaMesh) {
        this.lavaMesh.material = this.matLava;
      }
      if (this.colliders) {
        this.colliders.forEach(c => {
          if (c && c.material) {
            c.material = this.matObsidian;
          }
        });
      }
      if (this.skyMat) {
        this.skyMat.color.setHex(0x220505);
      }
      if (this.dirLight) {
        this.dirLight.color.setHex(0xff8866);
        this.dirLight.intensity = 1.1;
      }
      if (this.ambientLight) {
        this.ambientLight.color.setHex(0xff6644);
        this.ambientLight.intensity = 0.65;
      }
    }
  }

  update(delta) {
    this.animTime += delta;

    // Animate Molten Lava Surface Flow
    if (this.texLava) {
      this.texLava.offset.x = (this.animTime * 0.04) % 1;
      this.texLava.offset.y = (this.animTime * 0.06) % 1;
    }

    // Clouds Drift
    this.clouds.forEach(c => {
      c.position.x += delta * 1.5;
      if (c.position.x > 60) c.position.x = -60;
    });

    // Jump pads cooldown
    this.jumpPads.forEach(pad => {
      if (pad.cooldown > 0) pad.cooldown -= delta;
      if (pad.bounceAnim > 0) {
        pad.bounceAnim -= delta * 3;
        const scale = 1.0 + Math.sin(pad.bounceAnim * Math.PI) * 0.4;
        pad.mesh.scale.set(scale, 1, scale);
      }
    });
  }
}
