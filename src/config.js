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
    },

    scrollSpeed: 55,                // auto-scroll ekranu
    puddle: { slowMult: 0.5, slowMs: 600 },
    boost: { mult: 1.55, ms: 4500 },       // piorun = przyspieszenie biegu

    cross: { speed: 380, cooldownMs: 330, lifeMs: 900, damage: 1 },   // rzut krzyżem (Alt)

    ult: {
        max: 100,                   // pełny pasek = można odpalić Grom z Nieba
        prayMs: 1000,               // tyle trzeba się modlić (trzymać Shift)
        dim: 0.75,                  // przyciemnienie ekranu w czasie modlitwy
        perDiamond: 4,
        perKill: 6,
    },

    score: { diamond: 50, lightning: 100, cross: 500, dog: 100, wolf: 200, bat: 80, spider: 120 },

    enemies: {
        dog:    { hp: 1, speed: 150, scale: 0.42, weight: 4, bodyW: 40, bodyH: 22 },
        wolf:   { hp: 2, speed: 85, scale: 0.6, weight: 2, jumpEveryMs: 1500, jumpV: 300, bodyW: 56, bodyH: 30, tint: 0x9a9ab0 },
        bat:    { hp: 1, speed: 105, scale: 1.3, weight: 3, wave: 3, gap: 36, amp: 22, freq: 3.2, yMin: 170, yMax: 225, tint: 0x7a4aa0 },
        spider: { hp: 1, dropSpeed: 90, dropTo: 236, holdMs: 1100, scale: 1.4, weight: 2, tint: 0x3a2a3a },
    },
    spawn: { minMs: 1300, maxMs: 2600, maxAlive: 6 },

    car: { scale: 0.42 },
    debug: false,
};
