'use strict';
/* Wybór poziomu trudności przed nową grą (po START NEW GAME): ŁATWY / NORMALNY / TRUDNY (CFG.difficulty).
   Klawiatura: strzałki + Enter/Spacja, Esc = powrót. Dotyk: przycisk (dotknięcie i puszczenie na tym samym). */
class DifficultyScene extends Phaser.Scene {
    constructor() { super('Difficulty'); }
    create() {
        const W = CFG.W, D = CFG.difficulty;
        this.leaving = false; this.downOn = -1; this.readyAt = this.time.now + 250;   // reset stanu przy każdym wejściu
        this.ids = D.order.slice();
        this.sel = Math.max(0, this.ids.indexOf(Difficulty.load()));                  // ostatni wybór
        bindGlobalKeys(this);
        this.cameras.main.fadeIn(250, 0, 0, 0);
        this.add.image(0, 0, 'title_bg_church').setOrigin(0).setTint(0x8a7a8a);
        goldText(this, W / 2, 34, 'POZIOM TRUDNOŚCI', 16);

        this.items = this.ids.map((id, i) => {
            const P = D.levels[id], y = 92 + i * 52;
            const box = this.add.rectangle(W / 2, y, 400, 42, 0x1a0c10, 0.8).setStrokeStyle(2, 0xd8a640);
            const t = txt(this, W / 2, y - 8, P.label, 16, '#ffe9a8', { stroke: '#2a1206', strokeW: 4 });
            const d = txt(this, W / 2, y + 11, P.desc, 8, '#d8c8a0');
            box.setInteractive({ useHandCursor: true });
            box.on('pointerover', () => this.select(i));
            box.on('pointerdown', (p, x, y2, ev) => { ev.stopPropagation(); WikaryAudio.unlock(); this.downOn = i; this.select(i); });
            box.on('pointerup', (p, x, y2, ev) => { ev.stopPropagation(); if (this.downOn === i) this.choose(i); this.downOn = -1; });
            return { id, y, box, t, d };
        });
        this.arrow = txt(this, 0, 0, '\u25b6', 16, '#ffd040', { stroke: '#2a1206', strokeW: 4 });

        const back = this.add.rectangle(64, 298, 100, 22, 0x2a1410, 0.9).setStrokeStyle(2, 0xd8a640).setInteractive({ useHandCursor: true });
        txt(this, 64, 299, '\u25c0 WRÓĆ', 8, '#ffe8a0');
        back.on('pointerdown', (p, x, y, ev) => { ev.stopPropagation(); this.downOn = 'back'; });
        back.on('pointerup', (p, x, y, ev) => { ev.stopPropagation(); if (this.downOn === 'back') this.back(); this.downOn = -1; });
        txt(this, W / 2 + 40, 298, IS_TOUCH ? 'DOTKNIJ POZIOM' : '\u2191\u2193 + ENTER   ESC = POWRÓT', 8, '#c8b890');
        cornerButtons(this);

        const kb = this.input.keyboard, n = this.ids.length;
        kb.on('keydown-UP', onKey(() => this.select((this.sel + n - 1) % n)));
        kb.on('keydown-DOWN', onKey(() => this.select((this.sel + 1) % n)));
        kb.on('keydown-ENTER', onKey(() => this.choose(this.sel)));
        kb.on('keydown-SPACE', onKey(() => this.choose(this.sel)));
        kb.on('keydown-ESC', onKey(() => this.back()));
        this.select(this.sel, true);
    }
    select(i, silent) {
        if (this.leaving) return;
        if (this.sel !== i && !silent) WikaryAudio.sfx('click');
        this.sel = i;
        this.items.forEach((it, k) => {
            it.box.setStrokeStyle(2, k === i ? 0xffd040 : 0x8a6a30).setFillStyle(k === i ? 0x3a1a10 : 0x1a0c10, k === i ? 0.9 : 0.72);
            it.t.setColor(k === i ? '#ffe070' : '#c8b8a0');
            it.d.setColor(k === i ? '#ffffff' : '#a89878');
        });
        this.arrow.setPosition(CFG.W / 2 - 184, this.items[i].y - 7);
    }
    choose(i) {
        if (this.leaving || this.time.now < this.readyAt) return;
        this.leaving = true; this.sel = i;
        const id = this.ids[i];
        WikaryAudio.unlock(); WikaryAudio.sfx('select');
        Difficulty.save(id);
        GS.reset(id);                                   // nowa gra: wynik, życia (z profilu), moce, licznik powtórek
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Intro'));
    }
    back() {
        if (this.leaving) return; this.leaving = true;
        WikaryAudio.sfx('click');
        this.scene.start('Title');
    }
    update(time) { this.arrow.x = CFG.W / 2 - 184 + Math.round(Math.sin(time / 160) * 2); }
}
