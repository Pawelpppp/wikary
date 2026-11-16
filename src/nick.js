'use strict';
/* Wpisywanie nicku po GAME OVER / wygranej -> zapis lokalny -> HIGH SCORES. */
class NickScene extends Phaser.Scene {
    constructor() { super('Nick'); }
    create(data) {
        const W = CFG.W;
        this.result = (data && data.result) || 'over';
        this.nick = Leaderboard.lastNick(); this.saved = false; this.textInput = true;   // M i F wpisują litery, a nie przełączają
        bindGlobalKeys(this);
        cornerButtons(this);
        WikaryAudio.play('title');
        this.cameras.main.fadeIn(300, 0, 0, 0);
        this.add.image(0, 0, 'title_bg_church').setOrigin(0).setTint(0x7a6a7a);
        this.add.image(W / 2, 112, this.result === 'win' ? 'wikary_kamil_closeup_open' : 'wikary_kamil_closeup_closed').setScale(0.42).setAlpha(0.9);
        goldText(this, W / 2, 30, this.result === 'win' ? 'BRAWO, KAMIL!' : 'GAME OVER', 24);
        txt(this, W / 2, 160, 'PUNKTY: ' + GS.score + '    CZAS: ' + Leaderboard.fmt(GS.timeMs / 1000), 8, '#ffffff');
        txt(this, W / 2, 186, 'WPISZ NICK (MAX ' + Leaderboard.NICK_MAX + '):', 8, '#ffd040');
        this.box = this.add.rectangle(W / 2, 212, 236, 26, 0x140c1c, 0.92).setStrokeStyle(2, 0xffd040).setInteractive({ useHandCursor: true });
        this.field = txt(this, W / 2, 213, '', 16, '#ffffff');
        this.box.on('pointerdown', (p, x, y, ev) => { ev.stopPropagation(); this.promptNick(); });

        const mkBtn = (x, label, cb) => {
            const r = this.add.rectangle(x, 254, 140, 24, 0x2a1410, 0.9).setStrokeStyle(2, 0xd8a640).setInteractive({ useHandCursor: true });
            txt(this, x, 255, label, 8, '#ffe8a0');
            r.on('pointerdown', (p, lx, ly, ev) => { ev.stopPropagation(); cb(); });
        };
        mkBtn(W / 2 - 80, 'ZAPISZ', () => this.save());
        mkBtn(W / 2 + 80, 'POMIŃ', () => this.skip());
        txt(this, W / 2, 290, IS_TOUCH ? 'DOTKNIJ POLE, ABY WPISAĆ NICK' : 'ENTER = ZAPISZ   ESC = POMIŃ', 8, '#c8b890');

        this.input.keyboard.addCapture('BACKSPACE');
        this.input.keyboard.on('keydown', onKey((e) => this.onKey(e)));
        this.render(0);
    }
    onKey(e) {
        if (this.saved) return;
        if (e.key === 'Enter') return this.save();
        if (e.key === 'Escape') return this.skip();
        if (e.key === 'Backspace') { this.nick = this.nick.slice(0, -1); WikaryAudio.sfx('click'); return; }
        if (e.key && e.key.length === 1 && this.nick.length < Leaderboard.NICK_MAX) {
            const c = Leaderboard.sanitize(e.key);
            if (c) { this.nick += c; WikaryAudio.sfx('click'); }
        }
    }
    promptNick() {         // telefon: systemowe okienko z klawiaturą
        try {
            const v = window.prompt('Nick (max ' + Leaderboard.NICK_MAX + ' znaków):', this.nick);
            if (v !== null) this.nick = Leaderboard.sanitize(v);
        } catch (e) { /* brak prompt */ }
    }
    save() {
        if (this.saved) return; this.saved = true;
        WikaryAudio.sfx('select');
        const pos = Leaderboard.add(this.nick, GS.score, Math.floor(GS.timeMs / 1000));
        this.scene.start('Scores', { highlight: pos });
    }
    skip() {
        if (this.saved) return; this.saved = true;
        WikaryAudio.sfx('click');
        this.scene.start('Title');
    }
    render(time) { this.field.setText(this.nick + ((Math.floor(time / 400) % 2 && this.nick.length < Leaderboard.NICK_MAX) ? '_' : ' ')); }
    update(time) { this.render(time); }
}
