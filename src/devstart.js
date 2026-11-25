'use strict';
/* Tylko ?dev=true: po wyborze poziomu trudności lista punktów startu (DEV_STARTS = skróty debug 1–9) + zwykłe intro.
   Klawiatura: strzałki (góra/dół w kolumnie, lewo/prawo między kolumnami) + Enter/Spacja, Esc = wybór trudności.
   Dotyk: dotknięcie i puszczenie na tym samym przycisku. Wybrana trudność (GS.difficulty) obowiązuje. */
class DevStartScene extends Phaser.Scene {
    constructor() { super('DevStart'); }
    create() {
        const W = CFG.W, ROWS = 5;
        this.leaving = false; this.downOn = -1; this.readyAt = this.time.now + 250;      // reset stanu przy każdym wejściu
        this.diff = GS.difficulty;
        bindGlobalKeys(this);
        this.cameras.main.fadeIn(200, 0, 0, 0);
        this.add.image(0, 0, 'title_bg_church').setOrigin(0).setTint(0x6a6a7a);
        goldText(this, W / 2, 22, 'DEV: START OD', 16);
        txt(this, W / 2, 46, 'TRUDNOŚĆ: ' + Difficulty.cur().label, 8, '#d8c8a0');
        const list = [{ label: 'INTRO (ZWYKŁY START)', go: (s) => s.scene.start('Intro') }]
            .concat(DEV_STARTS.map((d, i) => ({ label: (i + 1) + '. ' + d.label, go: (s) => d.go(s, this.diff) })));
        this.ROWS = ROWS;
        this.items = list.map((it, i) => {
            const col = Math.floor(i / ROWS), x = col ? W / 2 + 136 : W / 2 - 136, y = 78 + (i % ROWS) * 40;
            const box = this.add.rectangle(x, y, 252, 30, 0x1a0c10, 0.8).setStrokeStyle(2, 0x8a6a30).setInteractive({ useHandCursor: true });
            const t = txt(this, x, y + 1, it.label, 8, '#c8b8a0');
            box.on('pointerover', () => this.select(i));
            box.on('pointerdown', (p, lx, ly, ev) => { ev.stopPropagation(); this.downOn = i; this.select(i); });
            box.on('pointerup', (p, lx, ly, ev) => { ev.stopPropagation(); if (this.downOn === i) this.choose(i); this.downOn = -1; });
            return Object.assign({ box, t, x, y }, it);
        });
        const back = this.add.rectangle(64, 298, 100, 22, 0x2a1410, 0.9).setStrokeStyle(2, 0xd8a640).setInteractive({ useHandCursor: true });
        txt(this, 64, 299, '\u25c0 WRÓĆ', 8, '#ffe8a0');
        back.on('pointerdown', (p, x, y, ev) => { ev.stopPropagation(); this.downOn = 'back'; });
        back.on('pointerup', (p, x, y, ev) => { ev.stopPropagation(); if (this.downOn === 'back') this.back(); this.downOn = -1; });
        txt(this, W / 2 + 40, 298, IS_TOUCH ? 'DOTKNIJ PUNKT STARTU' : '\u2191\u2193\u2190\u2192 + ENTER   ESC = POWRÓT', 8, '#c8b890');
        cornerButtons(this);
        const kb = this.input.keyboard, n = this.items.length;
        kb.on('keydown-UP', onKey(() => this.select((this.sel + n - 1) % n)));
        kb.on('keydown-DOWN', onKey(() => this.select((this.sel + 1) % n)));
        kb.on('keydown-LEFT', onKey(() => this.select(Math.max(0, this.sel - ROWS))));
        kb.on('keydown-RIGHT', onKey(() => this.select(Math.min(n - 1, this.sel + ROWS))));
        kb.on('keydown-ENTER', onKey(() => this.choose(this.sel)));
        kb.on('keydown-SPACE', onKey(() => this.choose(this.sel)));
        kb.on('keydown-ESC', onKey(() => this.back()));
        this.sel = -1; this.select(0, true);
    }
    select(i, silent) {
        if (this.leaving) return;
        if (this.sel !== i && !silent) WikaryAudio.sfx('click');
        this.sel = i;
        this.items.forEach((it, k) => {
            it.box.setStrokeStyle(2, k === i ? 0xffd040 : 0x8a6a30).setFillStyle(k === i ? 0x3a1a10 : 0x1a0c10, k === i ? 0.9 : 0.72);
            it.t.setColor(k === i ? '#ffe070' : '#c8b8a0');
        });
    }
    choose(i) {
        if (this.leaving || this.time.now < this.readyAt) return;
        this.leaving = true; this.sel = i;
        WikaryAudio.unlock(); WikaryAudio.sfx('select');
        this.items[i].go(this);
    }
    back() {
        if (this.leaving) return; this.leaving = true;
        WikaryAudio.sfx('click');
        this.scene.start('Difficulty');
    }
}
