'use strict';
/* =====================================================================
   Level 2 i ogólne rozszerzenia sceny Level: ruchoma kładka, pogoda (deszcz,
   dalekie błyskawice), dom Krzysztofa, wrony / dziki / błędne ogniki, znicz i ogień (Z),
   arena z Hansem (boss) i zakończenie z Krzysztofem. Dopisywane do LevelScene.
   ===================================================================== */
Object.assign(LevelScene.prototype, {

    /* ---------- ruchoma kładka nad rzeką ---------- */
    /** pływająca platforma nad rzeką / bagnem: kładka (L2) albo pień (L4); ekran czeka, aż Kamil przepłynie */
    createPlank(x0, x1, key) {
        key = key || 'platform_plank';
        const log = key === 'platform_log', speed = log ? CFG.bog.logSpeed : CFG.plank.speed, margin = log ? CFG.bog.logMargin : CFG.plank.margin;
        const [w] = ART.SPEC[key].size;
        const minX = x0 + w / 2 + margin, maxX = x1 - w / 2 - margin, x = this.L.dir > 0 ? minX : maxX;
        const p = this.createPlatform(x, key);
        p.minX = minX; p.maxX = maxX; p.speed = speed;
        p.body.setVelocityX(this.L.dir * speed);
        return p;
    },
    /** platforma na poziomie ziemi (wierzch hitboxu = ziemia); bez prędkości stoi (lilia wodna w L4) */
    createPlatform(x, key) {
        const G = CFG.GROUND_Y, [w, h] = ART.SPEC[key].size, y = key === 'platform_plank' ? G + 1 : CFG.bog.surfaceY;
        const p = key === 'platform_plank' && !ART.has(key)
            ? this.add.tileSprite(x, y, w, h, 'tile_ground_cobble').setTint(ART.SPEC.platform_plank.tint)
            : ART.image(this, x, y, key, 1, 0.5, 0.5);
        p.setDepth(3.6);
        this.physics.add.existing(p);
        const sx = Math.abs(p.scaleX) || 1, sy = Math.abs(p.scaleY) || 1, top = G - (y - h / 2);      // od wierzchu obrazka do poziomu ziemi
        const bw = key === 'platform_lily' ? CFG.bog.lilyW : w, bh = key === 'platform_lily' ? CFG.bog.lilyH : h - top;
        p.body.setSize(bw / sx, bh / sy, false); p.body.setOffset((w - bw) / 2 / sx, top / sy);
        p.body.setAllowGravity(false); p.body.setImmovable(true); p.body.setFriction(0, 0);   // przenoszenie robi carryOnPlank
        p.body.checkCollision.down = false; p.body.checkCollision.left = false; p.body.checkCollision.right = false;
        p.minX = x; p.maxX = x; p.prevX = x; p.dx = 0; p.speed = 0; p.kind = key;
        this.planks.push(p);
        return p;
    },
    updatePlanks() {
        this.planks.forEach(p => {
            const S = p.speed;
            if (p.x >= p.maxX && p.body.velocity.x > 0) p.body.setVelocityX(-S);
            else if (p.x <= p.minX && p.body.velocity.x < 0) p.body.setVelocityX(S);
            p.dx = p.x - p.prevX; p.prevX = p.x;
        });
    },
    /** Kamil stojący na kładce płynie razem z nią */
    carryOnPlank() {
        const b = this.hero.body;
        if (!(b.touching.down || b.blocked.down)) return;
        for (const p of this.planks) {
            const pb = p.body;
            if (Math.abs(b.bottom - pb.top) < 3 && b.right > pb.left && b.left < pb.right) { this.hero.x += p.dx; this.onPlank = p; return; }
        }
        this.onPlank = null;
    },
    /** auto-scroll czeka przy rzece z kładką, aż Kamil ją przepłynie */
    holdForPlank(sx) {
        const L = this.L, cam = this.cameras.main, hd = this.heroD();
        for (const r of this.rivers) {
            if (!r.plank || hd >= r.at + r.w - 2) continue;
            const limit = r.at + r.w + CFG.plank.holdView;
            const front = L.dir > 0 ? sx + CFG.W : L.length - sx;
            if (front > limit) return cam.scrollX;
        }
        return sx;
    },

    /* ---------- pogoda: deszcz (gdy jest grafika) i dalekie błyskawice ---------- */
    createWeather() {
        const Wt = this.L.weather || {}, C = CFG.weather;
        this.flashes = 0;
        this.nextFlash = Wt.lightning ? this.time.now + Phaser.Math.Between(C.flashMinMs / 2, C.flashMaxMs / 2) : Infinity;
        if (Wt.rain && ART.has('fx_rain_1')) {
            this.rainFrames = ['fx_rain_1', 'fx_rain_2', 'fx_rain_3'].filter(ART.has);
            this.rain = this.add.tileSprite(0, 0, CFG.W, CFG.H, 'fx_rain_1').setOrigin(0).setScrollFactor(0).setDepth(7.6).setAlpha(C.rainAlpha);
            this.rainT = 0;
        }
    },
    updateWeather(time, delta) {
        const C = CFG.weather, dt = Math.min(delta, 50) / 1000;
        if (this.rain) {
            this.rainT += dt;
            this.rain.tilePositionY -= C.rainVY * dt;
            this.rain.tilePositionX = this.cameras.main.scrollX + C.rainVX * this.rainT;
            const f = this.rainFrames[Math.floor(time / C.rainFrameMs) % this.rainFrames.length];
            if (this.rain.texture.key !== f) this.rain.setTexture(f);
        }
        if (time > this.nextFlash) {
            this.nextFlash = time + Phaser.Math.Between(C.flashMinMs, C.flashMaxMs);
            if (!this.praying && !this.ended && !this.dead) {
                this.cameras.main.flash(C.flashMs, 190, 200, 255);
                this.flashes++;
                this.time.delayedCall(C.rumbleDelayMs, () => WikaryAudio.sfx('rumble'));
            }
        }
    },

    /* ---------- dom Krzysztofa na końcu Level 2 ---------- */
    createHouse(ex) {
        const G = CFG.GROUND_Y, k = 'house_krzysztof';
        const house = ART.image(this, ex, CFG.house.floorY, k, 1, 0.5, 1).setDepth(2.5);
        const left = house.x - house.displayWidth * (ART.isFallback(k) ? 0.5 : house.originX), top = house.y - house.displayHeight;
        let door;
        if (ART.isFallback(k)) {               // zamiennik: drzwi z intro w tym samym miejscu co w obrazku domu z intro
            const [cx, cy] = ART.SPEC[k].crop, sx = house.scaleX, sy = house.scaleY;
            const hl = ex - (ART.SPEC[k].crop[2] / 2) * sx, ht = CFG.house.floorY - ART.SPEC[k].crop[3] * sy;
            door = this.add.image(hl + (70 - cx) * sx, ht + (70 - cy) * sy, ART.key('house_krzysztof_door_1')).setOrigin(0).setScale(sx, sy);
            const t = ART.tint('house_krzysztof_door_1'); if (t) door.setTint(t);
        } else {
            const D = CFG.house.door;
            door = ART.image(this, left + D.x, top + D.y, 'house_krzysztof_door_1', 1, 0, 0);
        }
        door.setDepth(2.6);
        this.house = house; this.houseDoor = door;
        this.doorX = door.x + door.displayWidth / 2;
    },
    openHouseDoor() {
        const d = this.houseDoor, key = ART.key('house_krzysztof_door_2');
        if (d && key) { d.setTexture(key); WikaryAudio.sfx('door'); }
    },

    /* ---------- wrogowie Level 2 ---------- */
    spawnEnemy2(type, frontX, mv, mk) {
        const D = { crow: ['enemy_crow_fly_1', 'crow_fly'], boar: ['enemy_boar_run_1', 'boar_run'], wisp: ['enemy_wisp_1', 'wisp'] }[type];
        if (!D) return false;
        const C = enemyCfg(type), G = CFG.GROUND_Y, hero = this.hero;
        const y = type === 'boar' ? G : Phaser.Math.Between(C.yMin, C.yMax);
        const e = mk(frontX, y, ART.key(D[0]), D[1]);
        if (type === 'wisp') e.setOrigin(0.5, 0.5);
        e.setScale(C.scale * ART.mul(this, D[0]));
        e.baseTint = ART.tint(D[0]); if (e.baseTint) e.setTint(e.baseTint);
        this.fitBody(e);
        e.body.setAllowGravity(type === 'boar');
        e.state = type === 'wisp' ? 'circle' : type === 'crow' ? 'fly' : 'walk';
        e.mv = mv; e.t0 = this.time.now;
        if (type === 'wisp') {
            e.ang = Math.atan2((e.y - hero.y) / 0.55, e.x - hero.x); e.radius = C.radius0;
            e.setFlipX(false);
        } else e.setVelocityX(mv * C.speed);
        return true;
    },
    updateEnemy2(e, C, time, dt) {
        if (e.type !== 'crow' && e.type !== 'boar' && e.type !== 'wisp') return false;
        const hero = this.hero, cam = this.cameras.main, dx = hero.x - e.x;
        if (e.type === 'crow') {
            if (e.state === 'fly') {
                e.body.velocity.y = 0;
                if (Math.sign(dx) === e.mv && Math.abs(dx) < C.diveRange) {
                    const dy = hero.y - (e.y - e.displayHeight / 2), len = Math.hypot(dx, dy) || 1;
                    e.state = 'dive'; e.setVelocity(dx / len * C.diveSpeed, dy / len * C.diveSpeed);
                    e.play('crow_dive'); this.fitBody(e); WikaryAudio.sfx('caw');
                }
            } else if (e.state === 'dive' && e.y >= C.pullUpY) {
                e.state = 'up'; e.setVelocity(e.mv * C.speed, -C.diveSpeed * 0.6);
                e.play('crow_fly'); this.fitBody(e);
            }
        } else if (e.type === 'boar') {
            if (e.state === 'walk' && Math.abs(dx) < C.chargeRange && Math.sign(dx) === e.mv && this.inView(e)) {
                e.state = 'windup'; e.until = time + C.windupMs; e.setVelocityX(0); e.anims.pause(); WikaryAudio.sfx('grunt');
            } else if (e.state === 'windup' && time > e.until) {
                e.state = 'charge'; e.setVelocityX(e.mv * C.chargeSpeed); e.anims.resume(); e.anims.timeScale = 2;
            }
        } else {
            e.ang += C.angSpeed * dt; e.radius = Math.max(C.radius1, e.radius - C.shrinkPerS * dt);
            const tx = hero.x + Math.cos(e.ang) * e.radius, ty = hero.y - 8 + Math.sin(e.ang) * e.radius * 0.55;
            const vx = Phaser.Math.Clamp((tx - e.x) * C.follow, -240, 240), vy = Phaser.Math.Clamp((ty - e.y) * C.follow, -240, 240);
            e.setVelocity(vx, vy);
            if (time - e.t0 > C.lifeMs) {                 // ognik gaśnie
                e.dead = true; e.body.enable = false;
                this.tweens.add({ targets: e, alpha: 0, duration: 400, onComplete: () => e.destroy() });
            }
        }
        const far = e.x < cam.scrollX - 160 || e.x > cam.scrollX + CFG.W + 160 || e.y < -60 || e.y > CFG.H + 80;
        if (far && time - e.t0 > 1500) e.destroy();
        return true;
    },

    /* ---------- pociski: krzyż (1 cel) i ogień (przebija kilku) ---------- */
    shotHits(s, e) {
        if (e.dead || !s.active) return;
        if (s.kind === 'fire' && e.ghost) { this.fireFizzle(s, e); return; }      // Level 3: ogień nie działa na duchy
        if (s.kind === 'fire') {
            if (s.hitSet.has(e)) return;
            s.hitSet.add(e);
            this.damageEnemy(e, CFG.fire.damage);
            if (--s.pierce <= 0) s.destroy();
            return;
        }
        s.destroy(); this.damageEnemy(e, CFG.cross.damage);
    },
    throwFire(time) {
        const F = CFG.fire, h = this.hero;
        this.lastFire = time; this.attackUntil = time + 260;
        const y = this.crouching ? h.body.bottom - F.crouchUp : h.y + F.standDy;
        const s = this.shots.create(h.x + this.facing * 16, y, 'fx_fireball_1');
        s.setScale(F.scale).setDepth(9).setFlipX(this.facing < 0).play('fireball');
        s.body.setAllowGravity(false); s.body.setSize(F.bodyW / F.scale, F.bodyH / F.scale);
        s.setVelocityX(this.facing * F.speed);
        s.dieAt = time + F.lifeMs; s.kind = 'fire'; s.pierce = F.pierce; s.hitSet = new Set();
        if (!this.crouching) this.kamil.play('k_attack_fire');
        WikaryAudio.sfx('fire');
    },
    zniczPickup(it) {          // jak krzyż: piorun + przyciemnienie -> nowa moc: ogień (Z)
        this.cutscene = true; this.setCrouch(false, 0);
        this.tweens.killTweensOf(it); it.destroy();
        this.physics.pause();
        const k = this.kamil;
        k.setAlpha(1); k.play('k_bless');
        WikaryAudio.sfx('thunder');
        this.cameras.main.flash(180, 255, 230, 200);
        this.tweens.add({ targets: this.dim, alpha: 0.6, duration: 250 });
        const fx = this.add.sprite(k.x, k.y - k.displayHeight - 6, 'fx_fireball_1').setScale(1.6).setDepth(11).play('fireball');
        const strike = () => {
            const b = this.add.sprite(k.x + Phaser.Math.Between(-4, 4), k.y, 'fx_lightning_strike_1').setOrigin(0.5, 1).setDepth(11.5).play('lightning_strike');
            b.once('animationcomplete', () => b.destroy());
        };
        strike(); this.time.delayedCall(380, strike);
        this.time.delayedCall(380, () => { this.cameras.main.flash(140, 255, 255, 255); this.cameras.main.shake(200, 0.008); });
        this.time.delayedCall(700, () => hintBubble(this, IS_TOUCH ? 'OGIEŃ = KULA OGNIA (PRZEBIJA WROGÓW)' : 'Z = KULA OGNIA (PRZEBIJA WROGÓW)', 3200, 90));
        this.time.delayedCall(1900, () => {
            fx.destroy();
            this.tweens.add({ targets: this.dim, alpha: 0, duration: 300, onComplete: () => this.dim.setAlpha(0) });
            GS.hasFire = true; GS.score += CFG.score.znicz; this.popup(k.x, k.y - 80, '+' + CFG.score.znicz);
            this.physics.resume(); this.cutscene = false;
        });
    },

    /* ---------- arena: dom Krzysztofa i Hans ---------- */
    startArena() {
        if (this.arena) return;
        const L = this.L, B = CFG.boss;
        this.arena = true; this.cutscene = true;
        this.setCrouch(false, 0); if (this.praying) this.cancelPray();
        this.arenaCamX = Phaser.Math.Clamp(L.dir > 0 ? L.length - CFG.W : 0, 0, L.length - CFG.W);
        this.enemies.getChildren().slice().forEach(e => { if (e.active && !e.dead) { e.dead = true; e.body.enable = false; this.tweens.add({ targets: e, alpha: 0, duration: 300, onComplete: () => e.destroy() }); } });
        this.autoWalk = { x: this.doorX - L.dir * B.heroStandOff };
        WikaryAudio.stop(0.6);
        this.runArenaIntro();
    },
    updateArenaCamera(dt) {
        const cam = this.cameras.main, d = this.arenaCamX - cam.scrollX;
        cam.scrollX += Math.sign(d) * Math.min(Math.abs(d), 320 * dt);
    },
    updateAutoWalk() {
        const b = this.hero.body;
        if (!this.autoWalk) { if (!this.physics.world.isPaused) b.setVelocityX(0); return 0; }
        const dx = this.autoWalk.x - this.hero.x;
        if (Math.abs(dx) < 4) { b.setVelocityX(0); this.autoWalk = null; this.facing = this.L.dir; return 0; }
        const vx = Math.sign(dx) * CFG.hero.speed; this.facing = Math.sign(dx); b.setVelocityX(vx);
        return vx;
    },
    krzysztofSay(text, portrait) {
        const kz = this.krzysztof;
        return this.talk.say(portrait || 'krzysztof_closeup_open', 'KRZYSZTOF', text, {
            onStart: () => kz && kz.active && kz.play('krzysztof_talk'),
            onEnd: () => kz && kz.active && kz.play('krzysztof_idle'),
        });
    },
    kamilSay(text) { return this.talk.say('wikary_kamil_closeup_open', 'KAMIL', text); },
    showKrzysztof() {
        const G = CFG.GROUND_Y, L = this.L;
        if (!this.krzysztof) {
            this.krzysztof = this.add.sprite(this.doorX, G, 'krzysztof_idle_1').setOrigin(0.5, 1).setScale(CFG.hero.scale).setDepth(6).setFlipX(L.dir > 0).play('krzysztof_idle');
        }
        const kz = this.krzysztof.setAlpha(0).setVisible(true);
        kz.x = this.doorX;
        this.tweens.add({ targets: kz, alpha: 1, duration: 300 });
        this.tweens.add({ targets: kz, x: this.doorX - L.dir * 36, duration: 700, delay: 200 });
    },
    async runArenaIntro() {
        const T = this.talk; T.skipped = false;
        try {
            for (let i = 0; i < 60 && this.autoWalk; i++) await sleep(this, 100);
            if (this.dead) return;
            this.facing = this.L.dir;
            await sleep(this, 300);
            this.openHouseDoor(); this.showKrzysztof();
            await sleep(this, 900);
            const lines = [
                [0, 'Czego?! Jak po kolędę, to w styczniu!'],
                [1, 'Szczęść Boże, panie Krzysztofie! Proboszcz przysyła... w sprawie guzika.'],
                [0, 'Guzik to też pieniądz! Inflacja, proszę księdza!'],
                [1, 'Dwa grosze i guzik od kalesonów? Panie Krzysztofie...'],
                [0, 'Dość gadania! HANS! Do nogi! To znaczy... BIERZ GO!'],
            ];
            for (const [who, s] of lines) { await (who ? this.kamilSay(s) : this.krzysztofSay(s)); if (this.dead) return; }
            this.spawnBoss();
            const kz = this.krzysztof;
            this.tweens.add({ targets: kz, x: this.doorX, alpha: 0, duration: 500, delay: 300 });
            await sleep(this, 900);
            hintBubble(this, 'HANS! SKACZ NAD FALĄ, SALTEM NAD SZARŻĄ', 2600, 90);
            WikaryAudio.play('boss');
            this.cutscene = false;
        } catch (e) { this.cutscene = false; }
    },
    spawnBoss() {
        const B = CFG.boss, G = CFG.GROUND_Y, k = 'boss_hans_run_1';
        const e = this.enemies.create(this.doorX, G, ART.key(k));
        e.type = 'hans'; e.hp = e.maxHp = Difficulty.bossHp(B.hp); e.dead = false; e.thread = null;
        e.setOrigin(0.5, 1).setScale(B.scale * ART.mul(this, k)).setDepth(7);
        e.baseTint = ART.tint(k); if (e.baseTint) e.setTint(e.baseTint);
        e.play('hans_run'); this.fitBody(e);
        e.state = 'enter'; e.until = this.time.now + 900; e.attackN = 0; e.enraged = false;
        e.setVelocityX(-this.L.dir * B.walkSpeed * 2); e.setFlipX(-this.L.dir < 0);
        this.boss = e;
        WikaryAudio.sfx('bark');
        this.createBossBar();
    },
    createBossBar(name, y) {
        const D = 4000, x = CFG.W / 2 - 100; y = y || 34;
        const lab = txt(this, x - 8, y + 4, name || 'HANS', 8, '#ff9070', { ox: 1, oy: 0.5 }).setScrollFactor(0).setDepth(D);
        const bg = this.add.rectangle(x, y, 200, 9, 0x221420, 1).setOrigin(0).setStrokeStyle(1, 0xd8a640).setScrollFactor(0).setDepth(D);
        const fill = this.add.rectangle(x + 1, y + 1, 198, 7, 0xe04030, 1).setOrigin(0).setScrollFactor(0).setDepth(D);
        this.bossBar = { lab, bg, fill };
    },
    updateBossBar() {
        const e = this.boss, b = this.bossBar; if (!e || !b) return;
        b.fill.width = Math.max(0, Math.round(198 * e.hp / e.maxHp));
        const show = !e.dead; [b.lab, b.bg, b.fill].forEach(o => o.setVisible(show));
    },
    bossPhase(e) {
        let p = CFG.boss.phases[0];
        for (const ph of CFG.boss.phases) if (e.hp / e.maxHp <= ph.from) p = ph;
        return p;
    },
    updateBoss(e, time, dt) {
        if (e.dead || !e.active) return;
        const B = CFG.boss, hero = this.hero, cam = this.cameras.main, ph = this.bossPhase(e);
        const minX = cam.scrollX + B.arenaPad, maxX = cam.scrollX + CFG.W - B.arenaPad;
        const face = (d) => e.setFlipX(d < 0);
        this.updateWaves(time);
        if (ph.enraged && !e.enraged) { e.enraged = true; e.baseTint = 0xffa0a0; e.setTint(e.baseTint); hintBubble(this, 'HANS SIĘ WŚCIEKŁ!', 1600, 90); }
        if (this.cutscene && e.state !== 'enter') { e.setVelocityX(0); return; }
        if (e.state === 'enter') {
            if (time > e.until) { e.state = 'walk'; e.until = time + ph.restMs; }
        } else if (e.state === 'walk') {
            const d = Math.sign(hero.x - e.x) || 1;
            face(d);
            e.setVelocityX(Math.abs(hero.x - e.x) > B.keepDist ? d * B.walkSpeed : 0);
            if (time > e.until) {
                e.attackN++;
                const charge = ph.enraged ? Math.random() < 0.55 : e.attackN % 2 === 1;
                e.setVelocityX(0);
                if (charge) {
                    e.state = 'windup'; e.until = time + B.windupMs / (ph.enraged ? 1.3 : 1); e.chargeDir = d; e.anims.pause();
                } else {
                    e.state = 'bark'; e.until = time + B.barkMs; e.play('hans_bark'); WikaryAudio.sfx('bark');
                    for (let i = 0; i < ph.waves; i++) this.time.delayedCall(B.waveDelayMs + i * B.waveGapMs, () => this.spawnWaves(e));
                }
            }
        } else if (e.state === 'windup') {
            if (Math.floor(time / 80) % 2) e.setTint(0xff5040); else if (e.baseTint) e.setTint(e.baseTint); else e.clearTint();
            if (time > e.until) {
                if (e.baseTint) e.setTint(e.baseTint); else e.clearTint();
                e.state = 'charge'; e.anims.resume(); e.anims.timeScale = 1.8; face(e.chargeDir);
                e.setVelocityX(e.chargeDir * B.chargeSpeed * ph.chargeMul); WikaryAudio.sfx('grunt');
            }
        } else if (e.state === 'charge') {
            if ((e.chargeDir > 0 && e.x >= maxX) || (e.chargeDir < 0 && e.x <= minX)) {
                e.setVelocityX(0); e.anims.timeScale = 1; e.state = 'walk'; e.until = time + ph.restMs;
                cam.shake(120, 0.006);
            }
        } else if (e.state === 'bark' && time > e.until) {
            e.state = 'walk'; e.until = time + ph.restMs; e.play('hans_run'); this.fitBody(e);
        }
        if (e.x < minX) e.x = minX; if (e.x > maxX) e.x = maxX;
    },
    spawnWaves(e) {
        if (!e.active || e.dead || this.ended || this.dead) return;
        const B = CFG.boss, G = CFG.GROUND_Y, sx = 0.6, sy = 0.35;
        [-1, 1].forEach(d => {
            const w = this.waves.create(e.x + d * 40, G, 'fx_enemy_poof_2');
            w.setOrigin(0.5, 1).setScale(sx, sy).setTint(0xffd080).setDepth(7.5);
            w.body.setAllowGravity(false);
            w.body.setSize(B.waveW / sx, B.waveH / sy, false);
            w.body.setOffset((w.frame.width - B.waveW / sx) / 2, w.frame.height - B.waveH / sy);
            w.setVelocityX(d * B.waveSpeed); w.dieAt = this.time.now + 3000;
            this.tweens.add({ targets: w, scaleY: sy * 1.3, duration: 120, yoyo: true, repeat: -1 });
        });
        this.cameras.main.shake(140, 0.005);
        WikaryAudio.sfx('wave');
    },
    updateWaves(time) {
        this.waves.getChildren().slice().forEach(w => { if (time > w.dieAt) w.destroy(); });
    },
    waveHit(w) {
        const now = this.time.now;
        if (!w.active || now < this.invulnUntil || this.cutscene || this.ended || this.dead) return;
        this.stunUntil = now + CFG.boss.stunMs;
        w.destroy();
        this.hurt(w.x);
    },
    bossHit(e, dmg, byUlt) {
        if (e.dead) return;
        const B = CFG.boss;
        e.hp -= byUlt ? Math.min(dmg, B.gromDamage) : dmg;
        WikaryAudio.sfx('hit');
        if (e.hp <= 0) { e.hp = 0; this.bossDefeated(e); return; }
        if (e.state === 'walk' || e.state === 'bark') {
            const back = e.state === 'bark' ? 'hans_bark' : 'hans_run';
            e.anims.stop(); e.setTexture(ART.key('boss_hans_hurt_1'));
            this.time.delayedCall(B.hurtMs, () => { if (e.active && !e.dead) { e.play(back); if (e.baseTint) e.setTint(e.baseTint); } });
        }
        e.setTintFill(0xffffff);
        this.time.delayedCall(70, () => { if (e.active && !e.dead) { e.clearTint(); if (e.baseTint) e.setTint(e.baseTint); } });
    },
    bossDefeated(e) {
        e.dead = true; e.body.enable = false; e.setVelocity(0, 0);
        e.anims.stop(); e.setTexture(ART.key('boss_hans_defeated_1')); e.clearTint();
        const t = ART.tint('boss_hans_defeated_1'); if (t) e.setTint(t);
        this.waves.clear(true, true);
        GS.score += CFG.score.hans; GS.kills++;
        this.popup(e.x, e.y - e.displayHeight - 4, '+' + CFG.score.hans);
        this.ended = true; this.ending = true; this.cutscene = true;
        this.setCrouch(false, 0); if (this.praying) this.cancelPray();
        this.hero.body.setVelocityX(0);
        this.facing = this.L.dir; this.kamil.setFlipX(this.facing < 0).play('k_idle').setAlpha(1);
        WikaryAudio.stop(0.4); WikaryAudio.sfx('win');
        this.cameras.main.flash(300, 255, 255, 255);
        this.updateBossBar();
        this.runEnding();
    },
    async runEnding() {
        const T = this.talk; T.skipped = false;
        try {
            await sleep(this, 1400);
            this.showKrzysztof();
            await sleep(this, 900);
            await this.krzysztofSay('Hans... mój Hans... No dobrze już, dobrze, proszę księdza. Wstyd mi.', 'krzysztof_closeup_ashamed');
            const kz = this.krzysztof;
            if (kz && kz.active) kz.play('krzysztof_coin');
            WikaryAudio.sfx('coin');
            GS.score += CFG.score.tenZloty;
            this.popup(kz.x, kz.y - kz.displayHeight - 6, '+10 ZŁ');
            await this.talk.say('krzysztof_closeup_ashamed', 'KRZYSZTOF', 'Dorzucam na tacę... całe DZIESIĘĆ ZŁOTYCH! Tylko niech proboszcz nikomu nie mówi.');
            if (kz && kz.active) kz.play('krzysztof_idle');
            await this.kamilSay('Bóg zapłać, panie Krzysztofie! A guzik oddaję, przyda się do kalesonów.');
            await sleep(this, 400);
        } catch (e) { /* dalej do podsumowania */ }
        this.showSummary();
    },
});
