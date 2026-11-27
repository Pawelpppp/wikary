'use strict';
/* =====================================================================
   Grafiki kościoła, Level 2 i Level 3: docelowe klucze + zamienniki.
   Gra wczytuje plik tylko, gdy jest w ART_FILES (src/art_files.js, generowany przez
   tools/art_manifest.py). Brakujący plik = zamiennik z istniejących grafik
   (przyciemniony tint / skala), więc po wrzuceniu nowej grafiki do assets/ i
   odświeżeniu listy gra sama przełącza się na docelową wersję.
   size = rozmiar płótna docelowej grafiki (px), fb = zamiennik, tint = kolor zamiennika,
   stretch = rozciągnij zamiennik do size (przeszkody, dom), crop = wycinek zamiennika.
   ===================================================================== */
const ART = (function () {
    const EVE = 0x7a7aa8;                                   // wieczorny odcień zamienników tła
    const SPEC = {
        bg_church_interior: { size: [568, 320], fb: 'title_bg_church' },
        prop_collection_basket: { size: [32, 20], fb: null },
        bg_l2_sky: { size: [568, 320], fb: 'bg_l1_sky', tint: 0x6868a0 },
        bg_l2_city_far: { size: [568, 200], fb: 'bg_l1_city_far', tint: 0x5a5a8c },
        bg_l2_houses_near: { size: [568, 150], fb: 'bg_l1_houses_near', tint: EVE },
        tile_ground_wet: { size: [64, 32], fb: 'tile_ground_cobble', tint: 0x9090b0 },
        fx_rain_1: { size: [64, 64], fb: null }, fx_rain_2: { size: [64, 64], fb: null }, fx_rain_3: { size: [64, 64], fb: null },
        obstacle_dug_road: { size: [72, 24], fb: 'obstacle_fence', tint: 0x9a6a44, stretch: true },
        obstacle_fallen_tree: { size: [88, 36], fb: 'obstacle_fence', tint: 0x6a4a30, stretch: true },
        platform_plank: { size: [64, 10], fb: 'tile_ground_cobble', tint: 0xb08050, tile: true },
        house_krzysztof: { size: [260, 230], fb: 'intro_house_bg', crop: [0, 0, 350, 300], tint: 0x9a9ac0, stretch: true },
        house_krzysztof_door_1: { size: [0, 0], fb: 'door_1', tint: 0x9a9ac0 },
        house_krzysztof_door_2: { size: [0, 0], fb: 'door_2', tint: 0x9a9ac0 },
        boss_hans_bark_1: { size: [240, 150], fb: 'enemy_dog_run_1', tint: 0x8a6a6a },
        boss_hans_bark_2: { size: [240, 150], fb: 'enemy_dog_run_3', tint: 0x8a6a6a },
        boss_hans_hurt_1: { size: [240, 150], fb: 'enemy_dog_run_2', tint: 0xffa0a0 },
        boss_hans_defeated_1: { size: [240, 150], fb: 'enemy_dog_run_4', tint: 0x5a4444 },
    };
    const seq = (p, n, size, fb, tint) => { for (let i = 1; i <= n; i++) SPEC[p + i] = { size, fb: typeof fb === 'function' ? fb(i) : fb + i, tint }; };
    seq('enemy_crow_fly_', 4, [90, 60], 'enemy_bat_fly_', 0x4a4a62);
    seq('enemy_crow_dive_', 2, [90, 70], 'enemy_bat_fly_', 0x4a4a62);
    seq('enemy_boar_run_', 4, [150, 95], 'enemy_wolf_run_', 0xa87458);
    seq('enemy_wisp_', 4, [48, 64], 'fx_pray_aura_', 0x80e0ff);
    seq('item_znicz_', 4, [40, 56], 'candle_', 0xff9a80);
    seq('boss_hans_run_', 4, [240, 150], 'enemy_dog_run_', 0x8a6a6a);

    /* ---------- Level 3 „Noc duchów”: noc = przyciemnione grafiki Level 1, duchy = podbarwione wrogowie ---------- */
    const NIGHT = 0x5a5a90, GHOST = 0xb0e8ff, ZOMBIE = 0x7aa080, RAF_G = 0x90ffc0, RAF = 0xc8a890;
    Object.assign(SPEC, {
        bg_l3_sky: { size: [568, 320], fb: 'bg_l1_sky', tint: 0x34345e },
        bg_l3_city_far: { size: [568, 200], fb: 'bg_l1_city_far', tint: 0x2e2e56 },
        bg_l3_houses_near: { size: [568, 150], fb: 'bg_l1_houses_near', tint: 0x48487a },
        tile_ground_night: { size: [64, 32], fb: 'tile_ground_cobble', tint: 0x6a6a90 },
        fx_fog_1: { size: [284, 64], fb: null }, fx_fog_2: { size: [284, 64], fb: null },
        church_exterior_night: { size: [240, 250], fb: 'church_exterior', tint: NIGHT },
        church_door_night_hp_1: { size: [48, 72], fb: 'church_door_1', tint: NIGHT },
        church_door_night_hp_2: { size: [48, 72], fb: 'church_door_1', tint: 0x8a5a70 },
        church_door_night_hp_3: { size: [48, 72], fb: 'church_door_2', tint: 0x7a3048 },
        bg_l3_dawn: { size: [568, 320], fb: 'bg_l1_sky' },
        boss_rafal_hurt_1: { size: [120, 170], fb: 'proboszcz_idle_1', tint: 0xff9090 },
        rafal_closeup_open: { size: [192, 192], fb: 'proboszcz_closeup_open', tint: RAF },
        rafal_closeup_closed: { size: [192, 192], fb: 'proboszcz_closeup_closed', tint: RAF },
        rafal_closeup_confused: { size: [192, 192], fb: 'proboszcz_closeup_closed', tint: RAF },
        rafal_ghost_closeup_open: { size: [192, 192], fb: 'proboszcz_closeup_open', tint: RAF_G },
        rafal_ghost_closeup_closed: { size: [192, 192], fb: 'proboszcz_closeup_closed', tint: RAF_G },
    });
    const seqF = (p, n, size, fbs, tint) => { for (let i = 1; i <= n; i++) SPEC[p + i] = { size, fb: fbs[(i - 1) % fbs.length], tint }; };
    seq('enemy_duszek_', 4, [56, 64], 'enemy_wisp_', GHOST);
    seq('enemy_phantom_', 4, [114, 110], 'enemy_wolf_run_', 0x8090ff);
    seqF('enemy_phantom_attack_', 2, [114, 110], ['enemy_wolf_jump_1', 'enemy_wolf_jump_2'], 0xa0b0ff);
    seqF('enemy_upior_rise_', 4, [158, 130], ['krzysztof_idle_1', 'krzysztof_idle_2'], ZOMBIE);
    seqF('enemy_upior_walk_', 4, [158, 130], ['krzysztof_talk_1', 'krzysztof_idle_1', 'krzysztof_talk_2', 'krzysztof_idle_2'], ZOMBIE);
    seq('fx_ghost_poof_', 4, [64, 64], 'fx_enemy_poof_', 0xa0ffe0);
    seq('item_blessing_', 4, [40, 56], 'fx_bless_', 0xa0e0ff);
    seq('fx_blessing_wave_', 4, [120, 120], 'fx_pray_aura_', 0xc0f0ff);
    seqF('proboszcz_cast_', 3, [160, 164], ['proboszcz_bless_1', 'proboszcz_bless_2', 'proboszcz_bless_2'], null);
    seq('fx_proboszcz_spell_', 3, [40, 40], 'fx_bless_', 0x9ad0ff);
    seqF('proboszcz_tired_sit_', 2, [106, 164], ['proboszcz_idle_1', 'proboszcz_idle_2'], 0x9a9ab0);
    // Kamil błogosławi w Level 3 (110×180); stare wikary_kamil_bless_1..4 zostają dla krzyża / znicza / ultimate
    seqF('wikary_kamil_blessing_', 3, [110, 180], ['wikary_kamil_bless_1', 'wikary_kamil_bless_2', 'wikary_kamil_bless_3'], null);
    seqF('boss_rafal_float_', 4, [120, 170], ['proboszcz_idle_1', 'proboszcz_idle_2'], RAF_G);
    seqF('boss_rafal_walk_', 4, [120, 170], ['proboszcz_idle_1', 'proboszcz_idle_2'], RAF_G);
    seqF('boss_rafal_swing_', 3, [150, 170], ['proboszcz_bless_1', 'proboszcz_bless_2', 'proboszcz_talk_2'], RAF_G);
    seqF('boss_rafal_throw_', 2, [130, 170], ['proboszcz_talk_1', 'proboszcz_talk_2'], RAF_G);
    seqF('boss_rafal_scream_', 2, [130, 170], ['proboszcz_talk_2', 'proboszcz_talk_1'], 0xc0ffd0);
    seqF('boss_rafal_exorcise_', 4, [130, 170], ['proboszcz_bless_1', 'proboszcz_bless_2'], 0xffffff);
    seq('proj_key_', 2, [24, 12], 'fx_cross_', 0xe0c060);
    seq('fx_rafal_ghost_', 3, [64, 96], 'enemy_wisp_', RAF_G);
    seqF('rafal_dazed_', 2, [100, 164], ['proboszcz_idle_1', 'proboszcz_idle_2'], 0xb0a090);
    seqF('rafal_idle_', 2, [100, 164], ['proboszcz_idle_1', 'proboszcz_idle_2'], RAF);
    seqF('rafal_talk_', 2, [118, 164], ['proboszcz_talk_1', 'proboszcz_talk_2'], RAF);
    seqF('rafal_walk_', 4, [100, 164], ['proboszcz_idle_1', 'proboszcz_idle_2'], RAF);

    /* ---------- Czerwony Diabeł (koniec L3 i L4) ---------- */
    const DEV = 0xff5040;
    seqF('devil_rise_', 6, [98, 152], ['boss_rafal_exorcise_4', 'boss_rafal_exorcise_3', 'boss_rafal_exorcise_2', 'boss_rafal_exorcise_1', 'boss_rafal_float_1', 'boss_rafal_float_2'], DEV);
    seqF('devil_idle_', 2, [98, 152], ['boss_rafal_float_1', 'boss_rafal_float_2'], DEV);
    seqF('devil_talk_', 2, [98, 152], ['boss_rafal_scream_1', 'boss_rafal_scream_2'], DEV);
    seqF('devil_fly_', 4, [118, 148], ['boss_rafal_float_1', 'boss_rafal_float_2', 'boss_rafal_float_3', 'boss_rafal_float_4'], DEV);
    seq('fx_brimstone_', 4, [80, 80], 'fx_enemy_poof_', 0xffa040);
    seqF('fx_devil_exit_rafal_', 4, [90, 120], ['fx_rafal_ghost_1', 'fx_rafal_ghost_2', 'fx_rafal_ghost_3', 'fx_rafal_ghost_2'], DEV);
    Object.assign(SPEC, {
        devil_closeup_open: { size: [192, 192], fb: 'rafal_ghost_closeup_open', tint: 0xff6050 },
        devil_closeup_closed: { size: [192, 192], fb: 'rafal_ghost_closeup_closed', tint: 0xff6050 },
        devil_closeup_angry: { size: [192, 192], fb: 'rafal_ghost_closeup_open', tint: 0xff3020 },
    });

    /* ---------- Level 4 „Bagna”: zmierzch, zielona mgła, komary, żaby, bagienne stwory, Adrian ---------- */
    const SW = 0x6a9050, ADR = 0xb090f0;
    Object.assign(SPEC, {
        bg_l4_sky: { size: [568, 320], fb: 'bg_l1_sky', tint: 0x7a9a6a },
        bg_l4_far: { size: [568, 200], fb: 'bg_l1_city_far', tint: 0x405a40 },
        bg_l4_near: { size: [568, 150], fb: 'bg_l1_houses_near', tint: 0x587a50 },
        tile_ground_swamp: { size: [64, 32], fb: 'tile_ground_cobble', tint: 0x7a8a58 },
        bog_bank_left: { size: [16, 32], fb: 'water_bank_left', tint: SW },
        bog_bank_right: { size: [16, 32], fb: 'water_bank_right', tint: SW },
        platform_lily: { size: [48, 12], fb: 'platform_plank', tint: 0x50b048, stretch: true },
        platform_log: { size: [80, 14], fb: 'platform_plank', tint: 0x8a6038, stretch: true },
        obstacle_stump: { size: [40, 32], fb: 'obstacle_trash_bin', tint: 0x7a5a3a, stretch: true },
        obstacle_reeds: { size: [48, 40], fb: 'obstacle_fence', tint: 0x6a9a40, stretch: true },
        fx_swamp_fog_1: { size: [284, 64], fb: 'fx_fog_1', tint: 0x90d080 },
        fx_swamp_fog_2: { size: [284, 64], fb: 'fx_fog_2', tint: 0x90d080 },
        hut_adrian: { size: [260, 240], fb: 'house_krzysztof', tint: 0x7a8a68, stretch: true },
        hut_adrian_door_1: { size: [18, 54], fb: 'house_krzysztof_door_1', tint: 0x7a8a68 },
        hut_adrian_door_2: { size: [18, 54], fb: 'house_krzysztof_door_2', tint: 0x7a8a68 },
        adrian_hurt_1: { size: [132, 164], fb: 'krzysztof_idle_1', tint: 0xff9090 },
        adrian_defeated_1: { size: [100, 164], fb: 'krzysztof_idle_2', tint: 0x6a5a7a },
        adrian_closeup_open: { size: [192, 192], fb: 'krzysztof_closeup_open', tint: 0xc0a0ff },
        adrian_closeup_closed: { size: [192, 192], fb: 'krzysztof_closeup_closed', tint: 0xc0a0ff },
        adrian_closeup_ashamed: { size: [192, 192], fb: 'krzysztof_closeup_ashamed', tint: 0xc0a0ff },
        car_1: { size: [219, 100], fb: null }, car_2: { size: [219, 100], fb: null },
        car_empty_1: { size: [219, 100], fb: null }, car_empty_2: { size: [219, 100], fb: null },
    });
    seq('tile_bog_', 4, [64, 32], 'tile_water_', 0x5a7a30);
    seq('enemy_mosquito_small_', 3, [40, 32], 'enemy_bat_fly_', 0xb0a070);
    seq('enemy_mosquito_big_', 4, [90, 74], 'enemy_crow_fly_', 0xa09060);
    seq('enemy_mosquito_big_sting_', 2, [90, 74], 'enemy_crow_dive_', 0xc08060);
    seq('enemy_frog_', 4, [136, 84], 'enemy_boar_run_', 0x60b040);
    seqF('enemy_frog_tongue_', 2, [230, 84], ['enemy_boar_run_1', 'enemy_boar_run_2'], 0xa0d060);
    seq('enemy_bogman_rise_', 4, [118, 130], 'enemy_upior_rise_', 0x80a050);
    seq('enemy_bogman_walk_', 4, [118, 130], 'enemy_upior_walk_', 0x80a050);
    seq('fx_splat_', 4, [48, 48], 'fx_ghost_poof_', 0x90c050);
    seq('item_repellent_', 4, [40, 56], 'item_blessing_', 0x80ffb0);
    seqF('adrian_idle_', 2, [100, 164], ['krzysztof_idle_1', 'krzysztof_idle_2'], ADR);
    seqF('adrian_talk_', 2, [110, 164], ['krzysztof_talk_1', 'krzysztof_talk_2'], ADR);
    seqF('adrian_cast_', 3, [140, 164], ['krzysztof_coin_1', 'krzysztof_coin_2', 'krzysztof_talk_2'], ADR);
    seq('proj_adrian_spell_', 3, [40, 40], 'fx_bless_', 0xc060ff);

    /* ---------- Level 5 „Bernard” (Solniczki): Benek matematyk, motor, karetka, przechodzień, sanitariusze ----------
       Obie paczki grafik (postacie, motor, karetka, pociski, portrety; tła Solniczek, droga, znak, konie,
       ujęcie z przodu auta) są w repo. */
    const BEN = 0xd0d0ff;
    seqF('benek_idle_', 2, [140, 164], ['adrian_idle_1', 'adrian_idle_2'], BEN);
    seqF('benek_walk_', 4, [140, 164], ['adrian_idle_1', 'adrian_idle_2'], BEN);
    seqF('benek_cast_', 3, [140, 164], ['adrian_cast_1', 'adrian_cast_2', 'adrian_cast_3'], BEN);
    seqF('benek_possessed_', 4, [140, 164], ['adrian_cast_1', 'adrian_cast_2'], 0xff9090);
    seqF('passerby_idle_', 2, [140, 164], ['krzysztof_idle_1', 'krzysztof_idle_2'], 0xffe0a0);
    seqF('paramedic_a_', 2, [140, 164], ['krzysztof_idle_1', 'krzysztof_idle_2'], 0xff8040);
    seqF('paramedic_b_', 2, [140, 164], ['krzysztof_idle_1', 'krzysztof_idle_2'], 0xff8040);
    seqF('devil_smoke_', 3, [90, 120], ['fx_rafal_ghost_1', 'fx_rafal_ghost_2', 'fx_rafal_ghost_3'], DEV);
    seqF('moto_red_', 2, [200, 130], ['car_1', 'car_2'], 0xff4040);
    seqF('moto_crash_', 3, [200, 150], ['car_1', 'car_2', 'car_empty_1'], 0xff4040);
    seqF('ambulance_', 2, [220, 110], ['car_empty_1', 'car_empty_2'], 0xffffff);
    seqF('proj_triangle_', 2, [64, 56], ['fx_bless_1', 'fx_bless_2'], 0xff6080);
    seqF('horses_', 4, [68, 65], ['enemy_boar_run_1', 'enemy_boar_run_2'], null);          // [LPC] Horses, bluecarrot16 (CC-BY 3.0)
    seqF('horses_white_', 4, [68, 65], ['enemy_boar_run_1', 'enemy_boar_run_2'], null);
    Object.assign(SPEC, {
        benek_hurt_1: { size: [140, 164], fb: 'adrian_hurt_1', tint: BEN },
        benek_defeated_1: { size: [164, 100], fb: 'adrian_defeated_1', tint: BEN },
        passerby_phone_1: { size: [140, 164], fb: 'krzysztof_talk_1', tint: 0xffe0a0 },
        proj_integral: { size: [20, 28], fb: 'fx_bless_1', tint: 0xff6080 },
        proj_sqrt: { size: [20, 28], fb: 'fx_bless_2', tint: 0xff6080 },
        benek_closeup_normal: { size: [192, 192], fb: 'krzysztof_closeup_open', tint: BEN },
        kamil_praying_portrait: { size: [192, 192], fb: 'wikary_kamil_closeup_closed' },
        benek_closeup_possessed: { size: [192, 192], fb: 'krzysztof_closeup_open', tint: 0xff8080 },
        benek_closeup_hurt: { size: [192, 192], fb: 'krzysztof_closeup_ashamed', tint: BEN },
        passerby_closeup: { size: [192, 192], fb: 'krzysztof_closeup_open', tint: 0xffe0a0 },
        // paczka 2: tła wsi, droga, znak, ujęcie z przodu auta (zamienniki tylko awaryjnie, bez podbarwiania)
        bg_solniczki_sky: { size: [568, 320], fb: 'bg_l1_sky' },
        bg_solniczki_far: { size: [568, 200], fb: 'bg_l1_city_far' },
        bg_solniczki_near: { size: [568, 150], fb: 'bg_l1_houses_near' },
        tile_ground_road: { size: [64, 32], fb: 'tile_ground_cobble' },
        sign_solniczki: { size: [96, 64], fb: null },
        car_front_kamil: { size: [568, 320], fb: 'wikary_kamil_closeup_open' },
    });

    const has = (k) => typeof ART_FILES !== 'undefined' && Object.prototype.hasOwnProperty.call(ART_FILES, k);
    const api = {
        SPEC, has,
        /** klucz tekstury do użycia (docelowy albo zamiennik; null = pomiń) */
        key(k) { return has(k) ? k : (SPEC[k] ? SPEC[k].fb : k); },
        tint(k) { return has(k) || !SPEC[k] ? null : (SPEC[k].tint || null); },
        isFallback(k) { return !has(k) && !!SPEC[k]; },
        /** klucze klatek animacji prefix1..n (po zamianie) */
        frames(prefix, n) { const a = []; for (let i = 1; i <= n; i++) { const k = api.key(prefix + i); if (k) a.push(k); } return a; },
        /** mnożnik skali, żeby zamiennik miał rozmiar docelowej grafiki (po wysokości) */
        mul(scene, k) {
            if (!api.isFallback(k)) return 1;
            const s = SPEC[k], fb = s.fb; if (!fb || !s.size[1] || !scene.textures.exists(fb)) return 1;
            const h = s.crop ? s.crop[3] : scene.textures.get(fb).getSourceImage().height;
            return s.size[1] / h;
        },
        /** dopasowuje obiekt (image/sprite) do klucza k: skala, tint, wycinek; ox/oy = origin docelowy */
        fit(scene, obj, k, base, ox, oy) {
            base = base || 1; ox = ox === undefined ? 0.5 : ox; oy = oy === undefined ? 0.5 : oy;
            obj.setOrigin(ox, oy);
            if (!api.isFallback(k)) { obj.setScale(base); return obj; }
            const s = SPEC[k], src = scene.textures.get(s.fb).getSourceImage();
            let fw = src.width, fh = src.height;
            if (s.crop) {
                const [cx, cy, cw, ch] = s.crop;
                obj.setCrop(cx, cy, cw, ch);
                obj.setOrigin((cx + cw * ox) / fw, (cy + ch * oy) / fh);
                fw = cw; fh = ch;
            }
            if (s.stretch && s.size[0]) obj.setScale(base * s.size[0] / fw, base * s.size[1] / fh);
            else obj.setScale(base * api.mul(scene, k));
            if (s.tint) obj.setTint(s.tint);
            return obj;
        },
        image(scene, x, y, k, base, ox, oy) {
            const key = api.key(k); if (!key || !scene.textures.exists(key)) return null;
            return api.fit(scene, scene.add.image(x, y, key), k, base, ox, oy);
        },
        /** pliki do wczytania: wszystkie docelowe klucze z SPEC, które już są w repo */
        toLoad() { return Object.keys(SPEC).filter(has).map(k => [k, ART_FILES[k]]); },
        /** lista docelowych grafik, które jeszcze zastępują zamienniki */
        missing() { return Object.keys(SPEC).filter(k => !has(k)); },
    };
    return api;
})();
