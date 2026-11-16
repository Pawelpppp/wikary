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
            { at: 0, text: '\u2192 = BIEG   SPACJA = SKOK', touch: '> = BIEG   ^ = SKOK', ms: 3200 },
            { at: 640, text: 'RZEKA! 2\u00d7 SPACJA = SALTO', touch: 'RZEKA! 2\u00d7 ^ = SALTO', ms: 3200 },
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
        next: null,                                         // Level 2 dojdzie w kolejnym kroku
    },
];
