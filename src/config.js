'use strict';
/* =====================================================================
   PRZYGODY KSIĘDZA KAMILA - wszystkie parametry rozgrywki w jednym miejscu.
   Jednostki: px, px/s, ms (chyba że napisano inaczej).
   ===================================================================== */
const CFG = {
    W: 568, H: 320,                 // rozdzielczość bazowa
    GROUND_Y: 292,                  // poziom ziemi (stopy postaci)
    gravity: 950,

    hero: {
        scale: 0.45,                // sprite'y Kamila mają 160 px wysokości -> ok. 72 px na ekranie
        bodyW: 22, bodyH: 64,       // hitbox
        speed: 150,                 // bieg strzałkami
        jumpV: 340,                 // zwykły skok (Spacja)
        saltoV: 400,                // drugi skok w powietrzu = salto (2× Spacja)
        maxFall: 620,
        coyoteMs: 90,               // skok chwilę po zejściu z krawędzi
        jumpBufferMs: 110,          // wciśnięcie Spacji chwilę przed lądowaniem
        edgeMargin: 14,             // odległość od krawędzi ekranu
        followAt: 0.55,             // kamera dogania gracza, gdy jest dalej niż 55% ekranu
        lives: 3,
        invulnMs: 1600,             // nietykalność po każdej utracie życia (też woda)
        knockback: 140,
        respawnBeforeRiver: 60,     // powrót przed rzekę (px przed brzegiem)
        crouchH: 38,                // hitbox w kucnięciu (strzałka w dół) - nietoperze przelatują nad głową
        crouchSpeed: 0,             // bieg w kucnięciu (0 = stoi w miejscu; auto-scroll i tak pcha)
        crouchDownMs: 90,           // klatka przejściowa (półprzysiad) przy kucaniu
    },

    touch: {                        // przyciski dotykowe: pionowo na środku, przy lewej i prawej krawędzi
        leftW: 40, rightW: 56, h: 40, gap: 8, alpha: 0.28, edge: 2,
        heroMargin: 64,             // w trybie dotyku Kamil trzyma się tyle px od krawędzi (nie wchodzi pod przyciski)
    },

    scrollSpeed: 55,                // auto-scroll ekranu
    puddle: { slowMult: 0.5, slowMs: 600 },
    boost: { mult: 1.55, ms: 4500 },       // piorun = przyspieszenie biegu

    cross: { speed: 380, cooldownMs: 330, lifeMs: 900, damage: 1,    // rzut krzyżem (Alt)
        standDy: -6,                // wysokość lotu na stojąco: środek hitboxu Kamila + standDy
        crouchUp: 22 },             // w kucnięciu: tyle px nad stopami (nisko - trafia psy i wilki)

    fire: {                         // ogień (Z) po zdobyciu znicza w Level 2: przebija kilku wrogów
        speed: 300, cooldownMs: 420, lifeMs: 1100, damage: 1, pierce: 3, scale: 1,
        standDy: -8, crouchUp: 20, bodyW: 26, bodyH: 18,
    },

    church: { floorY: 288, kamilFrom: -30, kamilTo: 340, proboszczX: 450, basketX: 404, blessMs: 1500 },

    weather: {                      // Level 2: deszcz (gdy jest fx_rain) i dalekie błyskawice (tylko błysk ekranu)
        flashMinMs: 6000, flashMaxMs: 12000, flashMs: 160, rumbleDelayMs: 600,
        rainAlpha: 0.5, rainVX: -50, rainVY: 320, rainFrameMs: 90,
    },

    plank: { speed: 70, margin: 6, holdView: 150 },

    house: { door: { x: 134, y: 130 }, floorY: 288 },     // dom Krzysztofa: lewy górny róg nakładki drzwi w obrazku domu (260x230)   // ruchoma kładka; ekran czeka, aż Kamil przepłynie

    boss: {                         // Hans, pies-bestia Krzysztofa (mini-boss Level 2)
        hp: 20, scale: 0.45, bodyW: 84, bodyH: 50, gromDamage: 6, hurtMs: 120,
        walkSpeed: 60, keepDist: 120, chargeSpeed: 320, windupMs: 650, barkMs: 800, waveDelayMs: 260, waveGapMs: 480,
        waveSpeed: 210, waveW: 22, waveH: 14, stunMs: 700, arenaPad: 34,
        heroStandOff: 240,          // Kamil zatrzymuje się tyle px od drzwi domu
        phases: [                   // od pełnego HP w dół (ułamek HP, od którego obowiązuje faza)
            { from: 1.0, chargeMul: 1.0, waves: 1, restMs: 1300 },
            { from: 0.6, chargeMul: 1.2, waves: 2, restMs: 1000 },
            { from: 0.3, chargeMul: 1.45, waves: 2, restMs: 650, enraged: true },
        ],
    },

    ult: {
        max: 100,                   // pełny pasek = można odpalić Grom z Nieba
        prayMs: 1000,               // tyle trzeba się modlić (trzymać Shift)
        dim: 0.75,                  // przyciemnienie ekranu w czasie modlitwy
        perDiamond: 4,
        perKill: 6,
    },

    score: { diamond: 50, lightning: 100, cross: 500, znicz: 500, dog: 100, wolf: 200, bat: 80, spider: 120,
        crow: 90, boar: 180, wisp: 110, hans: 3000, tenZloty: 1000 },

    enemies: {
        // skala postaci = jak Kamil (0.45); bodyW/bodyH = hitbox na ekranie (px)
        dog:    { hp: 1, speed: 150, scale: 0.45, weight: 4, bodyW: 38, bodyH: 22 },
        wolf:   { hp: 2, speed: 85, scale: 0.45, weight: 2, jumpEveryMs: 1500, jumpV: 300, bodyW: 50, bodyH: 28 },
        bat:    { hp: 1, speed: 105, scale: 0.45, weight: 3, wave: 3, gap: 36, amp: 22, freq: 3.2, yMin: 170, yMax: 222, bodyW: 24, bodyH: 14 },
        spider: { hp: 1, dropSpeed: 90, dropTo: 244, holdMs: 1100, scale: 0.45, weight: 2, bodyW: 22, bodyH: 20 },
        // Level 2
        crow:   { hp: 1, speed: 120, scale: 0.6,  weight: 3, yMin: 90, yMax: 140, diveRange: 150, diveSpeed: 230, pullUpY: 250, bodyW: 30, bodyH: 18, center: true },
        boar:   { hp: 2, speed: 70, chargeSpeed: 260, chargeRange: 250, windupMs: 380, scale: 0.45, weight: 2, bodyW: 52, bodyH: 30 },
        wisp:   { hp: 1, scale: 0.45, weight: 2, radius0: 150, radius1: 30, shrinkPerS: 16, angSpeed: 2.2, follow: 3.0, lifeMs: 9000, yMin: 150, yMax: 220, bodyW: 16, bodyH: 18, center: true },
    },
    spawn: { minMs: 1300, maxMs: 2600, maxAlive: 6 },

    items: { scale: 0.45 },         // diamenciki, pioruny, efekt "poof" (skala postaci)
    obstacles: {                    // hitbox przeszkód (px na ekranie, od ziemi w górę)
        fence: { w: 44, h: 24 },
        trash_bin: { w: 22, h: 30 },
        dug_road: { w: 64, h: 16 },
        fallen_tree: { w: 80, h: 30 },
    },
    debug: false,
};
