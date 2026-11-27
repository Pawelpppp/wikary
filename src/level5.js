'use strict';
/* =====================================================================
   Level 5 „Bernard” (Solniczki): jazda autem (zaślepka ~5 s), znak Solniczki z końmi,
   filmowe intro (Benek na czerwonym motorze, wywrotka, przechodzień, karetka z opętanymi
   sanitariuszami, diabeł wchodzi w Benka), walka z Benkiem matematykiem (całki, pierwiastki,
   co jakiś czas duży trójkąt = zadanie matematyczne na czas), zakończenie i „Ciąg dalszy nastąpi”.
   Dopisywane do LevelScene (jak level2.js–level4.js). Opis: docs/level5_bernard.md.
   ===================================================================== */
const L5_SKIP = 'l5-skip';
const SUP = { 2: '\u00b2', 3: '\u00b3', 4: '\u2074', 5: '\u2075' };

Object.assign(LevelScene.prototype, {

    createLevel5() {
        if (this.L.boss !== 'benek') return;
        const C = CFG.level5, G = CFG.GROUND_Y, L = this.L, ax = L.length - CFG.W;
        const S = this.l5 = { ax, props: [], intro: true, phase: 'drive', follow: null, shots: 0, triangles: 0, quizzes: 0, right: 0, wrong: 0 };
        // tło areny: konie (horses_1..2) i zielony znak „SOLNICZKI” (sign_solniczki; brak = prosty znak z tekstu)
        C.horsesX.forEach((x, i) => {
            const h = this.add.sprite(ax + x, G - 6, ART.key('horses_1')).setDepth(2.3).play({ key: 'horses', startFrame: i });
            ART.fit(this, h, 'horses_1', 0.6, 0.5, 1); if (i) h.setFlipX(true);
        });
        if (ART.has('sign_solniczki')) ART.image(this, ax + C.signX, G, 'sign_solniczki', 1, 0.5, 1).setDepth(2.45);
        else {
            const x = ax + C.signX, post = this.add.rectangle(x, G, 4, 44, 0x8a8a90).setOrigin(0.5, 1);
            const board = this.add.rectangle(x, G - 44, 92, 24, 0x1f7a3a).setStrokeStyle(2, 0xffffff);
            this.add.container(0, 0, [post, board, txt(this, x, G - 43, 'SOLNICZKI', 8, '#ffffff', { strokeW: 0 })]).setDepth(2.45);
        }
        // Kamil w aucie Adriana
        const car = this.car = this.add.sprite(this.hero.x, G + 2, ART.key('car_1')).setOrigin(0.5, 1).setScale(CFG.car.scale).setDepth(9).play('car_drive');
        this.kamilFree = true; this.kamil.setAlpha(0); this.hero.body.enable = false; this.cutscene = true;
        this.input.keyboard.on('keydown-SPACE', onKey(() => { if (this.l5 && this.l5.intro) this.skipL5Intro(); }));
        this.input.keyboard.on('keydown', onKey((e) => { if (this.quiz) this.quizKeyEvent(e); }));   // onKey: Phaser potrafi podać to samo zdarzenie 2×
        if (this.skipTo === 'boss') { this.l5StartFight(); return; }
        S.follow = car;
        hintBubble(this, IS_TOUCH ? 'DOTKNIJ = POMIŃ INTRO' : 'SPACJA = POMIŃ INTRO', 2400, 290);
        this.runL5Intro();
    },
    updateLevel5(time) {
        const S = this.l5; if (!S) return;
        if (S.follow && S.follow.active) this.cameras.main.scrollX = Phaser.Math.Clamp(S.follow.x - CFG.level5.carX, 0, S.ax);
        const B = CFG.level5.boss;
        this.hostile.getChildren().forEach(o => {
            if (o.kind === 'integral' && o.body) o.body.velocity.y = o.vy0 + Math.cos((time - o.t0) / 1000 * Math.PI * 2 * B.integral.wobbleHz) * B.integral.wobble;
        });
        if (this.quiz) this.updateQuiz(time);
    },
    l5Prop(o) { this.l5.props.push(o); return o; },
    l5Sprite(x, k, anim, scale, depth) {
        const s = this.add.sprite(x, CFG.GROUND_Y + 2, ART.key(k)).setDepth(depth || 8);
        ART.fit(this, s, k, scale || CFG.level5.scale, 0.5, 1);
        if (anim) s.play(anim);
        return this.l5Prop(s);
    },
    /** pełnoekranowe ujęcie (zbliżenie): obraz docelowy albo portret na ciemnym tle */
    l5Shot(key, fullKey) {
        const W = CFG.W, H = CFG.H, D = 4600, objs = [];
        const add = (o) => { o.setScrollFactor(0).setDepth(D); objs.push(this.l5Prop(o)); return o; };
        if (fullKey && ART.has(fullKey)) add(this.add.image(W / 2, H / 2, fullKey));
        else {
            add(this.add.rectangle(0, 0, W, H, 0x0c0814, 0.94).setOrigin(0));
            const p = add(this.add.image(W / 2, H / 2, ART.key(key)).setScale(1.1));
            const t = ART.tint(key); if (t) p.setTint(t);
            objs.portrait = p;
        }
        add(this.add.rectangle(0, 0, W, 26, 0x000000, 1).setOrigin(0));       // kinowe pasy
        add(this.add.rectangle(0, H - 26, W, 26, 0x000000, 1).setOrigin(0));
        return objs;
    },
    benekSay(text, portrait) { return this.talk.say(portrait || 'benek_closeup_normal', 'BENEK', text); },
    passerbySay(text) { return this.talk.say('passerby_closeup', 'PRZECHODZIEŃ', text); },

    async runL5Intro() {
        const C = CFG.level5, G = CFG.GROUND_Y, S = this.l5, T = this.talk, car = this.car, ax = S.ax, cam = this.cameras.main, k = this.kamil;
        T.skipped = false;
        const go = async (p) => { await p; if (!S.intro) throw L5_SKIP; };
        const wait = (ms) => go(sleep(this, ms));
        try {
            // 1. jazda (zaślepka): auto jedzie w prawo, w stronę kościoła; na końcu znak Solniczki i konie
            WikaryAudio.sfx('engine');
            this.tweens.add({ targets: car, x: ax + C.carX, duration: C.driveMs, ease: 'Sine.easeOut' });
            await wait(C.driveMs * 0.75);
            hintBubble(this, 'SOLNICZKI', 1800, 90);
            await wait(C.driveMs * 0.25 + 300);
            S.follow = null; cam.scrollX = ax; S.phase = 'intro';
            // 2. ujęcie z przodu auta: twarz Kamila i ręce na kierownicy (car_front_kamil; zamiennik: portret)
            const shot = this.l5Shot('wikary_kamil_closeup_open', 'car_front_kamil');
            WikaryAudio.sfx('engine');
            await wait(C.frontShotMs);
            shot.forEach(o => o.destroy());
            // 3. Benek na czerwonym motorze wyprzedza i się wywraca
            const moto = this.l5Sprite(cam.scrollX - 120, 'moto_red_1', 'moto_red', C.motoScale, 9.2);
            WikaryAudio.sfx('engine');
            this.tweens.add({ targets: moto, x: ax + C.benekX, duration: 1000 });
            await wait(1000);
            moto.play('moto_crash'); WikaryAudio.sfx('hit'); cam.shake(300, 0.01);
            this.tweens.add({ targets: moto, x: ax + C.motoX, duration: 700, ease: 'Quad.easeOut' });
            const boom = this.l5Prop(goldText(this, ax + C.benekX + 40, G - 90, 'ŁUUUP!', 16).setDepth(30));
            this.tweens.add({ targets: boom, y: boom.y - 20, duration: 900, onComplete: () => boom.setVisible(false) });
            await wait(800);
            const ben = this.l5Ben = this.l5Sprite(ax + C.benekX, 'benek_defeated_1', null, C.scale, 8.5);
            // 4. Kamil wysiada, z prawej podbiega przechodzień
            car.anims.stop(); car.setTexture(ART.key('car_empty_1')); WikaryAudio.sfx('door');
            k.setAlpha(1).setFlipX(false).setPosition(car.x, G).play('k_run');
            this.tweens.add({ targets: k, x: ax + C.kamilX, duration: 900 });
            const pb = this.l5Pb = this.l5Sprite(cam.scrollX + CFG.W + 40, 'passerby_idle_1', 'passerby_idle', C.scale, 8.6).setFlipX(true);
            this.tweens.add({ targets: pb, x: ax + C.passerbyX, duration: 1100 });
            await wait(1150);
            k.play('k_idle');
            // 5–8. rozmowa
            await go(this.benekSay('Czy rana jest duża? Coś poważnego?', 'benek_closeup_hurt'));
            k.setFlipX(false); pb.setFlipX(true);                        // spoglądają na siebie...
            await wait(500);
            await go(T.say('wikary_kamil_closeup_open', 'KAMIL I PRZECHODZIEŃ', 'Nic takiego!'));
            await go(this.kamilSay('Co się stało?'));
            await go(this.passerbySay('Pożyczyłem mu motor na pierwszą przejażdżkę... i kazałem dać więcej gazu.'));
            await go(this.kamilSay('Nic się nie stało, ale lepiej wezwać karetkę.'));
            pb.anims.stop(); pb.setTexture(ART.key('passerby_phone_1'));
            await go(this.passerbySay('Halo, pogotowie? Mamy tu motocyklistę z... draśnięciem na łydce.'));
            pb.play('passerby_idle');
            // 9. karetka, dwaj sanitariusze (opętani od początku: czerwony błysk w oczach)
            const amb = this.ambulance = this.l5Sprite(cam.scrollX + CFG.W + 160, 'ambulance_1', 'ambulance', C.ambulanceScale, 6.5).setFlipX(true);
            WikaryAudio.sfx('engine');
            this.tweens.add({ targets: amb, x: ax + C.ambulanceX, duration: 1500, ease: 'Quad.easeOut' });
            await wait(1600);
            amb.anims.stop(); amb.setTexture(ART.key('ambulance_1')); WikaryAudio.sfx('door');
            const medics = ['paramedic_a_', 'paramedic_b_'].map((p, i) => {
                const m = this.l5Sprite(amb.x, p + '1', null, C.scale, 8.4).setFlipX(true).setAlpha(0);
                m.pre = p;
                this.tweens.add({ targets: m, x: ax + C.medicsX[i], alpha: 1, duration: 700, delay: i * 250 });
                return m;
            });
            this.l5Medics = medics;
            await wait(1000);
            const glint = (on) => medics.forEach(m => m.active && m.setTexture(ART.key(m.pre + (on ? 2 : 1))));
            for (let i = 0; i < 2; i++) { glint(true); await wait(220); glint(false); await wait(220); }
            glint(true);
            await go(this.talk.say(null, 'SANITARIUSZ', 'Spokojnie... zajmiemy się nim.'));
            // 10. diabeł wylatuje z sanitariuszy jak dym...
            this.redScreen(true); WikaryAudio.sfx('devil');
            const sm = this.l5Sprite((medics[0].x + medics[1].x) / 2, 'devil_smoke_1', 'devil_smoke', C.smokeScale, 9.5).setAlpha(0);
            this.tweens.add({ targets: sm, alpha: 1, y: G - 20, duration: 500 });
            glint(false);
            await go(this.talk.say('devil_closeup_angry', 'DIABEŁ', 'Mówiłem, że o mnie usłyszysz, księżulku!'));
            // ...i wchodzi w Benka
            this.tweens.add({ targets: sm, x: ben.x, y: G - 4, scale: sm.scale * 0.4, alpha: 0.2, duration: 900, ease: 'Quad.easeIn' });
            await wait(950);
            sm.setVisible(false);
            // 11. zbliżenie na Benka: czerwone oczy, rogi, symbole ∫ √ △ π
            const zoom = this.l5Shot('benek_closeup_normal');
            const p = zoom.portrait;
            if (p) this.tweens.add({ targets: p, scale: 1.45, duration: 700, ease: 'Quad.easeIn' });
            await wait(800);
            cam.flash(250, 255, 60, 60); cam.shake(400, 0.006); WikaryAudio.sfx('rumble');
            if (p) { p.setTexture(ART.key('benek_closeup_possessed')); p.clearTint(); const t = ART.tint('benek_closeup_possessed'); if (t) p.setTint(t); }
            ['\u222b', '\u221a', '\u25b3', '\u03c0'].forEach((g, i) => {
                const a = i * Math.PI / 2 + 0.4, gx = CFG.W / 2 + Math.cos(a) * 150, gy = CFG.H / 2 + Math.sin(a) * 105;
                const s = this.l5Prop(txt(this, gx, gy, g, 16, '#ff5060').setScrollFactor(0).setDepth(4601));
                this.tweens.add({ targets: s, y: gy - 10, duration: 500 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            });
            await wait(C.closeupMs);
            zoom.forEach(o => o.destroy());
            this.l5Props(true);
            ben.setTexture(ART.key('benek_possessed_1')); ART.fit(this, ben, 'benek_possessed_1', C.scale, 0.5, 1); ben.setFlipX(true).play('benek_possess');
            await wait(1100);
            await go(this.benekSay('Policzymy się, księże... CAŁKOWICIE!', 'benek_closeup_possessed'));
            // przechodzień ucieka, oszołomieni sanitariusze wracają do karetki
            this.tweens.add({ targets: pb, x: cam.scrollX + CFG.W + 60, duration: 900 });
            await go(this.talk.say(null, 'SANITARIUSZ', 'Co my tu właściwie robimy...?'));
            this.tweens.add({ targets: medics, x: amb.x, alpha: 0, duration: 600 });
            await wait(650);
            this.l5StartFight();
        } catch (err) {
            if (err !== L5_SKIP && this.l5 && this.l5.intro) this.l5StartFight();
        }
    },
    /** symbole z zbliżenia: zatrzymaj (tween yoyo) i usuń */
    l5Props(onlyText) {
        const S = this.l5;
        S.props = S.props.filter(o => {
            if (!o || !o.active) return false;
            if (onlyText && o.type !== 'Text') return true;
            this.tweens.killTweensOf(o); o.destroy(); return false;
        });
    },
    skipL5Intro() {
        const S = this.l5; if (!S || !S.intro) return;
        this.l5StartFight();
    },

    /* ---------- walka ---------- */
    l5StartFight() {
        const S = this.l5, C = CFG.level5, G = CFG.GROUND_Y, ax = S.ax, T = this.talk, cam = this.cameras.main;
        if (S.phase === 'fight') return;
        S.intro = false; S.phase = 'fight'; S.follow = null;
        if (T.dialog) { T.skipped = true; T.close(); }
        T.skipped = false;
        if (this.red) { this.tweens.killTweensOf(this.red); this.red.setAlpha(0); }
        this.l5Props(false); this.l5Ben = this.l5Pb = this.l5Medics = null;
        cam.resetFX(); cam.scrollX = ax; this.arena = true; this.arenaCamX = ax;
        // auto (puste) i karetka parkują na swoich miejscach
        this.tweens.killTweensOf(this.car);
        this.car.anims.stop(); this.car.setTexture(ART.key('car_empty_1')).setPosition(ax + C.carX, G + 2);
        const amb = this.ambulance = this.l5Sprite(ax + C.ambulanceX, 'ambulance_1', null, C.ambulanceScale, 6.5).setFlipX(true);
        const moto = this.add.image(ax + C.motoX, G + 2, ART.key('moto_crash_3')).setDepth(6.6);   // leżący motor (tło walki)
        ART.fit(this, moto, 'moto_crash_3', C.motoScale, 0.5, 1);
        S.props = [];                                                  // karetka i motor zostają do końca walki
        // Kamil wysiada i walczy
        const k = this.kamil, hb = this.hero.body;
        this.tweens.killTweensOf(k);
        this.kamilFree = false; k.setAlpha(1);
        hb.enable = true; hb.reset(ax + C.kamilX - 40, G - CFG.hero.bodyH / 2 - 1); hb.setVelocity(0, 0);
        this.prevHeroX = this.hero.x; this.facing = 1; this.jumps = 0; this.flipping = false; this.jumpAt = -99999;
        this.spawnBenek(ax + C.benekX + 70);
        this.cutscene = false;
        WikaryAudio.play('boss');
        hintBubble(this, IS_TOUCH ? 'BENEK! TRÓJKĄT = ZADANIE' : 'BENEK! UNIKAJ CAŁEK I PIERWIASTKÓW. TRÓJKĄT = ZADANIE!', 2800, 90);
        return amb;
    },
    spawnBenek(x) {
        const B = CFG.level5.boss, k = 'benek_possessed_4', now = this.time.now;
        const e = this.enemies.create(x, CFG.GROUND_Y, ART.key(k));
        e.type = 'benek'; e.hp = e.maxHp = Difficulty.bossHp(B.hp); e.dead = false; e.harmless = false; e.thread = null;
        e.setOrigin(0.5, 1).setScale(CFG.level5.scale * ART.mul(this, k)).setDepth(7).setFlipX(true);
        e.baseTint = ART.tint(k); if (e.baseTint) e.setTint(e.baseTint);
        e.body.setAllowGravity(false);
        e.state = 'idle'; e.until = now + 1200; e.attackN = 0; e.shotN = 0; e.enraged = false;
        e.nextTri = now + B.phases[0].triangleEveryMs * 0.5;
        e.play('benek_fight'); this.fitBody(e);
        this.benek = e; this.boss = e;
        this.createBossBar('BENEK', 34);
        return e;
    },
    benekPhase(e) {
        let p = CFG.level5.boss.phases[0];
        for (const ph of CFG.level5.boss.phases) if (e.hp / e.maxHp <= ph.from) p = ph;
        return p;
    },
    updateBenek(e, time) {
        if (e.dead || !e.active) return;
        const B = CFG.level5.boss, hero = this.hero, ph = this.benekPhase(e), dx = hero.x - e.x, cam = this.cameras.main;
        if (e.frame.width !== e._fw) { e._fw = e.frame.width; this.fitBody(e); }
        if (ph.enraged && !e.enraged) { e.enraged = true; e.baseTint = 0xffa0a0; e.setTint(e.baseTint); hintBubble(this, 'BENEK SIĘ WŚCIEKŁ!', 1600, 90); }
        if (this.cutscene || this.quiz) { e.setVelocity(0, 0); return; }
        const back = () => { e.state = 'idle'; e.until = time + ph.restMs; e.setVelocity(0, 0); e.play('benek_fight', true); };
        if (e.state !== 'walk') { e.setVelocity(0, 0); e.setFlipX(dx < 0); }
        if (e.warnSpr) { e.warnSpr.x = e.x; e.warnSpr.y = e.y - e.displayHeight - 22; }
        if (e.state === 'idle' && time > e.until) {
            if (time > e.nextTri) {
                e.state = 'warn'; e.until = time + B.triangle.warnMs; e.play('benek_cast');
                const w = this.add.sprite(e.x, e.y - e.displayHeight - 22, ART.key('proj_triangle_2')).setDepth(9).play('triangle_warn');
                ART.fit(this, w, 'proj_triangle_2', B.triangle.scale, 0.5, 0.5);
                e.warnSpr = w; WikaryAudio.sfx('orb');
            } else {
                e.attackN++;
                if (Math.abs(dx) < B.keepAway || e.attackN % 4 === 0) {
                    const spots = B.spots.map(s => cam.scrollX + s).filter(x => Math.abs(x - e.x) > 30);
                    spots.sort((a, b) => Math.abs(b - hero.x) - Math.abs(a - hero.x));
                    e.state = 'walk'; e.target = spots[0];
                } else { e.state = 'cast'; e.until = time + B.castWindupMs; e.play('benek_cast'); }
            }
        } else if (e.state === 'walk') {
            const d = e.target - e.x;
            if (Math.abs(d) < 4) back();
            else { e.setFlipX(d < 0); e.setVelocity(Math.sign(d) * B.walkSpeed, 0); }
        } else if (e.state === 'cast' && time > e.until) {
            for (let i = 0; i < ph.shots; i++) this.benekShoot(e, (e.shotN++ % 2) ? 'sqrt' : 'integral', i);
            back();
        } else if (e.state === 'warn' && time > e.until) {
            if (e.warnSpr) { e.warnSpr.destroy(); e.warnSpr = null; }
            this.benekTriangle(e);
            e.nextTri = time + ph.triangleEveryMs;
            back();
        }
    },
    benekShoot(e, kind, i) {
        const P = CFG.level5.boss[kind], k = kind === 'sqrt' ? 'proj_sqrt' : 'proj_integral', now = this.time.now;
        const x0 = e.x + (e.flipX ? -22 : 22), y0 = e.y - e.displayHeight * 0.6;
        const o = this.hostile.create(x0, y0, ART.key(k));
        ART.fit(this, o, k, P.scale, 0.5, 0.5); o.setDepth(9);
        o.body.setAllowGravity(false); o.body.setSize(P.w / o.scaleX, P.h / o.scaleY);
        const ang = Math.atan2(this.hero.y - y0, this.hero.x - x0) + (i ? (i % 2 ? 0.28 : -0.28) : 0);
        o.setVelocity(Math.cos(ang) * P.speed, Math.sin(ang) * P.speed);
        o.kind = kind; o.t0 = now; o.vy0 = Math.sin(ang) * P.speed; o.dieAt = now + P.lifeMs;
        this.l5.shots++; WikaryAudio.sfx('orb');
        return o;
    },
    benekTriangle(e) {
        const T = CFG.level5.boss.triangle, k = 'proj_triangle_1', now = this.time.now, dir = Math.sign(this.hero.x - e.x) || -1;
        const o = this.hostile.create(e.x + dir * 30, T.y, ART.key(k));
        ART.fit(this, o, k, T.scale, 0.5, 0.5); o.setDepth(9);
        o.body.setAllowGravity(false); o.body.setSize(T.w / o.scaleX, T.h / o.scaleY);
        o.setVelocityX(dir * T.speed);
        o.kind = 'triangle'; o.dieAt = now + T.lifeMs; o.onHit = (t) => this.triangleHit(t);
        this.l5.triangles++; WikaryAudio.sfx('teleport');
        return o;
    },
    triangleHit(t) {
        if (this.quiz || this.dead || this.ended || this.cutscene || this.respawning || this.time.now < this.invulnUntil) return;
        t.destroy();
        this.openQuiz();
    },
    benekHit(e, dmg, byUlt) {
        if (e.dead || e.harmless) return;
        const B = CFG.level5.boss;
        e.hp -= byUlt ? Math.min(dmg, B.gromDamage) : dmg;
        WikaryAudio.sfx('hit');
        if (e.hp <= 0) { e.hp = 0; this.benekDefeated(e); return; }
        if (e.state === 'idle') {
            e.anims.stop(); e.setTexture(ART.key('benek_hurt_1'));
            this.time.delayedCall(B.hurtMs, () => { if (e.active && !e.dead && e.state === 'idle') e.play('benek_fight'); });
        }
        e.setTintFill(0xffffff);
        this.time.delayedCall(70, () => { if (e.active && !e.dead) { e.clearTint(); if (e.baseTint) e.setTint(e.baseTint); } });
    },
    benekDefeated(e) {
        e.dead = true; e.body.enable = false; e.setVelocity(0, 0); e.setAlpha(1);
        if (e.warnSpr) { e.warnSpr.destroy(); e.warnSpr = null; }
        this.hostile.clear(true, true);
        GS.score += CFG.score.benek; GS.kills++;
        this.popup(e.x, e.y - e.displayHeight - 4, '+' + CFG.score.benek);
        e.anims.stop(); e.clearTint(); e.setTexture(ART.key('benek_hurt_1'));
        this.ended = true; this.ending = true; this.cutscene = true;
        this.setCrouch(false, 0); if (this.praying) this.cancelPray();
        this.hero.body.setVelocityX(0);
        this.facing = Math.sign(e.x - this.hero.x) || 1; this.kamil.setFlipX(this.facing < 0).play('k_idle').setAlpha(1);
        WikaryAudio.stop(0.4); WikaryAudio.sfx('win');
        this.cameras.main.flash(300, 255, 255, 255);
        this.updateBossBar();
        this.runL5Ending(e);
    },
    async runL5Ending(e) {
        const C = CFG.level5, G = CFG.GROUND_Y, S = this.l5, T = this.talk, k = this.kamil, car = this.car, amb = this.ambulance, cam = this.cameras.main;
        T.skipped = false;
        try {
            await sleep(this, 900);
            // diabeł wychodzi z Benka (dym) i ucieka do karetki
            this.redScreen(true); WikaryAudio.sfx('devil');
            const sm = this.add.sprite(e.x, G - 6, ART.key('devil_smoke_1')).setDepth(9.5).play('devil_smoke').setAlpha(0);
            ART.fit(this, sm, 'devil_smoke_1', C.smokeScale, 0.5, 1);
            this.tweens.add({ targets: sm, alpha: 1, y: G - 26, duration: 500 });
            e.setTexture(ART.key('benek_defeated_1')); const dt = ART.tint('benek_defeated_1'); if (dt) e.setTint(dt);
            await this.talk.say('devil_closeup_angry', 'DIABEŁ', 'Ech, ta matematyka... Jeszcze się policzymy, księżulku!');
            this.tweens.add({ targets: sm, x: amb.x, y: G - 30, scale: sm.scale * 0.5, alpha: 0.2, duration: 1000, ease: 'Quad.easeIn', onComplete: () => sm.destroy() });
            await sleep(this, 1050);
            this.redScreen(false);
            // karetka z diabłem odjeżdża
            amb.setFlipX(false).play('ambulance'); WikaryAudio.sfx('engine');
            this.tweens.add({ targets: amb, x: cam.scrollX + CFG.W + 200, duration: 1600, ease: 'Quad.easeIn', onComplete: () => { S.ambulanceGone = true; amb.destroy(); } });
            await sleep(this, 1700);
            // rozmowa z Benkiem
            this.kamilFree = true; k.play('k_run');
            const to = e.x - 70; k.setFlipX(to < k.x);
            this.tweens.add({ targets: k, x: to, duration: Math.min(1200, Math.abs(to - k.x) * 6 + 100) });
            await sleep(this, Math.min(1200, Math.abs(to - k.x) * 6 + 100) + 50);
            k.setFlipX(false).play('k_idle');
            await this.benekSay('Co się stało...? Czemu wszystko mi się w głowie liczy?', 'benek_closeup_hurt');
            await this.kamilSay('Mam nadzieję, że poczujesz się lepiej. Noga zagoi się do wesela!');
            await this.benekSay('Dzięki, księże... Następnym razem dam mniej gazu.', 'benek_closeup_normal');
            // krótka jazda dalej, w stronę kościoła
            k.play('k_run').setFlipX(car.x < k.x);
            const ms = Math.min(1400, Math.abs(car.x - k.x) * 6 + 100);
            this.tweens.add({ targets: k, x: car.x, duration: ms });
            await sleep(this, ms);
            k.setAlpha(0); this.hero.body.enable = false; WikaryAudio.sfx('door');
            car.play('car_drive'); await sleep(this, 300);
            WikaryAudio.sfx('engine');
            this.tweens.add({ targets: car, x: cam.scrollX + CFG.W + 260, duration: C.driveOutMs, ease: 'Quad.easeIn', onComplete: () => { this.carGone = true; } });
            await sleep(this, C.driveOutMs + 200);
        } catch (err) { /* dalej do podsumowania */ }
        this.showSummary();
    },

    /* ---------- zadanie matematyczne (trafienie trójkątem) ---------- */
    quizSettings() {
        const Q = CFG.mathQuiz, d = Q.byDifficulty[GS.difficulty] || {};
        return { timeMs: d.timeMs || Q.timeMs, ops: d.ops || Q.ops, ranges: Object.assign({}, Q.ranges, d.ranges || {}) };
    },
    makeProblem(ops, R) {
        const rnd = (r) => Phaser.Math.Between(r[0], r[1]), op = Phaser.Utils.Array.GetRandom(ops);
        if (op === 'add') { const a = rnd(R.add), b = rnd(R.add); return { op, text: a + ' + ' + b, answer: a + b }; }
        if (op === 'sub') { const a = rnd(R.sub), b = Phaser.Math.Between(Math.min(R.sub[0] >> 1, a), a); return { op, text: a + ' \u2212 ' + b, answer: a - b }; }
        if (op === 'mul') { const a = rnd(R.mul), b = rnd(R.mul); return { op, text: a + ' \u00d7 ' + b, answer: a * b }; }
        if (op === 'div') { const b = rnd(R.div), q = rnd(R.div); return { op, text: (b * q) + ' : ' + b, answer: q }; }
        if (op === 'sqrt') { const n = rnd(R.sqrt); return { op, text: '\u221a' + (n * n), answer: n }; }
        if (op === 'cbrt') { const n = rnd(R.cbrt); return { op, text: '\u221b' + (n * n * n), answer: n }; }
        const b = rnd(R.pow), x = b <= 3 ? Phaser.Math.Between(2, 5) : b <= 5 ? Phaser.Math.Between(2, 3) : 2;
        return { op: 'pow', text: b + SUP[x], answer: Math.pow(b, x) };
    },
    openQuiz(problem) {
        if (this.quiz) return;
        const Q = CFG.mathQuiz, st = this.quizSettings(), p = problem || this.makeProblem(st.ops, st.ranges), now = this.time.now;
        const W = CFG.W, H = CFG.H, D = 4950, objs = [], touch = IS_TOUCH, px = touch ? 186 : W / 2;
        this.setCrouch(false, 0); if (this.praying) this.cancelPray();
        this.resetHeldInput();
        this.physics.pause(); this.cutscene = true; this.l5.quizzes++;
        const add = (o) => { o.setScrollFactor(0).setDepth(D); objs.push(o); return o; };
        add(this.add.rectangle(0, 0, W, H, 0x000000, 0.55).setOrigin(0).setInteractive());      // blokuje przyciski pod spodem
        add(this.add.rectangle(W / 2, 170, touch ? 440 : 340, 224, 0x140c1c, 0.95).setStrokeStyle(2, 0xd8a640));
        add(goldText(this, px, 84, 'ZADANIE!', 16));
        add(txt(this, px, 128, p.text + ' = ?', 16, '#ffffff'));
        add(this.add.rectangle(px, 166, 130, 28, 0x000000, 0.6).setStrokeStyle(1, 0xd8a640));
        const at = add(txt(this, px, 167, '', 16, '#ffe070'));
        add(this.add.rectangle(px - 80, 200, 160, 8, 0x221420).setOrigin(0, 0.5).setStrokeStyle(1, 0xd8a640));
        const bar = add(this.add.rectangle(px - 79, 200, 158, 6, 0x60d060).setOrigin(0, 0.5));
        const secs = add(txt(this, px, 218, '', 8, '#d8c8a0'));
        const hint = add(txt(this, px, 246, touch ? 'WPISZ WYNIK I DOTKNIJ OK' : 'CYFRY + ENTER   BACKSPACE = POPRAW', 8, '#c8b890'));
        const q = this.quiz = { p, input: '', t0: now, until: now + st.timeMs, timeMs: st.timeMs, objs, at, bar, secs, hint, done: false, keys: [] };
        if (touch) {
            const K = Q.keypad, x0 = 336, y0 = 74;
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '\u232b', '0', 'OK'].forEach((lab, i) => {
                const x = x0 + (i % 3) * (K.key + K.gap) + K.key / 2, y = y0 + Math.floor(i / 3) * (K.key + K.gap) + K.key / 2;
                const r = add(this.add.rectangle(x, y, K.key, K.key, lab === 'OK' ? 0x2a5a20 : 0x2a1410, 0.95).setStrokeStyle(2, 0xd8a640).setInteractive());
                add(txt(this, x, y + 1, lab, lab.length > 1 ? 8 : 16, '#ffe8a0'));
                r.on('pointerdown', (ptr, lx, ly, ev) => { if (ev) ev.stopPropagation(); r.setFillStyle(0xd8a640, 0.6); this.quizKey(lab); });
                const rel = () => r.setFillStyle(lab === 'OK' ? 0x2a5a20 : 0x2a1410, 0.95);
                r.on('pointerup', rel); r.on('pointerout', rel);
                q.keys.push({ label: lab, x, y });
            });
        }
        WikaryAudio.sfx('select');
        this.updateQuiz(now);
    },
    quizKeyEvent(e) {
        if (!this.quiz || e.repeat) return;
        if (/^[0-9]$/.test(e.key)) this.quizKey(e.key);
        else if (e.key === 'Backspace') this.quizKey('\u232b');
        else if (e.key === 'Enter') this.quizKey('OK');
    },
    quizKey(k) {
        const q = this.quiz; if (!q || q.done) return;
        if (k === 'OK') { if (q.input !== '') this.finishQuiz(+q.input === q.p.answer, false); return; }
        if (k === '\u232b') q.input = q.input.slice(0, -1);
        else if (q.input.length < CFG.mathQuiz.maxDigits) q.input += k;
        q.at.setText(q.input);
        WikaryAudio.sfx('click');
    },
    updateQuiz(time) {
        const q = this.quiz; if (!q || q.done) return;
        const left = Math.max(0, q.until - time);
        q.bar.width = Math.round(158 * left / q.timeMs);
        q.bar.fillColor = left < q.timeMs * 0.3 ? 0xe04030 : 0x60d060;
        q.secs.setText(Math.ceil(left / 1000) + ' S');
        if (left <= 0) this.finishQuiz(false, true);
    },
    finishQuiz(ok, timeout) {
        const q = this.quiz, Q = CFG.mathQuiz, S = this.l5; if (!q || q.done) return;
        q.done = true; q.ok = ok;
        if (ok) { S.right++; WikaryAudio.sfx('kill'); q.hint.setText('DOBRZE! TRÓJKĄT PĘKA').setColor('#80ff80'); }
        else { S.wrong++; WikaryAudio.sfx('hurt'); q.hint.setText((timeout ? 'KONIEC CZASU! ' : 'ŹLE! ') + 'WYNIK: ' + q.p.answer).setColor('#ff8070'); }
        this.time.delayedCall(Q.resultMs, () => this.closeQuiz(ok));
    },
    closeQuiz(ok) {
        const q = this.quiz; if (!q) return;
        q.objs.forEach(o => o.destroy());
        this.quiz = null;
        if (this.physics.world.isPaused) this.physics.resume();
        this.cutscene = false;
        const h = this.hero;
        if (ok) {
            GS.score += CFG.mathQuiz.rightBonus; this.popup(h.x, h.y - 40, '+' + CFG.mathQuiz.rightBonus);
            this.brimstone(h.x + 20 * (this.facing || 1), h.y - 10, 0.6);
            this.invulnUntil = this.time.now + CFG.mathQuiz.invulnAfterMs;
        } else {
            this.invulnUntil = 0;
            this.hurt(this.benek && this.benek.active ? this.benek.x : h.x + 1);
        }
    },
});
