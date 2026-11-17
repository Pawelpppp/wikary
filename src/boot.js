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
            ...range('wikary_kamil_pray_', 1, 2), 'wikary_kamil_crouch_down_1', ...range('wikary_kamil_crouch_', 1, 2), ...range('wikary_kamil_pray_back_', 1, 2), ...range('wikary_kamil_phone_', 1, 3),
            ...range('fx_cross_', 1, 4), ...range('fx_bless_', 1, 6), ...range('fx_pray_aura_', 1, 4),
            ...range('candle_', 1, 8), ...range('door_', 1, 3), 'phone_1', 'phone_2', 'phone_base_nohandset',
            // Level 1: wrogowie, efekty, znajdźki (skala postaci, x0.45)
            ...range('enemy_dog_run_', 1, 4), ...range('enemy_wolf_run_', 1, 4), ...range('enemy_wolf_jump_', 1, 2),
            ...range('enemy_bat_fly_', 1, 4), ...range('enemy_spider_', 1, 4), 'enemy_spider_thread',
            ...range('fx_enemy_poof_', 1, 4), ...range('item_diamond_', 1, 6), ...range('item_lightning_', 1, 4),
            // kościół i Level 2: proboszcz, Krzysztof, ogień
            ...range('proboszcz_idle_', 1, 2), ...range('proboszcz_talk_', 1, 2), ...range('proboszcz_bless_', 1, 2),
            ...range('krzysztof_idle_', 1, 2), ...range('krzysztof_talk_', 1, 2), ...range('krzysztof_coin_', 1, 2),
            ...range('fx_fireball_', 1, 4), ...range('wikary_kamil_attack_fire_', 1, 4),
        ];
        sprites.forEach(k => this.load.image(k, SPR + k + '.png'));
        ['title_bg_church', 'intro_room_bg', 'intro_house_bg',
            // Level 1: tła, ziemia, woda, przeszkody, kościół, efekty (1:1)
            'bg_l1_sky', 'bg_l1_city_far', 'bg_l1_houses_near', 'tile_ground_cobble', ...range('tile_water_', 1, 4),
            'water_bank_left', 'water_bank_right', 'obstacle_fence', 'obstacle_trash_bin', 'obstacle_puddle',
            'church_exterior', ...range('church_door_', 1, 3), ...range('fx_lightning_strike_', 1, 3),
            ...range('fx_grom_pillar_', 1, 4), 'fx_grom_cross',
        ].forEach(k => this.load.image(k, GAME + k + '.png'));
        ['wikary_kamil_closeup_open', 'wikary_kamil_closeup_closed', 'proboszcz_closeup_open', 'proboszcz_closeup_closed',
            'krzysztof_closeup_open', 'krzysztof_closeup_closed', 'krzysztof_closeup_ashamed']
            .forEach(k => this.load.image(k, POR + k + '.png'));
        // docelowe grafiki Level 2 / kościoła, które już są w repo (reszta = zamienniki z src/art.js)
        ART.toLoad().forEach(([k, path]) => this.load.image(k, path));
    }
    create() {
        const A = (key, frames, fps, repeat) => this.anims.create({ key, frames: frames.map(k => ({ key: k })), frameRate: fps, repeat: repeat === undefined ? -1 : repeat });
        A('k_run', range('wikary_kamil_run_', 1, 6), 12);
        A('k_idle', range('wikary_kamil_idle_', 1, 2), 2);
        A('k_flip', range('wikary_kamil_flip_', 1, 6), 16, 0);
        A('k_attack', range('wikary_kamil_attack_cross_', 1, 4), 18, 0);
        A('k_bless', range('wikary_kamil_bless_', 1, 4), 7, 0);
        A('k_crouch', range('wikary_kamil_crouch_', 1, 2), 2);
        A('k_pray', range('wikary_kamil_pray_', 1, 2), 2);
        A('k_pray_back', range('wikary_kamil_pray_back_', 1, 2), 1.5);
        A('k_phone', range('wikary_kamil_phone_', 1, 3), 3, 0);
        A('fx_cross', range('fx_cross_', 1, 4), 14);
        A('fx_bless', range('fx_bless_', 1, 6), 10, 0);
        A('fx_aura', range('fx_pray_aura_', 1, 4), 8);
        A('candle', range('candle_', 1, 8), 10);
        A('phone_ring', ['phone_1', 'phone_2'], 14);
        A('dog_run', range('enemy_dog_run_', 1, 4), 12);
        A('wolf_run', range('enemy_wolf_run_', 1, 4), 9);
        A('bat_fly', range('enemy_bat_fly_', 1, 4), 10);
        A('spider_wiggle', range('enemy_spider_', 1, 4), 6);
        A('poof', range('fx_enemy_poof_', 1, 4), 16, 0);
        A('diamond_spin', range('item_diamond_', 1, 6), 10);
        A('lightning_item', range('item_lightning_', 1, 4), 8);
        A('lightning_strike', range('fx_lightning_strike_', 1, 3), 14, 0);
        A('grom_pillar', range('fx_grom_pillar_', 1, 4), 12);
        // kościół, Level 2 (klatki docelowe albo zamienniki)
        A('k_attack_fire', range('wikary_kamil_attack_fire_', 1, 4), 16, 0);
        A('fireball', range('fx_fireball_', 1, 4), 14);
        A('proboszcz_idle', range('proboszcz_idle_', 1, 2), 2);
        A('proboszcz_talk', range('proboszcz_talk_', 1, 2), 5);
        A('proboszcz_bless', range('proboszcz_bless_', 1, 2), 3);
        A('krzysztof_idle', range('krzysztof_idle_', 1, 2), 2);
        A('krzysztof_talk', range('krzysztof_talk_', 1, 2), 5);
        A('krzysztof_coin', range('krzysztof_coin_', 1, 2), 3);
        A('crow_fly', ART.frames('enemy_crow_fly_', 4), 10);
        A('crow_dive', ART.frames('enemy_crow_dive_', 2), 8);
        A('boar_run', ART.frames('enemy_boar_run_', 4), 10);
        A('wisp', ART.frames('enemy_wisp_', 4), 8);
        A('znicz', ART.frames('item_znicz_', 4), 8);
        A('hans_run', ART.frames('boss_hans_run_', 4), 10);
        A('hans_bark', ART.frames('boss_hans_bark_', 2), 8);
        const target = DEBUG && (location.search.match(/[?&]scene=(\w+)/) || [])[1];
        const lvl = DEBUG && +((location.search.match(/[?&]level=(\d)/) || [])[1] || 0);
        if (lvl && LEVELS[lvl - 1]) { debugStart(this, lvl - 1); return; }
        this.scene.start(target && this.scene.get(target) ? target : 'Title');
    }
}
