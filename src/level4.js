'use strict';
/* =====================================================================
   Level 4 „Bagna”: zmierzch, zielona mgła, bagienne doły z liliami i pływającymi
   pniami, komary (małe roje i duże żądlące), żaby z językiem, bagienne stwory
   spod ziemi, święcona woda na komary, boss: czarnoksiężnik Adrian (czary,
   roje komarów, teleport). Czerwony Diabeł: koniec Level 3 i Level 4, auto Adriana.
   Dopisywane do LevelScene (jak level2.js / level3.js).
   ===================================================================== */
Object.assign(LevelScene.prototype, {

    /* ---------- bagno: zielona mgła (zamienniki: mgła z L3 w zieleni) ---------- */
    createSwamp() {
        const Wt = this.L.weather || {};
        if (!Wt.swampFog) return;
        this.fogs = this.fogs || [];
        CFG.swampFog.forEach(f => {
            const key = ART.key(f.key); if (!key || !this.textures.exists(key)) return;
            const t = this.add.tileSprite(0, f.y, CFG.W, 64, key).setOrigin(0).setScrollFactor(0).setDepth(f.depth).setAlpha(f.alpha);
            const tn = ART.tint(f.key); if (tn) t.setTint(tn);
            t.cfg = f; this.fogs.push(t);
        });
        this.swamp = { fogs: this.fogs.length };
    },
    updateLevel4(time, delta) {
        const dt = Math.min(delta, 50) / 1000, hero = this.hero, A = CFG.adrian;
        // czary Adriana: fioletowe kule lekko naprowadzają się na Kamila
        this.hostile.getChildren().forEach(o => {
            if (!o.homing || !o.active) return;
            const want = Math.atan2(hero.y - o.y, hero.x - o.x), v = o.body.velocity, cur = Math.atan2(v.y, v.x);
            const d = Phaser.Math.Angle.Wrap(want - cur), step = Phaser.Math.Clamp(d, -A.orbTurn * dt, A.orbTurn * dt);
            o.body.setVelocity(Math.cos(cur + step) * A.orbSpeed, Math.sin(cur + step) * A.orbSpeed);
        });
        // święcona woda: aura wokół Kamila zabija małe komary i odpycha duże
        if (this.repelAura) {
            const R = CFG.repellent, a = this.repelAura;
            a.x = this.kamil.x; a.y = this.kamil.y + 2;
            const left = this.repelUntil - time;
            if (left <= 0) { a.destroy(); this.repelAura = null; }
            else {
                a.setAlpha(left < R.warnMs && Math.floor(time / 120) % 2 ? 0.25 : 0.8);
                this.enemies.getChildren().slice().forEach(e => {
                    if (!e.active || e.dead) return;
                    const d = Math.hypot(e.x - hero.x, e.y - hero.y);
                    const rr = R.radius * Difficulty.spells().hitScale;
                    if (e.type === 'mosquito_small' && d < rr) { this.damageEnemy(e, 99); this.repelKills++; }
                    else if (e.type === 'mosquito_big' && d < rr * 1.5 && e.state !== 'up') { e.state = 'up'; e.play('mosq_big'); e.setVelocity(Math.sign(e.x - hero.x) * 80, -R.bigPush); }
                });
            }
        }
    },
    repellentPickup(it, time) {
        const R = CFG.repellent, k = this.kamil;
        GS.score += CFG.score.repellent; this.popup(it.x, it.y, '+' + CFG.score.repellent);
        this.repelUntil = time + R.ms;
        if (!this.repelAura) {
            this.repelAura = this.add.sprite(k.x, k.y + 2, 'fx_pray_aura_1').setOrigin(0.5, 1).setScale(R.auraScale).setTint(0x90ffb0).setDepth(9.4).play('fx_aura');
        }
        WikaryAudio.sfx('repel');
        hintBubble(this, 'ŚWIĘCONA WODA! KOMARY TRZYMAJĄ SIĘ Z DALA', 2400, 90);
    },

    /* ---------- wrogowie bagna (ogień działa) ---------- */
    swampSprite(type, x, y, key, anim, mv, center) {
        const C = enemyCfg(type);
        const e = this.enemies.create(x, y, ART.key(key));
        e.type = type; e.hp = C.hp; e.dead = false; e.thread = null;
        e.setOrigin(0.5, center ? 0.5 : 1).setScale(C.scale * ART.mul(this, key)).setDepth(7).setFlipX(mv < 0);
        e.baseTint = ART.tint(key); if (e.baseTint) e.setTint(e.baseTint);
        if (anim) e.play(anim);
        this.fitBody(e);
        e.mv = mv; e.t0 = this.time.now;
        return e;
    },
    spawnMosquitoSwarm(x, y, mv, n) {
        const C = enemyCfg('mosquito_small');
        for (let i = 0; i < (n || C.swarm); i++) {
            const e = this.swampSprite('mosquito_small', x + (mv < 0 ? 1 : -1) * i * C.gap, y + Phaser.Math.Between(-14, 14), 'enemy_mosquito_small_1', 'mosq_small', mv, true);
            e.body.setAllowGravity(false); e.phase = i * 1.3 + Math.random(); e.state = 'fly';
            e.anims.setProgress(Math.random());
        }
        WikaryAudio.sfx('buzz');
    },
    spawnEnemy4(type, frontX, mv) {
        const C = enemyCfg(type), G = CFG.GROUND_Y, cam = this.cameras.main, W = CFG.W;
        if (type === 'mosquito_small') { this.spawnMosquitoSwarm(frontX, Phaser.Math.Between(C.yMin, C.yMax), mv); return true; }
        if (type === 'mosquito_big') {
            const e = this.swampSprite(type, frontX, Phaser.Math.Between(C.yMin, C.yMax), 'enemy_mosquito_big_1', 'mosq_big', mv, true);
            e.body.setAllowGravity(false); e.state = 'fly'; e.baseY = e.y; e.setVelocityX(mv * C.speed);
            WikaryAudio.sfx('buzz');
            return true;
        }
        if (type === 'frog') {
            const e = this.swampSprite(type, frontX, G - 2, 'enemy_frog_1', null, mv);
            e.state = 'sit'; e.nextJump = this.time.now + 500; e.nextTongue = 0;
            return true;
        }
        if (type === 'bogman') {
            const x = this.L.dir > 0 ? cam.scrollX + Phaser.Math.Between(W * 0.55, W * 0.9) : cam.scrollX + Phaser.Math.Between(W * 0.1, W * 0.45);
            this.spawnBogman(x, mv);
            return true;
        }
        return false;
    },
    spawnBogman(x, mv) {
        const C = enemyCfg('bogman'), G = CFG.GROUND_Y;
        const e = this.swampSprite('bogman', x, G, 'enemy_bogman_rise_1', null, mv);
        e.body.setAllowGravity(false);
        e.state = 'warn'; e.harmless = true; e.setVisible(false); e.body.enable = false; e.until = this.time.now + C.warnMs;
        const b = this.add.sprite(x, G + 2, ART.key('fx_splat_1')).setOrigin(0.5, 1).setDepth(6.5).play({ key: 'splat', repeat: 2 });   // bąble bagna
        ART.fit(this, b, 'fx_splat_1', 0.4, 0.5, 1);
        b.once('animationcomplete', () => b.destroy());
        WikaryAudio.sfx('bubble');
        e.warnFx = b;
        return e;
    },
    updateEnemy4(e, C, time, dt) {
        const T = e.type;
        if (T !== 'mosquito_small' && T !== 'mosquito_big' && T !== 'frog' && T !== 'bogman') return false;
        const hero = this.hero, cam = this.cameras.main, G = CFG.GROUND_Y, dx = hero.x - e.x;
        if (T === 'mosquito_small') {                 // rój: leci na Kamila zygzakiem
            const ty = hero.y - 8 + Math.sin((time - e.t0) / 1000 * C.freq + e.phase) * C.amp;
            const len = Math.hypot(dx, ty - e.y) || 1;
            e.setVelocity(e.body.velocity.x + (dx / len * C.speed - e.body.velocity.x) * Math.min(1, C.home * dt),
                (ty - e.y) / len * C.speed);
            e.setFlipX(e.body.velocity.x < 0);
        } else if (T === 'mosquito_big') {           // duży: krąży wyżej, nad Kamilem nurkuje z żądłem
            if (e.state === 'fly') {
                e.y = e.baseY + Math.sin((time - e.t0) / 400) * 6;
                if (Math.abs(dx) < C.diveRange && Math.sign(dx) === Math.sign(e.body.velocity.x || dx)) {
                    e.state = 'sting'; e.until = time + C.stingMs; e.play('mosq_sting'); this.fitBody(e);
                    const len = Math.hypot(dx, hero.y - e.y) || 1;
                    e.setVelocity(dx / len * C.diveSpeed, (hero.y - e.y) / len * C.diveSpeed);
                    WikaryAudio.sfx('buzz');
                }
            } else if (e.state === 'sting') {
                if (e.y > C.pullUpY || time > e.until) { e.state = 'up'; e.play('mosq_big'); this.fitBody(e); e.setVelocityY(-C.speed); }
            } else if (e.state === 'up') {
                if (e.y <= e.baseY) { e.state = 'fly'; e.setVelocity(e.mv * C.speed, 0); }
            }
            e.setFlipX(e.body.velocity.x < 0);
        } else if (T === 'frog') {                   // żaba: skacze w stronę Kamila, z bliska strzela językiem
            const onG = e.body.blocked.down || e.body.touching.down, d = Math.sign(dx) || -1;
            if (e.state === 'sit') {
                e.setVelocityX(0); if (onG) e.setTexture(ART.key('enemy_frog_1'));
                if (onG && Math.abs(dx) < C.tongueRange && time > e.nextTongue && Math.abs(hero.body.bottom - G) < 40) {
                    e.state = 'tongue'; e.until = time + C.tongueMs; e.tongueHit = false; e.tongueDir = d; e.setFlipX(d < 0);
                    e.play('frog_tongue'); this.fitBody(e); WikaryAudio.sfx('tongue'); this.tongues++;
                } else if (onG && time > e.nextJump) {
                    e.state = 'jump'; e.setFlipX(d < 0); e.play('frog_jump'); e.setVelocity(d * C.jumpVX, -C.jumpV); WikaryAudio.sfx('croak');
                }
            } else if (e.state === 'jump') {
                if (onG && e.body.velocity.y >= 0 && time - e.t0 > 200) { e.state = 'sit'; e.nextJump = time + C.jumpEveryMs; e.anims.stop(); this.fitBody(e); }
            } else if (e.state === 'tongue') {
                const reach = Math.abs(dx) < C.tongueReach + CFG.hero.bodyW / 2 && Math.sign(dx) === e.tongueDir;
                if (!e.tongueHit && reach && time > e.until - C.tongueMs * 0.6) { e.tongueHit = true; this.hurt(e.x); }
                if (time > e.until) { e.state = 'sit'; e.nextTongue = time + C.tongueCdMs; e.nextJump = time + 400; e.anims.stop(); e.setTexture(ART.key('enemy_frog_1')); this.fitBody(e); }
            }
        } else {                                      // bagienny stwór: bąble, wychodzi spod ziemi, idzie
            if (e.state === 'warn' && time > e.until) {
                e.state = 'rise'; e.setVisible(true); e.y = G; e.play('bogman_rise');      // grafika sama wychodzi z bagna
                this.time.delayedCall(C.riseMs, () => {
                    if (!e.active || e.dead) return;
                    e.state = 'walk'; e.body.enable = true; e.harmless = false; e.play('bogman_walk'); this.fitBody(e);
                });
            } else if (e.state === 'walk') {
                const d = Math.sign(dx) || -1;
                e.setFlipX(d < 0).setVelocityX(d * C.speed);
            }
        }
        const far = e.x < cam.scrollX - 220 || e.x > cam.scrollX + CFG.W + 220 || e.y > CFG.H + 80 || e.y < -120;
        if (far && time - e.t0 > 1200) e.destroy();
        return true;
    },

    /* ---------- chata Adriana na palach ---------- */
    createHut(ex) {
        const k = 'hut_adrian', H = CFG.hut;
        const hut = ART.image(this, ex, H.floorY, k, 1, 0.5, 1).setDepth(2.5);
        const [w, h] = ART.SPEC[k].size, left = ex - w / 2, top = H.floorY - h;
        const door = ART.image(this, left + H.door.x, top + H.door.y, 'hut_adrian_door_1', 1, 0, 0).setDepth(2.6);
        this.hut = hut; this.hutDoor = door;
        this.doorX = door.x + door.displayWidth / 2; this.doorBottom = door.y + door.displayHeight;
    },
    openHutDoor() {
        const d = this.hutDoor; if (!d) return;
        d.setTexture(ART.key('hut_adrian_door_2')); WikaryAudio.sfx('door');
    },

    /* ---------- arena: czarnoksiężnik Adrian ---------- */
    startAdrianArena() {
        if (this.arena) return;
        const L = this.L, A = CFG.adrian;
        this.arena = true; this.cutscene = true;
        this.setCrouch(false, 0); if (this.praying) this.cancelPray();
        this.arenaCamX = Phaser.Math.Clamp(L.dir > 0 ? L.length - CFG.W : 0, 0, L.length - CFG.W);
        this.enemies.getChildren().slice().forEach(e => { if (e.active && !e.dead) { e.dead = true; e.body.enable = false; this.tweens.add({ targets: e, alpha: 0, duration: 300, onComplete: () => e.destroy() }); } });
        this.autoWalk = { x: this.doorX - L.dir * A.heroStandOff };
        WikaryAudio.stop(0.6);
        this.runAdrianIntro();
    },
    adrianSay(text, portrait) {
        const e = this.adrian;
        return this.talk.say(portrait || 'adrian_closeup_open', 'ADRIAN', text, {
            onStart: () => e && e.active && !e.dead && e.play('adrian_talk'),
            onEnd: () => e && e.active && !e.dead && e.play('adrian_idle'),
        });
    },
    async runAdrianIntro() {
        const T = this.talk, A = CFG.adrian, G = CFG.GROUND_Y; T.skipped = false;
        try {
            for (let i = 0; i < 60 && this.autoWalk; i++) await sleep(this, 100);
            if (this.dead) return;
            this.facing = this.L.dir;
            await sleep(this, 300);
            this.openHutDoor();
            const e = this.spawnAdrian();
            await sleep(this, A.enterMs);
            const lines = [
                [0, 'Kto śmie pukać do chaty czarnoksiężnika Adriana?!'],
                [1, 'Szczęść Boże! Szukam pewnego czerwonego pana z rogami. Podobno wpadł tu na herbatkę.'],
                [0, 'Diabeł to mój wspólnik! A ty, klecho, skończysz jako żaba w moim kociołku!'],
                [1, 'Proszę pana, ja nawet żab nie jadam. Ale chętnie pana nawrócę.'],
            ];
            for (const [who, s] of lines) { await (who ? this.kamilSay(s) : this.adrianSay(s)); if (this.dead) return; }
            // zeskok z progu chaty na bagno
            const spot = this.cameras.main.scrollX + A.spots[A.spots.length - 1];
            this.tweens.add({ targets: e, x: spot, y: G, duration: 500, ease: 'Quad.easeIn' });
            await sleep(this, 550);
            hintBubble(this, 'ADRIAN! UNIKAJ KUL, BIJ GO KRZYŻEM I OGNIEM', 2600, 90);
            WikaryAudio.play('boss');
            e.state = 'idle'; e.harmless = false; e.until = this.time.now + 900; e.body.enable = true;
            this.cutscene = false;
        } catch (err) { this.cutscene = false; if (this.adrian) { this.adrian.state = 'idle'; this.adrian.harmless = false; this.adrian.body.enable = true; this.adrian.y = G; } }
    },
    spawnAdrian() {
        if (this.adrian) return this.adrian;
        const A = CFG.adrian, k = 'adrian_idle_1';
        const e = this.enemies.create(this.doorX, this.doorBottom || CFG.GROUND_Y, ART.key(k));
        e.type = 'adrian'; e.hp = e.maxHp = Difficulty.bossHp(A.hp); e.dead = false; e.thread = null; e.harmless = true;
        e.setOrigin(0.5, 1).setScale(A.scale * ART.mul(this, k)).setDepth(7).setAlpha(0).setFlipX(this.L.dir > 0);
        e.baseTint = ART.tint(k); if (e.baseTint) e.setTint(e.baseTint);
        e.body.setAllowGravity(false); e.body.enable = false;
        const pose = () => this.adrianPose(e);       // klatki mają różne szerokości (100/110/140/132): stopy i hitbox pod postacią
        e.on(Phaser.Animations.Events.ANIMATION_START, pose); e.on(Phaser.Animations.Events.ANIMATION_UPDATE, pose);
        e.play('adrian_idle'); pose();
        e.state = 'enter'; e.until = 0; e.attackN = 0; e.enraged = false;
        this.tweens.add({ targets: e, alpha: 1, duration: 400 });
        this.adrian = e; this.boss = e;
        this.createBossBar('ADRIAN', 34);
        return e;
    },
    /** origin w stopach (hurt_1: stopy przesunięte o CFG.adrian.hurtFootDx, lustrzanie przy flipX) + hitbox pod stopami */
    adrianPose(e) {
        if (!e || !e.active) return;
        const hurt = e.texture && e.texture.key === 'adrian_hurt_1' && ART.has('adrian_hurt_1');
        const dx = hurt ? CFG.adrian.hurtFootDx / e.frame.width : 0;
        e.setOrigin(0.5 + (e.flipX ? -dx : dx), 1);
        if (e.body) this.fitBody(e);
    },
    adrianPhase(e) {
        let p = CFG.adrian.phases[0];
        for (const ph of CFG.adrian.phases) if (e.hp / e.maxHp <= ph.from) p = ph;
        return p;
    },
    updateAdrian(e, time) {
        if (e.dead || !e.active) return;
        if (e.frame.width !== e._fw) { e._fw = e.frame.width; this.fitBody(e); }
        const A = CFG.adrian, hero = this.hero, ph = this.adrianPhase(e), dx = hero.x - e.x;
        if (ph.enraged && !e.enraged) { e.enraged = true; e.baseTint = 0xff80c0; e.setTint(e.baseTint); hintBubble(this, 'ADRIAN SIĘ WŚCIEKŁ!', 1600, 90); }
        e.setVelocity(0, 0);
        if (this.cutscene || e.state === 'enter' || e.state === 'tp') return;
        e.setFlipX(dx < 0); this.adrianPose(e);
        const back = () => { e.state = 'idle'; e.until = time + ph.restMs; e.play('adrian_idle'); };
        if (e.state === 'idle' && time > e.until) {
            e.attackN++;
            if (e.attackN % (ph.teleportEvery + 2) === 0 || Math.abs(dx) < A.keepAway) this.adrianTeleport(e);
            else if (e.attackN % 3 === 2) {
                e.state = 'summon'; e.until = time + A.summonMs; e.play('adrian_cast'); e.setTint(CFG.adrian.summonTint);   // lekka zieleń: przywołuje komary
                for (let i = 0; i < ph.swarm; i++) this.spawnMosquitoSwarm(e.x + (i ? 40 : -40), e.y - e.displayHeight - 10 - i * 20, Math.sign(dx) || -1, 3);
                this.swarmsSummoned++;
            } else { e.state = 'cast'; e.until = time + A.castWindupMs; e.play('adrian_cast'); WikaryAudio.sfx('orb'); }
        } else if (e.state === 'cast' && time > e.until) {
            const base = Math.atan2(hero.y - (e.y - e.displayHeight * 0.7), dx);
            for (let i = 0; i < ph.orbs; i++) this.castOrb(e, base + (i - (ph.orbs - 1) / 2) * 0.5);
            back();
        } else if (e.state === 'summon' && time > e.until) { if (e.baseTint) e.setTint(e.baseTint); else e.clearTint(); back(); }
    },
    castOrb(e, ang) {
        const A = CFG.adrian, k = 'proj_adrian_spell_1';
        const o = this.hostile.create(e.x + Math.cos(ang) * 16, e.y - e.displayHeight * 0.7, ART.key(k));
        ART.fit(this, o, k, A.orbScale, 0.5, 0.5); o.play('adrian_spell'); o.setDepth(9);
        o.body.setAllowGravity(false); o.body.setSize(A.orbW / o.scaleX, A.orbH / o.scaleY);
        o.setVelocity(Math.cos(ang) * A.orbSpeed, Math.sin(ang) * A.orbSpeed);
        o.homing = true; o.dieAt = this.time.now + A.orbLifeMs;
        this.orbsCast++;
    },
    adrianTeleport(e) {
        const A = CFG.adrian, cam = this.cameras.main, hero = this.hero;
        e.state = 'tp'; e.body.enable = false; e.harmless = true;
        WikaryAudio.sfx('teleport');
        const puff = (x, y) => { const p = this.add.sprite(x, y, ART.key('fx_brimstone_1')).setDepth(8).play('brimstone'); ART.fit(this, p, 'fx_brimstone_1', 0.5, 0.5, 0.5); p.setTint(0xc080ff); p.once('animationcomplete', () => p.destroy()); };
        puff(e.x, e.y - e.displayHeight / 2);
        this.tweens.add({ targets: e, alpha: 0, duration: A.teleportMs / 2, onComplete: () => {
            const spots = A.spots.map(s => cam.scrollX + s).filter(x => Math.abs(x - e.x) > 40);
            spots.sort((a, b) => Math.abs(b - hero.x) - Math.abs(a - hero.x));
            e.x = spots[0]; this.teleports++;
            puff(e.x, e.y - e.displayHeight / 2);
            this.tweens.add({ targets: e, alpha: 1, duration: A.teleportMs / 2, onComplete: () => {
                if (!e.active || e.dead) return;
                e.body.enable = true; e.harmless = false; e.state = 'idle'; e.until = this.time.now + 500;
            } });
        } });
    },
    adrianHit(e, dmg, byUlt) {
        if (e.dead || e.harmless) return;
        const A = CFG.adrian;
        e.hp -= byUlt ? Math.min(dmg, A.gromDamage) : dmg;
        WikaryAudio.sfx('hit');
        if (e.hp <= 0) { e.hp = 0; this.adrianDefeated(e); return; }
        if (e.state === 'idle') {
            e.anims.stop(); e.setTexture(ART.key('adrian_hurt_1')); this.adrianPose(e);
            this.time.delayedCall(A.hurtMs, () => { if (e.active && !e.dead && e.state === 'idle') e.play('adrian_idle'); });
        }
        e.setTintFill(0xffffff);
        this.time.delayedCall(70, () => { if (e.active && !e.dead) { e.clearTint(); if (e.baseTint) e.setTint(e.baseTint); } });
    },
    adrianDefeated(e) {
        e.dead = true; e.body.enable = false; e.setVelocity(0, 0); e.setAlpha(1);
        this.hostile.clear(true, true);
        this.enemies.getChildren().slice().forEach(o => { if (o !== e && o.active) { o.dead = true; if (o.body) o.body.enable = false; this.tweens.add({ targets: o, alpha: 0, duration: 300, onComplete: () => o.destroy() }); } });
        GS.score += CFG.score.adrian; GS.kills++;
        this.popup(e.x, e.y - e.displayHeight - 4, '+' + CFG.score.adrian);
        e.anims.stop(); e.setTexture(ART.key('adrian_defeated_1')); this.adrianPose(e); e.clearTint();
        const t = ART.tint('adrian_defeated_1'); if (t) e.setTint(t);
        this.ended = true; this.ending = true; this.cutscene = true;
        this.setCrouch(false, 0); if (this.praying) this.cancelPray();
        if (this.repelAura) { this.repelAura.destroy(); this.repelAura = null; }
        this.hero.body.setVelocityX(0);
        this.facing = Math.sign(e.x - this.hero.x) || this.L.dir; this.kamil.setFlipX(this.facing < 0).play('k_idle').setAlpha(1);
        WikaryAudio.stop(0.4); WikaryAudio.sfx('win');
        this.cameras.main.flash(300, 255, 255, 255);
        this.updateBossBar();
        this.runL4Ending(e);
    },

    /* ---------- Czerwony Diabeł ---------- */
    spawnDevil(x, y, anim) {
        const D = CFG.devil, k = 'devil_idle_1';
        const d = this.add.sprite(x, y, ART.key(k)).setOrigin(0.5, 1).setDepth(9).setFlipX(this.hero.x < x);
        d.setScale(D.scale * ART.mul(this, k));
        const t = ART.tint(k); if (t) d.setTint(t);
        d.play(anim || 'devil_idle');
        this.devil = d;
        return d;
    },
    devilSay(text, portrait) {
        const d = this.devil;
        return this.talk.say(portrait || 'devil_closeup_open', 'DIABEŁ', text, {
            onStart: () => d && d.active && d.play('devil_talk'),
            onEnd: () => d && d.active && d.play('devil_idle'),
        });
    },
    brimstone(x, y, scale) {
        const p = this.add.sprite(x, y, ART.key('fx_brimstone_1')).setDepth(9.5).play('brimstone');
        ART.fit(this, p, 'fx_brimstone_1', scale || CFG.devil.brimstoneScale, 0.5, 0.5);
        p.once('animationcomplete', () => p.destroy());
        return p;
    },
    devilFlyAway(dirX, dy) {
        const d = this.devil, D = CFG.devil; if (!d) return;
        this.brimstone(d.x, d.y - d.displayHeight / 2, 1.1);
        const h = d.displayHeight; d.setOrigin(0.5, 0.5); d.y -= h / 2;      // devil_fly: origin w środku tułowia
        d.play('devil_fly'); d.setFlipX(dirX < 0);
        WikaryAudio.sfx('devil');
        this.tweens.add({ targets: d, x: d.x + dirX * (CFG.W + 200), y: d.y + (dy || -140), duration: D.flyMs, ease: 'Quad.easeIn',
            onComplete: () => { d.destroy(); if (this.devil === d) this.devil = null; this.devilGone = true; } });
    },
    redScreen(on) {
        const D = CFG.devil;
        if (!this.red) this.red = this.add.rectangle(0, 0, CFG.W, CFG.H, D.redColor, 1).setOrigin(0).setScrollFactor(0).setDepth(8.5).setAlpha(0);
        this.tweens.killTweensOf(this.red);
        this.tweens.add({ targets: this.red, alpha: on ? D.redAlpha : 0, duration: D.redMs });
    },

    /* ---------- koniec Level 4: diabeł spod ziemi, wyznanie Adriana, auto ---------- */
    async runL4Ending(e) {
        const T = this.talk, G = CFG.GROUND_Y, D = CFG.devil, cam = this.cameras.main; T.skipped = false;
        try {
            await sleep(this, 1000);
            // ekran czerwienieje, ziemia drży, z ziemi powoli wyłania się Czerwony Diabeł
            this.redScreen(true); WikaryAudio.sfx('rumble'); cam.shake(D.riseMs, 0.004);
            const dx = (this.hero.x + e.x) / 2;
            const d = this.spawnDevil(dx, G, 'devil_rise');
            d.setDepth(D.riseDepth); d.y = G + d.displayHeight;
            this.brimstone(dx, G - 10, 0.9);
            this.tweens.add({ targets: d, y: G, duration: D.riseMs, ease: 'Sine.easeOut' });
            await sleep(this, D.riseMs + 100);
            d.setDepth(9).play('devil_idle');
            WikaryAudio.sfx('devil');
            await this.devilSay('Brawo, księżulku. Pokonałeś mojego czarnoksiężnika... Ale to dopiero początek!', 'devil_closeup_angry');
            await this.kamilSay('Proszę pana, ja tu jestem służbowo. Mam w kieszeni święconą wodę i nie zawaham się jej użyć!');
            await this.adrianSay('Szefie, mówiłeś, że to będzie łatwa robota...', 'adrian_closeup_ashamed');
            await this.devilSay('Milcz, Adrianie! Zemszczę się, wikary! Jeszcze o mnie usłyszysz!', 'devil_closeup_angry');
            this.devilFlyAway(1, -200);
            this.redScreen(false);
            await sleep(this, 1200);
            // Adrian się przyznaje i oddaje auto
            e.setTexture(ART.key('adrian_idle_1')); e.play('adrian_idle'); this.adrianPose(e); e.clearTint(); if (e.baseTint) e.setTint(e.baseTint);
            await this.adrianSay('Diabeł wie, gdzie mieszka moja rodzina... Sam mu powiedziałem, przy herbatce. Teraz tego żałuję.', 'adrian_closeup_ashamed');
            await this.kamilSay('To trzeba ich ratować! I to szybko!');
            await this.adrianSay('Weź moje auto. Tylko uważaj na sprzęgło, trochę bierze wysoko.', 'adrian_closeup_ashamed');
            await this.driveAway();
        } catch (err) { /* dalej do podsumowania */ }
        this.showSummary();
    },
    async driveAway() {
        const C = CFG.car, G = CFG.GROUND_Y, cam = this.cameras.main, k = this.kamil;
        // auto Adriana podjeżdża z prawej (puste), przodem w lewo
        const car = this.add.sprite(cam.scrollX + CFG.W + 120, G + 2, ART.key('car_empty_1')).setOrigin(0.5, 1).setScale(C.scale).setDepth(9).setFlipX(true).play('car_empty');
        this.car = car;
        const park = Phaser.Math.Clamp(k.x - 70, cam.scrollX + 80, cam.scrollX + CFG.W - 80);
        WikaryAudio.sfx('engine');
        this.tweens.add({ targets: car, x: park, duration: 900, ease: 'Quad.easeOut' });
        await sleep(this, 1000);
        // Kamil wsiada
        this.kamilFree = true;
        this.facing = Math.sign(car.x - k.x) || -1; k.setFlipX(this.facing < 0).setAlpha(1).play('k_run');
        this.tweens.add({ targets: k, x: car.x, duration: C.enterMs });
        await sleep(this, C.enterMs);
        k.setAlpha(0); this.hero.body.enable = false; WikaryAudio.sfx('door');
        car.play('car_drive');
        await sleep(this, 300);
        // i rusza w lewo
        WikaryAudio.sfx('engine');
        this.tweens.add({ targets: car, x: cam.scrollX - 160, duration: C.driveMs, ease: 'Quad.easeIn', onComplete: () => { this.carGone = true; } });
        await sleep(this, C.driveMs + 200);
    },
});
