'use strict';
/* =====================================================================
   Poziom (sterowany danymi z levels.js): auto-scroll, skoki i salto, rzeki,
   przeszkody, znajdźki, wrogowie, rzut krzyżem (Alt), Grom z Nieba (Shift).
   ===================================================================== */
class LevelScene extends Phaser.Scene {
    constructor() { super('Level'); }
    init(data) {
        this.levelIndex = (data && data.level) || 0; this.startAtD = (data && data.startAt) || null;
        this.skipTo = (data && data.skipTo) || null;       // tylko debug: 'defense' / 'boss' w Level 3
    }

    create() {
        const L = this.L = LEVELS[this.levelIndex], W = CFG.W, H = CFG.H, G = CFG.GROUND_Y, HC = CFG.hero;
        // --- reset CAŁEGO stanu sceny (scena przy restarcie zachowuje pola instancji) ---
        this.ended = false; this.dead = false; this.cutscene = false; this.respawning = false;
        this.praying = false; this.charged = false; this.prayStart = 0; this.aura = null;
        this.invulnUntil = 0; this.stompSafeUntil = 0; this.stomps = 0; this.stompLog = []; this.lastGroundAt = 0; this.jumpAt = -99999; this.jumps = 0; this.flipping = false;
        this.attackUntil = 0; this.lastThrow = -99999; this.attackPressed = false;
        this.boostUntil = 0; this.slowUntil = 0; this.facing = L.dir;
        this.spawnAcc = 0; this.nextSpawn = 1200; this.hintsShown = {}; this.hintSlots = {}; this.summaryShown = false;
        this.touch = { left: false, right: false, ult: false, down: false }; this.joy = null;
        this.crouching = false; this.crouchAt = 0;
        this.items = []; this.puddles = []; this.solids = []; this.groundSolids = []; this.popups = [];
        this.prevHeroX = 0; this.textInput = false;
        this.firePressed = false; this.lastFire = -99999; this.stunUntil = 0;
        this.arena = false; this.boss = null; this.krzysztof = null; this.autoWalk = null; this.planks = [];
        this.nextFlash = 0; this.rain = null; this.bossBar = null; this.ending = false;
        this.blessPressed = false; this.lastBless = -99999; this.fireHintAt = -99999; this.fog = null;
        this.fizzles = 0; this.blessCasts = 0; this.rafalScreams = 0; this.keysThrown = 0; this.exorcised = false;
        this.defense = null; this.doorBar = null; this.proboszcz = null; this.rafal = null; this.dawn = null; this.door = null;
        this.devil = null; this.devilGone = false; this.adrian = null; this.adrianNpc = null; this.car = null; this.red = null; this.hut = null; this.hutDoor = null;
        this.kamilFree = false; this.repelUntil = 0; this.repelAura = null; this.repelKills = 0; this.swamp = null;
        this.orbsCast = 0; this.swarmsSummoned = 0; this.teleports = 0; this.tongues = 0; this.carGone = false;
        GS.level = this.levelIndex;
        this.retryPrompt = null;
        // stan na starcie poziomu: do powtórzenia po przegranej (wynik zostaje, moce i pasek jak na starcie)
        this.levelStart = { hasCross: GS.hasCross, hasFire: GS.hasFire, hasBless: GS.hasBless, meter: GS.meter };
        this.ensureLifeTexture();

        bindGlobalKeys(this);
        const cam = this.cameras.main;
        cam.setBackgroundColor('#1a1020');
        cam.setScroll(L.dir > 0 ? 0 : L.length - W, 0);
        cam.fadeIn(300, 0, 0, 0);
        this.physics.world.gravity.y = CFG.gravity;
        if (this.physics.world.isPaused) this.physics.resume();

        // --- tło: niebo (stałe) + dwie warstwy paralaksy ---
        const BG = L.bg;
        const tnt = (o, k) => { const t = ART.tint(k); if (t) o.setTint(t); return o; };   // zamiennik = wieczorny odcień
        tnt(this.add.image(0, 0, ART.key(BG.sky)).setOrigin(0).setScrollFactor(0).setDepth(0), BG.sky);
        this.far = tnt(this.add.tileSprite(0, 16, W, 200, ART.key(BG.far)).setOrigin(0).setScrollFactor(0).setDepth(0.5), BG.far);
        this.near = tnt(this.add.tileSprite(0, 138, W, 150, ART.key(BG.near)).setOrigin(0).setScrollFactor(0).setDepth(1), BG.near);

        // --- ziemia i rzeki ---
        const rivers = (L.rivers || []).slice().sort((a, b) => a.at - b.at);
        let d0 = 0;
        const segs = [];
        rivers.forEach(r => { segs.push([d0, r.at]); d0 = r.at + r.w; });
        segs.push([d0, L.length]);
        segs.forEach(([a, b]) => {
            const x0 = Math.min(this.wx(a), this.wx(b)), x1 = Math.max(this.wx(a), this.wx(b));
            tnt(this.add.tileSprite(x0, 288, x1 - x0, 32, ART.key(BG.ground)).setOrigin(0).setDepth(2).setTilePosition(x0 % 64, 0), BG.ground);
            const z = this.add.zone((x0 + x1) / 2, G + 40, x1 - x0, 80);
            this.physics.add.existing(z, true);
            this.solids.push(z); this.groundSolids.push(z);
        });
        this.rivers = rivers.map(r => {
            const x0 = Math.min(this.wx(r.at), this.wx(r.at + r.w)), x1 = Math.max(this.wx(r.at), this.wx(r.at + r.w));
            const ws = ART.SPEC[BG.water + '1'], wh = ws ? ws.size[1] : 28;                       // woda 28 px (L2/L3), bagno 32 px (L4)
            const water = this.add.tileSprite(x0, 320 - wh, x1 - x0, wh, ART.key(BG.water + '1')).setOrigin(0).setDepth(3).setTilePosition(x0 % 64, 0);
            const kl = BG.bankL || 'water_bank_left', kr = BG.bankR || 'water_bank_right';
            const bl = this.add.image(x0, 288, ART.key(kl)).setOrigin(0).setDepth(3.5);
            const br = this.add.image(x1, 288, ART.key(kr)).setOrigin(1, 0).setDepth(3.5);
            const wt = L.waterTint || ART.tint(BG.water + '1');
            if (wt) water.setTint(wt);
            [[bl, kl], [br, kr]].forEach(([o, k]) => { const t = L.waterTint || ART.tint(k); if (t) o.setTint(t); });
            if (r.plank) this.createPlank(x0, x1, r.plank === 'log' ? 'platform_log' : 'platform_plank');
            (r.lily || []).forEach(off => this.createPlatform(this.wx(r.at + off), 'platform_lily'));
            return { at: r.at, w: r.w, x0, x1, water, plank: !!r.plank };
        });

        // --- przeszkody ---
        (L.obstacles || []).forEach(o => {
            const x = this.wx(o.at);
            if (o.type === 'fence' || o.type === 'trash_bin') {         // stałe przeszkody: można na nie wskoczyć
                this.add.image(x, G, 'obstacle_' + o.type).setOrigin(0.5, 1).setDepth(4).setFlipX(L.dir < 0);
                const hb = CFG.obstacles[o.type];
                const z = this.add.zone(x, G - hb.h / 2, hb.w, hb.h);
                this.physics.add.existing(z, true);
                this.solids.push(z);
            } else if (CFG.obstacles[o.type]) {                         // Level 2: rozkopana droga, przewrócone drzewo
                ART.image(this, x, G - 4, 'obstacle_' + o.type, 1, 0.5, 1).setDepth(4).setFlipX(L.dir < 0);
                const hb = CFG.obstacles[o.type];
                const z = this.add.zone(x, G - hb.h / 2, hb.w, hb.h);
                this.physics.add.existing(z, true);
                this.solids.push(z);
            } else if (o.type === 'puddle') {
                this.add.image(x, G + 2, 'obstacle_puddle').setOrigin(0.5, 1).setDepth(3);
                this.puddles.push({ x0: x - 26, x1: x + 26 });
            }
        });

        // --- znajdźki ---
        const placedLifePickups = this.lifePickupDistances();
        const sceneItems = (L.items || []).concat(placedLifePickups.map(at => ({ type: 'life', at })));
        sceneItems.forEach(it => {
            const x = this.wx(it.at);
            let s;
            if (it.type === 'life') {
                s = this.add.image(x, G - CFG.lifePickup.pickupY, 'item_life_heart').setScale(1.25).setDepth(6);
                this.tweens.add({ targets: s, y: s.y - 5, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            } else if (it.type === 'diamond') {
                s = this.add.sprite(x, G - (it.h || 18) - 6, 'item_diamond_1').setScale(CFG.items.scale).setDepth(6).play({ key: 'diamond_spin', startFrame: it.at % 6 });
                this.tweens.add({ targets: s, y: s.y - 4, duration: 600 + (it.at % 5) * 60, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            } else if (it.type === 'lightning') {
                s = this.add.sprite(x, G - (it.h || 26) - 8, 'item_lightning_1').setScale(CFG.items.scale).setDepth(6).play('lightning_item');
                this.tweens.add({ targets: s, y: s.y - 5, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            } else if (it.type === 'znicz') {
                if (GS.hasFire) return;
                s = this.add.sprite(x, G - 30, ART.key('item_znicz_1')).play('znicz').setDepth(6);
                ART.fit(this, s, 'item_znicz_1', CFG.items.scale, 0.5, 0.5);
                this.tweens.add({ targets: s, y: s.y - 4, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            } else if (it.type === 'blessing') {
                if (GS.hasBless) return;
                s = this.add.sprite(x, G - 32, ART.key('item_blessing_1')).play('blessing_item').setDepth(6);
                ART.fit(this, s, 'item_blessing_1', CFG.items.scale, 0.5, 0.5);
                this.tweens.add({ targets: s, y: s.y - 5, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            } else if (it.type === 'repellent') {
                s = this.add.sprite(x, G - 30, ART.key('item_repellent_1')).play('repellent_item').setDepth(6);
                ART.fit(this, s, 'item_repellent_1', CFG.items.scale, 0.5, 0.5);
                this.tweens.add({ targets: s, y: s.y - 4, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            } else if (it.type === 'cross') {
                if (GS.hasCross) return;
                s = this.add.image(x, G - 24, 'fx_bless_3').setScale(0.4).setDepth(6);
                this.tweens.add({ targets: s, scale: 0.46, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            }
            if (s) { s.itemType = it.type; this.items.push(s); }
        });

        // --- koniec poziomu: kościół (Level 1) albo dom Krzysztofa (Level 2) ---
        const ex = this.wx(L.endAt), flip = L.dir < 0;
        if (BG.end === 'hut_adrian') this.createHut(ex);
        else if (!/^church_exterior/.test(BG.end)) this.createHouse(ex);
        else {                                                        // kościół: Level 1 (dzień) i Level 3 (noc)
        const doorLeft = flip ? 240 - 51 - 48 : 51;                  // lewa krawędź drzwi w obrazku kościoła
        const churchX = ex - (doorLeft + 24) + 120, churchY = L.night ? CFG.defense.churchFloorY : G + 2;
        this.churchTop = churchY - 250; this.churchLeft = churchX - 120;
        this.church = ART.image(this, churchX, churchY, BG.end, 1, 0.5, 1).setDepth(2.5).setFlipX(flip);
        this.doorKey = L.night ? 'church_door_night_hp_1' : 'church_door_1';
        this.door = ART.image(this, churchX - 120 + doorLeft, churchY - 250 + 162, this.doorKey, 1, 0, 0).setDepth(2.6).setFlipX(flip);
        this.doorLook = this.doorKey;
        this.doorX = ex;
        }

        // --- bohater: niewidoczny hitbox + sprite ---
        const sx = this.wx(this.startAtD || L.startAt || 100);
        this.hero = this.add.zone(sx, G - HC.bodyH / 2 - 1, HC.bodyW, HC.bodyH);
        this.physics.add.existing(this.hero);
        this.hero.body.setMaxVelocity(2000, HC.maxFall);
        this.kamil = this.add.sprite(sx, G, 'wikary_kamil_idle_1').setOrigin(0.5, 1).setScale(HC.scale).setDepth(10).play('k_idle');
        this.kamil.setFlipX(this.facing < 0);
        this.physics.add.collider(this.hero, this.solids);
        this.planks.forEach(p => this.physics.add.collider(this.hero, p));

        // --- wrogowie i pociski ---
        this.enemies = this.physics.add.group();
        this.shots = this.physics.add.group({ allowGravity: false });
        this.physics.add.collider(this.enemies, this.groundSolids, null, (e) => !e.ghost);     // duchy nie stoją na ziemi
        this.physics.add.overlap(this.hero, this.enemies, (h, e) => {
            if (e.dead || e.harmless) return;
            if (this.tryStomp(e) || this.time.now < this.stompSafeUntil) return;
            this.hurt(e.x);
        });
        this.hostile = this.physics.add.group({ allowGravity: false });        // klucze Rafała
        this.physics.add.overlap(this.hero, this.hostile, (h, k) => { if (k.active) { k.destroy(); this.hurt(k.x); } });
        this.allyShots = this.physics.add.group({ allowGravity: false });      // czary proboszcza
        this.physics.add.overlap(this.allyShots, this.enemies, (s, e) => this.spellHits(s, e));
        this.physics.add.overlap(this.shots, this.enemies, (s, e) => this.shotHits(s, e));
        this.waves = this.physics.add.group({ allowGravity: false });
        this.physics.add.overlap(this.hero, this.waves, (h, w) => this.waveHit(w));

        // --- przyciemnienie (modlitwa, piorun) ---
        this.dim = this.add.rectangle(0, 0, W, H, 0x000000, 1).setOrigin(0).setScrollFactor(0).setDepth(8).setAlpha(0);

        // --- sterowanie ---
        const kb = this.input.keyboard;
        this.keys = kb.addKeys({ left: 'LEFT', right: 'RIGHT', shift: 'SHIFT', alt: 'ALT', space: 'SPACE', up: 'UP', down: 'DOWN' });
        kb.on('keydown-SPACE', onKey(() => { this.jumpAt = this.time.now; }));
        kb.on('keydown-UP', onKey(() => { this.jumpAt = this.time.now; }));
        kb.on('keydown-ALT', onKey(() => { this.attackPressed = true; }));
        kb.on('keydown-Z', onKey(() => { this.firePressed = true; }));
        kb.on('keydown-X', onKey(() => { this.blessPressed = true; }));
        kb.on('keydown-ENTER', onKey(() => this.onConfirm()));
        kb.on('keydown-SPACE', onKey(() => { if (this.talk.dialog) this.talk.skip(); else if (this.retryPrompt) this.retryPrompt.confirm(); }));
        ['LEFT', 'RIGHT', 'UP', 'DOWN'].forEach(k => kb.on('keydown-' + k, onKey(() => { if (this.retryPrompt) this.retryPrompt.select(1 - this.retryPrompt.sel); })));
        this.input.on('pointerdown', (p, over) => this.onPointerDown(p, over));
        this.talk = makeTalker(this);

        this.createHud();
        if (IS_TOUCH) this.createTouch();
        this.createWeather();
        this.createNight();
        this.createSwamp();
        WikaryAudio.play(L.music);
        hintBubble(this, 'POZIOM ' + L.id + ': ' + L.name, 2200, 112);
    }

    /* ---------- pomocnicze ---------- */
    wx(d) { return this.L.dir > 0 ? d : this.L.length - d; }           // odległość od startu -> x świata
    heroD() { return this.L.dir > 0 ? this.hero.x : this.L.length - this.hero.x; }
    frontD() { const c = this.cameras.main; return this.L.dir > 0 ? c.scrollX + CFG.W : this.L.length - c.scrollX; }
    playK(key) { if (!this.kamil.anims.currentAnim || this.kamil.anims.currentAnim.key !== key || !this.kamil.anims.isPlaying) this.kamil.play(key); }
    onGround() { const b = this.hero.body; return b.blocked.down || b.touching.down; }

    ensureLifeTexture() {
        if (this.textures.exists('item_life_heart')) return;
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const rows = ['00100100', '01111110', '11111111', '11111111', '01111110', '00111100', '00011000', '00000000'];
        rows.forEach((row, y) => Array.from(row).forEach((px, x) => {
            if (px === '1') {
                g.fillStyle(y < 2 ? 0xffb4c0 : 0xf0445e, 1);
                g.fillRect(x * 2, y * 2, 2, 2);
            }
        }));
        g.generateTexture('item_life_heart', 16, 16);
        g.destroy();
    }

    lifePickupDistances() {
        const C = CFG.lifePickup, count = C.countByLevel[this.levelIndex] || 0;
        if (!count || GS.lives >= CFG.hero.maxLives) return [];
        const L = this.L, last = Math.min(L.endAt || L.length, L.length) - C.safeMargin;
        const blocked = (L.rivers || []).map(r => [r.at - C.safeMargin, r.at + r.w + C.safeMargin]);
        blocked.push([0, (this.startAtD || L.startAt || 100) + C.safeMargin]);     // nie na miejscu startu Kamila
        (L.obstacles || []).forEach(o => {
            const width = CFG.obstacles[o.type] ? CFG.obstacles[o.type].w : 52;
            blocked.push([o.at - width / 2 - C.safeMargin, o.at + width / 2 + C.safeMargin]);
        });
        const placed = (L.items || []).map(i => i.at);
        const candidates = [];
        for (let d = C.safeMargin; d < last; d += 20) {
            if (blocked.some(([a, b]) => d >= a && d <= b)) continue;
            if (placed.some(p => Math.abs(p - d) < C.minGap)) continue;
            candidates.push(d);
        }
        Phaser.Utils.Array.Shuffle(candidates);
        const selected = [];
        candidates.forEach(d => {
            if (selected.length < count && selected.every(p => Math.abs(p - d) >= C.minGap)) selected.push(d);
        });
        return selected;
    }

    createLifePickup(x, y) {
        if (GS.lives >= CFG.hero.maxLives) return null;
        this.ensureLifeTexture();
        const it = this.add.image(x, y, 'item_life_heart').setScale(1.25).setDepth(6);
        it.itemType = 'life'; it.taken = false;
        this.tweens.add({ targets: it, y: y - 5, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.items.push(it);
        return it;
    }

    removeLifePickups(except) {
        this.items.filter(i => i.itemType === 'life' && i.active).forEach(i => {
            if (i === except) return;
            this.tweens.killTweensOf(i); i.destroy();
        });
        this.items = this.items.filter(i => i.active && !i.taken);
    }

    /* ---------- HUD ---------- */
    createHud() {
        const D = 4000, W = CFG.W;
        this.add.rectangle(0, 0, W, 24, 0x0c0610, 0.55).setOrigin(0).setScrollFactor(0).setDepth(D - 1);
        this.lifeIcons = [];
        for (let i = 0; i < CFG.hero.maxLives; i++) this.lifeIcons.push(this.add.image(14 + i * 22, 12, 'wikary_kamil_closeup_open').setScale(0.11).setScrollFactor(0).setDepth(D));
        this.hudScore = txt(this, 142, 8, '', 8, '#ffffff', { ox: 0, oy: 0 }).setScrollFactor(0).setDepth(D);
        this.hudTime = txt(this, 262, 8, '', 8, '#ffe8a0', { ox: 0.5, oy: 0 }).setScrollFactor(0).setDepth(D);
        this.hudCross = this.add.image(332, 12, 'fx_cross_1').setScale(0.5).setScrollFactor(0).setDepth(D);
        this.hudFire = this.add.image(312, 12, 'fx_fireball_1').setScale(0.6).setScrollFactor(0).setDepth(D);
        this.hudBless = ART.image(this, 294, 12, 'item_blessing_1', 0.28, 0.5, 0.5).setScrollFactor(0).setDepth(D);
        this.hudGromLabel = txt(this, 350, 8, 'GROM', 8, '#ffd040', { ox: 0, oy: 0 }).setScrollFactor(0).setDepth(D);
        this.hudBarBg = this.add.rectangle(396, 7, 106, 10, 0x221420, 1).setOrigin(0).setStrokeStyle(1, 0xd8a640).setScrollFactor(0).setDepth(D);
        this.hudBar = this.add.rectangle(397, 8, 0, 8, 0xffc830, 1).setOrigin(0).setScrollFactor(0).setDepth(D);
        cornerButtons(this, 12);
        this.updateHud(0);
    }
    updateHud(time) {
        this.lifeIcons.forEach((ic, i) => ic.setAlpha(i < GS.lives ? 1 : 0.2));
        this.hudScore.setText('PKT ' + String(GS.score).padStart(6, '0'));
        this.hudTime.setText(Leaderboard.fmt(GS.timeMs / 1000));
        this.hudCross.setVisible(GS.hasCross);
        this.hudFire.setVisible(GS.hasFire);
        this.hudBless.setVisible(GS.hasBless);
        if (this.bossBar) this.updateBossBar();
        const full = GS.meter >= CFG.ult.max;
        this.hudBar.width = Math.round(104 * Math.min(1, GS.meter / CFG.ult.max));
        this.hudBar.fillColor = full ? ((Math.floor(time / 150) % 2) ? 0xfff2a0 : 0xffb020) : 0xffc830;
        this.hudGromLabel.setText(full && !this.praying ? (IS_TOUCH ? 'GROM!' : 'SHIFT') : 'GROM');
    }

    /* ---------- dotyk ---------- */
    createTouch() {
        this.input.addPointer(3);
        const T = CFG.touch, D = 4500, a = T.alpha;
        const midY = 24 + (CFG.H - 24) / 2;            // środek pola gry pod HUD-em
        const ys = [midY - T.h - T.gap, midY, midY + T.h + T.gap];
        const withFire = GS.hasFire || (this.L.items || []).some(i => i.type === 'znicz');
        const withBless = GS.hasBless || (this.L.items || []).some(i => i.type === 'blessing');
        const nR = 3 + (withFire ? 1 : 0) + (withBless ? 1 : 0);
        const ry = Array.from({ length: nR }, (_, i) => midY + (i - (nR - 1) / 2) * (T.h + T.gap));
        this.touchButtons = {};
        const btn = (name, x, y, w, label, size, down, up) => {
            const r = this.add.rectangle(x, y, w, T.h, 0x140c1c, a).setStrokeStyle(1, 0xd8a640, 0.55).setScrollFactor(0).setDepth(D).setInteractive();
            txt(this, x, y + 1, label, size, '#ffe8a0').setScrollFactor(0).setDepth(D + 1).setAlpha(0.7);
            r.on('pointerdown', () => { r.setFillStyle(0xd8a640, 0.45); down(); });
            const rel = () => { r.setFillStyle(0x140c1c, a); if (up) up(); };
            r.on('pointerup', rel); r.on('pointerout', rel);
            this.touchButtons[name] = r;
            return r;
        };
        const lx = T.edge + T.leftW / 2, rx = CFG.W - T.edge - T.rightW / 2;
        if (TOUCH_MODE === 'joystick') {
            this.createJoystick();
            const LJ = T.leftJump;                      // drugi SKOK z lewej, nad joystickiem (przycisk ma pierwszeństwo przed strefą joysticka)
            btn('jumpLeft', LJ.x, LJ.y, LJ.w, 'SKOK', 8, () => this.jumpAt = this.time.now);
        }
        else {
            btn('left', lx, ys[0], T.leftW, '<', 16, () => this.touch.left = true, () => this.touch.left = false);
            btn('right', lx, ys[1], T.leftW, '>', 16, () => this.touch.right = true, () => this.touch.right = false);
            btn('down', lx, ys[2], T.leftW, '↓', 16, () => this.touch.down = true, () => this.touch.down = false);
        }
        let ri = 0;
        btn('ult', rx, ry[ri++], T.rightW, 'GROM', 8, () => this.touch.ult = true, () => this.touch.ult = false);
        if (withFire) btn('fire', rx, ry[ri++], T.rightW, 'OGIEŃ', 8, () => this.firePressed = true);
        if (withBless) btn('bless', rx, ry[ri++], T.rightW, 'BŁOG.', 8, () => this.blessPressed = true);
        btn('attack', rx, ry[ri++], T.rightW, 'KRZYŻ', 8, () => this.attackPressed = true);
        btn('jump', rx, ry[ri++], T.rightW, 'SKOK', 8, () => this.jumpAt = this.time.now);
    }

    /* ---------- joystick (dotyk, tryb testowy): pływający, w lewej strefie ekranu ---------- */
    createJoystick() {
        const J = CFG.touch.joystick, a = CFG.touch.alpha, D = 4500;
        const base = this.add.circle(J.restX, J.restY, J.baseR, 0x140c1c, a).setStrokeStyle(1, 0xd8a640, 0.55).setScrollFactor(0).setDepth(D);
        const knob = this.add.circle(J.restX, J.restY, J.knobR, 0xd8a640, 0.45).setScrollFactor(0).setDepth(D + 1);
        this.joy = { id: null, x0: J.restX, y0: J.restY, ax: 0, ay: 0, base, knob };
        this.joyRest();
        this.input.on('pointermove', (p) => { if (this.joy && p.id === this.joy.id) this.joyMove(p); });
        const up = (p) => { if (this.joy && p.id === this.joy.id) { this.joyMove(p); this.joyRelease(true); } };
        this.input.on('pointerup', up); this.input.on('pointerupoutside', up);
        this.events.once('shutdown', () => { this.joy = null; });
    }
    joyRest() {
        const J = CFG.touch.joystick, j = this.joy;
        j.base.setPosition(J.restX, J.restY).setAlpha(J.restAlpha); j.knob.setPosition(J.restX, J.restY).setAlpha(J.restAlpha);
    }
    inJoyZone(p) { const J = CFG.touch.joystick; return p.x < CFG.W * J.zoneW && p.y > J.topY; }
    joyStart(p) {
        const j = this.joy; j.id = p.id; j.x0 = p.x; j.y0 = p.y; j.t0 = this.time.now; j.maxD = 0;
        j.base.setPosition(p.x, p.y).setAlpha(1); j.knob.setPosition(p.x, p.y).setAlpha(1);
        this.joyMove(p);
    }
    joyMove(p) {
        const J = CFG.touch.joystick, j = this.joy;
        let dx = p.x - j.x0, dy = p.y - j.y0; const d = Math.hypot(dx, dy);
        j.maxD = Math.max(j.maxD || 0, d);
        if (d > J.radius) { dx *= J.radius / d; dy *= J.radius / d; }
        j.knob.setPosition(j.x0 + dx, j.y0 + dy);
        const nx = dx / J.radius, ny = dy / J.radius, m = Math.abs(nx);
        j.ax = m < J.deadZone ? 0 : Math.sign(nx) * (m - J.deadZone) / (1 - J.deadZone);   // analog: 0..1 za martwą strefą
        j.ay = ny;
        this.touch.down = ny >= J.crouchY && dy > Math.abs(dx) * J.crouchSlope;
        if (this.touch.down) j.ax = 0;
    }
    joyRelease(tap) {
        const J = CFG.touch.joystick, j = this.joy;
        // krótkie stuknięcie w joystick = skok (w powietrzu: salto), jak Spacja; przeciąganie = zwykłe sterowanie
        if (tap && J.joyTapJump && j.id !== null && this.time.now - j.t0 < J.tapMaxMs && (j.maxD || 0) < J.tapMaxDist) {
            this.jumpAt = this.time.now; this.joyTaps = (this.joyTaps || 0) + 1;
        }
        j.id = null; j.ax = 0; j.ay = 0; this.touch.down = false;
        this.joyRest();
    }
    /** dotknięcie ekranu: dymek / podsumowanie, joystick, albo (poza przyciskami) skok */
    onPointerDown(p, over) {
        if (this.talk.dialog) { this.talk.advance(); return; }
        if (this.summaryShown) { this.onConfirm(); return; }
        if (!IS_TOUCH || TOUCH_MODE !== 'joystick' || !this.joy) return;
        if (over && over.length) return;                          // przycisk (KRZYŻ, OGIEŃ, GROM, SKOK, M, F)
        if (this.joy.id === null && this.inJoyZone(p)) { this.joyStart(p); return; }
        if (CFG.touch.joystick.tapJump) this.jumpAt = this.time.now;
    }

    /** puszczenie wszystkiego, co trzymane (np. po obróceniu telefonu): Kamil nie biegnie dalej sam */
    resetHeldInput() {
        if (!this.touch) return;
        this.touch.left = this.touch.right = this.touch.down = this.touch.ult = false;
        if (this.joy) this.joyRelease();
        const a = CFG.touch.alpha;
        Object.values(this.touchButtons || {}).forEach(r => r.setFillStyle(0x140c1c, a));
    }

    /* ---------- kucanie (strzałka w dół / przycisk ↓) ---------- */
    setCrouch(on, time) {
        if (on === this.crouching) return;
        const HC = CFG.hero, b = this.hero.body;
        this.crouching = on;
        if (on) { b.setSize(HC.bodyW, HC.crouchH, false); b.setOffset(0, HC.bodyH - HC.crouchH); this.crouchAt = time; }
        else { b.setSize(HC.bodyW, HC.bodyH, false); b.setOffset(0, 0); }
    }

    /* ---------- pętla ---------- */
    update(time, delta) {
        const dt = Math.min(delta, 50) / 1000, cam = this.cameras.main, L = this.L, HC = CFG.hero, W = CFG.W, G = CFG.GROUND_Y;
        const hero = this.hero, body = hero.body;
        const wf = 1 + Math.floor(time / 170) % 4;
        const wk = ART.key(this.L.bg.water + wf);
        this.rivers.forEach(r => { if (r.water.texture.key !== wk) r.water.setTexture(wk); });
        this.far.tilePositionX = cam.scrollX * 0.2;
        this.near.tilePositionX = cam.scrollX * 0.5;

        if (!this.ended && !this.dead) GS.timeMs += delta;
        this.updateHud(time);
        this.updateEnemies(time, dt);
        this.updatePlanks(dt);
        this.updateWeather(time, delta);
        this.updateLevel3(time, delta);
        this.updateLevel4(time, delta);
        this.updateShots(time);
        if (this.dead || this.ended || this.respawning) { this.syncSprite(time, 0); return; }

        // --- auto-scroll + kamera dogania gracza ---
        if (this.arena) this.updateArenaCamera(dt);                   // walka z bossem: ekran stoi przy domu
        else if (!this.cutscene) {
            let sx = this.holdForPlank(cam.scrollX + L.dir * CFG.scrollSpeed * dt);
            if (L.dir > 0 && hero.x - sx > W * HC.followAt) sx = hero.x - W * HC.followAt;
            if (L.dir < 0 && sx + W - hero.x > W * HC.followAt) sx = hero.x - W * (1 - HC.followAt);
            cam.scrollX = Phaser.Math.Clamp(sx, 0, L.length - W);
        }
        if (this.cutscene) { this.syncSprite(time, this.updateAutoWalk()); return; }

        const onG = this.onGround();
        if (onG && body.velocity.y >= 0) { this.lastGroundAt = time; this.jumps = 0; this.flipping = false; }
        const left = this.keys.left.isDown || this.touch.left, right = this.keys.right.isDown || this.touch.right;
        const shift = this.keys.shift.isDown || this.touch.ult;
        const downHeld = this.keys.down.isDown || this.touch.down;

        // --- modlitwa / Grom z Nieba ---
        if (!this.praying && shift && GS.meter >= CFG.ult.max && onG) { this.setCrouch(false, time); this.startPray(time); }
        let vx = 0;
        if (this.praying) {
            if (!this.charged && time - this.prayStart >= CFG.ult.prayMs) this.chargeUlt();
            if (!shift) { if (this.charged) this.fireGrom(); else this.cancelPray(); }
        } else {
            const mult = (time < this.boostUntil ? CFG.boost.mult : 1) * (time < this.slowUntil ? CFG.puddle.slowMult : 1);
            const stunned = time < this.stunUntil;                       // ogłuszony szczekaniem Hansa
            const keyX = (right ? 1 : 0) - (left ? 1 : 0), joyX = this.joy && !keyX ? this.joy.ax : 0;
            const dirX = stunned ? 0 : (keyX || Math.sign(joyX)), amp = keyX ? 1 : Math.abs(joyX);   // joystick: szybciej / wolniej
            if (dirX) this.facing = dirX;
            if (stunned) this.jumpAt = -99999;
            const wantJump = time - this.jumpAt <= HC.jumpBufferMs;
            this.setCrouch(downHeld && onG && !wantJump, time);   // skok z kucnięcia: wstaje i skacze
            vx = dirX * amp * (this.crouching ? HC.crouchSpeed : HC.speed) * mult;
            // skok / salto (z buforem i "coyote time")
            if (time - this.jumpAt <= HC.jumpBufferMs) {
                if (this.jumps === 0 && (onG || time - this.lastGroundAt <= HC.coyoteMs)) {
                    body.setVelocityY(-HC.jumpV); this.jumps = 1; this.lastGroundAt = -99999; this.jumpAt = -99999;
                    WikaryAudio.sfx('jump');
                } else if (!onG && this.jumps < 2) {
                    body.setVelocityY(-HC.saltoV); this.jumps = 2; this.flipping = true; this.jumpAt = -99999;
                    this.kamil.play('k_flip'); WikaryAudio.sfx('salto');
                }
            }
            // rzut krzyżem
            if (this.attackPressed) {
                this.attackPressed = false;
                if (GS.hasCross && time - this.lastThrow >= CFG.cross.cooldownMs) this.throwCross(time);
            }
        }
        if (this.firePressed && !this.praying) {
            if (GS.hasFire && time - this.lastFire >= CFG.fire.cooldownMs) this.throwFire(time);
        }
        if (this.blessPressed && !this.praying) {
            if (GS.hasBless && time - this.lastBless >= CFG.bless.cooldownMs) this.castBlessing(time);
        }
        this.attackPressed = false; this.firePressed = false; this.blessPressed = false;
        body.setVelocityX(vx);
        this.carryOnPlank();

        // --- bohater nigdy nie wychodzi poza ekran ---
        const em = IS_TOUCH ? CFG.touch.heroMargin : HC.edgeMargin;
        const minX = cam.scrollX + em + HC.bodyW / 2, maxX = cam.scrollX + W - em - HC.bodyW / 2;
        if (hero.x < minX) { hero.x = minX; if (body.velocity.x < 0) body.setVelocityX(0); if (body.blocked.right || body.touching.right) this.liftOverObstacle(); }
        if (hero.x > maxX) { hero.x = maxX; if (body.velocity.x > 0) body.setVelocityX(0); if (body.blocked.left || body.touching.left) this.liftOverObstacle(); }

        // --- woda ---
        if (body.top > G + 14) { this.drown(); return; }      // rzeka albo bagno

        // --- kałuże ---
        if (onG && this.puddles.some(p => hero.x > p.x0 && hero.x < p.x1)) {
            if (time > this.slowUntil) WikaryAudio.sfx('puddle');
            this.slowUntil = time + CFG.puddle.slowMs;
        }
        // --- znajdźki ---
        const hb = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
        for (const it of this.items) {
            if (!it.active || it.taken) continue;
            if (Phaser.Geom.Intersects.RectangleToRectangle(hb, it.getBounds())) this.collect(it, time);
        }
        this.items = this.items.filter(i => i.active && !i.taken);

        // --- podpowiedzi ---
        (L.hints || []).forEach((h, i) => {
            if (!this.hintsShown[i] && this.heroD() >= h.at) { this.hintsShown[i] = true; hintBubble(this, IS_TOUCH && h.touch ? (TOUCH_MODE === 'joystick' && h.joy ? h.joy : h.touch) : h.text, h.ms || 3000); }
        });
        // --- spawner wrogów (dopiero gdy wikary ma krzyż) ---
        const E = L.enemies, fd = this.frontD();
        const SP = L.spawn || CFG.spawn;
        const ST = E && E.stages ? E.stages.filter(st => this.heroD() >= st.at).pop() || E.stages[0] : null;   // Level 3: etapy
        const SPs = ST || SP;
        if (E && GS.hasCross && !this.arena && fd > E.from && fd < E.to) {
            this.spawnAcc += delta;
            if (this.spawnAcc >= this.nextSpawn && this.enemies.countActive(true) < SPs.maxAlive) {
                this.spawnAcc = 0; this.nextSpawn = Phaser.Math.Between(SPs.minMs, SPs.maxMs);
                const set = ST ? ST.set : E.late && this.heroD() >= E.late.at ? E.late.set : E.set;
                const t = this.pickEnemy(set);
                if (this.spawnAllowed(t)) this.spawnEnemy(t);
            }
        }
        // --- meta: kościół (Level 1) albo arena z bossem (Level 2) ---
        if (L.defense) { if (!this.arena && this.heroD() >= L.arenaAt) this.startDefense(); }
        else if (L.boss === 'adrian') { if (!this.arena && this.heroD() >= L.arenaAt) this.startAdrianArena(); }
        else if (L.boss) { if (!this.arena && this.heroD() >= L.arenaAt) this.startArena(); }
        else if (this.heroD() >= L.endAt - 6) this.finishLevel();
        this.syncSprite(time, vx);
    }

    syncSprite(time, vx) {
        const k = this.kamil, hero = this.hero, b = hero.body;
        if (this.kamilFree) return;                           // cutscenka steruje sprite'em Kamila (wsiadanie do auta)
        k.x = hero.x; k.y = b.bottom;
        k.setFlipX(this.facing < 0);
        const moved = Math.abs(hero.x - this.prevHeroX) > 0.3; this.prevHeroX = hero.x;
        if (!this.dead && !this.ended && !this.cutscene) {
            const onG = this.onGround();
            if (this.praying) this.playK('k_pray');
            else if (this.crouching) { if (time - this.crouchAt < CFG.hero.crouchDownMs) { k.anims.stop(); k.setTexture('wikary_kamil_crouch_down_1'); } else this.playK('k_crouch'); }
            else if (time < this.attackUntil) { /* animacja rzutu */ }
            else if (!onG && this.flipping && k.anims.isPlaying && k.anims.currentAnim.key === 'k_flip') { /* salto */ }
            else if (!onG) { k.anims.stop(); k.setTexture(b.velocity.y < -60 ? 'wikary_kamil_jump_1' : b.velocity.y < 60 ? 'wikary_kamil_jump_2' : 'wikary_kamil_jump_3'); }
            else if (vx !== 0 || moved) this.playK('k_run');
            else this.playK('k_idle');
        }
        const inv = time < this.invulnUntil && !this.dead;
        k.setAlpha(inv && Math.floor(time / 80) % 2 ? 0.35 : 1);
        if (!this.dead) k.setTint(time < this.stunUntil ? 0xa0a0ff : time < this.boostUntil ? 0xffffb0 : 0xffffff);
        if (this.aura) { this.aura.x = k.x; this.aura.y = k.y + 2; }
    }

    liftOverObstacle() {     // przyparty do przeszkody przez krawędź ekranu -> wskakuje na nią (nie ginie za ekranem)
        const hero = this.hero;
        const ob = this.solids.find(z => !this.groundSolids.includes(z) && Math.abs(z.x - hero.x) < z.body.width / 2 + CFG.hero.bodyW);
        if (ob) { hero.body.reset(hero.x, ob.body.top - CFG.hero.bodyH / 2 - 2); }
    }

    /* ---------- znajdźki ---------- */
    collect(it, time) {
        it.taken = true;
        const t = it.itemType;
        if (t === 'diamond') {
            GS.score += CFG.score.diamond; GS.diamonds++; this.addMeter(CFG.ult.perDiamond);
            WikaryAudio.sfx('diamond'); this.popup(it.x, it.y, '+' + CFG.score.diamond);
        } else if (t === 'lightning') {
            GS.score += CFG.score.lightning; this.boostUntil = time + CFG.boost.ms;
            WikaryAudio.sfx('boost'); this.popup(it.x, it.y, 'SZYBCIEJ!');
        } else if (t === 'cross') {
            this.crossPickup(it); return;
        } else if (t === 'znicz') {
            this.zniczPickup(it); return;
        } else if (t === 'blessing') {
            this.blessingPickup(it); return;
        } else if (t === 'repellent') {
            this.repellentPickup(it, time);
        } else if (t === 'life') {
            GS.lives = Math.min(CFG.hero.maxLives, GS.lives + 1);
            WikaryAudio.sfx('pickup'); this.popup(it.x, it.y, '+1 ŻYCIE');
            if (GS.lives >= CFG.hero.maxLives) this.removeLifePickups(it);
        }
        this.tweens.killTweensOf(it);
        this.tweens.add({ targets: it, scale: it.scale * 1.8, alpha: 0, duration: 180, onComplete: () => it.destroy() });
    }
    addMeter(v) { GS.meter = Math.min(CFG.ult.max, GS.meter + v); }
    popup(x, y, s) {
        const p = txt(this, x, y - 10, s, 8, '#ffe070').setDepth(20);
        this.tweens.add({ targets: p, y: y - 34, alpha: 0, duration: 700, onComplete: () => p.destroy() });
    }

    crossPickup(it) {           // piorun + przyciemnienie + pierwsza moc: rzut krzyżem
        this.cutscene = true; this.setCrouch(false, 0);
        this.tweens.killTweensOf(it); it.destroy();
        this.physics.pause();
        const k = this.kamil;
        k.setAlpha(1); this.kamil.play('k_bless');
        WikaryAudio.sfx('thunder');
        this.cameras.main.flash(180, 255, 255, 230);
        this.tweens.add({ targets: this.dim, alpha: 0.6, duration: 250 });
        const fx = this.add.sprite(k.x, k.y - k.displayHeight - 6, 'fx_bless_1').setScale(0.7).setDepth(11).play('fx_bless');
        const strike = () => {
            const b = this.add.sprite(k.x + Phaser.Math.Between(-4, 4), k.y, 'fx_lightning_strike_1').setOrigin(0.5, 1).setDepth(11.5).play('lightning_strike');
            b.once('animationcomplete', () => b.destroy());
        };
        strike(); this.time.delayedCall(380, strike);
        this.time.delayedCall(380, () => { this.cameras.main.flash(140, 255, 255, 255); this.cameras.main.shake(200, 0.008); });
        this.time.delayedCall(700, () => hintBubble(this, IS_TOUCH ? 'KRZYŻ = RZUT KRZYŻEM' : 'ALT = RZUT KRZYŻEM', 3200, 90));
        this.time.delayedCall(1900, () => {
            fx.destroy();
            this.tweens.add({ targets: this.dim, alpha: 0, duration: 300, onComplete: () => this.dim.setAlpha(0) });
            GS.hasCross = true; GS.score += CFG.score.cross; this.popup(k.x, k.y - 80, '+' + CFG.score.cross);
            this.physics.resume(); this.cutscene = false;
        });
    }

    /** hitbox czaru (w px ekranu): dawny hitbox × Difficulty.spells().hitScale + reachUp/reachDown; grafika bez zmian */
    spellBody(s, baseW, baseH) {
        const S = Difficulty.spells(), sx = Math.abs(s.scaleX), sy = Math.abs(s.scaleY);
        const w = baseW * S.hitScale, h = baseH * S.hitScale + S.reachUp + S.reachDown;
        s.body.setSize(w / sx, h / sy, false);
        s.body.setOffset(s.frame.width / 2 - w / sx / 2, s.frame.height / 2 - h / sy / 2 + (S.reachDown - S.reachUp) / 2 / sy);
        s.hitW = w; s.hitH = h;
    }
    /** zasięg pocisków: krzyż do Difficulty.spells().crossRange, ogień do krawędzi kamery ('screen') albo liczba px */
    updateShots(time) {
        const cam = this.cameras.main, S = Difficulty.spells();
        this.shots.getChildren().slice().forEach(s => {
            if (!s.active) return;
            if (time > s.dieAt) { s.destroy(); return; }
            if (s.range === 'screen') {
                const vx = s.body.velocity.x, edge = s.displayWidth / 2;
                if ((vx > 0 && s.x - edge > cam.scrollX + CFG.W) || (vx < 0 && s.x + edge < cam.scrollX)) { s.reachedEdge = true; s.destroy(); }
            } else if (typeof s.range === 'number' && Math.abs(s.x - s.startX) >= s.range) { s.travelled = Math.abs(s.x - s.startX); s.destroy(); }
        });
    }
    throwCross(time) {
        this.lastThrow = time; this.attackUntil = time + 240;
        const h = this.hero, y = this.crouching ? h.body.bottom - CFG.cross.crouchUp : h.y + CFG.cross.standDy;
        const s = this.shots.create(h.x + this.facing * 14, y, 'fx_cross_1');
        s.setScale(0.8).setDepth(9).play('fx_cross');
        s.body.setAllowGravity(false); this.spellBody(s, 16, 19.2);      // dawny hitbox 20x24 px klatki × skala 0.8
        s.setVelocityX(this.facing * CFG.cross.speed);
        s.kind = 'cross'; s.startX = s.x; s.range = Difficulty.spells().crossRange; s.dieAt = time + 10000;
        if (!this.crouching) this.kamil.play('k_attack');   // w kucnięciu zostaje w kucnięciu
        WikaryAudio.sfx('throw');
    }

    /* ---------- Grom z Nieba ---------- */
    startPray(time) { this.praying = true; this.charged = false; this.prayStart = time; this.hero.body.setVelocityX(0); }
    chargeUlt() {
        this.charged = true;
        this.aura = this.add.sprite(this.kamil.x, this.kamil.y + 2, 'fx_pray_aura_1').setOrigin(0.5, 1).setScale(0.5).setDepth(9.5).play('fx_aura');
        this.tweens.killTweensOf(this.dim);
        this.tweens.add({ targets: this.dim, alpha: CFG.ult.dim, duration: 500 });
        WikaryAudio.sfx('charge');
    }
    cancelPray() {
        this.praying = false; this.charged = false;
        if (this.aura) { this.aura.destroy(); this.aura = null; }
        this.tweens.killTweensOf(this.dim);
        this.tweens.add({ targets: this.dim, alpha: 0, duration: 200, onComplete: () => this.dim.setAlpha(0) });
    }
    fireGrom() {
        const cam = this.cameras.main, G = CFG.GROUND_Y, cx = cam.scrollX + CFG.W / 2;
        this.cancelPray();
        GS.meter = 0;
        this.kamil.play('k_bless');
        const cross = this.add.image(cx, -80, 'fx_grom_cross').setDepth(12);
        const pillars = [this.add.sprite(cx, CFG.H, 'fx_grom_pillar_1').setOrigin(0.5, 1).setAlpha(0).setDepth(11).play('grom_pillar')];
        WikaryAudio.sfx('grom');
        this.tweens.add({
            targets: cross, y: G - 150, duration: 260, ease: 'Quad.easeIn',
            onComplete: () => {
                cam.flash(450, 255, 255, 255); cam.shake(350, 0.012);
                pillars[0].setAlpha(1);
                this.enemies.getChildren().slice().forEach(e => {
                    if (!e.active || e.dead || !this.inView(e)) return;
                    if (Math.abs(e.x - cx) > 40) pillars.push(this.add.sprite(e.x, CFG.H, 'fx_grom_pillar_1').setOrigin(0.5, 1).setDepth(11).play({ key: 'grom_pillar', startFrame: pillars.length % 4 }));
                    this.damageEnemy(e, 999, true);
                });
                this.tweens.add({ targets: [cross, ...pillars], alpha: 0, duration: 600, delay: 450, onComplete: () => { cross.destroy(); pillars.forEach(p => p.destroy()); } });
            },
        });
    }
    inView(o) { const c = this.cameras.main; return o.x > c.scrollX - 20 && o.x < c.scrollX + CFG.W + 20 && o.y > -40 && o.y < CFG.H + 40; }

    /* ---------- wrogowie (grafiki TYMCZASOWE z Fibi-Run) ---------- */
    spawnAllowed(type) {             // CFG.spawnRate: rzadsze typy w danym poziomie (np. nietoperze w Level 2)
        const r = (CFG.spawnRate.byLevel[this.levelIndex] || {})[type];
        return r === undefined || Math.random() < r;
    }
    pickEnemy(set) {
        const tot = set.reduce((a, t) => a + CFG.enemies[t].weight, 0);
        let r = Math.random() * tot;
        for (const t of set) { r -= CFG.enemies[t].weight; if (r <= 0) return t; }
        return set[0];
    }
    spawnEnemy(type) {
        const cam = this.cameras.main, W = CFG.W, G = CFG.GROUND_Y, dir = this.L.dir, C = enemyCfg(type);
        const frontX = dir > 0 ? cam.scrollX + W + 30 : cam.scrollX - 30, mv = -dir;
        const mk = (x, y, key, anim) => {
            const e = this.enemies.create(x, y, key);
            e.type = type; e.hp = C.hp; e.dead = false; e.thread = null;
            e.setOrigin(0.5, 1).setScale(C.scale).setDepth(7).setFlipX(mv < 0);   // grafiki patrzą w prawo
            if (anim) e.play(anim);
            this.fitBody(e);
            return e;
        };
        if (type === 'dog' || type === 'wolf') {
            const e = mk(frontX, G, type === 'dog' ? 'enemy_dog_run_1' : 'enemy_wolf_run_1', type === 'dog' ? 'dog_run' : 'wolf_run');
            e.setVelocityX(mv * C.speed);
            e.nextJump = this.time.now + (C.jumpEveryMs || 0);
        } else if (type === 'bat') {
            const baseY = Phaser.Math.Between(C.yMin, C.yMax);
            for (let i = 0; i < C.wave; i++) {
                const e = mk(frontX + dir * i * C.gap, baseY, 'enemy_bat_fly_1', 'bat_fly');
                e.body.setAllowGravity(false);
                e.anims.setProgress((i * 0.3) % 1);
                e.baseY = baseY; e.phase = i * 0.9; e.t0 = this.time.now;
                e.setVelocityX(mv * C.speed);
            }
        } else if (this.spawnEnemy2(type, frontX, mv, mk) || this.spawnEnemy3(type, frontX, mv, mk) || this.spawnEnemy4(type, frontX, mv)) {
            /* Level 2: wrona, dzik, błędny ognik (level2.js) */
        } else if (type === 'spider') {
            const x = dir > 0 ? cam.scrollX + Phaser.Math.Between(W * 0.55, W * 0.9) : cam.scrollX + Phaser.Math.Between(W * 0.1, W * 0.45);
            const e = mk(x, 0, 'enemy_spider_1', 'spider_wiggle');
            e.setFlipX(false);
            e.body.setAllowGravity(false);
            e.state = 'drop'; e.setVelocityY(C.dropSpeed);
            e.thread = this.add.tileSprite(x, -8, 4, 8, 'enemy_spider_thread').setOrigin(0.5, 0).setScale(C.scale).setDepth(6.9);
            e.once('destroy', () => { if (e.thread) { e.thread.destroy(); e.thread = null; } });
        }
    }
    /** hitbox na dole klatki (origin 0.5,1), w px ekranu z CFG; działa też po zmianie klatki (skok wilka) */
    fitBody(e) {
        const C = e.type === 'hans' ? CFG.boss : e.type === 'rafal' ? CFG.rafal : e.type === 'adrian' ? CFG.adrian : enemyCfg(e.type), w = C.bodyW / Math.abs(e.scaleX), h = C.bodyH / Math.abs(e.scaleY);
        e.body.setSize(w, h, false);
        const mid = e.type === 'bat' || C.center;
        e.body.setOffset(e.frame.width * e.originX - w / 2, mid ? (e.frame.height - h) / 2 : e.frame.height - h - (e.type === 'spider' ? 2 : 0));
    }
    updateEnemies(time, dt) {
        const cam = this.cameras.main, dir = this.L.dir;
        this.enemies.getChildren().slice().forEach(e => {
            if (!e.active || e.dead) return;
            if (e.type === 'hans') { this.updateBoss(e, time, dt); return; }
            if (e.type === 'rafal') { this.updateRafal(e, time, dt); return; }
            if (e.type === 'adrian') { this.updateAdrian(e, time, dt); return; }
            const C = enemyCfg(e.type);
            if (e.type === 'wolf') {
                const onG = e.body.blocked.down || e.body.touching.down;
                if (onG && time > e.nextJump) { e.setVelocityY(-C.jumpV); e.nextJump = time + C.jumpEveryMs; }
                else if (!onG) { e.anims.stop(); e.setTexture(e.body.velocity.y < 0 ? 'enemy_wolf_jump_1' : 'enemy_wolf_jump_2'); this.fitBody(e); }
                else if (!e.anims.isPlaying) { e.play('wolf_run'); this.fitBody(e); }
            }
            if (this.updateEnemy2(e, C, time, dt) || this.updateEnemy3(e, C, time, dt) || this.updateEnemy4(e, C, time, dt)) return;
            if (e.type === 'bat') e.body.velocity.y = Math.cos((time - e.t0) / 1000 * C.freq + e.phase) * C.amp * C.freq;
            if (e.type === 'spider') {
                if (e.state === 'drop' && e.y >= C.dropTo) { e.state = 'hold'; e.setVelocityY(0); e.holdUntil = time + C.holdMs; }
                else if (e.state === 'hold' && time > e.holdUntil) { e.state = 'up'; e.setVelocityY(-C.dropSpeed); }
                else if (e.state === 'up' && e.y < -6) { e.destroy(); return; }
                if (e.thread) { e.thread.x = e.x; e.thread.height = Math.max(1, (e.y - e.displayHeight + 3 + 8) / C.scale); }
            }
            const behind = dir > 0 ? e.x < cam.scrollX - 140 : e.x > cam.scrollX + CFG.W + 140;
            if (behind || e.y > CFG.H + 80) e.destroy();
        });
    }
    damageEnemy(e, dmg, byUlt) {
        if (e.dead || !e.active) return;
        if (e.type === 'hans') { this.bossHit(e, dmg, byUlt); return; }
        if (e.type === 'rafal') { this.rafalHit(e, dmg, byUlt); return; }
        if (e.type === 'adrian') { this.adrianHit(e, dmg, byUlt); return; }
        e.hp -= dmg;
        if (e.hp > 0) {
            WikaryAudio.sfx('hit');
            e.setTintFill(0xffffff);
            this.time.delayedCall(90, () => { if (e.active) { e.clearTint(); if (e.baseTint) e.setTint(e.baseTint); } });
            return;
        }
        e.dead = true; e.body.enable = false;
        const pts = CFG.score[e.type] || 50;
        GS.score += pts; GS.kills++; if (!byUlt) this.addMeter(CFG.ult.perKill);
        WikaryAudio.sfx('kill'); this.popup(e.x, e.y - e.displayHeight - 4, '+' + pts);
        const poof = this.makePoof(e);
        poof.once('animationcomplete', () => poof.destroy());
        const dropChance = Math.min(1, (CFG.lifePickup.dropChanceByLevel[this.levelIndex] || 0) * Difficulty.cur().heartDrop);
        if (GS.lives < CFG.hero.maxLives && Math.random() < dropChance) {
            this.createLifePickup(e.x, CFG.GROUND_Y - CFG.lifePickup.pickupY);
        }
        e.destroy();
    }

    /** naskok: Kamil spada stopami na wierzch wroga -> wróg z 1 HP ginie, z większą liczbą traci 1 HP, Kamil się odbija */
    tryStomp(e) {
        const S = CFG.stomp, hb = this.hero.body, eb = e.body;
        if (!eb || S.exclude.includes(e.type) || this.dead || this.ended || this.cutscene || this.respawning) return false;
        if (hb.velocity.y <= 0 || hb.center.y >= eb.center.y) return false;
        const footPrev = hb.prev.y + hb.height, top = Math.min(eb.top, eb.prev.y);
        if (footPrev > top + S.tolerancePx) return false;
        const kill = !(e.hp > 1);
        this.damageEnemy(e, kill ? Math.max(1, e.hp || 1) : 1);
        hb.setVelocityY(-(kill ? S.bounceKill : S.bounceHit));
        this.jumps = 1; this.flipping = false; this.lastGroundAt = -99999;   // po odbiciu można jeszcze zrobić salto
        this.stompSafeUntil = this.time.now + S.invulnMs; this.stomps++;
        this.stompLog.push({ type: e.type, kill, hpLeft: kill ? 0 : e.hp });
        WikaryAudio.sfx('jump');
        return true;
    }

    /* ---------- obrażenia, woda, koniec ---------- */
    hurt(fromX) {
        const now = this.time.now;
        if (now < this.invulnUntil || this.dead || this.ended || this.cutscene || this.respawning) return;
        GS.lives--; this.invulnUntil = now + CFG.hero.invulnMs;
        if (this.praying) this.cancelPray();
        WikaryAudio.sfx('hurt'); this.cameras.main.shake(150, 0.008);
        const away = Math.sign(this.hero.x - fromX) || -this.L.dir;
        this.hero.body.setVelocity(away * CFG.hero.knockback, -200);
        this.jumps = 1;
        if (GS.lives <= 0) this.gameOver();
    }
    drown() {
        if (this.respawning || this.dead) return;
        this.setCrouch(false, 0);
        const now = this.time.now;
        this.respawning = true;
        if (this.praying) this.cancelPray();
        WikaryAudio.sfx('splash');
        if (now >= this.invulnUntil) GS.lives--;                // nietykalność działa też na wodę
        this.invulnUntil = now + CFG.hero.invulnMs + 600;
        this.hero.body.setVelocity(0, 0); this.hero.body.setAllowGravity(false);
        if (GS.lives <= 0) { this.respawning = false; this.gameOver(); return; }
        const cam = this.cameras.main;
        cam.once('camerafadeoutcomplete', () => {
            const hd = this.heroD();
            const r = this.rivers.filter(rv => rv.at <= hd + 4).sort((a, b) => b.at - a.at)[0] || this.rivers[0];
            const x = this.wx(Math.max(0, (r ? r.at : hd) - CFG.hero.respawnBeforeRiver));
            this.hero.body.setAllowGravity(true);
            this.hero.body.reset(x, CFG.GROUND_Y - CFG.hero.bodyH / 2 - 1);
            this.jumps = 0; this.flipping = false; this.facing = this.L.dir; this.jumpAt = -99999;
            if (this.L.dir > 0) cam.scrollX = Phaser.Math.Clamp(Math.min(cam.scrollX, x - 140), 0, this.L.length - CFG.W);
            else cam.scrollX = Phaser.Math.Clamp(Math.max(cam.scrollX, x + 140 - CFG.W), 0, this.L.length - CFG.W);
            this.invulnUntil = this.time.now + CFG.hero.invulnMs;
            this.prevHeroX = x;
            cam.fadeIn(250, 0, 0, 0);
            this.respawning = false;
        });
        cam.fade(300, 0, 0, 0, true);
    }
    gameOver() {
        if (this.dead) return;
        this.setCrouch(false, 0);
        this.dead = true; GS.lives = 0;
        if (this.praying) this.cancelPray();
        this.hero.body.setVelocity(0, 0); this.hero.body.setAllowGravity(false); this.hero.body.enable = false;
        WikaryAudio.stop(0.2); WikaryAudio.sfx('gameover');
        this.kamil.anims.stop(); this.kamil.setTexture('wikary_kamil_pray_1').setTint(0xff8080).setAlpha(1);
        this.tweens.add({ targets: this.kamil, alpha: 0.4, duration: 900 });
        const go = goldText(this, CFG.W / 2, CFG.H / 2 - 20, 'GAME OVER', 24).setScrollFactor(0).setDepth(5000);
        go.setScale(0.2);
        this.tweens.add({ targets: go, scale: 1, duration: 400, ease: 'Back.easeOut' });
        const toNick = () => {
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Nick', { result: 'over' }));
            this.cameras.main.fade(400, 0, 0, 0, true);
        };
        if (Difficulty.retryAllowed() && GS.retries < CFG.retry.maxRetries) this.time.delayedCall(CFG.retry.askDelayMs, () => this.askRetry(go, toNick));
        else this.time.delayedCall(2600, toNick);
    }
    /** „POWTÓRZYĆ POZIOM?” TAK / NIE: strzałki + Spacja / Enter albo dotyk; TAK = ten sam poziom od początku */
    askRetry(go, toNick) {
        if (this.retryPrompt || !this.sys.isActive()) return;
        const W = CFG.W, D = 5100;
        this.tweens.add({ targets: go, y: 92, duration: 300 });
        const box = this.add.rectangle(W / 2, 178, 300, 104, 0x0c0610, 0.92).setStrokeStyle(2, 0xd8a640).setScrollFactor(0).setDepth(D);
        const q = txt(this, W / 2, 148, 'POWTÓRZYĆ POZIOM?', 16, '#ffe9a8', { stroke: '#2a1206', strokeW: 4 }).setScrollFactor(0).setDepth(D + 1);
        const sub = txt(this, W / 2, 168, 'WYNIK ZOSTAJE, MOŻNA TYLKO RAZ', 8, '#c8b890').setScrollFactor(0).setDepth(D + 1);
        const P = { sel: 0, buttons: [], objs: [box, q, sub] };
        ['TAK', 'NIE'].forEach((label, i) => {
            const x = W / 2 + (i ? 62 : -62), y = 202;
            const r = this.add.rectangle(x, y, 96, 26, 0x1a0c10, 0.85).setStrokeStyle(2, 0x8a6a30).setScrollFactor(0).setDepth(D + 1);
            const t = txt(this, x, y + 1, label, 16, '#c8b8a0', { stroke: '#2a1206', strokeW: 4 }).setScrollFactor(0).setDepth(D + 2);
            r.setInteractive({ useHandCursor: true })
                .on('pointerover', () => P.select(i))
                .on('pointerdown', (p, lx, ly, ev) => { if (ev) ev.stopPropagation(); })
                .on('pointerup', (p, lx, ly, ev) => { if (ev) ev.stopPropagation(); P.select(i); P.confirm(); });
            P.buttons.push({ r, t }); P.objs.push(r, t);
        });
        P.select = (i) => {
            if (P.sel !== i) WikaryAudio.sfx('click');
            P.sel = i;
            P.buttons.forEach((b, k) => {
                b.r.setStrokeStyle(2, k === i ? 0xffd040 : 0x8a6a30).setFillStyle(k === i ? 0x3a1a10 : 0x1a0c10, 0.88);
                b.t.setColor(k === i ? '#ffe070' : '#c8b8a0');
            });
        };
        P.confirm = () => {
            if (P.done) return; P.done = true;
            WikaryAudio.sfx('select');
            if (P.sel === 0) this.retryLevel(); else toNick();
        };
        P.select(0);
        P.objs.forEach(o => o.setAlpha(0));
        this.tweens.add({ targets: P.objs, alpha: 1, duration: 200 });
        this.retryPrompt = P;
    }
    retryLevel() {
        const S = this.levelStart;
        GS.retries++; GS.retryUsed = true;
        GS.lives = Difficulty.cur().lives;
        GS.hasCross = S.hasCross; GS.hasFire = S.hasFire; GS.hasBless = S.hasBless; GS.meter = S.meter;
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Level', { level: this.levelIndex }));
        this.cameras.main.fade(350, 0, 0, 0, true);
    }
    finishLevel() {
        if (this.ended) return;
        this.setCrouch(false, 0);
        this.ended = true;
        if (this.praying) this.cancelPray();
        const k = this.kamil, hero = this.hero;
        hero.body.setVelocity(0, 0);
        this.enemies.getChildren().slice().forEach(e => { if (e.active) { e.dead = true; e.body.enable = false; this.tweens.add({ targets: e, alpha: 0, duration: 300, onComplete: () => e.destroy() }); } });
        WikaryAudio.stop(0.5); WikaryAudio.sfx('win');
        this.facing = this.L.dir; k.setFlipX(this.facing < 0); k.play('k_idle'); k.setAlpha(1);
        this.door.setTexture('church_door_2');
        this.time.delayedCall(220, () => this.door.setTexture('church_door_3'));
        // dymek "Zdążyłem!"
        const bx = k.x, by = k.y - k.displayHeight - 16;
        const t = txt(this, bx, by, this.L.endText || 'Zdążyłem!', 8, '#ffffff');
        const bg = this.add.rectangle(bx, by, t.width + 16, t.height + 12, 0x140c1c, 0.92).setStrokeStyle(2, 0xd8a640);
        this.add.container(0, 0, [bg, t]).setDepth(30);
        this.time.delayedCall(1300, () => {
            k.play('k_run');
            this.tweens.add({ targets: k, x: this.doorX, duration: Math.abs(this.doorX - k.x) * 8 + 200 });
            this.tweens.add({ targets: k, alpha: 0, delay: Math.abs(this.doorX - k.x) * 8, duration: 300, onComplete: () => k.setAlpha(0) });
        });
        this.time.delayedCall(2500, () => this.showSummary());
    }
    showSummary() {
        const W = CFG.W, D = 4800, L = this.L;
        const add = (o) => o.setScrollFactor(0).setDepth(D);
        add(this.add.rectangle(W / 2, 168, 360, 200, 0x0c0610, 0.92).setStrokeStyle(2, 0xd8a640));
        add(goldText(this, W / 2, 88, 'POZIOM ' + L.id + ' UKOŃCZONY!', 16));
        const lines = [['PUNKTY', String(GS.score)], ['DIAMENTY', String(GS.diamonds)], ['WROGOWIE', String(GS.kills)], ['CZAS', Leaderboard.fmt(GS.timeMs / 1000)]];
        lines.forEach(([a, b], i) => {
            add(txt(this, W / 2 - 140, 120 + i * 20, a, 8, '#d8c8a0', { ox: 0 }));
            add(txt(this, W / 2 + 140, 120 + i * 20, b, 8, '#ffffff', { ox: 1 }));
        });
        const hasNext = L.next !== null && L.next !== undefined && LEVELS[L.next];
        const nextTxt = hasNext ? (L.nextVia === 'Church' ? 'DALEJ: KOŚCIÓŁ I ROZMOWA Z PROBOSZCZEM' : 'DALEJ: LEVEL ' + LEVELS[L.next].id + ' – ' + LEVELS[L.next].name)
            : L.final ? 'KONIEC... NA RAZIE!' : L.nextText || 'CIĄG DALSZY: LEVEL ' + (L.id + 1) + ' WKRÓTCE';
        add(txt(this, W / 2, 214, nextTxt, L.final ? 16 : 8, '#ffd040'));
        add(txt(this, W / 2, 246, (IS_TOUCH ? 'DOTKNIJ' : 'ENTER') + (hasNext ? ' = DALEJ' : ' = ZAPISZ WYNIK'), 8, '#c8b890'));
        this.time.delayedCall(400, () => { this.summaryShown = true; });
    }
    onConfirm() {
        if (this.talk.dialog) { this.talk.advance(); return; }
        if (this.retryPrompt) { this.retryPrompt.confirm(); return; }
        if (!this.summaryShown) return;
        this.summaryShown = false;
        WikaryAudio.sfx('select');
        const L = this.L;
        this.cameras.main.once('camerafadeoutcomplete', () => {
            if (L.next !== null && L.next !== undefined && LEVELS[L.next]) {
                if (L.nextVia === 'Church') this.scene.start('Church', { next: L.next });
                else this.scene.start('Level', { level: L.next });
            }
            else this.scene.start('Nick', { result: 'win' });
        });
        this.cameras.main.fade(350, 0, 0, 0, true);
    }

    /* ---------- tylko testy (?debug=1) ---------- */
    debugTeleport(d) {
        const x = this.wx(d), cam = this.cameras.main;
        this.hero.body.reset(x, CFG.GROUND_Y - CFG.hero.bodyH / 2 - 1);
        cam.scrollX = Phaser.Math.Clamp(this.L.dir > 0 ? x - 150 : x + 150 - CFG.W, 0, this.L.length - CFG.W);
        this.prevHeroX = x;
    }
}
