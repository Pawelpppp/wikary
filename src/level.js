'use strict';
/* =====================================================================
   Poziom (sterowany danymi z levels.js): auto-scroll, skoki i salto, rzeki,
   przeszkody, znajdźki, wrogowie, rzut krzyżem (Alt), Grom z Nieba (Shift).
   ===================================================================== */
class LevelScene extends Phaser.Scene {
    constructor() { super('Level'); }
    init(data) { this.levelIndex = (data && data.level) || 0; }

    create() {
        const L = this.L = LEVELS[this.levelIndex], W = CFG.W, H = CFG.H, G = CFG.GROUND_Y, HC = CFG.hero;
        // --- reset CAŁEGO stanu sceny (scena przy restarcie zachowuje pola instancji) ---
        this.ended = false; this.dead = false; this.cutscene = false; this.respawning = false;
        this.praying = false; this.charged = false; this.prayStart = 0; this.aura = null;
        this.invulnUntil = 0; this.lastGroundAt = 0; this.jumpAt = -99999; this.jumps = 0; this.flipping = false;
        this.attackUntil = 0; this.lastThrow = -99999; this.attackPressed = false;
        this.boostUntil = 0; this.slowUntil = 0; this.facing = L.dir;
        this.spawnAcc = 0; this.nextSpawn = 1200; this.hintsShown = {}; this.summaryShown = false;
        this.touch = { left: false, right: false, ult: false };
        this.items = []; this.puddles = []; this.solids = []; this.groundSolids = []; this.popups = [];
        this.prevHeroX = 0; this.textInput = false;
        GS.level = this.levelIndex;

        bindGlobalKeys(this);
        const cam = this.cameras.main;
        cam.setBackgroundColor('#1a1020');
        cam.setScroll(L.dir > 0 ? 0 : L.length - W, 0);
        cam.fadeIn(300, 0, 0, 0);
        this.physics.world.gravity.y = CFG.gravity;
        if (this.physics.world.isPaused) this.physics.resume();

        // --- tło: niebo (stałe) + dwie warstwy paralaksy ---
        const BG = L.bg;
        this.add.image(0, 0, BG.sky).setOrigin(0).setScrollFactor(0).setDepth(0);
        this.far = this.add.tileSprite(0, 16, W, 200, BG.far).setOrigin(0).setScrollFactor(0).setDepth(0.5);
        this.near = this.add.tileSprite(0, 138, W, 150, BG.near).setOrigin(0).setScrollFactor(0).setDepth(1);

        // --- ziemia i rzeki ---
        const rivers = (L.rivers || []).slice().sort((a, b) => a.at - b.at);
        let d0 = 0;
        const segs = [];
        rivers.forEach(r => { segs.push([d0, r.at]); d0 = r.at + r.w; });
        segs.push([d0, L.length]);
        segs.forEach(([a, b]) => {
            const x0 = Math.min(this.wx(a), this.wx(b)), x1 = Math.max(this.wx(a), this.wx(b));
            this.add.tileSprite(x0, 288, x1 - x0, 32, BG.ground).setOrigin(0).setDepth(2).setTilePosition(x0 % 64, 0);
            const z = this.add.zone((x0 + x1) / 2, G + 40, x1 - x0, 80);
            this.physics.add.existing(z, true);
            this.solids.push(z); this.groundSolids.push(z);
        });
        this.rivers = rivers.map(r => {
            const x0 = Math.min(this.wx(r.at), this.wx(r.at + r.w)), x1 = Math.max(this.wx(r.at), this.wx(r.at + r.w));
            const water = this.add.tileSprite(x0, 292, x1 - x0, 28, BG.water + '1').setOrigin(0).setDepth(3);
            this.add.image(x0, 288, 'water_bank_left').setOrigin(0).setDepth(3.5);
            this.add.image(x1, 288, 'water_bank_right').setOrigin(1, 0).setDepth(3.5);
            return { at: r.at, w: r.w, x0, x1, water };
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
            } else if (o.type === 'puddle') {
                this.add.image(x, G + 2, 'obstacle_puddle').setOrigin(0.5, 1).setDepth(3);
                this.puddles.push({ x0: x - 26, x1: x + 26 });
            }
        });

        // --- znajdźki ---
        (L.items || []).forEach(it => {
            const x = this.wx(it.at);
            let s;
            if (it.type === 'diamond') {
                s = this.add.sprite(x, G - (it.h || 18) - 6, 'item_diamond_1').setScale(CFG.items.scale).setDepth(6).play({ key: 'diamond_spin', startFrame: it.at % 6 });
                this.tweens.add({ targets: s, y: s.y - 4, duration: 600 + (it.at % 5) * 60, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            } else if (it.type === 'lightning') {
                s = this.add.sprite(x, G - (it.h || 26) - 8, 'item_lightning_1').setScale(CFG.items.scale).setDepth(6).play('lightning_item');
                this.tweens.add({ targets: s, y: s.y - 5, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            } else if (it.type === 'cross') {
                if (GS.hasCross) return;
                s = this.add.image(x, G - 24, 'fx_bless_3').setScale(0.4).setDepth(6);
                this.tweens.add({ targets: s, scale: 0.46, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            }
            if (s) { s.itemType = it.type; this.items.push(s); }
        });

        // --- kościół na końcu: drzwi (overlay 48x72 w punkcie 51,162 obrazka) stoją na pozycji endAt ---
        const ex = this.wx(L.endAt), flip = L.dir < 0;
        const doorLeft = flip ? 240 - 51 - 48 : 51;                  // lewa krawędź drzwi w obrazku kościoła
        const churchX = ex - (doorLeft + 24) + 120, churchY = G + 2;
        this.add.image(churchX, churchY, BG.end).setOrigin(0.5, 1).setDepth(2.5).setFlipX(flip);
        this.door = this.add.image(churchX - 120 + doorLeft, churchY - 250 + 162, 'church_door_1').setOrigin(0).setDepth(2.6).setFlipX(flip);
        this.doorX = ex;

        // --- bohater: niewidoczny hitbox + sprite ---
        const sx = this.wx(L.startAt || 100);
        this.hero = this.add.zone(sx, G - HC.bodyH / 2 - 1, HC.bodyW, HC.bodyH);
        this.physics.add.existing(this.hero);
        this.hero.body.setMaxVelocity(2000, HC.maxFall);
        this.kamil = this.add.sprite(sx, G, 'wikary_kamil_idle_1').setOrigin(0.5, 1).setScale(HC.scale).setDepth(10).play('k_idle');
        this.kamil.setFlipX(this.facing < 0);
        this.physics.add.collider(this.hero, this.solids);

        // --- wrogowie i pociski ---
        this.enemies = this.physics.add.group();
        this.shots = this.physics.add.group({ allowGravity: false });
        this.physics.add.collider(this.enemies, this.groundSolids);
        this.physics.add.overlap(this.hero, this.enemies, (h, e) => { if (!e.dead) this.hurt(e.x); });
        this.physics.add.overlap(this.shots, this.enemies, (s, e) => { if (e.dead || !s.active) return; s.destroy(); this.damageEnemy(e, CFG.cross.damage); });

        // --- przyciemnienie (modlitwa, piorun) ---
        this.dim = this.add.rectangle(0, 0, W, H, 0x000000, 1).setOrigin(0).setScrollFactor(0).setDepth(8).setAlpha(0);

        // --- sterowanie ---
        const kb = this.input.keyboard;
        this.keys = kb.addKeys({ left: 'LEFT', right: 'RIGHT', shift: 'SHIFT', alt: 'ALT', space: 'SPACE', up: 'UP' });
        kb.on('keydown-SPACE', onKey(() => { this.jumpAt = this.time.now; }));
        kb.on('keydown-UP', onKey(() => { this.jumpAt = this.time.now; }));
        kb.on('keydown-ALT', onKey(() => { this.attackPressed = true; }));
        kb.on('keydown-ENTER', onKey(() => this.onConfirm()));
        this.input.on('pointerdown', (p) => { if (this.summaryShown) this.onConfirm(); });

        this.createHud();
        if (IS_TOUCH) this.createTouch();
        WikaryAudio.play(L.music);
        hintBubble(this, 'POZIOM ' + L.id + ': ' + L.name, 2200, 112);
    }

    /* ---------- pomocnicze ---------- */
    wx(d) { return this.L.dir > 0 ? d : this.L.length - d; }           // odległość od startu -> x świata
    heroD() { return this.L.dir > 0 ? this.hero.x : this.L.length - this.hero.x; }
    frontD() { const c = this.cameras.main; return this.L.dir > 0 ? c.scrollX + CFG.W : this.L.length - c.scrollX; }
    playK(key) { if (!this.kamil.anims.currentAnim || this.kamil.anims.currentAnim.key !== key || !this.kamil.anims.isPlaying) this.kamil.play(key); }
    onGround() { const b = this.hero.body; return b.blocked.down || b.touching.down; }

    /* ---------- HUD ---------- */
    createHud() {
        const D = 4000, W = CFG.W;
        this.add.rectangle(0, 0, W, 24, 0x0c0610, 0.55).setOrigin(0).setScrollFactor(0).setDepth(D - 1);
        this.lifeIcons = [];
        for (let i = 0; i < CFG.hero.lives; i++) this.lifeIcons.push(this.add.image(14 + i * 22, 12, 'wikary_kamil_closeup_open').setScale(0.11).setScrollFactor(0).setDepth(D));
        this.hudScore = txt(this, 82, 8, '', 8, '#ffffff', { ox: 0, oy: 0 }).setScrollFactor(0).setDepth(D);
        this.hudTime = txt(this, 262, 8, '', 8, '#ffe8a0', { ox: 0.5, oy: 0 }).setScrollFactor(0).setDepth(D);
        this.hudCross = this.add.image(332, 12, 'fx_cross_1').setScale(0.5).setScrollFactor(0).setDepth(D);
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
        const full = GS.meter >= CFG.ult.max;
        this.hudBar.width = Math.round(104 * Math.min(1, GS.meter / CFG.ult.max));
        this.hudBar.fillColor = full ? ((Math.floor(time / 150) % 2) ? 0xfff2a0 : 0xffb020) : 0xffc830;
        this.hudGromLabel.setText(full && !this.praying ? (IS_TOUCH ? 'GROM!' : 'SHIFT') : 'GROM');
    }

    /* ---------- dotyk ---------- */
    createTouch() {
        this.input.addPointer(3);
        const y = CFG.H - 14, D = 4500;
        const btn = (x, w, label, down, up) => {
            const r = this.add.rectangle(x, y, w, 24, 0x140c1c, 0.35).setStrokeStyle(1, 0xd8a640, 0.7).setScrollFactor(0).setDepth(D).setInteractive();
            txt(this, x, y + 1, label, 8, '#ffe8a0').setScrollFactor(0).setDepth(D + 1).setAlpha(0.85);
            r.on('pointerdown', () => { r.setFillStyle(0xd8a640, 0.45); down(); });
            const rel = () => { r.setFillStyle(0x140c1c, 0.35); if (up) up(); };
            r.on('pointerup', rel); r.on('pointerout', rel);
            return r;
        };
        btn(26, 46, '<', () => this.touch.left = true, () => this.touch.left = false);
        btn(78, 46, '>', () => this.touch.right = true, () => this.touch.right = false);
        btn(CFG.W - 168, 52, 'GROM', () => this.touch.ult = true, () => this.touch.ult = false);
        btn(CFG.W - 106, 52, 'KRZYŻ', () => this.attackPressed = true);
        btn(CFG.W - 40, 64, 'SKOK', () => this.jumpAt = this.time.now);
    }

    /* ---------- pętla ---------- */
    update(time, delta) {
        const dt = Math.min(delta, 50) / 1000, cam = this.cameras.main, L = this.L, HC = CFG.hero, W = CFG.W, G = CFG.GROUND_Y;
        const hero = this.hero, body = hero.body;
        const wf = 1 + Math.floor(time / 170) % 4;
        this.rivers.forEach(r => { if (r.water.texture.key !== this.L.bg.water + wf) r.water.setTexture(this.L.bg.water + wf); });
        this.far.tilePositionX = cam.scrollX * 0.2;
        this.near.tilePositionX = cam.scrollX * 0.5;

        if (!this.ended && !this.dead) GS.timeMs += delta;
        this.updateHud(time);
        this.updateEnemies(time, dt);
        this.shots.getChildren().forEach(s => { if (time > s.dieAt) s.destroy(); });
        if (this.dead || this.ended || this.respawning) { this.syncSprite(time, 0); return; }

        // --- auto-scroll + kamera dogania gracza ---
        if (!this.cutscene) {
            let sx = cam.scrollX + L.dir * CFG.scrollSpeed * dt;
            if (L.dir > 0 && hero.x - sx > W * HC.followAt) sx = hero.x - W * HC.followAt;
            if (L.dir < 0 && sx + W - hero.x > W * HC.followAt) sx = hero.x - W * (1 - HC.followAt);
            cam.scrollX = Phaser.Math.Clamp(sx, 0, L.length - W);
        }
        if (this.cutscene) { this.syncSprite(time, 0); return; }

        const onG = this.onGround();
        if (onG && body.velocity.y >= 0) { this.lastGroundAt = time; this.jumps = 0; this.flipping = false; }
        const left = this.keys.left.isDown || this.touch.left, right = this.keys.right.isDown || this.touch.right;
        const shift = this.keys.shift.isDown || this.touch.ult;

        // --- modlitwa / Grom z Nieba ---
        if (!this.praying && shift && GS.meter >= CFG.ult.max && onG) this.startPray(time);
        let vx = 0;
        if (this.praying) {
            if (!this.charged && time - this.prayStart >= CFG.ult.prayMs) this.chargeUlt();
            if (!shift) { if (this.charged) this.fireGrom(); else this.cancelPray(); }
        } else {
            const mult = (time < this.boostUntil ? CFG.boost.mult : 1) * (time < this.slowUntil ? CFG.puddle.slowMult : 1);
            vx = ((right ? 1 : 0) - (left ? 1 : 0)) * HC.speed * mult;
            if (vx) this.facing = Math.sign(vx);
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
        this.attackPressed = false;
        body.setVelocityX(vx);

        // --- bohater nigdy nie wychodzi poza ekran ---
        const minX = cam.scrollX + HC.edgeMargin + HC.bodyW / 2, maxX = cam.scrollX + W - HC.edgeMargin - HC.bodyW / 2;
        if (hero.x < minX) { hero.x = minX; if (body.velocity.x < 0) body.setVelocityX(0); if (body.blocked.right || body.touching.right) this.liftOverObstacle(); }
        if (hero.x > maxX) { hero.x = maxX; if (body.velocity.x > 0) body.setVelocityX(0); if (body.blocked.left || body.touching.left) this.liftOverObstacle(); }

        // --- woda ---
        if (body.top > G + 14) { this.drown(); return; }

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
            if (!this.hintsShown[i] && this.heroD() >= h.at) { this.hintsShown[i] = true; hintBubble(this, IS_TOUCH && h.touch ? h.touch : h.text, h.ms || 3000); }
        });
        // --- spawner wrogów (dopiero gdy wikary ma krzyż) ---
        const E = L.enemies, fd = this.frontD();
        if (E && GS.hasCross && fd > E.from && fd < E.to) {
            this.spawnAcc += delta;
            if (this.spawnAcc >= this.nextSpawn && this.enemies.countActive(true) < CFG.spawn.maxAlive) {
                this.spawnAcc = 0; this.nextSpawn = Phaser.Math.Between(CFG.spawn.minMs, CFG.spawn.maxMs);
                this.spawnEnemy(this.pickEnemy(E.set));
            }
        }
        // --- meta ---
        if (this.heroD() >= L.endAt - 6) this.finishLevel();
        this.syncSprite(time, vx);
    }

    syncSprite(time, vx) {
        const k = this.kamil, hero = this.hero, b = hero.body;
        k.x = hero.x; k.y = b.bottom;
        k.setFlipX(this.facing < 0);
        const moved = Math.abs(hero.x - this.prevHeroX) > 0.3; this.prevHeroX = hero.x;
        if (!this.dead && !this.ended && !this.cutscene) {
            const onG = this.onGround();
            if (this.praying) this.playK('k_pray');
            else if (time < this.attackUntil) { /* animacja rzutu */ }
            else if (!onG && this.flipping && k.anims.isPlaying && k.anims.currentAnim.key === 'k_flip') { /* salto */ }
            else if (!onG) { k.anims.stop(); k.setTexture(b.velocity.y < -60 ? 'wikary_kamil_jump_1' : b.velocity.y < 60 ? 'wikary_kamil_jump_2' : 'wikary_kamil_jump_3'); }
            else if (vx !== 0 || moved) this.playK('k_run');
            else this.playK('k_idle');
        }
        const inv = time < this.invulnUntil && !this.dead;
        k.setAlpha(inv && Math.floor(time / 80) % 2 ? 0.35 : 1);
        if (!this.dead) k.setTint(time < this.boostUntil ? 0xffffb0 : 0xffffff);
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
        this.cutscene = true;
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

    throwCross(time) {
        this.lastThrow = time; this.attackUntil = time + 240;
        const h = this.hero, s = this.shots.create(h.x + this.facing * 14, h.y - 6, 'fx_cross_1');
        s.setScale(0.8).setDepth(9).play('fx_cross');
        s.body.setAllowGravity(false); s.body.setSize(20, 24);
        s.setVelocityX(this.facing * CFG.cross.speed);
        s.dieAt = time + CFG.cross.lifeMs;
        this.kamil.play('k_attack');
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
    pickEnemy(set) {
        const tot = set.reduce((a, t) => a + CFG.enemies[t].weight, 0);
        let r = Math.random() * tot;
        for (const t of set) { r -= CFG.enemies[t].weight; if (r <= 0) return t; }
        return set[0];
    }
    spawnEnemy(type) {
        const cam = this.cameras.main, W = CFG.W, G = CFG.GROUND_Y, dir = this.L.dir, C = CFG.enemies[type];
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
        const C = CFG.enemies[e.type], w = C.bodyW / C.scale, h = C.bodyH / C.scale;
        e.body.setSize(w, h, false);
        e.body.setOffset((e.frame.width - w) / 2, e.type === 'bat' ? (e.frame.height - h) / 2 : e.frame.height - h - (e.type === 'spider' ? 2 : 0));
    }
    updateEnemies(time, dt) {
        const cam = this.cameras.main, dir = this.L.dir;
        this.enemies.getChildren().slice().forEach(e => {
            if (!e.active || e.dead) return;
            const C = CFG.enemies[e.type];
            if (e.type === 'wolf') {
                const onG = e.body.blocked.down || e.body.touching.down;
                if (onG && time > e.nextJump) { e.setVelocityY(-C.jumpV); e.nextJump = time + C.jumpEveryMs; }
                else if (!onG) { e.anims.stop(); e.setTexture(e.body.velocity.y < 0 ? 'enemy_wolf_jump_1' : 'enemy_wolf_jump_2'); this.fitBody(e); }
                else if (!e.anims.isPlaying) { e.play('wolf_run'); this.fitBody(e); }
            }
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
        e.hp -= dmg;
        if (e.hp > 0) {
            WikaryAudio.sfx('hit');
            e.setTintFill(0xffffff);
            this.time.delayedCall(90, () => { if (e.active) e.clearTint(); });
            return;
        }
        e.dead = true; e.body.enable = false;
        const pts = CFG.score[e.type] || 50;
        GS.score += pts; GS.kills++; if (!byUlt) this.addMeter(CFG.ult.perKill);
        WikaryAudio.sfx('kill'); this.popup(e.x, e.y - e.displayHeight - 4, '+' + pts);
        const poof = this.add.sprite(e.x, e.y - e.displayHeight / 2, 'fx_enemy_poof_1').setScale(CFG.items.scale).setDepth(8).play('poof');
        poof.once('animationcomplete', () => poof.destroy());
        e.destroy();
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
        this.dead = true; GS.lives = 0;
        if (this.praying) this.cancelPray();
        this.hero.body.setVelocity(0, 0); this.hero.body.setAllowGravity(false); this.hero.body.enable = false;
        WikaryAudio.stop(0.2); WikaryAudio.sfx('gameover');
        this.kamil.anims.stop(); this.kamil.setTexture('wikary_kamil_pray_1').setTint(0xff8080).setAlpha(1);
        this.tweens.add({ targets: this.kamil, alpha: 0.4, duration: 900 });
        const go = goldText(this, CFG.W / 2, CFG.H / 2 - 20, 'GAME OVER', 24).setScrollFactor(0).setDepth(5000);
        go.setScale(0.2);
        this.tweens.add({ targets: go, scale: 1, duration: 400, ease: 'Back.easeOut' });
        this.time.delayedCall(2600, () => {
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Nick', { result: 'over' }));
            this.cameras.main.fade(400, 0, 0, 0, true);
        });
    }
    finishLevel() {
        if (this.ended) return;
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
        add(txt(this, W / 2, 214, L.next === null || L.next === undefined ? 'CIĄG DALSZY WKRÓTCE: LEVEL 2' : '', 8, '#ffd040'));
        add(txt(this, W / 2, 246, IS_TOUCH ? 'DOTKNIJ = ZAPISZ WYNIK' : 'ENTER = ZAPISZ WYNIK', 8, '#c8b890'));
        this.time.delayedCall(400, () => { this.summaryShown = true; });
    }
    onConfirm() {
        if (!this.summaryShown) return;
        this.summaryShown = false;
        WikaryAudio.sfx('select');
        const L = this.L;
        this.cameras.main.once('camerafadeoutcomplete', () => {
            if (L.next !== null && L.next !== undefined && LEVELS[L.next]) this.scene.start('Level', { level: L.next });
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
