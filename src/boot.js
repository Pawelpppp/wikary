'use strict';
/* Ładowanie grafik i tworzenie animacji. */
const SPR = 'assets/sprites/', GAME = 'assets/game/', POR = 'assets/portraits/';
const range = (p, a, b) => Array.from({ length: b - a + 1 }, (_, i) => p + (a + i));

class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }
    preload() {
        const W = CFG.W, H = CFG.H;
        const bar = this.add.rectangle(W / 2 - 100, H / 2, 0, 8, 0xd8a640).setOrigin(0, 0.5);
        this.add.rectangle(W / 2, H / 2, 204, 12).setStrokeStyle(2, 0xd8a640);
        txt(this, W / 2, H / 2 - 22, 'ŁADOWANIE...', 8, '#ffd040');
        this.load.on('progress', (v) => bar.width = 200 * v);

        const sprites = [
            ...range('wikary_kamil_run_', 1, 6), ...range('wikary_kamil_idle_', 1, 2), ...range('wikary_kamil_jump_', 1, 3),
            ...range('wikary_kamil_flip_', 1, 6), ...range('wikary_kamil_attack_cross_', 1, 4), ...range('wikary_kamil_bless_', 1, 4),
            ...range('wikary_kamil_pray_', 1, 2), ...range('wikary_kamil_pray_back_', 1, 2), ...range('wikary_kamil_phone_', 1, 3),
            ...range('fx_cross_', 1, 4), ...range('fx_bless_', 1, 6), ...range('fx_pray_aura_', 1, 4),
            ...range('candle_', 1, 8), ...range('door_', 1, 3), 'phone_1', 'phone_2', 'phone_base_nohandset',
            // tymczasowe zastępstwa z Fibi-Run (do wymiany na grafiki od artysty)
            'fibi_walk_1', 'fibi_walk_2', 'freeze_spell_1', 'freeze_spell_2',
        ];
        sprites.forEach(k => this.load.image(k, SPR + k + '.png'));
        ['title_bg_church', 'intro_room_bg', 'intro_house_bg', 'car_empty_1', 'rafal_kastet_spin_1', 'rafal_kastet_spin_2']
            .forEach(k => this.load.image(k, GAME + k + '.png'));
        ['wikary_kamil_closeup_open', 'wikary_kamil_closeup_closed', 'proboszcz_closeup_open', 'proboszcz_closeup_closed']
            .forEach(k => this.load.image(k, POR + k + '.png'));
    }
    create() {
        const A = (key, frames, fps, repeat) => this.anims.create({ key, frames: frames.map(k => ({ key: k })), frameRate: fps, repeat: repeat === undefined ? -1 : repeat });
        A('k_run', range('wikary_kamil_run_', 1, 6), 12);
        A('k_idle', range('wikary_kamil_idle_', 1, 2), 2);
        A('k_flip', range('wikary_kamil_flip_', 1, 6), 16, 0);
        A('k_attack', range('wikary_kamil_attack_cross_', 1, 4), 18, 0);
        A('k_bless', range('wikary_kamil_bless_', 1, 4), 7, 0);
        A('k_pray', range('wikary_kamil_pray_', 1, 2), 2);
        A('k_pray_back', range('wikary_kamil_pray_back_', 1, 2), 1.5);
        A('k_phone', range('wikary_kamil_phone_', 1, 3), 3, 0);
        A('fx_cross', range('fx_cross_', 1, 4), 14);
        A('fx_bless', range('fx_bless_', 1, 6), 10, 0);
        A('fx_aura', range('fx_pray_aura_', 1, 4), 8);
        A('candle', range('candle_', 1, 8), 10);
        A('phone_ring', ['phone_1', 'phone_2'], 14);
        A('dog_run', ['fibi_walk_1', 'fibi_walk_2'], 8);
        A('bat_fly', ['freeze_spell_1', 'freeze_spell_2'], 8);
        A('spider_spin', ['rafal_kastet_spin_1', 'rafal_kastet_spin_2'], 6);
        // wycinki z teł (tymczasowe: ziemia i miasto w tle poziomu)
        const hb = this.textures.get('intro_house_bg');
        if (!hb.has('cobble')) hb.add('cobble', 0, 0, 288, 330, 32);
        if (!hb.has('city')) hb.add('city', 0, 334, 0, 234, 286);
        const rb = this.textures.get('intro_room_bg');
        if (!rb.has('water')) rb.add('water', 0, 340, 10, 200, 100);
        hb.firstFrame = '__BASE'; rb.firstFrame = '__BASE';      // dodanie wycinka zmienia domyślną klatkę - przywróć całe tło
        const target = DEBUG && (location.search.match(/[?&]scene=(\w+)/) || [])[1];
        this.scene.start(target && this.scene.get(target) ? target : 'Title');
    }
}
