/**
 * Overwatch HUD & UI Controller
 * Manages Soldier 76 & Genji HUD switching, Deflect/Dragonblade overlays, and Hero Select Modal.
 */

class UIController {
  constructor() {
    // HUD Elements
    this.elCrosshair = document.getElementById('crosshair');
    this.elHitmarker = document.getElementById('hitmarker');
    this.elElimBanner = document.getElementById('elim-banner');
    this.elElimTarget = document.getElementById('elim-target-name');
    this.elVisorOverlay = document.getElementById('visor-overlay');
    this.elVisorLockBox = document.getElementById('visor-lock-box');
    this.elDeflectOverlay = document.getElementById('deflect-overlay');
    this.elDragonOverlay = document.getElementById('dragonblade-overlay');

    // Stats
    this.elStatKills = document.getElementById('stat-kills');
    this.elStatAcc = document.getElementById('stat-accuracy');
    this.elStatHeadshot = document.getElementById('stat-headshot');
    this.elStatTimer = document.getElementById('stat-timer');
    this.elStatScore = document.getElementById('stat-score');
    this.elTimerBox = document.getElementById('challenge-timer-box');
    this.elScoreBox = document.getElementById('challenge-score-box');
    this.elModeDisplay = document.getElementById('mode-display');

    // Health
    this.elHpCurrent = document.getElementById('hp-current');
    this.elHpMax = document.getElementById('hp-max');
    this.elHpBarFill = document.getElementById('hp-bar-fill');

    // Hero Portrait & Name
    this.elPortraitAvatar = document.getElementById('portrait-avatar');
    this.elPortraitHeroName = document.getElementById('portrait-hero-name');

    // Ultimate
    this.elUltWrapper = document.getElementById('ult-wrapper');
    this.elUltCircle = document.getElementById('ult-circle-bar');
    this.elUltPercent = document.getElementById('ult-percent');
    this.elUltReadyBanner = document.getElementById('ult-ready-banner');

    // Ability Slots
    this.elGlyphAb1 = document.getElementById('glyph-ab-1');
    this.elNameAb1 = document.getElementById('name-ab-1');
    this.elCdOverlay1 = document.getElementById('cd-overlay-1');
    this.elCdTimer1 = document.getElementById('cd-timer-1');
    this.elSprintActiveGlow = document.getElementById('sprint-active-glow');

    this.elGlyphAb2 = document.getElementById('glyph-ab-2');
    this.elNameAb2 = document.getElementById('name-ab-2');
    this.elCdOverlay2 = document.getElementById('cd-overlay-2');
    this.elCdTimer2 = document.getElementById('cd-timer-2');

    this.elGlyphAb3 = document.getElementById('glyph-ab-3');
    this.elNameAb3 = document.getElementById('name-ab-3');
    this.elCdOverlay3 = document.getElementById('cd-overlay-3');
    this.elCdTimer3 = document.getElementById('cd-timer-3');

    // Weapon & Ammo
    this.elWeaponLabel = document.getElementById('weapon-label');
    this.elAmmoCurrent = document.getElementById('ammo-current');
    this.elAmmoMax = document.getElementById('ammo-max');
    this.elAmmoBarFill = document.getElementById('ammo-bar-fill');
    this.elReloadPrompt = document.getElementById('reload-prompt');

    // Modals
    this.elStartScreen = document.getElementById('start-screen');
    this.elSettingsModal = document.getElementById('settings-modal');
    this.elHeroModal = document.getElementById('hero-modal');
    this.elStageSelectModal = document.getElementById('stage-select-modal');
    this.elMissionFailedModal = document.getElementById('mission-failed-modal');

    // Lives HUD Elements
    this.elHudLivesBox = document.getElementById('hud-lives-box');
    this.elLivesCountText = document.getElementById('lives-count-text');
    this.elLifeHearts = [
      document.getElementById('life-1'),
      document.getElementById('life-2'),
      document.getElementById('life-3')
    ];

    // Quest, Killfeed, Announcements, Playtime, Game Clear
    this.elQuestTracker = document.getElementById('quest-tracker');
    this.elQuestTitle = document.getElementById('quest-title');
    this.elQuestBarFill = document.getElementById('quest-bar-fill');
    this.elQuestCounter = document.getElementById('quest-counter');

    this.elKillfeedContainer = document.getElementById('killfeed-container');

    this.elCenterAnnouncement = document.getElementById('center-announcement-banner');
    this.elAnnounceTitle = document.getElementById('announce-title');
    this.elAnnounceDesc = document.getElementById('announce-desc');

    this.elPlaytimeVal = document.getElementById('playtime-val');

    this.elGameClearModal = document.getElementById('game-clear-modal');
    this.elClearStageBadge = document.getElementById('clear-stage-badge');
    this.elClearTitleText = document.getElementById('clear-title-text');
    this.elClearSubtitleText = document.getElementById('clear-subtitle-text');
    this.elClearStarStatus = document.getElementById('clear-star-status');
    this.elClearStars = [
      document.getElementById('cstar-1'),
      document.getElementById('cstar-2'),
      document.getElementById('cstar-3')
    ];
    this.elClearImg = document.getElementById('clear-img');
    this.elCsTime = document.getElementById('cs-time');
    this.elCsDeaths = document.getElementById('cs-deaths');
    this.elCsAcc = document.getElementById('cs-accuracy');
    this.elCsHs = document.getElementById('cs-headshot');
    this.elCsKills = document.getElementById('cs-kills');
    this.elCsDamage = document.getElementById('cs-damage');

    this.elimTimeout = null;
    this.hitmarkerTimeout = null;
    this.announcementTimeout = null;
    this.currentHero = 'soldier';

    this.setupModalEvents();
  }

  setupModalEvents() {
    // Settings modal toggle
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const btnResume = document.getElementById('btn-resume-game');

    if (btnOpenSettings) {
      btnOpenSettings.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showSettings(true);
      });
    }

    if (btnCloseSettings) {
      btnCloseSettings.addEventListener('click', () => this.showSettings(false));
    }

    if (btnResume) {
      btnResume.addEventListener('click', () => {
        this.showSettings(false);
        if (window.gameInstance) window.gameInstance.requestPointerLock();
      });
    }

    // Hero select modal toggle
    const btnOpenHero = document.getElementById('btn-open-hero-select');
    const btnSwitchHeroStart = document.getElementById('btn-switch-hero-start');
    const btnCloseHero = document.getElementById('btn-close-hero-modal');

    if (btnOpenHero) {
      btnOpenHero.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showHeroModal(true);
      });
    }

    if (btnSwitchHeroStart) {
      btnSwitchHeroStart.addEventListener('click', (e) => {
        if (e) e.stopPropagation();
        this.showStartScreen(false);
        this.showHeroModal(true);
      });
    }

    if (btnCloseHero) {
      btnCloseHero.addEventListener('click', (e) => {
        if (e) e.stopPropagation();
        this.showHeroModal(false);
        if (window.gameInstance && window.gameInstance.gameMode === 'menu') {
          this.showStartScreen(true);
        }
      });
    }

    // Roster Card Clicks
    const cardSoldier = document.getElementById('card-hero-soldier');
    const cardGenji = document.getElementById('card-hero-genji');

    if (cardSoldier) {
      cardSoldier.addEventListener('click', () => {
        this.selectHero('soldier');
      });
    }

    if (cardGenji) {
      cardGenji.addEventListener('click', () => {
        this.selectHero('genji');
      });
    }

    // Settings inputs
    const sliderSens = document.getElementById('slider-sens');
    const sensVal = document.getElementById('sens-val');
    if (sliderSens) {
      sliderSens.addEventListener('input', (e) => {
        sensVal.textContent = e.target.value;
        if (window.playerController) {
          window.playerController.sensitivity = parseFloat(e.target.value);
        }
      });
    }

    const chkInvert = document.getElementById('chk-invert-y');
    if (chkInvert) {
      chkInvert.addEventListener('change', (e) => {
        if (window.playerController) {
          window.playerController.invertY = e.target.checked;
        }
      });
    }

    // Crosshair customization
    const selectCh = document.getElementById('select-crosshair');
    if (selectCh) {
      selectCh.addEventListener('change', (e) => {
        this.elCrosshair.className = `crosshair ${e.target.value}`;
      });
    }

    const selectChColor = document.getElementById('select-ch-color');
    if (selectChColor) {
      selectChColor.addEventListener('change', (e) => {
        const color = e.target.value;
        const lines = this.elCrosshair.querySelectorAll('.crosshair-line, .crosshair-dot');
        lines.forEach(l => l.style.backgroundColor = color);
        const circle = this.elCrosshair.querySelector('.crosshair-circle');
        if (circle) circle.style.borderColor = color;
      });
    }

    // Volume
    const sliderVol = document.getElementById('slider-volume');
    const volVal = document.getElementById('volume-val');
    if (sliderVol) {
      sliderVol.addEventListener('input', (e) => {
        volVal.textContent = `${e.target.value}%`;
        window.audioEngine.setVolume(parseInt(e.target.value) / 100);
      });
    }

    const chkVoice = document.getElementById('chk-voice');
    if (chkVoice) {
      chkVoice.addEventListener('change', (e) => {
        window.audioEngine.setVoiceEnabled(e.target.checked);
      });
    }

    // Reset stats
    const btnResetStats = document.getElementById('btn-reset-stats');
    if (btnResetStats) {
      btnResetStats.addEventListener('click', () => {
        if (window.gameInstance) window.gameInstance.resetStats();
      });
    }

    // Main Menu Cards / Buttons: [게임 플레이] vs [훈련장 가기]
    const openStageSelectHandler = (e) => {
      if (e) e.stopPropagation();
      if (window.audioEngine) window.audioEngine.ensureContext();
      this.showStartScreen(false);
      this.showStageSelect(true);
    };

    const cardPlay = document.getElementById('card-choice-play');
    const btnMainPlay = document.getElementById('btn-main-play');
    if (cardPlay) cardPlay.addEventListener('click', openStageSelectHandler);
    if (btnMainPlay) btnMainPlay.addEventListener('click', openStageSelectHandler);

    const enterPracticeHandler = (e) => {
      if (e) e.stopPropagation();
      if (window.audioEngine) window.audioEngine.ensureContext();
      this.hideAllModals();
      if (window.gameInstance) window.gameInstance.startPracticeRange();
    };

    const cardPractice = document.getElementById('card-choice-practice');
    const btnMainPractice = document.getElementById('btn-main-practice');
    if (cardPractice) cardPractice.addEventListener('click', enterPracticeHandler);
    if (btnMainPractice) btnMainPractice.addEventListener('click', enterPracticeHandler);

    // Stage Select Close
    const btnCloseStageModal = document.getElementById('btn-close-stage-modal');
    const btnCloseStageX = document.getElementById('btn-close-stage-x');
    const closeStageSelectModalHandler = (e) => {
      if (e) e.stopPropagation();
      this.showStageSelect(false);
      this.showStartScreen(true);
    };
    if (btnCloseStageModal) btnCloseStageModal.addEventListener('click', closeStageSelectModalHandler);
    if (btnCloseStageX) btnCloseStageX.addEventListener('click', closeStageSelectModalHandler);

    // Event Delegation for Stages Grid (1-1 ~ 1-5 Cards & Start Buttons)
    const stagesGrid = document.getElementById('stages-grid');
    if (stagesGrid) {
      stagesGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.stage-card');
        if (!card) return;
        if (card.classList.contains('locked')) {
          return;
        }
        const stageNum = parseInt(card.dataset.stage || '1');
        if (window.audioEngine) window.audioEngine.ensureContext();
        this.hideAllModals();
        if (window.gameInstance) {
          window.gameInstance.startStage(stageNum);
        }
      });
    }

    // Exit to Main Menu from HUD
    const btnToMainMenu = document.getElementById('btn-to-main-menu');
    if (btnToMainMenu) {
      btnToMainMenu.addEventListener('click', () => {
        if (window.gameInstance) window.gameInstance.exitToMainMenu();
      });
    }

    // Stage Clear Modal Buttons
    const btnRestartGame = document.getElementById('btn-restart-game');
    if (btnRestartGame) {
      btnRestartGame.addEventListener('click', () => {
        this.hideGameClear();
        if (window.gameInstance) window.gameInstance.restartCurrentMode();
      });
    }

    const btnNextStage = document.getElementById('btn-next-stage');
    if (btnNextStage) {
      btnNextStage.addEventListener('click', () => {
        this.hideGameClear();
        if (window.gameInstance) window.gameInstance.startNextStage();
      });
    }

    const btnClearToStages = document.getElementById('btn-clear-to-stages');
    if (btnClearToStages) {
      btnClearToStages.addEventListener('click', () => {
        this.hideGameClear();
        this.showStageSelect(true);
      });
    }

    const btnClearToMain = document.getElementById('btn-clear-to-main');
    if (btnClearToMain) {
      btnClearToMain.addEventListener('click', () => {
        this.hideGameClear();
        if (window.gameInstance) window.gameInstance.exitToMainMenu();
      });
    }

    // Mission Failed Modal Buttons
    const btnFailedRetry = document.getElementById('btn-failed-retry');
    if (btnFailedRetry) {
      btnFailedRetry.addEventListener('click', () => {
        this.hideMissionFailed();
        if (window.gameInstance) window.gameInstance.restartCurrentMode();
      });
    }

    const btnFailedToStages = document.getElementById('btn-failed-to-stages');
    if (btnFailedToStages) {
      btnFailedToStages.addEventListener('click', () => {
        this.hideMissionFailed();
        this.showStageSelect(true);
      });
    }

    const btnFailedToMain = document.getElementById('btn-failed-to-main');
    if (btnFailedToMain) {
      btnFailedToMain.addEventListener('click', () => {
        this.hideMissionFailed();
        if (window.gameInstance) window.gameInstance.exitToMainMenu();
      });
    }
  }

  hideAllModals() {
    if (this.elStartScreen) this.elStartScreen.classList.add('hidden');
    if (this.elStageSelectModal) this.elStageSelectModal.classList.add('hidden');
    if (this.elSettingsModal) this.elSettingsModal.classList.add('hidden');
    if (this.elHeroModal) this.elHeroModal.classList.add('hidden');
    if (this.elGameClearModal) this.elGameClearModal.classList.add('hidden');
    if (this.elMissionFailedModal) this.elMissionFailedModal.classList.add('hidden');
  }

  showStartScreen(show) {
    if (show) this.elStartScreen.classList.remove('hidden');
    else this.elStartScreen.classList.add('hidden');
  }

  showSettings(show) {
    if (show) this.elSettingsModal.classList.remove('hidden');
    else this.elSettingsModal.classList.add('hidden');
  }

  showHeroModal(show) {
    if (show) {
      try { document.exitPointerLock(); } catch(e) {}
      this.elHeroModal.classList.remove('hidden');
    } else {
      this.elHeroModal.classList.add('hidden');
      if (window.gameInstance) window.gameInstance.requestPointerLock();
    }
  }

  selectHero(hero) {
    this.currentHero = hero;
    if (window.gameInstance) {
      window.gameInstance.setHero(hero);
    }

    // Update roster cards active class
    const cardSoldier = document.getElementById('card-hero-soldier');
    const cardGenji = document.getElementById('card-hero-genji');
    if (hero === 'soldier') {
      cardSoldier.classList.add('active');
      cardGenji.classList.remove('active');
      this.applySoldierHUD();
    } else {
      cardGenji.classList.add('active');
      cardSoldier.classList.remove('active');
      this.applyGenjiHUD();
    }

    this.showHeroModal(false);
    if (window.gameInstance && window.gameInstance.gameMode === 'menu') {
      this.showStartScreen(true);
    }
  }

  applySoldierHUD() {
    if (this.elPortraitHeroName) this.elPortraitHeroName.textContent = '솔저: 76';
    if (this.elPortraitAvatar) {
      this.elPortraitAvatar.className = 'portrait-avatar';
      this.elPortraitAvatar.innerHTML = `
        <div class="soldier-visor-glow"></div>
        <span class="portrait-number">76</span>
      `;
    }

    if (this.elGlyphAb1) this.elGlyphAb1.textContent = '⚡';
    if (this.elNameAb1) this.elNameAb1.textContent = '질주';

    if (this.elGlyphAb2) this.elGlyphAb2.textContent = '➕';
    if (this.elNameAb2) this.elNameAb2.textContent = '생체장';

    if (this.elGlyphAb3) this.elGlyphAb3.textContent = '🚀';
    if (this.elNameAb3) this.elNameAb3.textContent = '나선 로켓';

    if (this.elWeaponLabel) this.elWeaponLabel.textContent = '헤비 펄스 소총';
    if (this.elAmmoMax) this.elAmmoMax.textContent = '30';
    if (this.elUltWrapper) this.elUltWrapper.classList.remove('genji-ready');
  }

  applyGenjiHUD() {
    if (this.elPortraitHeroName) this.elPortraitHeroName.textContent = '겐지 (Genji)';
    if (this.elPortraitAvatar) {
      this.elPortraitAvatar.className = 'portrait-avatar avatar-genji-hud';
      this.elPortraitAvatar.innerHTML = `
        <div class="soldier-visor-glow" style="background:#38e469;box-shadow:0 0 10px 2px #38e469;"></div>
        <span class="portrait-number" style="font-size:24px;">🥷</span>
      `;
    }

    if (this.elGlyphAb1) this.elGlyphAb1.textContent = '🗡️';
    if (this.elNameAb1) this.elNameAb1.textContent = '질풍참';

    if (this.elGlyphAb2) this.elGlyphAb2.textContent = '🛡️';
    if (this.elNameAb2) this.elNameAb2.textContent = '튕겨내기';

    if (this.elGlyphAb3) this.elGlyphAb3.textContent = '✨';
    if (this.elNameAb3) this.elNameAb3.textContent = '부채꼴 수리검';

    if (this.elWeaponLabel) this.elWeaponLabel.textContent = '수리검 (Shuriken)';
    if (this.elAmmoMax) this.elAmmoMax.textContent = '30';
  }

  triggerCrosshairBloom(spreadNormalized) {
    if (spreadNormalized > 0.05) {
      this.elCrosshair.classList.add('bloom');
      this.elCrosshair.style.transform = `scale(${1 + spreadNormalized * 8})`;
    } else {
      this.elCrosshair.classList.remove('bloom');
      this.elCrosshair.style.transform = 'scale(1)';
    }
  }

  triggerHitmarker(isHeadshot) {
    clearTimeout(this.hitmarkerTimeout);
    this.elHitmarker.className = `hitmarker active ${isHeadshot ? 'crit' : 'normal'}`;
    this.hitmarkerTimeout = setTimeout(() => {
      this.elHitmarker.className = 'hitmarker normal';
    }, 120);
  }

  showElimination(targetName = '전준성', isHeadshot = false) {
    const attacker = this.currentHero === 'soldier' ? '솔저: 76' : '겐지';
    this.addKillfeedEntry(attacker, targetName, isHeadshot, false);
  }

  addKillfeedEntry(attacker = '솔저: 76', victim = '전준성', isHeadshot = false, isBoss = false) {
    if (!this.elKillfeedContainer) return;

    const item = document.createElement('div');
    item.className = `killfeed-item ${isHeadshot ? 'headshot' : ''} ${isBoss ? 'boss-kill' : ''}`;

    let icon = '🔫';
    if (isBoss) {
      icon = '👑💥';
    } else if (isHeadshot) {
      icon = '🎯💀';
    } else if (this.currentHero === 'genji') {
      icon = '🗡️';
    }

    item.innerHTML = `
      <span class="kf-attacker">${attacker}</span>
      <span class="kf-icon">${icon}</span>
      <span class="kf-victim">${victim}</span>
    `;

    this.elKillfeedContainer.appendChild(item);

    // Limit maximum visible items to 6
    while (this.elKillfeedContainer.children.length > 6) {
      this.elKillfeedContainer.removeChild(this.elKillfeedContainer.firstChild);
    }

    setTimeout(() => {
      item.classList.add('fade-out');
      setTimeout(() => {
        if (item.parentNode) item.parentNode.removeChild(item);
      }, 400);
    }, 3200);
  }

  updateQuest(current, max = 10, titleText = '전준성 들을 잡으세요') {
    if (this.elQuestTitle) this.elQuestTitle.textContent = titleText;
    if (this.elQuestCounter) this.elQuestCounter.textContent = `${current} / ${max}`;
    if (this.elQuestBarFill) {
      const pct = Math.min(100, (current / max) * 100);
      this.elQuestBarFill.style.width = `${pct}%`;
      if (current >= max) {
        this.elQuestBarFill.style.background = 'linear-gradient(90deg, #ffcc00 0%, #ff1744 100%)';
      } else {
        this.elQuestBarFill.style.background = 'linear-gradient(90deg, #00e5ff 0%, #00ff88 100%)';
      }
    }
  }

  showCenterAnnouncement(title = '🔥 보스를 잡으세요! 🔥', desc = '하늘에서 보스 블록이 떨어졌습니다! 파괴하여 보스를 소환하십시오!', duration = 3500) {
    if (!this.elCenterAnnouncement) return;
    if (this.elAnnounceTitle) this.elAnnounceTitle.textContent = title;
    if (this.elAnnounceDesc) this.elAnnounceDesc.textContent = desc;
    this.elCenterAnnouncement.classList.remove('hidden');

    if (this.announcementTimeout) clearTimeout(this.announcementTimeout);
    this.announcementTimeout = setTimeout(() => {
      this.elCenterAnnouncement.classList.add('hidden');
    }, duration);
  }

  updatePlayTime(seconds) {
    if (!this.elPlaytimeVal) return;
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    const mStr = String(mins).padStart(2, '0');
    const sStr = String(secs).padStart(4, '0');
    this.elPlaytimeVal.textContent = `${mStr}:${sStr}`;
  }

  showStageSelect(show) {
    if (!this.elStageSelectModal) return;
    if (show) {
      this.hideAllModals();
      try { document.exitPointerLock(); } catch (e) {}
      this.updateStageSelectCards();
      this.elStageSelectModal.classList.remove('hidden');
    } else {
      this.elStageSelectModal.classList.add('hidden');
    }
  }

  updateStageSelectCards() {
    try {
      let records = {};
      if (window.gameInstance && typeof window.gameInstance.getStageRecords === 'function') {
        records = window.gameInstance.getStageRecords() || {};
      }
      for (let st = 1; st <= 5; st++) {
        const card = document.getElementById(`stage-card-${st}`);
        const starsWrap = document.getElementById(`stars-stage-${st}`);
        const bestTimeEl = document.getElementById(`best-time-${st}`);
        const startBtn = card ? card.querySelector('.btn-stage-start') : null;
        const rec = records[st] || { stars: 0, time: 0 };

        // Unlock rule: Stage 1 is always unlocked. Others unlock if previous stage has at least 1 star.
        const prevRec = records[st - 1];
        const isUnlocked = (st === 1) || (prevRec && prevRec.stars > 0);

        if (card) {
          if (!isUnlocked) {
            card.classList.add('locked');
            if (startBtn) {
              startBtn.disabled = true;
              startBtn.textContent = '🔒 잠김';
            }
          } else {
            card.classList.remove('locked');
            if (startBtn) {
              startBtn.disabled = false;
              if (st === 1) startBtn.textContent = '⚔️ 결전 개시';
              else if (st === 2) startBtn.textContent = '❄️ 빙원 결전 개시';
              else if (st === 5) startBtn.textContent = '🔥 수렵 개시';
              else startBtn.textContent = '작전 시작';
            }
          }
        }

        if (starsWrap) {
          const starSpans = starsWrap.querySelectorAll('.star-icon');
          const starCount = rec.stars || 0;
          starSpans.forEach((s, idx) => {
            if (idx < starCount) s.classList.add('active');
            else s.classList.remove('active');
          });
        }

        if (bestTimeEl) {
          if (rec.time && rec.time > 0) {
            const mins = Math.floor(rec.time / 60);
            const secs = (rec.time % 60).toFixed(1);
            bestTimeEl.textContent = `최고 기록: ${String(mins).padStart(2, '0')}:${String(secs).padStart(4, '0')}`;
          } else {
            bestTimeEl.textContent = '최고 기록: --:--.-';
          }
        }
      }
    } catch (err) {
      console.warn('updateStageSelectCards error:', err);
    }
  }

  updateLives(lives, maxLives = 3, isStageMode = true) {
    if (!this.elHudLivesBox) return;
    if (!isStageMode) {
      this.elHudLivesBox.style.display = 'none';
      return;
    }

    this.elHudLivesBox.style.display = 'flex';
    if (this.elLivesCountText) {
      this.elLivesCountText.textContent = `${Math.max(0, lives)} / ${maxLives}`;
    }

    this.elLifeHearts.forEach((heart, i) => {
      if (!heart) return;
      if (i < lives) {
        heart.classList.remove('lost');
        heart.classList.add('active');
        heart.textContent = '❤️';
      } else {
        heart.classList.remove('active');
        heart.classList.add('lost');
        heart.textContent = '🖤';
      }
    });
  }

  showStageClear(result = {}) {
    if (this.elClearImg && window.CL_DATA_URL) {
      this.elClearImg.src = window.CL_DATA_URL;
    }
    const mins = Math.floor((result.time || 0) / 60);
    const secs = ((result.time || 0) % 60).toFixed(1);
    const mStr = String(mins).padStart(2, '0');
    const sStr = String(secs).padStart(4, '0');

    if (this.elClearStageBadge) {
      if (result.stage === 1) {
        this.elClearStageBadge.textContent = '👑 조인준 보스 토벌 완료 // 제 1 장 CLEAR 👑';
      } else if (result.stage === 2) {
        this.elClearStageBadge.textContent = '❄️ 노윤상 보스 토벌 완료 // 제 2 장 CLEAR ❄️';
      } else if (result.stage === 5) {
        this.elClearStageBadge.textContent = '🔥 대수신 JO 수렵 완료 // 제 5 장 CLEAR 🔥';
      } else {
        this.elClearStageBadge.textContent = `🏆 제 ${result.stage || 1} 장 // MISSION ACCOMPLISHED 🏆`;
      }
    }
    if (this.elClearTitleText) {
      this.elClearTitleText.textContent = result.clearTitle || `제 ${result.stage || 1} 장 클리어!`;
    }
    if (this.elClearSubtitleText) {
      this.elClearSubtitleText.textContent = result.clearSubtitle || '작전을 성공적으로 완수했습니다!';
    }
    if (this.elCsTime) this.elCsTime.textContent = `${mStr}:${sStr}`;
    if (this.elCsDeaths) this.elCsDeaths.textContent = `${result.deaths || 0} / 3`;
    if (this.elCsAcc) this.elCsAcc.textContent = `${result.accuracy || '0.0'}%`;
    if (this.elCsHs) this.elCsHs.textContent = `${result.headshot || '0.0'}%`;
    if (this.elCsKills) this.elCsKills.textContent = `${result.kills || 0}`;
    if (this.elCsDamage) this.elCsDamage.textContent = `${Math.round(result.damage || 0)}`;

    // Star Presentation (0 사망: 3성, 1 사망: 2성, 2 사망: 1성)
    const stars = result.stars || 1;
    this.elClearStars.forEach((star, idx) => {
      if (star) {
        if (idx < stars) {
          star.classList.add('active');
          star.style.animation = `star-pop 0.4s ease-out ${idx * 0.2}s both`;
        } else {
          star.classList.remove('active');
          star.style.animation = 'none';
        }
      }
    });

    if (this.elClearStarStatus) {
      if (stars === 3) {
        this.elClearStarStatus.textContent = '★★★ 별 3개 (목숨 3개 모두 무사!)';
        this.elClearStarStatus.className = 'clear-star-status-text star-3';
      } else if (stars === 2) {
        this.elClearStarStatus.textContent = '★★☆ 별 2개 (한 번 사망)';
        this.elClearStarStatus.className = 'clear-star-status-text star-2';
      } else {
        this.elClearStarStatus.textContent = '★☆☆ 별 1개 (2번 사망)';
        this.elClearStarStatus.className = 'clear-star-status-text star-1';
      }
    }

    // Next stage button handling
    const btnNext = document.getElementById('btn-next-stage');
    if (btnNext) {
      if ((result.stage || 1) >= 5) {
        btnNext.textContent = '🎉 전 챕터 제패! (메인으로)';
      } else {
        btnNext.textContent = `🚀 다음 챕터 (제 ${(result.stage || 1) + 1} 장)`;
      }
    }

    this.hideAllModals();
    if (this.elGameClearModal) {
      this.elGameClearModal.classList.remove('hidden');
    }

    try {
      document.exitPointerLock();
    } catch (e) {}
  }

  hideGameClear() {
    if (this.elGameClearModal) {
      this.elGameClearModal.classList.add('hidden');
    }
  }

  showMissionFailed(result = {}) {
    const elStageName = document.getElementById('failed-stage-name');
    const elTime = document.getElementById('failed-time');
    const elKills = document.getElementById('failed-kills');

    if (elStageName) elStageName.textContent = `제 ${result.stage || 1} 장`;
    if (elTime) {
      const mins = Math.floor((result.time || 0) / 60);
      const secs = ((result.time || 0) % 60).toFixed(1);
      elTime.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(4, '0')}`;
    }
    if (elKills) elKills.textContent = `${result.kills || 0}마리`;

    if (this.elMissionFailedModal) {
      this.elMissionFailedModal.classList.remove('hidden');
    }

    try {
      document.exitPointerLock();
    } catch (e) {}
  }

  hideMissionFailed() {
    if (this.elMissionFailedModal) {
      this.elMissionFailedModal.classList.add('hidden');
    }
  }

  setModeDisplay(text) {
    if (this.elModeDisplay) {
      this.elModeDisplay.textContent = text;
    }
  }

  updateHUD(player, weapons, stats, camera) {
    // 1. Health Bar
    const hp = Math.round(player.health);
    this.elHpCurrent.textContent = hp;
    const hpPct = Math.max(0, hp / player.maxHealth);
    this.elHpBarFill.style.width = `${hpPct * 100}%`;
    if (hp <= 60) {
      this.elHpBarFill.style.background = 'linear-gradient(90deg, #ff1e38 0%, #ff5268 100%)';
    } else {
      this.elHpBarFill.style.background = this.currentHero === 'genji'
        ? 'linear-gradient(90deg, #28b852 0%, #38e469 100%)'
        : 'linear-gradient(90deg, #00b0ff 0%, #00e5ff 100%)';
    }

    // 2. Ammo & Reload
    const currentAmmo = (this.currentHero === 'soldier') ? weapons.ammo : weapons.genjiAmmo;
    const maxAmmo = (this.currentHero === 'soldier') ? weapons.maxAmmo : weapons.genjiMaxAmmo;

    if (this.currentHero === 'genji' && weapons.dragonbladeActive) {
      this.elAmmoCurrent.textContent = '⚔️';
      this.elAmmoBarFill.style.width = '100%';
      this.elWeaponLabel.textContent = '용검 (DRAGONBLADE)';
      this.elReloadPrompt.classList.add('hidden');
    } else {
      this.elAmmoCurrent.textContent = currentAmmo;
      if (currentAmmo <= 6) {
        this.elAmmoCurrent.classList.add('low');
      } else {
        this.elAmmoCurrent.classList.remove('low');
      }
      const ammoPct = currentAmmo / maxAmmo;
      this.elAmmoBarFill.style.width = `${ammoPct * 100}%`;

      if (weapons.isReloading) {
        this.elReloadPrompt.classList.remove('hidden');
        this.elReloadPrompt.textContent = '재장전 중...';
      } else if (currentAmmo === 0) {
        this.elReloadPrompt.classList.remove('hidden');
        this.elReloadPrompt.textContent = '[R] 재장전 필요!';
      } else {
        this.elReloadPrompt.classList.add('hidden');
      }
    }

    // 3. Abilities Cooldowns & Visuals
    if (this.currentHero === 'soldier') {
      // Sprint
      if (player.isSprinting) {
        this.elSprintActiveGlow.style.opacity = '1';
      } else {
        this.elSprintActiveGlow.style.opacity = '0';
      }
      this.elCdOverlay1.style.height = '0%';
      this.elCdTimer1.textContent = '';

      // Biotic Field (E)
      if (weapons.bioticTimer > 0) {
        const pct = (weapons.bioticTimer / weapons.bioticCooldown) * 100;
        this.elCdOverlay2.style.height = `${pct}%`;
        this.elCdTimer2.textContent = Math.ceil(weapons.bioticTimer);
      } else {
        this.elCdOverlay2.style.height = '0%';
        this.elCdTimer2.textContent = '';
      }

      // Helix (Right click)
      if (weapons.helixTimer > 0) {
        const pct = (weapons.helixTimer / weapons.helixCooldown) * 100;
        this.elCdOverlay3.style.height = `${pct}%`;
        this.elCdTimer3.textContent = Math.ceil(weapons.helixTimer);
      } else {
        this.elCdOverlay3.style.height = '0%';
        this.elCdTimer3.textContent = '';
      }

      // Overlays
      this.elDeflectOverlay.classList.add('hidden');
      this.elDragonOverlay.classList.add('hidden');

      if (weapons.visorActive) {
        this.elVisorOverlay.classList.remove('hidden');
        if (weapons.lockedBot && !weapons.lockedBot.isDead) {
          this.updateVisorLockBox(weapons.lockedBot, camera);
        } else {
          this.elVisorLockBox.classList.add('hidden');
        }
      } else {
        this.elVisorOverlay.classList.add('hidden');
        this.elVisorLockBox.classList.add('hidden');
      }
    } else {
      // GENJI
      if (this.elSprintActiveGlow) this.elSprintActiveGlow.style.opacity = '0';

      // Swift Strike (Shift)
      if (weapons.swiftTimer > 0) {
        const pct = (weapons.swiftTimer / weapons.swiftCooldown) * 100;
        if (this.elCdOverlay1) this.elCdOverlay1.style.height = `${pct}%`;
        if (this.elCdTimer1) this.elCdTimer1.textContent = Math.ceil(weapons.swiftTimer);
      } else {
        if (this.elCdOverlay1) this.elCdOverlay1.style.height = '0%';
        if (this.elCdTimer1) this.elCdTimer1.textContent = '';
      }

      // Deflect (E)
      if (weapons.deflectTimer > 0) {
        const pct = (weapons.deflectTimer / weapons.deflectCooldown) * 100;
        if (this.elCdOverlay2) this.elCdOverlay2.style.height = `${pct}%`;
        if (this.elCdTimer2) this.elCdTimer2.textContent = Math.ceil(weapons.deflectTimer);
      } else {
        if (this.elCdOverlay2) this.elCdOverlay2.style.height = '0%';
        if (this.elCdTimer2) this.elCdTimer2.textContent = '';
      }

      // Fan of shurikens (Secondary fire is ready whenever ammo is available)
      if (this.elCdOverlay3) this.elCdOverlay3.style.height = '0%';
      if (this.elCdTimer3) this.elCdTimer3.textContent = '';

      // Overlays
      if (this.elVisorOverlay) this.elVisorOverlay.classList.add('hidden');
      if (this.elVisorLockBox) this.elVisorLockBox.classList.add('hidden');

      if (this.elDeflectOverlay) {
        if (weapons.isDeflecting) {
          this.elDeflectOverlay.classList.remove('hidden');
        } else {
          this.elDeflectOverlay.classList.add('hidden');
        }
      }

      if (this.elDragonOverlay) {
        if (weapons.dragonbladeActive) {
          this.elDragonOverlay.classList.remove('hidden');
        } else {
          this.elDragonOverlay.classList.add('hidden');
        }
      }
    }

    // 4. Ultimate Meter
    const ultPct = Math.min(100, Math.round(stats.ultCharge));
    this.elUltPercent.innerHTML = `${ultPct}<small>%</small>`;

    const maxOffset = 326.7;
    const offset = maxOffset - (ultPct / 100) * maxOffset;
    this.elUltCircle.style.strokeDashoffset = offset;

    if (ultPct >= 100) {
      this.elUltWrapper.classList.add('ready');
      if (this.currentHero === 'genji') {
        this.elUltWrapper.classList.add('genji-ready');
      } else {
        this.elUltWrapper.classList.remove('genji-ready');
      }
      this.elUltReadyBanner.classList.remove('hidden');
    } else {
      this.elUltWrapper.classList.remove('ready');
      this.elUltReadyBanner.classList.add('hidden');
    }

    // 5. Top Bar Stats
    this.elStatKills.textContent = stats.kills;
    const acc = stats.shotsFired > 0 ? ((stats.shotsHit / stats.shotsFired) * 100).toFixed(1) : '0.0';
    this.elStatAcc.innerHTML = `${acc}<small>%</small>`;
    const hs = stats.shotsHit > 0 ? ((stats.headshots / stats.shotsHit) * 100).toFixed(1) : '0.0';
    this.elStatHeadshot.innerHTML = `${hs}<small>%</small>`;

    // 6. Crosshair bloom
    if (this.currentHero === 'soldier') {
      this.triggerCrosshairBloom(weapons.spread / weapons.maxSpread);
    } else {
      this.triggerCrosshairBloom(0);
    }
  }

  updateVisorLockBox(bot, camera) {
    const botPos = bot.group.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const projected = botPos.project(camera);

    if (projected.z > 1) {
      this.elVisorLockBox.classList.add('hidden');
      return;
    }

    const screenX = (projected.x * 0.5 + 0.5) * window.innerWidth;
    const screenY = (-(projected.y * 0.5) + 0.5) * window.innerHeight;

    this.elVisorLockBox.classList.remove('hidden');
    this.elVisorLockBox.style.left = `${screenX}px`;
    this.elVisorLockBox.style.top = `${screenY}px`;
  }
}
