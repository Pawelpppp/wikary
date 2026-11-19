'use strict';
/* =====================================================================
   Level 3 „Noc duchów”: mgła, duchy (duszki, fantomy przenikające przeszkody,
   upiory wychodzące spod ziemi; ogień na nie nie działa), błogosławieństwo (X),
   obrona drzwi kościoła z proboszczem (3 fale), boss: kościelny Rafał opętany
   przez upiora, egzorcyzm i świt. Dopisywane do LevelScene (jak level2.js).
   ===================================================================== */
Object.assign(LevelScene.prototype, {

    /* ---------- noc: mgła (tylko gdy jest fx_fog) ---------- */
    createNight() {
        const Wt = this.L.weather || {};
        this.fogs = [];
        if (Wt.fog) CFG.fog.filter(f => ART.has(f.key)).forEach(f => {
            const t = this.add.tileSprite(0, f.y, CFG.W, 64, f.key).setOrigin(0).setScrollFactor(0).setDepth(f.depth).setAlpha(f.alpha);
            t.cfg = f; this.fogs.push(t);
        });
        this.fog = this.fogs.length ? this.fogs : null;
    },
    updateLevel3(time, delta) {
        const dt = Math.min(delta, 50) / 1000;
        (this.fogs || []).forEach(t => { t.tilePositionX = this.cameras.main.scrollX * t.cfg.par + time / 1000 * t.cfg.speed; });
        this.hostile.getChildren().slice().forEach(k => { if (time > k.dieAt) k.destroy(); });
        this.allyShots.getChildren().slice().forEach(s => {
            if (time > s.dieAt) { s.destroy(); return; }
            const t = s.target;                                    // czar proboszcza lekko naprowadza się na ducha
            if (t && t.active && !t.dead) {
                const dx = t.x - s.x, dy = (t.y - (t.originY === 1 ? t.displayHeight / 2 : 0)) - s.y, len = Math.hypot(dx, dy) || 1;
                s.setVelocity(dx / len * CFG.defense.spellSpeed, dy / len * CFG.defense.spellSpeed);
            }
        });
        if (this.defense && !this.ended && !this.dead) { this.updateDefense(time); this.updateProboszcz(time); }
        if (this.defense) this.updateDoorBar();
    },

    /* ---------- duchy ---------- */
    ghostSprite(type, x, y, key, anim, mv) {
        const C = enemyCfg(type);
        const e = this.enemies.create(x, y, ART.key(key));
        e.type = type; e.hp = C.hp; e.dead = false; e.thread = null; e.ghost = true;
        e.setOrigin(0.5, C.center ? 0.5 : 1).setScale(C.scale * ART.mul(this, key)).setDepth(7).setFlipX(mv < 0);
        e.baseTint = ART.tint(key); if (e.baseTint) e.setTint(e.baseTint);
        e.setAlpha(CFG.ghosts.alpha);
        e.body.setAllowGravity(false);
        if (anim) e.play(anim);
        this.fitBody(e);
        e.mv = mv; e.t0 = this.time.now;
        return e;
    },
    /** duch w miejscu x (świat); mv = kierunek ruchu na start */
    spawnGhost(type, x, mv, y) {
        const C = enemyCfg(type), G = CFG.GROUND_Y;
        if (type === 'duszek') {
            const e = this.ghostSprite(type, x, y || Phaser.Math.Between(C.yMin, C.yMax), 'enemy_duszek_1', 'duszek', mv);
            e.baseY = e.y; e.phase = Math.random() * 6; e.state = 'float';
            return e;
        }
        if (type === 'phantom') {               // pojawia się znikąd, miga, potem przelatuje przez wszystko
            const e = this.ghostSprite(type, x, G - C.groundGap - 110 * C.scale / 2, 'enemy_phantom_1', 'phantom', mv);   // origin 0.5,0.5
            e.state = 'appear'; e.harmless = true; e.setAlpha(0); e.until = this.time.now + C.appearMs + C.flickerMs;
            WikaryAudio.sfx('rise');
            return e;
        }
        if (type === 'upior') {                 // najpierw pęknięcie i kurz, potem wychodzi spod ziemi
            const e = this.ghostSprite(type, x, G, 'enemy_upior_rise_1', null, mv);
            e.state = 'warn'; e.harmless = true; e.setVisible(false); e.body.enable = false; e.until = this.time.now + C.warnMs;
            const dust = this.add.sprite(x, G + 4, 'fx_enemy_poof_1').setOrigin(0.5, 1).setScale(0.5, 0.3).setTint(0x8a7a60).setDepth(6.5).play('poof');
            dust.anims.repeat = 2; dust.once('animationcomplete', () => dust.destroy());
            this.tweens.add({ targets: dust, scaleX: 0.7, duration: C.warnMs, ease: 'Sine.easeOut' });
            this.cameras.main.shake(C.warnMs, 0.002);
            WikaryAudio.sfx('rise');
            e.warnFx = dust;
            return e;
        }
        return null;
    },
    spawnEnemy3(type, frontX, mv) {
        if (type !== 'duszek' && type !== 'phantom' && type !== 'upior') return false;
        const cam = this.cameras.main, W = CFG.W, dir = this.L.dir;
        let x = frontX;
        if (type !== 'duszek') x = dir > 0 ? cam.scrollX + Phaser.Math.Between(W * 0.58, W * 0.9) : cam.scrollX + Phaser.Math.Between(W * 0.1, W * 0.42);
        this.spawnGhost(type, x, mv);
        return true;
    },
    ghostTarget() {                          // w obronie duchy idą na drzwi kościoła, poza nią na Kamila
        if (this.defense && this.defense.state !== 'boss') return { x: this.doorX, y: CFG.GROUND_Y - 34, door: true };
        return { x: this.hero.x, y: this.hero.y - 6, door: false };
    },
    updateEnemy3(e, C, time, dt) {
        if (e.type !== 'duszek' && e.type !== 'phantom' && e.type !== 'upior') return false;
        const T = this.ghostTarget(), cam = this.cameras.main, G = CFG.GROUND_Y;
        if (e.frame.width !== e._fw) { e._fw = e.frame.width; this.fitBody(e); }
        if (e.type === 'duszek') {
            const dx = T.x - e.x, dy = T.y - e.y, len = Math.hypot(dx, dy) || 1;
            e.setVelocity(dx / len * C.speed, dy / len * C.speed + Math.cos((time - e.t0) / 1000 * C.bobFreq + e.phase) * C.bob);
            e.setFlipX(dx < 0);
        } else if (e.type === 'phantom') {
            if (e.state === 'appear') {
                const t = time - e.t0;
                e.setAlpha(t < C.appearMs ? CFG.ghosts.alpha * t / C.appearMs : (Math.floor(t / 70) % 2 ? 0.25 : CFG.ghosts.alpha));
                e.setFlipX(T.x < e.x);
                if (time > e.until) {
                    e.state = 'dash'; e.harmless = false; e.setAlpha(CFG.ghosts.alpha);
                    e.dashDir = Math.sign(T.x - e.x) || -this.L.dir;
                    e.setFlipX(e.dashDir < 0).setVelocityX(e.dashDir * C.dashSpeed);
                    e.play('phantom_attack'); this.fitBody(e); WikaryAudio.sfx('swing');
                }
            }
        } else {                                 // upiór
            if (e.state === 'warn' && time > e.until) {
                e.state = 'rise'; e.setVisible(true).setDepth(1.5);            // pod ziemią (ziemia ma depth 2) = wychodzi z niej
                e.y = G + e.displayHeight; e.play('upior_rise');
                this.tweens.add({ targets: e, y: G, duration: C.riseMs, ease: 'Sine.easeOut', onComplete: () => {
                    if (!e.active || e.dead) return;
                    e.state = 'walk'; e.setDepth(7); e.body.enable = true; e.harmless = false; e.play('upior_walk'); this.fitBody(e);
                } });
            } else if (e.state === 'walk') {
                const d = Math.sign(T.x - e.x) || -1;
                e.setFlipX(d < 0).setVelocityX(d * C.speed);
            }
        }
        if (T.door && e.state !== 'warn' && e.state !== 'rise' && e.state !== 'appear' && Math.abs(e.x - T.x) < CFG.defense.doorReach) { this.doorHit(e); return true; }
        const far = e.x < cam.scrollX - 220 || e.x > cam.scrollX + CFG.W + 220 || e.y < -80 || e.y > CFG.H + 120;
        if (far && time - e.t0 > 1200) e.destroy();
        return true;
    },
    makePoof(e) {
        const g = e.ghost, key = g ? ART.key('fx_ghost_poof_1') : 'fx_enemy_poof_1';
        const p = this.add.sprite(e.x, e.y - (e.originY === 1 ? e.displayHeight / 2 : 0), key).setScale(CFG.items.scale).setDepth(8).play(g ? 'ghost_poof' : 'poof');
        if (g) { const t = ART.tint('fx_ghost_poof_1'); if (t) p.setTint(t); ART.fit(this, p, 'fx_ghost_poof_1', CFG.items.scale, 0.5, 0.5); }
        if (e.warnFx && e.warnFx.active) e.warnFx.destroy();
        return p;
    },
    fireFizzle(s, e) {                       // ogień syczy i gaśnie na duchu
        const now = this.time.now;
        s.destroy();
        WikaryAudio.sfx('fizzle');
        const p = this.add.sprite(s.x, s.y, 'fx_enemy_poof_2').setScale(0.25).setTint(0x9aa0b0).setAlpha(0.7).setDepth(9);
        this.tweens.add({ targets: p, y: p.y - 14, alpha: 0, duration: 380, onComplete: () => p.destroy() });
        this.fizzles = (this.fizzles || 0) + 1;
        if (now - this.fireHintAt > CFG.ghosts.fireHintMs * 3) {
            this.fireHintAt = now;
            hintBubble(this, 'OGIEŃ NIE DZIAŁA NA DUCHY', CFG.ghosts.fireHintMs, 90);
        }
    },

    /* ---------- błogosławieństwo: trzecia moc (X / BŁOG.) ---------- */
    blessingPickup(it) {         // jak krzyż i znicz: piorun + przyciemnienie
        this.cutscene = true; this.setCrouch(false, 0);
        this.tweens.killTweensOf(it); it.destroy();
        this.physics.pause();
        const k = this.kamil;
        k.setAlpha(1); k.play('k_blessing');
        WikaryAudio.sfx('thunder');
        this.cameras.main.flash(180, 220, 240, 255);
        this.tweens.add({ targets: this.dim, alpha: 0.6, duration: 250 });
        const fx = this.add.sprite(k.x, k.y - k.displayHeight / 2, ART.key('fx_blessing_wave_1')).setDepth(11).play('blessing_wave');
        ART.fit(this, fx, 'fx_blessing_wave_1', 0.8, 0.5, 0.5);
        const strike = () => {
            const b = this.add.sprite(k.x + Phaser.Math.Between(-4, 4), k.y, 'fx_lightning_strike_1').setOrigin(0.5, 1).setDepth(11.5).play('lightning_strike');
            b.once('animationcomplete', () => b.destroy());
        };
        strike(); this.time.delayedCall(380, strike);
        this.time.delayedCall(380, () => { this.cameras.main.flash(140, 255, 255, 255); this.cameras.main.shake(200, 0.008); });
        this.time.delayedCall(700, () => hintBubble(this, IS_TOUCH ? 'BŁOG. = BŁOGOSŁAWIEŃSTWO (FALA NA DUCHY)' : 'X = BŁOGOSŁAWIEŃSTWO (FALA NA DUCHY)', 3200, 90));
        this.time.delayedCall(1900, () => {
            fx.destroy();
            this.tweens.add({ targets: this.dim, alpha: 0, duration: 300, onComplete: () => this.dim.setAlpha(0) });
            GS.hasBless = true; GS.score += CFG.score.blessing; this.popup(k.x, k.y - 80, '+' + CFG.score.blessing);
            this.physics.resume(); this.cutscene = false;
        });
    },
    castBlessing(time) {
        const B = CFG.bless, h = this.hero, k = this.kamil;
        this.lastBless = time; this.attackUntil = time + B.castMs;
        this.setCrouch(false, time);
        k.play('k_blessing');
        const cx = h.x, cy = h.y;
        const w = this.add.sprite(cx, cy, ART.key('fx_blessing_wave_1')).setDepth(9.6).play('blessing_wave');
        ART.fit(this, w, 'fx_blessing_wave_1', B.waveScale0, 0.5, 0.5);
        const s0 = w.scaleX, s1 = s0 * B.waveScale1 / B.waveScale0;
        this.tweens.add({ targets: w, scaleX: s1, scaleY: s1, alpha: 0, duration: B.waveMs, ease: 'Quad.easeOut', onComplete: () => w.destroy() });
        WikaryAudio.sfx('bless');
        this.blessCasts = (this.blessCasts || 0) + 1;
        this.enemies.getChildren().slice().forEach(e => {
            if (!e.active || e.dead || !e.body || (!e.body.enable && e.state !== 'warn')) return;
            const ey = e.originY === 1 ? e.y - e.displayHeight / 2 : e.y;
            if (Math.hypot(e.x - cx, ey - cy) > B.radius) return;
            if (e.type === 'rafal' || e.type === 'adrian') this.damageEnemy(e, B.bossDamage);
            else this.damageEnemy(e, e.ghost ? B.ghostDamage : B.damage);
        });
        this.hostile.getChildren().slice().forEach(kk => { if (Math.hypot(kk.x - cx, kk.y - cy) <= B.radius) kk.destroy(); });
    },

    /* ---------- część B: obrona drzwi kościoła ---------- */
    startDefense() {
        if (this.arena) return;
        const L = this.L, D = CFG.defense, G = CFG.GROUND_Y;
        this.arena = true; this.cutscene = true;
        this.setCrouch(false, 0); if (this.praying) this.cancelPray();
        this.arenaCamX = Phaser.Math.Clamp(L.dir > 0 ? L.length - CFG.W : 0, 0, L.length - CFG.W);
        this.enemies.getChildren().slice().forEach(e => { if (e.active && !e.dead) { e.dead = true; e.body.enable = false; this.tweens.add({ targets: e, alpha: 0, duration: 300, onComplete: () => e.destroy() }); } });
        this.autoWalk = { x: this.doorX - L.dir * D.heroStandOff };
        this.defense = { state: 'intro', wave: 0, spawned: 0, nextAt: 0, cleared: 0, doorHp: D.doorHp, doorMax: D.doorHp, breaches: 0 };
        // proboszcz na schodach kościoła
        const [plx, ply] = D.proboszczAt, flip = L.dir < 0;
        const px = this.churchLeft + (flip ? 240 - plx : plx), py = this.churchTop + ply;
        this.proboszcz = this.add.sprite(px, py, 'proboszcz_idle_1').setOrigin(0.5, 1).setScale(CFG.hero.scale).setDepth(6).setFlipX(L.dir > 0).play('proboszcz_idle');
        this.proboszcz.setAlpha(0);
        this.tweens.add({ targets: this.proboszcz, alpha: 1, duration: 500 });
        this.pState = { state: 'idle', nextCast: 0, casts: 0, tiredCount: 0, until: 0, target: null };
        this.createDoorBar();
        WikaryAudio.stop(0.6);
        this.runDefenseIntro();
    },
    proboszczSay(text) {
        const p = this.proboszcz;
        return this.talk.say('proboszcz_closeup_open', 'PROBOSZCZ', text, {
            onStart: () => p && p.active && p.play('proboszcz_talk'),
            onEnd: () => p && p.active && this.pState && this.pState.state !== 'tired' && p.play('proboszcz_idle'),
        });
    },
    rafalSay(text, portrait) {
        const r = this.rafal;
        return this.talk.say(portrait || 'rafal_closeup_open', 'RAFAŁ', text, {
            onStart: () => r && r.active && r.normal && r.play('rafal_talk'),
            onEnd: () => r && r.active && r.normal && r.play('rafal_idle'),
        });
    },
    async runDefenseIntro() {
        const T = this.talk; T.skipped = false;
        try {
            for (let i = 0; i < 60 && this.autoWalk; i++) await sleep(this, 100);
            if (this.dead) return;
            this.facing = this.L.dir;
            await sleep(this, 300);
            await this.proboszczSay('Kamil! Nie stój jak słup soli, pomóż mi!'); if (this.dead) return;
            await this.kamilSay('Proszę księdza, skąd tyle duchów?!'); if (this.dead) return;
            await this.proboszczSay('Z cmentarza, z mgły i z nieodprawionych kolęd! Brońmy drzwi!'); if (this.dead) return;
            WikaryAudio.play('level3');
            this.cutscene = false;
            if (this.skipTo === 'boss') { this.startRafal(); return; }
            this.defense.state = 'wave'; this.defense.nextAt = this.time.now + 600;
            hintBubble(this, 'BROŃ DRZWI KOŚCIOŁA!   FALA 1 / ' + CFG.defense.waves.length, 2400, 90);
        } catch (e) { this.cutscene = false; }
    },
    updateDefense(time) {
        const Df = this.defense, D = CFG.defense, cam = this.cameras.main;
        if (Df.state === 'wave') {
            const Wv = D.waves[Df.wave];
            if (Df.spawned < Wv.n && time >= Df.nextAt && !this.cutscene) {
                const type = Phaser.Utils.Array.GetRandom(Wv.set), side = Math.random() < 0.5 ? -1 : 1;
                let x = side < 0 ? cam.scrollX - 24 : cam.scrollX + CFG.W + 24;
                if (type !== 'duszek') x = side < 0 ? cam.scrollX + Phaser.Math.Between(30, 90) : cam.scrollX + CFG.W - Phaser.Math.Between(30, 90);
                this.spawnGhost(type, x, -side);
                Df.spawned++; Df.nextAt = time + Wv.gapMs;
            }
            const alive = this.enemies.getChildren().some(e => e.active && !e.dead && e.ghost);
            if (Df.spawned >= Wv.n && !alive) {
                Df.cleared++;
                if (Df.wave < D.waves.length - 1) {
                    Df.state = 'break'; Df.nextAt = time + D.waveBreakMs;
                    hintBubble(this, 'FALA ' + (Df.wave + 2) + ' / ' + D.waves.length, 2000, 90);
                } else { Df.state = 'boss'; this.startRafal(); }
            }
        } else if (Df.state === 'break' && time >= Df.nextAt) {
            Df.wave++; Df.spawned = 0; Df.state = 'wave'; Df.nextAt = time + 300;
        }
    },
    createDoorBar() {
        const D = 4000, x = CFG.W / 2 - 100, y = 48;
        const lab = txt(this, x - 8, y + 4, 'DRZWI', 8, '#ffd8a0', { ox: 1, oy: 0.5 }).setScrollFactor(0).setDepth(D);
        const bg = this.add.rectangle(x, y, 200, 9, 0x221420, 1).setOrigin(0).setStrokeStyle(1, 0xd8a640).setScrollFactor(0).setDepth(D);
        const fill = this.add.rectangle(x + 1, y + 1, 198, 7, 0xc08a40, 1).setOrigin(0).setScrollFactor(0).setDepth(D);
        this.doorBar = { lab, bg, fill };
    },
    updateDoorBar() {
        const b = this.doorBar, Df = this.defense; if (!b) return;
        b.fill.width = Math.max(0, Math.round(198 * Df.doorHp / Df.doorMax));
        const show = !this.ending; [b.lab, b.bg, b.fill].forEach(o => o.setVisible(show));
    },
    setDoorLook() {
        const Df = this.defense, r = Df.doorHp / Df.doorMax;
        const k = r > 2 / 3 ? 'church_door_night_hp_1' : r > 1 / 3 ? 'church_door_night_hp_2' : 'church_door_night_hp_3';
        if (!this.door || this.doorLook === k) return;
        this.doorLook = k;
        this.door.setTexture(ART.key(k));
        const t = ART.tint(k); if (t) this.door.setTint(t); else this.door.clearTint();
    },
    doorHit(e) {
        const Df = this.defense; if (!Df || this.ended || this.dead) return;
        e.dead = true; e.body.enable = false;
        const poof = this.makePoof(e); poof.once('animationcomplete', () => poof.destroy());
        e.destroy();
        Df.doorHp = Math.max(0, Df.doorHp - (CFG.defense.dmg[e.type] || 1)); Df.breaches++;
        this.setDoorLook();
        WikaryAudio.sfx('doorhit'); this.cameras.main.shake(140, 0.006);
        if (this.door) { this.door.setTintFill(0xff6060); this.time.delayedCall(90, () => { if (this.door) { this.doorLook = null; this.setDoorLook(); } }); }
        if (Df.doorHp <= 0) {
            hintBubble(this, 'DRZWI PADŁY! DUCHY WESZŁY DO KOŚCIOŁA...', 2400, 90);
            this.gameOver();
        }
    },

    /* ---------- proboszcz: czary na duchy, czasem się męczy ---------- */
    updateProboszcz(time) {
        const P = this.pState, D = CFG.defense, p = this.proboszcz;
        if (!P || !p || this.cutscene || this.ending) return;
        if (P.state === 'tired') {
            if (time > P.until) { P.state = 'idle'; P.nextCast = time + 600; p.setOrigin(0.5, 1).play('proboszcz_idle'); p.clearTint(); }
            return;
        }
        if (P.state === 'cast') {
            if (time > P.until) {
                const t = P.target;
                if (t && t.active && !t.dead) {
                    const s = this.allyShots.create(p.x - (p.flipX ? 18 : -18), p.y - p.displayHeight * 0.62, ART.key('fx_proboszcz_spell_1'));
                    ART.fit(this, s, 'fx_proboszcz_spell_1', 0.6, 0.5, 0.5); s.play('proboszcz_spell');
                    s.setDepth(9); s.body.setAllowGravity(false); s.body.setSize(20 / s.scaleX, 20 / s.scaleY);
                    s.target = t; s.dieAt = time + 2200;
                    WikaryAudio.sfx('spell');
                }
                P.casts++; P.state = 'idle'; P.nextCast = time + D.castMs; p.play('proboszcz_idle');
                if (P.casts % D.tiredEvery === 0) this.proboszczTired(time);
            }
            return;
        }
        if (time < P.nextCast) return;
        let best = null, bd = D.spellRange;
        this.enemies.getChildren().forEach(e => {
            if (!e.active || e.dead || !e.ghost || e.state === 'warn' || e.harmless) return;
            const d = Math.abs(e.x - p.x); if (d < bd) { bd = d; best = e; }
        });
        if (!best) return;
        P.state = 'cast'; P.target = best; P.until = time + D.castWindupMs;
        p.setFlipX(best.x < p.x).play('proboszcz_cast');
    },
    proboszczTired(time) {
        const P = this.pState, p = this.proboszcz;
        P.state = 'tired'; P.until = time + CFG.defense.tiredMs; P.tiredCount++;
        p.setOrigin(0.5, CFG.defense.sitOriginY).play('proboszcz_tired');
        const t = ART.tint('proboszcz_tired_sit_1'); if (t) p.setTint(t);
        const quips = ['Uff... Kamil, teraz ty! Ja mam swoje lata.', 'Chwileczkę... kolano mi strzyka.', 'Zdrowaśka na oddech i wracam!', 'Za moich czasów duchy były grzeczniejsze...'];
        hintBubble(this, 'PROBOSZCZ: ' + quips[(P.tiredCount - 1) % quips.length], 2600, 76);
    },
    spellHits(s, e) {
        if (!s.active || e.dead || !e.ghost || e.harmless) return;
        s.destroy();
        this.damageEnemy(e, CFG.defense.spellDamage);
    },

    /* ---------- boss: kościelny Rafał opętany przez upiora ---------- */
    async startRafal() {
        const R = CFG.rafal, G = CFG.GROUND_Y, k = 'boss_rafal_float_1';
        if (this.rafal) return;
        if (this.defense) this.defense.state = 'boss';
        this.cutscene = true;
        const e = this.enemies.create(this.doorX, G - R.hover, ART.key(k));
        e.type = 'rafal'; e.ghost = true; e.hp = e.maxHp = Difficulty.bossHp(R.hp); e.dead = false; e.thread = null; e.harmless = true;
        e.setOrigin(0.5, 1).setScale(R.scale * ART.mul(this, k)).setDepth(7).setAlpha(0);
        e.baseTint = ART.tint(k); if (e.baseTint) e.setTint(e.baseTint);
        e.body.setAllowGravity(false);
        e.play('rafal_float'); this.fitBody(e);
        e.state = 'enter'; e.until = 0; e.attackN = 0; e.enraged = false; e.normal = false; e.baseY = G - R.hover;
        this.rafal = e; this.boss = e;
        this.tweens.add({ targets: e, alpha: CFG.ghosts.alpha, x: this.doorX - this.L.dir * 60, duration: R.enterMs });
        if (this.door) { this.door.setTexture(ART.key('church_door_night_hp_3')); }
        WikaryAudio.stop(0.4); WikaryAudio.sfx('scream'); this.cameras.main.shake(300, 0.006);
        this.createBossBar('RAFAŁ', 34);
        const T = this.talk; T.skipped = false;
        try {
            await sleep(this, R.enterMs);
            if (this.dead) return;
            await this.rafalSay('Klucze... KLUCZE SĄ MOJE! Nikt nie wejdzie do zakrystii!', 'rafal_ghost_closeup_open'); if (this.dead) return;
            await this.kamilSay('Panie Rafale?! Pan kościelny?!'); if (this.dead) return;
            await this.proboszczSay('To nie Rafał, Kamil! Upiór w niego wstąpił. Przegońmy go!'); if (this.dead) return;
            this.setDoorLook();
            hintBubble(this, 'RAFAŁ: KRZYŻ I BŁOGOSŁAWIEŃSTWO. OGIEŃ NIC NIE DA!', 2600, 90);
            WikaryAudio.play('boss');
            e.state = 'float'; e.harmless = false; e.until = this.time.now + 900;
            this.cutscene = false;
        } catch (err) { this.cutscene = false; e.state = 'float'; e.harmless = false; }
    },
    rafalPhase(e) {
        let p = CFG.rafal.phases[0];
        for (const ph of CFG.rafal.phases) if (e.hp / e.maxHp <= ph.from) p = ph;
        return p;
    },
    updateRafal(e, time, dt) {
        if (e.dead || !e.active) return;
        if (e.frame.width !== e._fw) { e._fw = e.frame.width; this.fitBody(e); }   // serie klatek mają różne szerokości
        const R = CFG.rafal, hero = this.hero, cam = this.cameras.main, ph = this.rafalPhase(e);
        const minX = cam.scrollX + R.arenaPad, maxX = cam.scrollX + CFG.W - R.arenaPad;
        if (ph.enraged && !e.enraged) { e.enraged = true; e.baseTint = 0xff9ad0; e.setTint(e.baseTint); hintBubble(this, 'UPIÓR SIĘ WŚCIEKŁ!', 1600, 90); }
        e.y = e.baseY + Math.sin(time / 1000 * R.bobFreq * Math.PI * 2) * R.bobAmp;
        if (this.cutscene || e.state === 'enter') { e.setVelocityX(0); return; }
        const dx = hero.x - e.x, d = Math.sign(dx) || 1, sp = ph.speedMul;
        const back = () => { e.state = 'float'; e.until = time + ph.restMs; e.play('rafal_float'); if (e.baseTint) e.setTint(e.baseTint); };
        if (e.state === 'float') {
            e.setFlipX(d < 0);
            e.setVelocityX(Math.abs(dx) > R.keepDist ? d * R.floatSpeed * sp : 0);
            if (time > e.until) {
                e.setVelocityX(0); e.attackN++;
                if (Math.abs(dx) < R.swingRange) { e.state = 'swingWindup'; e.until = time + R.swingWindupMs / sp; e.swingDir = d; }
                else if (e.attackN % 3 === 0) {
                    e.state = 'scream'; e.until = time + R.screamMs; e.play('rafal_scream');
                    WikaryAudio.sfx('scream'); this.cameras.main.shake(400, 0.006);
                    for (let i = 0; i < ph.summon; i++) this.spawnGhost('duszek', e.x + (i % 2 ? 1 : -1) * (30 + i * 16), -d, e.y - e.displayHeight * 0.7 - i * 10);
                    this.rafalScreams = (this.rafalScreams || 0) + 1;
                } else { e.state = 'throwWindup'; e.until = time + R.throwWindupMs / sp; e.play('rafal_throw'); }
            }
        } else if (e.state === 'swingWindup') {
            e.setVelocityX(0);
            if (Math.floor(time / 70) % 2) e.setTint(0xffffff); else if (e.baseTint) e.setTint(e.baseTint);
            if (time > e.until) { e.state = 'swing'; e.until = time + R.swingMs; e.swingHit = false; e.play('rafal_swing'); WikaryAudio.sfx('swing'); if (e.baseTint) e.setTint(e.baseTint); }
        } else if (e.state === 'swing') {
            const reach = Math.abs(hero.x - e.x) < R.swingReach && Math.sign(hero.x - e.x) === e.swingDir;
            if (!e.swingHit && reach && hero.body.bottom > e.y - e.displayHeight) { e.swingHit = true; this.hurt(e.x); }
            if (time > e.until) back();
        } else if (e.state === 'throwWindup') {
            if (time > e.until) {
                const n = ph.keys, base = Math.atan2((hero.y - 10) - (e.y - e.displayHeight * 0.6), dx);
                for (let i = 0; i < n; i++) this.throwKey(e, base + (i - (n - 1) / 2) * 0.22);
                back();
            }
        } else if (e.state === 'scream' && time > e.until) back();
        if (e.x < minX) e.x = minX; if (e.x > maxX) e.x = maxX;
    },
    throwKey(e, ang) {
        const R = CFG.rafal, k = 'proj_key_1';
        const s = this.hostile.create(e.x + Math.cos(ang) * 20, e.y - e.displayHeight * 0.6, ART.key(k));
        ART.fit(this, s, k, R.keyScale, 0.5, 0.5); s.play('proj_key'); s.setDepth(9);
        s.body.setAllowGravity(false); s.body.setSize(R.keyW / s.scaleX, R.keyH / s.scaleY);
        s.setVelocity(Math.cos(ang) * R.keySpeed, Math.sin(ang) * R.keySpeed);
        s.body.setAllowRotation(true); s.body.setAngularVelocity(R.keySpin);
        s.dieAt = this.time.now + R.keyLifeMs;
        WikaryAudio.sfx('throw');
        this.keysThrown = (this.keysThrown || 0) + 1;
    },
    rafalHit(e, dmg, byUlt) {
        if (e.dead || e.harmless) return;
        const R = CFG.rafal;
        e.hp -= byUlt ? Math.min(dmg, R.gromDamage) : dmg;
        WikaryAudio.sfx('hit');
        if (e.hp <= 0) { e.hp = 0; this.rafalDefeated(e); return; }
        if (e.state === 'float') {
            e.anims.stop(); e.setTexture(ART.key('boss_rafal_hurt_1'));
            this.time.delayedCall(R.hurtMs, () => { if (e.active && !e.dead && e.state === 'float') e.play('rafal_float'); });
        }
        e.setTintFill(0xffffff);
        this.time.delayedCall(70, () => { if (e.active && !e.dead) { e.clearTint(); if (e.baseTint) e.setTint(e.baseTint); } });
    },
    rafalDefeated(e) {
        e.dead = true; e.body.enable = false; e.setVelocity(0, 0);
        this.hostile.clear(true, true); this.allyShots.clear(true, true);
        this.enemies.getChildren().slice().forEach(o => { if (o !== e && o.active) { o.dead = true; if (o.body) o.body.enable = false; this.tweens.add({ targets: o, alpha: 0, duration: 300, onComplete: () => o.destroy() }); } });
        const bonus = this.defense ? this.defense.doorHp * CFG.defense.doorBonus : 0;
        GS.score += CFG.score.rafal + bonus; GS.kills++;
        this.popup(e.x, e.y - e.displayHeight - 4, '+' + CFG.score.rafal);
        this.ended = true; this.ending = true; this.cutscene = true;
        this.setCrouch(false, 0); if (this.praying) this.cancelPray();
        this.hero.body.setVelocityX(0);
        this.facing = Math.sign(e.x - this.hero.x) || this.L.dir; this.kamil.setFlipX(this.facing < 0).play('k_idle').setAlpha(1);
        if (this.proboszcz) { this.proboszcz.clearTint().setOrigin(0.5, 1).play('proboszcz_idle'); if (this.pState) this.pState.state = 'idle'; }
        this.updateBossBar();
        WikaryAudio.stop(0.5);
        this.runL3Ending(e);
    },
    async runL3Ending(e) {
        const T = this.talk, G = CFG.GROUND_Y, R = CFG.rafal; T.skipped = false;
        try {
            // egzorcyzm: upiór wylatuje z Rafała
            e.y = G; e.play('rafal_exorcise'); e.clearTint(); const t0 = ART.tint('boss_rafal_exorcise_1'); if (t0 && t0 !== 0xffffff) e.setTint(t0);
            this.cameras.main.flash(500, 255, 255, 255); WikaryAudio.sfx('exorcise');
            if (this.kamil.active) this.kamil.play('k_bless');
            await sleep(this, 900);
            // grzmot: z ciała Rafała wychodzi Czerwony Diabeł (to on go opętał)
            WikaryAudio.sfx('thunder'); this.cameras.main.flash(400, 255, 230, 230); this.cameras.main.shake(300, 0.01);
            const bolt = this.add.sprite(e.x, G, 'fx_lightning_strike_1').setOrigin(0.5, 1).setDepth(11.5).play('lightning_strike');
            bolt.once('animationcomplete', () => bolt.destroy());
            const xk = 'fx_devil_exit_rafal_1';
            const exit = this.add.sprite(e.x, e.y - e.displayHeight * 0.6, ART.key(xk)).setDepth(11).play('devil_exit');
            ART.fit(this, exit, xk, CFG.devil.exitFxScale, 0.5, 0.5);
            this.tweens.add({ targets: exit, y: exit.y - 40, duration: 700 });
            exit.once('animationcomplete', () => exit.destroy());
            this.exorcised = true;
            WikaryAudio.sfx('devil');
            await sleep(this, 600);
            const dv = this.spawnDevil(e.x + this.L.dir * 46, G - 30);
            dv.setAlpha(0); this.tweens.add({ targets: dv, alpha: 1, y: G - 40, duration: 500 });
            this.brimstone(dv.x, dv.y - 40, 0.9);
            // Rafał wraca do normy: oszołomiony, ląduje na ziemi
            e.normal = true; e.ghost = false; e.setAlpha(1);
            e.setTexture(ART.key('rafal_dazed_1')); e.play('rafal_dazed');
            ART.fit(this, e, 'rafal_dazed_1', CFG.hero.scale, 0.5, 1);
            this.tweens.add({ targets: e, y: G, duration: 400, ease: 'Bounce.easeOut' });
            await sleep(this, 600);
            await this.devilSay('Następnym razem zniszczę ten kościół i pokonam cię, księże wikary Kamilu!', 'devil_closeup_angry');
            await this.kamilSay('A kysz! Wynocha z naszej parafii!');
            this.devilFlyAway(1, -160);
            await sleep(this, R.dazedMs);
            this.startDawn();
            e.play('rafal_idle'); ART.fit(this, e, 'rafal_idle_1', CFG.hero.scale, 0.5, 1);
            await sleep(this, 900);
            await this.rafalSay('Co ja tu robię? I czemu trzymam klucze od zakrystii... i od plebanii... i od lodówki proboszcza?', 'rafal_closeup_confused');
            await this.rafalSay('Chyba opętał mnie diabeł... Pewnie poleciał teraz na bagna, do czarnoksiężnika Adriana.');
            await this.proboszczSay('Kamil, ruszaj za tym diabłem do czarnoksiężnika Adriana i rozpraw się z tymi szatanami!');
            await this.kamilSay('Na bagna? Znowu nie wziąłem kaloszy...');
            await this.proboszczSay('Pan Bóg cię prowadzi. A kalosze pożyczy ci Rafał.');
            await sleep(this, 400);
        } catch (err) { /* dalej do podsumowania */ }
        this.showSummary();
    },
    startDawn() {                 // świt: niebo jaśnieje, mgła znika, biją dzwony
        const k = this.L.bg.dawn; if (!k) return;
        // docelowa grafika = cała scena o świcie (kościół w tym samym miejscu): nad tłem, kościołem i drzwiami, pod postaciami
        this.dawn = ART.image(this, 0, 0, k, 1, 0, 0).setScrollFactor(0).setDepth(ART.has(k) ? CFG.dawn.depth : 0.05).setAlpha(0);
        const ms = CFG.dawn.fadeMs;
        this.tweens.add({ targets: this.dawn, alpha: 1, duration: ms });
        if (this.fogs && this.fogs.length) this.tweens.add({ targets: this.fogs, alpha: 0, duration: ms });
        WikaryAudio.sfx('bells'); this.time.delayedCall(1400, () => WikaryAudio.sfx('bells'));
        WikaryAudio.play('title');
    },
});
