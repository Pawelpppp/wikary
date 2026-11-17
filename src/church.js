'use strict';
/* Kościół po Level 1: Kamil wbiega, proboszcz przy ołtarzu, rozmowa w dymkach, błogosławieństwo,
   Kamil wychodzi w lewo -> Level 2. Enter / klik = dalej, Spacja / Esc (dotyk: POMIŃ) = pomiń. */
class ChurchScene extends Phaser.Scene {
    constructor() { super('Church'); }
    init(data) { this.nextLevel = data && data.next !== undefined ? data.next : 1; }
    create() {
        const C = CFG.church, F = C.floorY, S = CFG.hero.scale;
        this.done = false; this.step = 0; this.textInput = false;
        bindGlobalKeys(this);
        cornerButtons(this);
        this.cameras.main.setBackgroundColor('#120e16');
        ART.image(this, 0, 0, 'bg_church_interior', 1, 0, 0).setDepth(0);
        this.basket = ART.image(this, C.basketX, F, 'prop_collection_basket', 1, 0.5, 1);
        if (this.basket) this.basket.setDepth(2);
        this.pro = this.add.sprite(C.proboszczX, F, 'proboszcz_idle_1').setOrigin(0.5, 1).setScale(S).setFlipX(true).setDepth(3).play('proboszcz_idle');
        this.kamil = this.add.sprite(C.kamilFrom, F, 'wikary_kamil_run_1').setOrigin(0.5, 1).setScale(S).setDepth(4).play('k_run');
        this.talk = makeTalker(this);

        const kb = this.input.keyboard;
        kb.on('keydown-SPACE', onKey(() => this.finish()));
        kb.on('keydown-ESC', onKey(() => this.finish()));
        kb.on('keydown-ENTER', onKey(() => this.talk.advance()));
        this.input.on('pointerdown', () => this.talk.advance());
        if (IS_TOUCH) {
            const r = this.add.rectangle(36, 12, 60, 18, 0x140c1c, 0.75).setStrokeStyle(1, 0xd8a640).setDepth(5000).setInteractive();
            txt(this, 36, 13, 'POMIŃ', 8, '#ffe8a0').setDepth(5001);
            r.on('pointerdown', (p, x, y, ev) => { if (ev) ev.stopPropagation(); this.finish(); });
        } else txt(this, CFG.W / 2, CFG.H - 8, 'SPACJA = POMIŃ   ENTER = DALEJ', 8, '#9a8a90').setDepth(5000);
        WikaryAudio.play('title');
        this.run();
    }
    walk(sprite, x, msPerPx) {
        return new Promise(res => this.tweens.add({ targets: sprite, x, duration: Math.abs(sprite.x - x) * (msPerPx || 7), onComplete: res }));
    }
    async run() {
        const C = CFG.church;
        const P = (s) => this.talk.say('proboszcz_closeup_open', 'PROBOSZCZ', s,
            { onStart: () => this.pro.play('proboszcz_talk'), onEnd: () => this.pro.active && this.pro.play('proboszcz_idle') });
        const K = (s) => this.talk.say('wikary_kamil_closeup_open', 'KAMIL', s);
        try {
            this.cameras.main.fadeIn(400, 0, 0, 0);
            await this.walk(this.kamil, C.kamilTo); if (this.done) return;
            this.kamil.play('k_idle');
            const lines = [
                [P, 'No, jesteś wreszcie! Zuch chłopak, dobrze się spisałeś.'],
                [K, 'Psy, wilki, nietoperze... Proszę księdza, ja tu biegłem jak na olimpiadzie!'],
                [P, 'Dobrze, dobrze, olimpijczyku. Zajrzyjmy do koszyczka z tacy...'],
                [P, 'Wszyscy dali pięknie... tylko pan Krzysztof „Dwa Grosze” spod lasu wrzucił guzik i dwa grosze.'],
                [K, 'Guzik? A chociaż ładny?'],
                [P, 'Od kalesonów. Idź do niego, porozmawiaj. Niech się chłop nawróci.'],
                [K, 'Do Krzysztofa? Przecież tam po drodze same wilki i błoto...'],
                [P, 'Pan Bóg cię prowadzi. I weź parasol, bo będzie padać.'],
            ];
            for (const [who, s] of lines) { this.step++; await who(s); if (this.done) return; }
            // błogosławieństwo na drogę
            this.pro.play('proboszcz_bless'); WikaryAudio.sfx('pickup');
            const fx = this.add.sprite(this.kamil.x, this.kamil.y - this.kamil.displayHeight - 4, 'fx_bless_1').setScale(0.6).setDepth(6).play('fx_bless');
            fx.once('animationcomplete', () => fx.destroy());
            await sleep(this, C.blessMs); if (this.done) return;
            this.pro.play('proboszcz_idle');
            this.kamil.setFlipX(true).play('k_run');                 // tym razem w lewo
            await this.walk(this.kamil, -40, 6); if (this.done) return;
            this.finish();
        } catch (e) { if (!this.done) this.finish(); }
    }
    finish() {
        if (this.done) return; this.done = true;
        this.talk.skip();
        this.tweens.killAll();
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Level', { level: this.nextLevel }));
        this.cameras.main.fade(350, 0, 0, 0, true);
    }
}
