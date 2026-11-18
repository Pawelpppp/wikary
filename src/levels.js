'use strict';
/* =====================================================================
   Poziomy opisane danymi. Pozycje "at" to odległość od startu poziomu
   (w px), niezależnie od kierunku: dir 1 = w prawo, dir -1 = w lewo
   (Level 2 pójdzie w lewo tą samą drogą). Wysokość "h" = ile px nad ziemią.
   ===================================================================== */
const row = (at, n, gap, h) => Array.from({ length: n }, (_, i) => ({ type: 'diamond', at: at + i * gap, h }));
const arc = (at, n, gap, h) => Array.from({ length: n }, (_, i) => ({ type: 'diamond', at: at + i * gap, h: h + Math.round(Math.sin((i / (n - 1)) * Math.PI) * 34) }));

const LEVELS = [
    {
        id: 1,
        name: 'DROGA NA PLEBANIĘ',
        dir: 1,
        length: 5700,
        startAt: 110,
        music: 'level1',
        bg: { sky: 'bg_l1_sky', far: 'bg_l1_city_far', near: 'bg_l1_houses_near', ground: 'tile_ground_cobble', water: 'tile_water_', end: 'church_exterior' },
        hints: [
            { at: 0, text: '\u2192 = BIEG   SPACJA = SKOK', touch: '> = BIEG   ^ = SKOK', joy: 'JOYSTICK = BIEG   DOTKNIJ = SKOK', ms: 3200 },
            { at: 640, text: 'RZEKA! 2\u00d7 SPACJA = SALTO', touch: 'RZEKA! 2\u00d7 SKOK = SALTO', joy: 'RZEKA! DOTKNIJ 2\u00d7 = SALTO', ms: 3200 },
        ],
        rivers: [{ at: 1000, w: 150 }],
        obstacles: [
            { type: 'fence', at: 430 }, { type: 'puddle', at: 640 }, { type: 'trash_bin', at: 820 },
            { type: 'fence', at: 1750 }, { type: 'puddle', at: 2080 }, { type: 'trash_bin', at: 2420 },
            { type: 'fence', at: 3000 }, { type: 'puddle', at: 3300 }, { type: 'trash_bin', at: 3620 },
            { type: 'fence', at: 4200 }, { type: 'puddle', at: 4520 }, { type: 'trash_bin', at: 4820 },
        ],
        items: [
            ...row(250, 4, 26, 18), ...arc(395, 5, 18, 50), ...row(700, 3, 26, 18),
            ...arc(1010, 6, 26, 80),                       // nad rzeką - zachęta do salta
            { type: 'cross', at: 1250 },                    // pierwszy item: krzyż (piorun + przyciemnienie)
            ...row(1450, 4, 26, 18), ...arc(1715, 5, 18, 50), { type: 'lightning', at: 1950, h: 26 },
            ...row(2200, 5, 26, 60), ...arc(2385, 5, 18, 50), ...row(2650, 4, 26, 18),
            ...arc(2965, 5, 18, 50), { type: 'lightning', at: 3200, h: 26 }, ...row(3400, 5, 26, 70),
            ...arc(3585, 5, 18, 50), ...row(3850, 6, 26, 18), ...arc(4165, 5, 18, 50),
            { type: 'lightning', at: 4400, h: 26 }, ...row(4620, 4, 26, 60), ...arc(4785, 5, 18, 50), ...row(5050, 6, 26, 18),
        ],
        enemies: { from: 1420, to: 5150, set: ['dog', 'wolf', 'bat', 'spider'] },
        endAt: 5450,                                        // drzwi kościoła (środek drzwi)
        endText: 'Zdążyłem!',
        next: 1,                                            // po podsumowaniu: kościół (rozmowa) -> Level 2
    },
    {
        id: 2,
        name: 'WIZYTA U SKĄPEGO PARAFIANINA',
        dir: -1,                                            // ekran przesuwa się w lewo, tą samą drogą
        length: 6400,
        startAt: 110,
        music: 'level2',
        weather: { rain: true, lightning: true },
        bg: { sky: 'bg_l2_sky', far: 'bg_l2_city_far', near: 'bg_l2_houses_near', ground: 'tile_ground_wet', water: 'tile_water_', end: 'house_krzysztof' },
        waterTint: 0x8a92c0,
        hints: [
            { at: 0, text: '\u2190 = BIEG   DOM KRZYSZTOFA JEST NA KOŃCU DROGI', touch: '< = BIEG   DO KRZYSZTOFA!', joy: 'JOYSTICK = BIEG   DO KRZYSZTOFA!', ms: 3200 },
            { at: 2980, text: 'KŁADKA! WSKOCZ, GDY PODPŁYNIE', touch: 'KŁADKA! WSKOCZ, GDY PODPŁYNIE', ms: 3000 },
        ],
        rivers: [{ at: 1150, w: 150 }, { at: 3300, w: 330, plank: true }],
        obstacles: [
            { type: 'dug_road', at: 420 }, { type: 'puddle', at: 650 }, { type: 'fallen_tree', at: 880 },
            { type: 'trash_bin', at: 1500 }, { type: 'dug_road', at: 1720 }, { type: 'puddle', at: 1900 }, { type: 'fallen_tree', at: 2120 },
            { type: 'fence', at: 2380 }, { type: 'puddle', at: 2700 }, { type: 'dug_road', at: 2900 },
            { type: 'fallen_tree', at: 3820 }, { type: 'puddle', at: 4020 }, { type: 'dug_road', at: 4250 }, { type: 'trash_bin', at: 4480 },
            { type: 'fallen_tree', at: 4720 }, { type: 'puddle', at: 4950 }, { type: 'dug_road', at: 5180 }, { type: 'fence', at: 5420 },
        ],
        items: [
            ...row(240, 4, 26, 18), ...arc(870, 5, 18, 56), ...arc(1160, 6, 26, 80),
            ...row(1550, 4, 26, 60), { type: 'lightning', at: 1800, h: 26 }, ...arc(2110, 5, 18, 56),
            { type: 'znicz', at: 2560 },                    // znicz: piorun + przyciemnienie -> ogień (Z)
            ...row(2750, 4, 26, 18), ...row(3330, 8, 34, 50),          // nad kładką
            ...arc(3810, 5, 18, 56), ...row(4100, 5, 26, 18), { type: 'lightning', at: 4380, h: 26 },
            ...arc(4710, 5, 18, 56), ...row(5000, 5, 26, 60), ...arc(5410, 5, 18, 50), ...row(5600, 4, 26, 18),
        ],
        enemies: { from: 300, to: 5700, set: ['dog', 'wolf', 'bat', 'crow', 'boar', 'spider'], late: { at: 3700, set: ['crow', 'boar', 'wisp', 'wolf', 'bat', 'wisp'] } },
        spawn: { minMs: 1000, maxMs: 2000, maxAlive: 8 },
        arenaAt: 5880,                                      // tu ekran staje: dom Krzysztofa i walka z Hansem
        endAt: 6250,                                        // drzwi domu Krzysztofa
        boss: 'hans',
        next: null,
    },
];
