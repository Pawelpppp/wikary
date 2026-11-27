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
        next: 1, nextVia: 'Church',                         // po podsumowaniu: kościół (rozmowa) -> Level 2
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
        next: 2,                                            // po podsumowaniu: od razu Level 3
    },
    {
        id: 3,
        name: 'NOC DUCHÓW',
        dir: 1,                                             // znów w prawo: ta sama droga z powrotem, na końcu kościół
        length: 6400,
        startAt: 110,
        music: 'level3',
        weather: { fog: true },
        night: true,
        bg: { sky: 'bg_l3_sky', far: 'bg_l3_city_far', near: 'bg_l3_houses_near', ground: 'tile_ground_night', water: 'tile_water_', end: 'church_exterior_night', dawn: 'bg_l3_dawn' },
        waterTint: 0x6a70a8,
        hints: [
            { at: 0, text: '\u2192 = BIEG   NOC DUCHÓW: WRACAJ DO KOŚCIOŁA!', touch: '> = BIEG   DO KOŚCIOŁA!', joy: 'JOYSTICK = BIEG   DO KOŚCIOŁA!', ms: 3200 },
            { at: 700, text: 'DUCHÓW NIE SPALISZ: NA DUCHY KRZYŻ (ALT)', touch: 'NA DUCHY: KRZYŻ', ms: 3000 },
            { at: 2580, text: 'KŁADKA! WSKOCZ, GDY PODPŁYNIE', touch: 'KŁADKA! WSKOCZ, GDY PODPŁYNIE', ms: 3000 },
        ],
        rivers: [{ at: 2770, w: 330, plank: true }, { at: 5100, w: 150 }],
        obstacles: [
            { type: 'fence', at: 980 }, { type: 'dug_road', at: 1220 }, { type: 'puddle', at: 1450 }, { type: 'fallen_tree', at: 1680 },
            { type: 'trash_bin', at: 1920 }, { type: 'dug_road', at: 2150 }, { type: 'puddle', at: 2380 }, { type: 'fallen_tree', at: 2580 },
            { type: 'dug_road', at: 3500 }, { type: 'puddle', at: 3700 }, { type: 'fence', at: 4020 }, { type: 'fallen_tree', at: 4280 },
            { type: 'puddle', at: 4500 }, { type: 'dug_road', at: 4680 }, { type: 'trash_bin', at: 4900 }, { type: 'fallen_tree', at: 5520 },
        ],
        items: [
            ...row(260, 4, 26, 18), ...arc(560, 5, 18, 50), ...arc(965, 5, 18, 56), ...row(1300, 4, 26, 60),
            ...arc(1665, 5, 18, 56), { type: 'lightning', at: 2000, h: 26 }, ...row(2250, 4, 26, 18),
            ...row(2800, 8, 34, 50),                        // nad kładką
            { type: 'blessing', at: 3300 },                 // błogosławieństwo: piorun + przyciemnienie -> trzecia moc (X)
            ...arc(3485, 5, 18, 56), ...row(3800, 5, 26, 18), ...arc(4005, 5, 18, 56), ...arc(4265, 5, 18, 56),
            { type: 'lightning', at: 4560, h: 26 }, ...arc(5110, 6, 26, 80), ...arc(5505, 5, 18, 56),
        ],
        enemies: {
            from: 300, to: 5650,
            stages: [                                       // im bliżej kościoła, tym więcej duchów
                { at: 0, set: ['dog', 'wolf', 'bat', 'crow', 'duszek'], minMs: 1300, maxMs: 2300, maxAlive: 6 },
                { at: 1800, set: ['wolf', 'bat', 'duszek', 'duszek', 'phantom', 'crow'], minMs: 1100, maxMs: 2000, maxAlive: 7 },
                { at: 3600, set: ['duszek', 'phantom', 'upior', 'duszek', 'bat'], minMs: 900, maxMs: 1700, maxAlive: 8 },
                { at: 4800, set: ['duszek', 'phantom', 'upior', 'upior', 'phantom'], minMs: 750, maxMs: 1400, maxAlive: 9 },
            ],
        },
        arenaAt: 5700,                                      // tu ekran staje: obrona drzwi kościoła, potem Rafał
        endAt: 6217,                                        // środek drzwi: kościół na ekranie tam, gdzie w bg_l3_dawn (x 310)
        defense: true,
        boss: 'rafal',
        next: 3,                                            // po świcie: proboszcz wysyła Kamila za diabłem -> Level 4
    },
    {
        id: 4,
        name: 'BAGNA',
        dir: 1,                                             // w prawo, przez bagna do chaty czarnoksiężnika Adriana
        length: 6800,
        startAt: 110,
        music: 'level4',
        weather: { swampFog: true },
        bg: { sky: 'bg_l4_sky', far: 'bg_l4_far', near: 'bg_l4_near', ground: 'tile_ground_swamp', water: 'tile_bog_',
            bankL: 'bog_bank_left', bankR: 'bog_bank_right', end: 'hut_adrian' },
        hints: [
            { at: 0, text: '\u2192 = BIEG   DO CHATY CZARNOKSIĘŻNIKA ADRIANA!', touch: '> = BIEG   DO ADRIANA!', joy: 'JOYSTICK = BIEG   DO ADRIANA!', ms: 3200 },
            { at: 760, text: 'BAGNO! WPADNIESZ = ŻYCIE MNIEJ. SKACZ!', touch: 'BAGNO! SKACZ!', ms: 3000 },
            { at: 1560, text: 'SKACZ PO LILIACH WODNYCH', touch: 'SKACZ PO LILIACH', ms: 3000 },
            { at: 2620, text: 'PIEŃ! WSKOCZ, GDY PODPŁYNIE', touch: 'PIEŃ! WSKOCZ, GDY PODPŁYNIE', ms: 3000 },
        ],
        rivers: [
            { at: 900, w: 140 },
            { at: 1700, w: 260, lily: [75, 175] },          // lilie wodne (środki, px od brzegu)
            { at: 2800, w: 330, plank: 'log' },             // pływający pień (jak kładka; ekran czeka)
            { at: 3900, w: 300, lily: [80, 200] },
            { at: 4900, w: 360, plank: 'log' },
            { at: 5600, w: 160 },
        ],
        obstacles: [
            { type: 'reeds', at: 480 }, { type: 'stump', at: 700 }, { type: 'reeds', at: 1250 }, { type: 'stump', at: 1500 },
            { type: 'reeds', at: 2200 }, { type: 'stump', at: 2450 }, { type: 'reeds', at: 3300 }, { type: 'stump', at: 3600 },
            { type: 'reeds', at: 4350 }, { type: 'stump', at: 4650 }, { type: 'reeds', at: 5350 }, { type: 'stump', at: 5900 },
        ],
        items: [
            ...row(260, 4, 26, 18), ...arc(905, 6, 24, 80), { type: 'repellent', at: 1150 }, ...row(1300, 4, 26, 60),
            ...arc(1760, 5, 30, 70), { type: 'lightning', at: 2050, h: 26 }, ...row(2300, 4, 26, 18),
            ...row(2830, 8, 34, 50),                        // nad pniem
            ...arc(3400, 5, 18, 56), { type: 'repellent', at: 3700 }, ...arc(3960, 5, 40, 70), ...row(4400, 4, 26, 18),
            { type: 'lightning', at: 4750, h: 26 }, ...row(4930, 8, 38, 50), { type: 'repellent', at: 5420 }, ...arc(5610, 6, 26, 80),
        ],
        enemies: {
            from: 300, to: 6150,
            stages: [                                       // głównie komary; im dalej, tym więcej bagiennych stworów
                { at: 0, set: ['mosquito_small', 'mosquito_small', 'mosquito_big', 'frog'], minMs: 1200, maxMs: 2200, maxAlive: 8 },
                { at: 2000, set: ['mosquito_small', 'mosquito_big', 'frog', 'bogman', 'mosquito_small'], minMs: 1000, maxMs: 1900, maxAlive: 9 },
                { at: 4200, set: ['mosquito_small', 'mosquito_big', 'mosquito_big', 'frog', 'bogman', 'bogman'], minMs: 850, maxMs: 1600, maxAlive: 10 },
            ],
        },
        arenaAt: 6250,                                      // tu ekran staje: chata Adriana na palach i walka
        endAt: 6662,                                        // środek chaty
        boss: 'adrian',
        next: 4,
    },
    {
        id: 5,
        name: 'SOLNICZKI',
        dir: 1,                                             // jazda autem w prawo, w stronę kościoła; Solniczki = arena na końcu
        length: 2200,
        startAt: 120,
        music: 'level1',
        bg: { sky: 'bg_solniczki_sky', far: 'bg_solniczki_far', near: 'bg_solniczki_near', ground: 'tile_ground_road', water: 'tile_water_', end: 'road' },
        hints: [],
        rivers: [], obstacles: [], items: [],
        endAt: 2100,
        boss: 'benek',                                      // przebieg: level5.js (jazda, intro, walka, zadania, zakończenie)
        next: null,
        nextText: 'CIĄG DALSZY NASTĄPI',
    },
];
