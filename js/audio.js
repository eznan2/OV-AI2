/**
 * Overwatch Sound System (Procedural Web Audio API Synthesizer)
 * Recreates authentic Overwatch sound effects with zero external audio assets!
 */

class OverwatchAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.volume = 0.8;
    this.voiceEnabled = true;
    this.healingSoundNode = null;
    this.healingGain = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  setVoiceEnabled(enabled) {
    this.voiceEnabled = enabled;
  }

  // --- SOLDIER: 76 PULSE RIFLE FIRE ---
  playPulseRifleShot() {
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Punchy transient oscillator (laser pop)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);

    oscGain.gain.setValueAtTime(0.35, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    // High frequency noise burst (kinetic crack)
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2400, t);
    noiseFilter.Q.setValueAtTime(3, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    // Sub bass thump
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, t);
    sub.frequency.exponentialRampToValueAtTime(35, t + 0.08);

    subGain.gain.setValueAtTime(0.3, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    // Connect
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    sub.connect(subGain);
    subGain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
    noise.start(t);
    noise.stop(t + 0.07);
    sub.start(t);
    sub.stop(t + 0.09);
  }

  // --- RELOAD SOUND (Mechanical magazine drop & snap lock) ---
  playReload() {
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Mag out (0.15s)
    setTimeout(() => {
      if (!this.ctx) return;
      const t1 = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const g1 = this.ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(220, t1);
      osc1.frequency.exponentialRampToValueAtTime(110, t1 + 0.1);
      g1.gain.setValueAtTime(0.18, t1);
      g1.gain.exponentialRampToValueAtTime(0.001, t1 + 0.1);
      osc1.connect(g1);
      g1.connect(this.masterGain);
      osc1.start(t1);
      osc1.stop(t1 + 0.12);
    }, 150);

    // Mag in click (0.75s)
    setTimeout(() => {
      if (!this.ctx) return;
      const t2 = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(450, t2);
      osc2.frequency.exponentialRampToValueAtTime(800, t2 + 0.06);
      g2.gain.setValueAtTime(0.25, t2);
      g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.07);
      osc2.connect(g2);
      g2.connect(this.masterGain);
      osc2.start(t2);
      osc2.stop(t2 + 0.08);
    }, 750);

    // Bolt slide chamber lock (1.1s)
    setTimeout(() => {
      if (!this.ctx) return;
      const t3 = this.ctx.currentTime;
      const osc3 = this.ctx.createOscillator();
      const g3 = this.ctx.createGain();
      osc3.type = 'sawtooth';
      osc3.frequency.setValueAtTime(750, t3);
      osc3.frequency.exponentialRampToValueAtTime(1200, t3 + 0.08);
      g3.gain.setValueAtTime(0.3, t3);
      g3.gain.exponentialRampToValueAtTime(0.001, t3 + 0.1);
      osc3.connect(g3);
      g3.connect(this.masterGain);
      osc3.start(t3);
      osc3.stop(t3 + 0.12);
    }, 1100);
  }

  // --- HELIX ROCKETS LAUNCH (High speed whoosh) ---
  playHelixLaunch() {
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.linearRampToValueAtTime(600, t + 0.18);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.35);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, t);

    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  playExplosion() {
    this.playHelixExplosion();
  }

  // --- HELIX ROCKETS EXPLOSION ---
  playHelixExplosion() {
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Sub rumble
    const sub = this.ctx.createOscillator();
    const subG = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(120, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.45);
    subG.gain.setValueAtTime(0.55, t);
    subG.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    sub.connect(subG);
    subG.connect(this.masterGain);

    // Noise blast
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, t);
    noiseFilter.frequency.linearRampToValueAtTime(200, t + 0.35);

    const noiseG = this.ctx.createGain();
    noiseG.gain.setValueAtTime(0.45, t);
    noiseG.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseG);
    noiseG.connect(this.masterGain);

    sub.start(t);
    sub.stop(t + 0.48);
    noise.start(t);
    noise.stop(t + 0.4);
  }

  // --- BODY HITMARKER SOUND (Subtle tick) ---
  playHitmarker() {
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.04);

    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // --- ICONIC OVERWATCH HEADSHOT "DINK!" SOUND ---
  playHeadshotDink() {
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Resonant twin frequencies characteristic of the metallic bell dink
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2480, t);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(3220, t);

    g.gain.setValueAtTime(0.42, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc1.connect(g);
    osc2.connect(g);
    g.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.3);
    osc2.stop(t + 0.3);
  }

  // --- ELIMINATION SOUND (Triumphant double-bell chime) ---
  playElimination() {
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, t); // A5
    osc1.frequency.setValueAtTime(1320, t + 0.08); // E6

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1100, t); // C#6
    osc2.frequency.setValueAtTime(1760, t + 0.08); // A6

    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc1.connect(g);
    osc2.connect(g);
    g.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.36);
    osc2.stop(t + 0.36);
  }

  // --- BIOTIC FIELD DEPLOY SOUND ---
  playBioticDeploy() {
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Metal beacon drop clank
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);

    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.13);

    // Warm chord swell
    [440, 554, 659].forEach((freq) => {
      const hOsc = this.ctx.createOscillator();
      const hGain = this.ctx.createGain();
      hOsc.type = 'sine';
      hOsc.frequency.setValueAtTime(freq, t + 0.05);

      hGain.gain.setValueAtTime(0.01, t + 0.05);
      hGain.gain.linearRampToValueAtTime(0.08, t + 0.25);
      hGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      hOsc.connect(hGain);
      hGain.connect(this.masterGain);
      hOsc.start(t + 0.05);
      hOsc.stop(t + 0.75);
    });
  }

  // --- BIOTIC FIELD CONTINUOUS HEAL LOOP ---
  startHealLoop() {
    if (this.healingSoundNode) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    this.healingSoundNode = this.ctx.createOscillator();
    this.healingSoundNode.type = 'sine';
    this.healingSoundNode.frequency.setValueAtTime(523.25, t); // C5

    this.healingGain = this.ctx.createGain();
    this.healingGain.gain.setValueAtTime(0.01, t);
    this.healingGain.gain.linearRampToValueAtTime(0.07, t + 0.2);

    this.healingSoundNode.connect(this.healingGain);
    this.healingGain.connect(this.masterGain);
    this.healingSoundNode.start();
  }

  stopHealLoop() {
    if (!this.healingSoundNode) return;
    const t = this.ctx.currentTime;
    this.healingGain.gain.linearRampToValueAtTime(0.0001, t + 0.2);
    setTimeout(() => {
      if (this.healingSoundNode) {
        this.healingSoundNode.stop();
        this.healingSoundNode.disconnect();
        this.healingSoundNode = null;
        this.healingGain = null;
      }
    }, 220);
  }

  // --- TACTICAL VISOR ACTIVATION & VOICE LINE ---
  playTacticalVisor() {
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Sci-fi high tech boot sweep
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(1600, t + 0.4);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, t);
    filter.Q.setValueAtTime(5, t);

    g.gain.setValueAtTime(0.35, t);
    g.gain.linearRampToValueAtTime(0.4, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.65);

    // Visor target lock chimes
    setTimeout(() => {
      if (!this.ctx) return;
      const tLock = this.ctx.currentTime;
      [800, 1200, 1600].forEach((freq, idx) => {
        const lOsc = this.ctx.createOscillator();
        const lG = this.ctx.createGain();
        lOsc.type = 'square';
        lOsc.frequency.setValueAtTime(freq, tLock + idx * 0.08);
        lG.gain.setValueAtTime(0.12, tLock + idx * 0.08);
        lG.gain.exponentialRampToValueAtTime(0.001, tLock + idx * 0.08 + 0.07);
        lOsc.connect(lG);
        lG.connect(this.masterGain);
        lOsc.start(tLock + idx * 0.08);
        lOsc.stop(tLock + idx * 0.08 + 0.08);
      });
    }, 150);

    // Soldier 76 Korean Voice line: "목표를 포착했다!" (I've got you in my sights!)
    if (this.voiceEnabled && 'speechSynthesis' in window) {
      setTimeout(() => {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance("목표를 포착했다!");
          utterance.lang = "ko-KR";
          utterance.rate = 1.05;
          utterance.pitch = 0.85; // Soldier's deep authoritative veteran voice
          utterance.volume = this.volume;
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.warn("Speech synthesis error:", e);
        }
      }, 100);
    }
  }

  playVisorReady() {
    this.playTacticalVisor();
  }

  // --- FOOTSTEP ---
  playFootstep(isSprint = false) {
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isSprint ? 120 : 90, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.05);

    g.gain.setValueAtTime(isSprint ? 0.12 : 0.07, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  // --- BOT LASER SHOT ---
  playBotLaser() {
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.12);

    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  // --- GENJI SOUND EFFECTS ---
  // Shuriken throw sound (Crisp metallic zip)
  playShurikenThrow(isFan = false) {
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(isFan ? 1600 : 1800, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);

    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  // Swift Strike (질풍참 - High speed blade dash swoosh)
  playSwiftStrike() {
    this.ensureContext();
    const t = this.ctx.currentTime;

    // High speed whoosh
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3000, t);
    filter.frequency.linearRampToValueAtTime(800, t + 0.2);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);

    // Blade slice tone
    const osc = this.ctx.createOscillator();
    const oscG = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.15);
    oscG.gain.setValueAtTime(0.3, t);
    oscG.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(oscG);
    oscG.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.25);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Deflect (튕겨내기 sword spin clash)
  playDeflect() {
    this.ensureContext();
    const t = this.ctx.currentTime;
    [1200, 1600, 2200].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + idx * 0.05 + 0.08);

      g.gain.setValueAtTime(0.22, t + idx * 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.09);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.1);
    });
  }

  playDeflectHit() {
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2800, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.08);

    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Dragonblade (용검 - "龍神の剣を喰らえ!" / 류진노 켄오 쿠라에!)
  playDragonblade() {
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Katana Unsheathe metallic ring
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(3200, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.35);

    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.45);

    // Dragon Roar Sub Rumble
    const sub = this.ctx.createOscillator();
    const subG = this.ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(160, t);
    sub.frequency.linearRampToValueAtTime(280, t + 0.25);
    sub.frequency.exponentialRampToValueAtTime(60, t + 0.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, t);

    subG.gain.setValueAtTime(0.4, t);
    subG.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    sub.connect(filter);
    filter.connect(subG);
    subG.connect(this.masterGain);

    sub.start(t);
    sub.stop(t + 0.85);

    // Genji Voice line: "龍神の剣を喰らえ! (Ryūjin no ken o kurae! / 류진노 켄오 쿠라에!)"
    if (this.voiceEnabled && 'speechSynthesis' in window) {
      setTimeout(() => {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance("류진노 켄오 쿠라에!");
          utterance.lang = "ja-JP"; // Japanese pronunciation or fallback
          utterance.rate = 1.1;
          utterance.pitch = 1.15;
          utterance.volume = this.volume;
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.warn("Speech synthesis error:", e);
        }
      }, 50);
    }
  }

  // Dragonblade Slash Swing
  playDragonSlash() {
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.18);

    g.gain.setValueAtTime(0.38, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.19);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Double Jump (Cybernetic air boost)
  playDoubleJump() {
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(920, t + 0.08);

    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // --- JUMP PAD SOUND (마인크래프트 슬라임 점프대 퐁! 바운스 사운드) ---
  playJumpPadLaunch() {
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Upward pitch bend spring boing (180Hz -> 680Hz)
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(720, t + 0.14);
    osc.frequency.exponentialRampToValueAtTime(340, t + 0.28);

    g.gain.setValueAtTime(0.01, t);
    g.gain.linearRampToValueAtTime(0.38, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    // Punchy slime squish impact transient
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(550, t);
    filter.Q.setValueAtTime(4.0, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(g);
    g.connect(this.masterGain);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.32);
    noise.start(t);
    noise.stop(t + 0.08);
  }

  // --- MINECRAFT VILLAGER SOUNDS (마인크래프트 주민 사운드) ---
  // Iconic nasal "Hrmm?!" / "Huuuh!" on damage
  playVillagerHurt() {
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    // Villager nasal pitch inflection (drops then rises slightly)
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(110, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(130, t + 0.22);

    // Formant vocal filter for nasal resonance
    const formant = this.ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(520, t);
    formant.Q.setValueAtTime(4.5, t);

    g.gain.setValueAtTime(0.01, t);
    g.gain.linearRampToValueAtTime(0.38, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(formant);
    formant.connect(g);
    g.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  // Villager death sound: Long nasal "Huuuugh..."
  playVillagerDeath() {
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(135, t);
    osc.frequency.linearRampToValueAtTime(75, t + 0.4);

    const formant = this.ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(480, t);
    formant.Q.setValueAtTime(4.0, t);

    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(formant);
    formant.connect(g);
    g.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.46);
  }

  // Emerald toss clink
  playEmeraldToss() {
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2100, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.12);

    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  // --- GIANT BOSS SOUND EFFECTS ---
  playBossRoar() {
    this.ensureContext();
    const t = this.ctx.currentTime;
    // Low rumbling sawtooth growl
    const osc1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(110, t);
    osc1.frequency.linearRampToValueAtTime(75, t + 0.4);
    osc1.frequency.exponentialRampToValueAtTime(35, t + 1.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + 1.2);

    g1.gain.setValueAtTime(0.01, t);
    g1.gain.linearRampToValueAtTime(0.55, t + 0.2);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc1.connect(filter);
    filter.connect(g1);
    g1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 1.25);
  }

  playBossFireball() {
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.35);

    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.36);
  }

  // --- LAVA TERRAIN SIZZLE / BURN SOUND ---
  playLavaBurn() {
    this.ensureContext();
    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.16);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2800, t);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    noise.start(t);
    noise.stop(t + 0.16);
  }

  // --- MONSTER HUNTER BOSS SOUND EFFECTS & TELEGRAPHS ---
  playTelegraphWarning() {
    this.ensureContext();
    const t = this.ctx.currentTime;
    // Dual high-pitch beep alarm
    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880 + i * 220, t + i * 0.12);
      g.gain.setValueAtTime(0.28, t + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.1);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.11);
    }
  }

  playBossChargeRoar() {
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(160, t + 0.5);
    osc.frequency.exponentialRampToValueAtTime(40, t + 1.2);
    g.gain.setValueAtTime(0.45, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 1.25);
  }

  playBossSlam() {
    this.ensureContext();
    const t = this.ctx.currentTime;
    // Heavy sub bass shockwave
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.7);
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.8);
    this.playExplosion();
  }

  playBossBreath() {
    this.ensureContext();
    const t = this.ctx.currentTime;
    // Roaring flame torrent white noise + low synth
    const bufferSize = this.ctx.sampleRate * 1.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, t);
    filter.Q.setValueAtTime(1.5, t);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    noise.start(t);
    noise.stop(t + 1.2);
  }

  playMeteorFall() {
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.7);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.72);
  }

  playSupernovaCharge() {
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.linearRampToValueAtTime(520, t + 2.0);
    g.gain.setValueAtTime(0.15, t);
    g.gain.linearRampToValueAtTime(0.6, t + 1.8);
    g.gain.exponentialRampToValueAtTime(0.001, t + 2.1);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 2.15);
  }

  playBossDefeat() {
    this.ensureContext();
    this.playExplosion();
    setTimeout(() => {
      if (this.ctx) this.playElimination();
    }, 200);
  }

  playVictoryFanfare() {
    this.ensureContext();
    this.playBossDefeat();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.65);
      }, i * 140);
    });
  }
}

// Global instance
window.audioEngine = new OverwatchAudioEngine();
