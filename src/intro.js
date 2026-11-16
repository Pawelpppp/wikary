'use strict';
/* Intro: modlitwa -> zbliżenie na twarz -> telefon -> rozmowa z proboszczem -> wybiega z domu.
   Spacja / dotyk = pomiń całe intro, Enter / klik = dalej w dymkach. Bez HUD. */
class IntroScene extends Phaser.Scene {
    constructor() { super('Intro'); }
    create() {
        this.done = false; this.dialog = null; this.dialogResolve = null; this.shake = null; this.layer = null;
        bindGlobalKeys(this);
        cornerButtons(this);
        this.cameras.main.setBackgroundColor('#120e16');
        WikaryAudio.play('prayer');

        const kb = this.input.keyboard;
        kb.on('keydown-SPACE', onKey(() => this.skip()));
        kb.on('keydown-ESC', onKey(() => this.skip()));
        kb.on('keydown-ENTER', onKey(() => this.advance()));
        this.input.on('pointerdown', (p) => { if (p.wasTouch) this.skip(); else this.advance(); });
        this.skipHint = txt(this, CFG.W / 2, CFG.H - 8, IS_TOUCH ? 'DOTKNIJ = POMIŃ' : 'SPACJA = POMIŃ   ENTER = DALEJ', 8, '#9a8a90').setDepth(5000);

        this.run();
    }
    wait(ms) { return new Promise(res => this.time.delayedCall(ms, res)); }
    clear() { if (this.layer) this.layer.destroy(); this.layer = this.add.container(0, 0); return this.layer; }
    fade(ms) {
        return new Promise(res => { this.cameras.main.fadeOut(ms, 0, 0, 0); this.cameras.main.once('camerafadeoutcomplete', res); })
            .then(() => { if (!this.done) this.cameras.main.fadeIn(ms, 0, 0, 0); });
    }
    async run() {
        const W = CFG.W, H = CFG.H;
        try {
            // 1. Za plecami: modlitwa w pokoju
            let L = this.clear();
            L.add(this.add.image(0, 0, 'intro_room_bg').setOrigin(0));
            L.add(this.add.sprite(270, 308, 'wikary_kamil_pray_back_1').setOrigin(0.5, 1).play('k_pray_back'));
            this.cameras.main.fadeIn(600, 0, 0, 0);
            this.cameras.main.zoomTo(1.06, 2600);
            await this.wait(2800); if (this.done) return;
            await this.fade(250); if (this.done) return;
            this.cameras.main.setZoom(1);

            // 2. Front, zbliżenie na twarz, oczy zamknięte
            L = this.clear();
            const face = this.add.image(W / 2, H / 2, 'wikary_kamil_closeup_closed').setScale(1);
            L.add(face);
            this.tweens.add({ targets: face, scale: 1.25, duration: 2200, ease: 'Sine.easeInOut' });
            await this.wait(2300); if (this.done) return;

            // 3. Dzwoni telefon: ekran dzielony, telefon się trzęsie, oczy się otwierają
            WikaryAudio.stop(0.4);
            this.tweens.add({ targets: face, x: 34 + 96, scale: 1, duration: 300, ease: 'Quad.easeOut' });
            const room = this.add.image(260 - 380 * 2, -100 * 2, 'intro_room_bg').setOrigin(0).setScale(2).setCrop(380, 100, 154, 160);
            const phone = this.add.sprite(260 + (432 - 380) * 2 + 32, (154 - 100) * 2 + 24, 'phone_1').setScale(2).play('phone_ring');
            const div = this.add.rectangle(259, 0, 1, H, 0x5a5070).setOrigin(0);
            L.add([room, phone, div]);
            WikaryAudio.ring(true);
            this.shake = this.time.addEvent({ delay: 40, loop: true, callback: () => { phone.x = 396 + Phaser.Math.Between(-3, 3); phone.y = 132 + Phaser.Math.Between(-2, 1); } });
            await this.wait(900); if (this.done) return;
            face.setTexture('wikary_kamil_closeup_open');
            await this.wait(1500); if (this.done) return;

            // 4. Sięga po telefon, rozmowa
            this.shake.remove(); WikaryAudio.ring(false); WikaryAudio.sfx('pick_phone');
            L = this.clear();
            L.add(this.add.image(0, 0, 'intro_room_bg').setOrigin(0));
            L.add(this.add.image(432, 154, 'phone_base_nohandset').setOrigin(0));
            L.add(this.add.sprite(330, 306, 'wikary_kamil_phone_1').setOrigin(0.5, 1).play('k_phone'));
            await this.wait(700); if (this.done) return;
            await this.say('proboszcz_closeup_open', 'PROBOSZCZ', 'Kamil, pilnie na plebanię! Tylko się nie spóźnij!'); if (this.done) return;
            await this.say('wikary_kamil_closeup_open', 'KAMIL', 'Już lecę, proszę księdza!'); if (this.done) return;
            await this.fade(250); if (this.done) return;

            // 5. Wybiega z domu, drzwi trzaskają
            L = this.clear();
            L.add(this.add.image(0, 0, 'intro_house_bg').setOrigin(0));
            const door = this.add.image(70, 70, 'door_2').setOrigin(0); L.add(door);
            const k = this.add.sprite(140, 302, 'wikary_kamil_run_1').setOrigin(0.5, 1).play('k_run'); L.add(k);
            let slammed = false;
            this.tweens.add({
                targets: k, x: W + 80, duration: 1700,
                onUpdate: () => {
                    if (!slammed && k.x > 270) {
                        slammed = true; door.setTexture('door_3'); WikaryAudio.sfx('slam');
                        this.cameras.main.shake(120, 0.006);
                        this.time.delayedCall(160, () => door.setTexture('door_1'));
                    }
                },
            });
            await this.wait(1800); if (this.done) return;
            this.finish();
        } catch (e) { if (!this.done) this.finish(); }
    }
    say(portrait, name, text) {
        return new Promise(res => {
            if (this.done) return res();
            this.dialog = dialogBox(this, { portrait, name, text, y: 12, hint: IS_TOUCH ? '' : 'ENTER' });
            this.dialogResolve = res;
            this.dialogAuto = this.time.delayedCall(900 + text.length * 55, () => this.closeDialog());
        });
    }
    closeDialog() {
        if (!this.dialog) return;
        if (this.dialogAuto) this.dialogAuto.remove(false);
        this.dialog.destroy(); this.dialog = null;
        const r = this.dialogResolve; this.dialogResolve = null; if (r) r();
    }
    advance() {
        if (this.done || !this.dialog) return;
        if (!this.dialog.done) this.dialog.finish(); else { WikaryAudio.sfx('click'); this.closeDialog(); }
    }
    skip() { if (!this.done) this.finish(); }
    finish() {
        if (this.done) return; this.done = true;
        WikaryAudio.ring(false);
        if (this.shake) this.shake.remove();
        this.time.removeAllEvents(); this.tweens.killAll();
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Level', { level: 0 }));
        this.cameras.main.fade(250, 0, 0, 0, true);
    }
}
