'use strict';
/* =====================================================================
   Grafiki Level 2 i kościoła: docelowe klucze + zamienniki.
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
