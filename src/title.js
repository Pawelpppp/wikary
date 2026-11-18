'use strict';
/* Ekran tytułowy: złoty tytuł, kościół, mrugająca twarz Kamila, świeczki, menu. */
class TitleScene extends Phaser.Scene {
    constructor() { super('Title'); }
    create() {
        const W = CFG.W, H = CFG.H;
        this.sel = 0; this.leaving = false; this.blinkAt = 0;          // reset stanu przy każdym wejściu
        bindGlobalKeys(this);
        this.cameras.main.fadeIn(300, 0, 0, 0);

        this.add.image(0, 0, 'title_bg_church').setOrigin(0);
        // duża twarz Kamila w tle (przyciemniona, półprzezroczysta), mruga
        this.face = this.add.image(W / 2 + 10, -24, 'wikary_kamil_closeup_open').setOrigin(0.5, 0).setScale(2).setTint(0xb3808f).setAlpha(0.62);
        this.nextBlink = this.time.now + 1800;

        this.title1 = goldText(this, W / 2, 30, 'PRZYGODY KSIĘDZA', 24);
        this.title2 = goldText(this, W / 2, 68, 'KAMILA', 24);

        // menu
        this.items = [
            { label: 'START NEW GAME', y: 150, go: () => this.startGame() },
            { label: 'HIGH SCORES', y: 192, go: () => this.openScores() },
        ];
        this.items.forEach((it, i) => {
            it.box = this.add.rectangle(W / 2, it.y, 300, 30, 0x1a0c10, 0.78).setStrokeStyle(2, 0xd8a640);
            it.t = txt(this, W / 2 + 8, it.y + 1, it.label, 16, '#ffe9a8', { stroke: '#2a1206', strokeW: 4 });
            it.box.setInteractive({ useHandCursor: true });        // hitbox = dokładnie prostokąt przycisku
            it.box.on('pointerover', () => this.select(i));
            it.box.on('pointerdown', (p, x, y, ev) => { ev.stopPropagation(); WikaryAudio.unlock(); this.select(i); it.go(); });
        });
        this.arrow = txt(this, 0, 0, '\u25b6', 16, '#ffd040', { stroke: '#2a1206', strokeW: 4 });
        this.select(0, true);

        // świeczki na dole (poniżej przycisków)
        const xs = [22, 62, 100, 140, 178, 216, 254, 314, 352, 390, 428, 468, 506, 546];
        xs.forEach((x, i) => {
            const c = this.add.sprite(x, H + 2, 'candle_1').setOrigin(0.5, 1).setScale(0.75 + ((i * 37) % 5) * 0.08);
            c.play({ key: 'candle', startFrame: (i * 3) % 8 });
        });

        txt(this, 6, 6, 'v' + window.WIKARY_VERSION, 8, '#d8c8a0', { ox: 0, oy: 0 });
        cornerButtons(this);
        txt(this, W / 2, 222, IS_TOUCH ? 'DOTKNIJ PRZYCISK' : '\u2191\u2193 + ENTER   M = DŹWIĘK   F = PEŁNY EKRAN', 8, '#c8b890');

        const kb = this.input.keyboard;
        kb.on('keydown-UP', onKey(() => this.select((this.sel + 1) % 2)));
        kb.on('keydown-DOWN', onKey(() => this.select((this.sel + 1) % 2)));
        kb.on('keydown-ENTER', onKey(() => this.items[this.sel].go()));
        kb.on('keydown-SPACE', onKey(() => this.items[this.sel].go()));

        if (DEBUG) {                                    // wybór poziomu tylko do testów (?debug=1)
            txt(this, W / 2, 238, 'DEBUG: 1 L1  2 KOŚCIÓŁ  3 L2  4 HANS  5 L3  6 OBRONA  7 RAFAŁ', 8, '#80ff80');
            kb.on('keydown-ONE', onKey(() => debugStart(this, 0)));
            kb.on('keydown-TWO', onKey(() => { GS.reset(); this.scene.start('Church', { next: 1 }); }));
            kb.on('keydown-THREE', onKey(() => debugStart(this, 1)));
            kb.on('keydown-FOUR', onKey(() => debugStart(this, 1, LEVELS[1].arenaAt - 140)));
            kb.on('keydown-FIVE', onKey(() => debugStart(this, 2)));
            kb.on('keydown-SIX', onKey(() => { debugStart(this, 2, LEVELS[2].arenaAt - 60); GS.hasBless = true; }));
            kb.on('keydown-SEVEN', onKey(() => { debugStart(this, 2, LEVELS[2].arenaAt - 60, { skipTo: 'boss' }); GS.hasBless = true; }));
        }
        WikaryAudio.play('title');
    }
    select(i, silent) {
        if (this.sel !== i && !silent) WikaryAudio.sfx('click');
        this.sel = i;
        this.items.forEach((it, k) => {
            it.box.setStrokeStyle(2, k === i ? 0xffd040 : 0x8a6a30);
            it.box.setFillStyle(k === i ? 0x3a1a10 : 0x1a0c10, k === i ? 0.88 : 0.7);
            it.t.setColor(k === i ? '#ffe070' : '#c8b8a0');
        });
        const it = this.items[i];
        this.arrow.setPosition(this.cameras.main.width / 2 - 134, it.y + 1);
    }
    startGame() {
        if (this.leaving) return; this.leaving = true;
        WikaryAudio.unlock(); WikaryAudio.sfx('select');
        GS.reset();
        this.cameras.main.fadeOut(350, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Intro'));
    }
    openScores() {
        if (this.leaving) return; this.leaving = true;
        WikaryAudio.sfx('select');
        this.scene.start('Scores', {});
    }
    update(time) {
        // mruganie
        if (time > this.nextBlink) {
            this.face.setTexture('wikary_kamil_closeup_closed');
            this.time.delayedCall(140, () => this.face && this.face.setTexture('wikary_kamil_closeup_open'));
            this.nextBlink = time + 2400 + Math.random() * 2600;
        }
        // migotanie tytułu (alfa ustawiana wprost - bez tweenów yoyo)
        const fl = 0.93 + 0.07 * Math.sin(time / 90) * Math.sin(time / 237);
        this.title1.setAlpha(fl); this.title2.setAlpha(fl);
        this.arrow.x = this.cameras.main.width / 2 - 134 + Math.round(Math.sin(time / 160) * 2);
    }
}
