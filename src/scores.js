'use strict';
/* HIGH SCORES: 20 miejsc w dwóch kolumnach. */
class ScoresScene extends Phaser.Scene {
    constructor() { super('Scores'); }
    create(data) {
        const W = CFG.W;
        this.leaving = false; this.highlight = (data && data.highlight !== undefined) ? data.highlight : -1; this.hlTexts = [];
        bindGlobalKeys(this);
        this.add.image(0, 0, 'title_bg_church').setOrigin(0).setTint(0x8a7a8a);
        this.add.rectangle(W / 2, 168, 552, 252, 0x0c0610, 0.8).setStrokeStyle(2, 0xd8a640);
        goldText(this, W / 2, 24, 'HIGH SCORES', 24);
        cornerButtons(this);

        const list = Leaderboard.load();
        const head = ' # ' + 'NICK'.padEnd(12, ' ') + 'PKT'.padStart(6, ' ') + ' ' + 'CZAS';
        txt(this, 22, 54, head, 8, '#d8a640', { ox: 0, oy: 0 });
        txt(this, 288, 54, head, 8, '#d8a640', { ox: 0, oy: 0 });
        if (!list.length) txt(this, W / 2, 150, 'BRAK WYNIKÓW - ZAGRAJ PIERWSZY!', 8, '#ffffff');
        list.forEach((e, i) => {
            const col = i < 10 ? 0 : 1, r = i % 10;
            const line = String(i + 1).padStart(2, ' ') + ' ' + e.nick.padEnd(12, ' ') + String(e.score).padStart(6, ' ') + ' ' + Leaderboard.fmt(e.time);
            const color = i === this.highlight ? '#ffe070' : (i < 3 ? '#fff2c0' : '#d8d0c0');
            const t = txt(this, 22 + col * 266, 72 + r * 22, line, 8, color, { ox: 0, oy: 0 });
            if (i === this.highlight) this.hlTexts.push(t);
        });
        txt(this, W / 2, 300, IS_TOUCH ? 'DOTKNIJ, ABY WRÓCIĆ' : 'ENTER / ESC = POWRÓT', 8, '#c8b890');

        const back = () => {
            if (this.leaving) return; this.leaving = true;
            WikaryAudio.sfx('click'); this.scene.start('Title');
        };
        this.input.keyboard.on('keydown-ENTER', onKey(back));
        this.input.keyboard.on('keydown-ESC', onKey(back));
        this.input.keyboard.on('keydown-SPACE', onKey(back));
        this.input.on('pointerdown', back);
        WikaryAudio.play('title');
    }
    update(time) {
        const a = (Math.floor(time / 250) % 2) ? 1 : 0.45;
        this.hlTexts.forEach(t => t.setAlpha(a));
    }
}
