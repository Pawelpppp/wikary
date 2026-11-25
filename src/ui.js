'use strict';
/* Wspólne elementy interfejsu: tekst pikselowym fontem, dymki, przyciski M/F. */
const FONT = '"PressStart", monospace';
const DEBUG = /[?&]debug=1/.test(location.search);
const IS_TOUCH = (() => { try { return ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || /[?&]touch=(1|buttons|joystick)\b/.test(location.search); } catch (e) { return false; } })();
/** Tryb sterowania dotykiem: CFG.touch.mode, nadpisywany przez ?touch=buttons / ?touch=joystick (testy A/B). */
const TOUCH_MODE = (() => { const m = (location.search.match(/[?&]touch=(buttons|joystick)\b/) || [])[1]; return m || CFG.touch.mode; })();

/** Poziom trudności (CFG.difficulty): profil bieżącej gry, zapamiętany wybór, przeskalowane parametry wrogów i bossów. */
const Difficulty = {
    valid(id) { return !!CFG.difficulty.levels[id]; },
    get(id) { return CFG.difficulty.levels[id] || CFG.difficulty.levels[CFG.difficulty.default]; },
    cur() { return this.get(GS.difficulty); },
    load() { try { const v = localStorage.getItem(CFG.difficulty.storageKey); return this.valid(v) ? v : CFG.difficulty.default; } catch (e) { return CFG.difficulty.default; } },
    save(id) { try { localStorage.setItem(CFG.difficulty.storageKey, id); } catch (e) { /* tryb prywatny */ } },
    _cache: {},
    /** CFG.enemies[type] z prędkościami (pola *speed / *Speed) × enemySpeed i HP + enemyHp (min 1) */
    enemy(type) {
        const id = this.valid(GS.difficulty) ? GS.difficulty : CFG.difficulty.default, D = this.get(id), C = CFG.enemies[type];
        if (!C || (D.enemySpeed === 1 && !D.enemyHp)) return C;
        const k = id + ':' + type;
        if (!this._cache[k]) {
            const o = Object.assign({}, C);
            Object.keys(o).forEach(f => { if (/speed$/i.test(f) && typeof o[f] === 'number') o[f] = o[f] * D.enemySpeed; });
            if (typeof o.hp === 'number') o.hp = Math.max(1, o.hp + D.enemyHp);
            this._cache[k] = o;
        }
        return this._cache[k];
    },
    /** CFG.spells z nadpisaniami profilu (TRUDNY: stare hitboxy i zasięgi) */
    spells() { return Object.assign({}, CFG.spells, this.cur().spells || {}); },
    bossHp(base) { return Math.max(1, Math.round(base * this.cur().bossHp)); },
    retryAllowed() { return this.cur().retry !== false; },
};
const enemyCfg = (type) => Difficulty.enemy(type);

const GS = {          // stan jednej rozgrywki (od START NEW GAME do końca)
    reset(difficulty) {                                  // tylko nowa gra (wybór poziomu trudności) i starty debug
        this.difficulty = Difficulty.valid(difficulty) ? difficulty : CFG.difficulty.default;
        this.score = 0; this.lives = Difficulty.get(this.difficulty).lives; this.timeMs = 0; this.meter = 0;
        this.hasCross = false; this.hasFire = false; this.hasBless = false; this.diamonds = 0; this.kills = 0; this.level = 0;
        this.retries = 0; this.retryUsed = false;          // powtórzenie poziomu po przegranej (CFG.retry)
    },
};
GS.reset();

/** Obsługa klawisza odporna na auto-powtarzanie i ponowne emitowanie tego samego zdarzenia przez Phasera. */
function onKey(fn) {
    const seen = new WeakSet();
    return (e) => {
        if (e && typeof e === 'object') { if (e.repeat || seen.has(e)) return; seen.add(e); }
        fn(e);
    };
}

function txt(scene, x, y, s, size, color, o) {
    o = o || {};
    const t = scene.add.text(x, y, s, {
        fontFamily: FONT, fontSize: (size || 8) + 'px', color: color || '#ffffff',
        stroke: o.stroke || '#120a14', strokeThickness: o.strokeW === undefined ? Math.max(2, Math.round((size || 8) / 4)) : o.strokeW,
        align: o.align || 'left', wordWrap: o.wrap ? { width: o.wrap } : undefined, lineSpacing: o.lineSpacing || 4,
    });
    t.setOrigin(o.ox === undefined ? 0.5 : o.ox, o.oy === undefined ? 0.5 : o.oy);
    if (o.shadow) t.setShadow(2, 2, '#000000', 0, true, true);
    return t;
}

function goldText(scene, x, y, s, size) {
    const t = txt(scene, x, y, s, size, '#ffd040', { stroke: '#3a1608', strokeW: 6 });
    t.setShadow(3, 3, '#140606', 0, true, true);
    const g = t.context.createLinearGradient(0, 0, 0, t.height);
    g.addColorStop(0, '#fff6aa'); g.addColorStop(0.35, '#ffd24a'); g.addColorStop(0.7, '#e09022'); g.addColorStop(1, '#8a4a12');
    t.setFill(g);
    return t;
}

/** Dymek dialogowy z portretem (scrollFactor 0). */
function dialogBox(scene, opts) {
    const W = CFG.W, w = opts.w || 520, h = opts.h || 64, x = (W - w) / 2, y = opts.y === undefined ? CFG.H - h - 10 : opts.y;
    const c = scene.add.container(0, 0).setScrollFactor(0).setDepth(opts.depth || 2000);
    const bg = scene.add.rectangle(x, y, w, h, 0x140c1c, 0.93).setOrigin(0).setStrokeStyle(2, 0xd8a640);
    c.add(bg);
    let tx = x + 12;
    if (opts.portrait) {
        const p = scene.add.image(x + 8 + 24, y + h / 2, ART.key(opts.portrait)).setScale(48 / 192);   // brak portretu = zamiennik z art.js
        const pt = ART.tint(opts.portrait); if (pt) p.setTint(pt);
        c.add(p); tx = x + 64;
        c.portrait = p;
    }
    if (opts.name) c.add(txt(scene, tx, y + 8, opts.name, 8, '#ffd040', { ox: 0, oy: 0 }));
    const body = txt(scene, tx, y + (opts.name ? 22 : 12), '', 8, '#ffffff', { ox: 0, oy: 0, wrap: x + w - tx - 12, lineSpacing: 6 });
    c.add(body);
    // pisanie na maszynie
    const full = opts.text || ''; let n = 0;
    c.done = false; c.full = full; c.name = opts.name || '';
    const ev = scene.time.addEvent({ delay: 28, repeat: full.length - 1, callback: () => { if (!body.active) return; n++; body.setText(full.slice(0, n)); if (n >= full.length) c.done = true; } });
    if (!full.length) c.done = true;
    c.finish = () => { ev.remove(false); if (body.active) body.setText(full); c.done = true; };
    c.once('destroy', () => ev.remove(false));
    if (opts.hint) c.add(txt(scene, x + w - 8, y + h - 8, opts.hint, 8, '#c8b890', { ox: 1, oy: 1 }));
    return c;
}

/** Krótka podpowiedź u góry ekranu (znika sama). */
function hintBubble(scene, s, ms, y) {
    const t = txt(scene, CFG.W / 2, y || 62, s, 8, '#fff2c0');
    const pad = 8;
    const bg = scene.add.rectangle(CFG.W / 2, y || 62, t.width + pad * 2, t.height + pad * 2, 0x140c1c, 0.88).setStrokeStyle(2, 0xd8a640);
    const c = scene.add.container(0, 0, [bg, t]).setScrollFactor(0).setDepth(1900).setAlpha(0);
    const slot = (scene.hintSlots = scene.hintSlots || {}), key = y || 62;
    if (slot[key] && slot[key].active) slot[key].destroy();     // nowa podpowiedź w tym samym miejscu zastępuje starą
    slot[key] = c;
    scene.tweens.add({ targets: c, alpha: 1, duration: 200 });
    scene.time.delayedCall(ms || 3000, () => {
        scene.tweens.add({ targets: c, alpha: 0, duration: 300, onComplete: () => c.destroy() });
    });
    return c;
}

/** Klawisze globalne: M = wycisz, F = pełny ekran, + odblokowanie dźwięku przy pierwszym geście. */
function bindGlobalKeys(scene) {
    const kb = scene.input.keyboard;
    kb.on('keydown-M', onKey(() => { if (scene.textInput) return; WikaryAudio.unlock(); WikaryAudio.toggleMute(); scene.events.emit('mutechange'); }));
    kb.on('keydown-F', onKey(() => { if (!scene.textInput) toggleFullscreen(scene); }));
    kb.on('keydown', () => WikaryAudio.unlock());
    scene.input.on('pointerdown', () => WikaryAudio.unlock());
}
/** Pełny ekran: natywne Fullscreen API na całej stronie (<html>), wołane wprost w geście użytkownika
    (klawisz F albo pointerup na przycisku F). Phaser sam słucha 'fullscreenchange' (isFullscreen, refresh, enterfullscreen).
    Odmowa przeglądarki -> 'fullscreenfailed' + podpowiedź, bez „Uncaught (in promise)”.
    iPhone (brak API): podpowiedź o dodaniu gry do ekranu początkowego. */
function toggleFullscreen(scene) {
    const sm = scene.scale, d = document;
    if (!sm.fullscreen.available) {
        sm.emit('fullscreenunsupported');
        hintBubble(scene, CFG.fullscreen.unsupportedHint, CFG.fullscreen.hintMs, CFG.fullscreen.hintY);
        return;
    }
    const failed = (err) => {
        sm.emit('fullscreenfailed', err);
        hintBubble(scene, CFG.fullscreen.failedHint, CFG.fullscreen.hintMs, CFG.fullscreen.hintY);
    };
    try {
        if (d.fullscreenElement || d.webkitFullscreenElement) {
            const exit = d.exitFullscreen || d.webkitExitFullscreen;
            const p = exit && exit.call(d);
            if (p && p.catch) p.catch(() => {});
            return;
        }
        const el = d.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
        const p = req.call(el, { navigationUI: 'hide' });
        if (p && p.catch) p.catch(failed);
    } catch (err) { failed(err); }
}

/** Małe przyciski M (dźwięk) i F (pełny ekran) w prawym górnym rogu. */
function cornerButtons(scene, y) {
    y = y || 10;
    const mk = (x, label, cb) => {
        const r = scene.add.rectangle(x, y, 22, 16, 0x140c1c, 0.75).setStrokeStyle(1, 0xd8a640).setScrollFactor(0).setDepth(3000);
        const t = txt(scene, x, y + 1, label, 8, '#ffe8a0').setScrollFactor(0).setDepth(3001);
        // pointerdown tylko zatrzymuje dotyk (bez skoku / pominięcia); akcja na pointerup = gest, który
        // przeglądarka na Androidzie uznaje za aktywację (touchstart / pointerdown dotykiem nie wystarcza do pełnego ekranu)
        r.setInteractive({ useHandCursor: true })
            .on('pointerdown', (p, lx, ly, ev) => { if (ev) ev.stopPropagation(); })
            .on('pointerup', (p, lx, ly, ev) => { if (ev) ev.stopPropagation(); cb(); });
        return { r, t };
    };
    const m = mk(CFG.W - 40, 'M', () => { WikaryAudio.unlock(); WikaryAudio.toggleMute(); scene.events.emit('mutechange'); });
    const f = mk(CFG.W - 14, 'F', () => toggleFullscreen(scene));
    const upd = () => { m.t.setColor(WikaryAudio.muted ? '#777777' : '#ffe8a0'); };
    upd(); scene.events.on('mutechange', upd);
    return { m, f };
}

/** Rozmowa w dymkach z portretami: say() zwraca Promise; Enter/klik = dalej, skip() = pomiń resztę.
    Portret *_open mruga (podmiana na *_closed). onStart/onEnd: np. animacja mówienia postaci. */
function makeTalker(scene, defaults) {
    defaults = defaults || {};
    const t = { dialog: null, resolve: null, auto: null, blink: null, skipped: false, onEnd: null };
    t.say = (portrait, name, text, o) => new Promise(res => {
        o = Object.assign({}, defaults, o || {});
        if (t.skipped || !scene.sys.isActive()) return res();
        t.dialog = dialogBox(scene, { portrait, name, text, y: o.y === undefined ? 26 : o.y, hint: IS_TOUCH ? '' : 'ENTER', depth: o.depth || 4900 });
        t.resolve = res; t.onEnd = o.onEnd || null;
        if (o.onStart) o.onStart();
        const closedName = portrait && /_open$/.test(portrait) ? portrait.replace(/_open$/, '_closed') : null;
        const closed = closedName ? ART.key(closedName) : null, open = ART.key(portrait);
        if (closed && scene.textures.exists(closed)) {
            const d = t.dialog;
            t.blink = scene.time.addEvent({ delay: 2100, loop: true, callback: () => {
                if (!d.portrait || !d.active) return;
                d.portrait.setTexture(closed);
                scene.time.delayedCall(140, () => { if (d.active && d.portrait) d.portrait.setTexture(open); });
            } });
        }
        t.auto = scene.time.delayedCall(o.ms || (1600 + text.length * 60), () => t.close());
    });
    t.close = () => {
        if (!t.dialog) return;
        if (t.auto) t.auto.remove(false);
        if (t.blink) t.blink.remove(false);
        t.auto = t.blink = null;
        t.dialog.destroy(); t.dialog = null;
        const e = t.onEnd; t.onEnd = null; if (e) e();
        const r = t.resolve; t.resolve = null; if (r) r();
    };
    t.advance = () => {
        if (!t.dialog) return false;
        if (!t.dialog.done) t.dialog.finish(); else { WikaryAudio.sfx('click'); t.close(); }
        return true;
    };
    t.skip = () => { t.skipped = true; t.close(); };
    return t;
}
const sleep = (scene, ms) => new Promise(res => scene.time.delayedCall(ms, res));

/** Tylko ?debug=1: start wybranego poziomu z nowym stanem gry (w Level 2 krzyż już jest). */
function debugStart(scene, idx, startAt, extra) {
    GS.reset(extra && extra.difficulty);
    if (idx >= 1) GS.hasCross = true;
    if (idx >= 2) GS.hasFire = true;
    if (idx >= 3) GS.hasBless = true;
    scene.scene.start('Level', Object.assign({ level: idx, startAt }, extra || {}));
}
