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
        maxLives: 6,
        invulnMs: 1600,             // nietykalność po każdej utracie życia (też woda)
        knockback: 140,
        respawnBeforeRiver: 60,     // powrót przed rzekę (px przed brzegiem)
        crouchH: 38,                // hitbox w kucnięciu (strzałka w dół) - nietoperze przelatują nad głową
        crouchSpeed: 0,             // bieg w kucnięciu (0 = stoi w miejscu; auto-scroll i tak pcha)
        crouchDownMs: 90,           // klatka przejściowa (półprzysiad) przy kucaniu
    },

    stomp: {                        // naskok na wroga (stopy w górną część, Kamil spada): 1 HP = ginie, więcej = -1 HP i odbicie
        bounceKill: 260,            // odbicie po zabiciu (px/s w górę, lekkie)
        bounceHit: 400,             // odbicie od twardszego wroga (wyżej)
        tolerancePx: 10,            // stopy (z poprzedniej klatki) mogą być tyle px poniżej wierzchu hitboxu wroga
        invulnMs: 250,              // po odbiciu wrogowie nie ranią Kamila (bez migania)
        exclude: ['hans', 'rafal', 'adrian'],   // bossy: bez stompa, zachowanie jak dotąd
    },

    difficulty: {                   // wybór przed nową grą (ekran po tytule); ostatni wybór w localStorage
        default: 'normal', storageKey: 'wikary_difficulty',
        order: ['easy', 'normal', 'hard'],
        levels: {                   // lives: życia startowe; enemySpeed: mnożnik prędkości wrogów; enemyHp: + HP (min 1);
                                    // heartDrop: mnożnik szansy na serce z wroga; bossHp: mnożnik HP bossów; retry: powtórka poziomu
            easy:   { label: 'ŁATWY',    short: 'Ł', lives: 5, enemySpeed: 0.8, enemyHp: -1, heartDrop: 1.5, bossHp: 0.75, retry: true,
                      desc: '5 ŻYĆ, WOLNIEJSI WROGOWIE, WIĘCEJ SERC' },
            normal: { label: 'NORMALNY', short: 'N', lives: 3, enemySpeed: 1,   enemyHp: 0,  heartDrop: 1,   bossHp: 1,    retry: true,
                      desc: '3 ŻYCIA, KLASYCZNA GRA' },
            hard:   { label: 'TRUDNY',   short: 'T', lives: 2, enemySpeed: 1.2, enemyHp: 1,  heartDrop: 0.5, bossHp: 1.25, retry: false,
                      desc: '2 ŻYCIA, SZYBSI I TWARDSI, BEZ POWTÓRKI' },
        },
    },

    retry: {                        // po GAME OVER: „POWTÓRZYĆ POZIOM?” (raz na całą rozgrywkę)
        maxRetries: 1,
        askDelayMs: 1800,           // ile po napisie GAME OVER pokazać pytanie
    },

    fullscreen: {                   // pełny ekran (przycisk F / klawisz F)
        unsupportedHint: 'UDOSTĘPNIJ \u2192 DO EKRANU POCZĄTKOWEGO',   // iPhone: brak Fullscreen API
        failedHint: 'PEŁNY EKRAN ZABLOKOWANY PRZEZ PRZEGLĄDARKĘ',
        hintMs: 3000, hintY: 40,
        buttonZone: { w: 60, h: 24 },     // prawy górny róg (M, F): dotyk tu nie pomija intro
    },

    lifePickup: {                   // znajdźki i dropy życia rosną z każdym poziomem
        countByLevel: [1, 2, 4, 6],
        dropChanceByLevel: [0.15, 0.20, 0.25, 0.30],
        pickupY: 30,
        safeMargin: 100,
        minGap: 90,
    },

    touch: {                        // przyciski dotykowe: pionowo na środku, przy lewej i prawej krawędzi
        leftW: 40, rightW: 56, h: 40, gap: 8, alpha: 0.28, edge: 2,
        heroMargin: 64,             // w trybie dotyku Kamil trzyma się tyle px od krawędzi (nie wchodzi pod przyciski)
        mode: 'joystick',           // 'joystick' (test: joystick z lewej, dotknięcie ekranu = skok) | 'buttons' (stare < > ↓); URL ?touch=buttons / ?touch=joystick
        joystick: {
            zoneW: 0.4,             // strefa joysticka: lewe 40% ekranu, pod HUD-em
            topY: 24,
            radius: 34,             // maks. wychylenie gałki (px)
            baseR: 34, knobR: 15,
            deadZone: 0.15,         // poniżej = stoi
            crouchY: 0.55,          // wychylenie w dół (część promienia), od którego kuca...
            crouchSlope: 1.2,       // ...gdy ruch jest głównie pionowy: dy > |dx| * crouchSlope
            restX: 64, restY: 248,  // gdzie widać spoczynkowy joystick (podpowiedź)
            restAlpha: 0.5,         // przezroczystość spoczynkowa (względem alpha przycisków)
            tapJump: true,          // dotknięcie poza joystickiem i przyciskami = skok, drugie w powietrzu = salto
        },
    },

    orientation: {                  // telefon w pionie = pauza + komunikat „OBRÓĆ TELEFON POZIOMO” (tylko dotyk)
        enabled: true,
        debounceMs: 150,            // iOS podaje nowe wymiary z opóźnieniem
        refreshLateMs: 400,         // drugie odświeżenie skali po obrocie
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

    bless: {                        // Level 3: błogosławieństwo (X / BŁOG.) po zdobyciu item_blessing: fala wokół Kamila
        radius: 120, cooldownMs: 2600, ghostDamage: 99, damage: 1, bossDamage: 2,
        waveMs: 420, waveScale0: 0.3, waveScale1: 2.4, castMs: 260,
    },

    ghosts: {                       // Level 3: duchy (ogień nie działa, krzyż i błogosławieństwo tak)
        fireHintMs: 2200,
        alpha: 0.82,
    },

    fog: [                          // mgła Level 3: dwie warstwy (tylko gdy są fx_fog_1/2); speed = dryf px/s, par = paralaksa
        { key: 'fx_fog_2', y: 232, speed: 8, par: 0.6, alpha: 0.65, depth: 7.3 },     // wyżej, rzadsza
        { key: 'fx_fog_1', y: 256, speed: 15, par: 0.9, alpha: 0.75, depth: 7.4 },   // niżej, gęstsza
    ],

    defense: {                      // Level 3, część B: obrona drzwi kościoła
        doorHp: 20, doorReach: 22, dmg: { duszek: 1, phantom: 2, upior: 3 },
        heroStandOff: 150,          // Kamil staje tyle px przed drzwiami (od strony drogi)
        churchFloorY: 288,          // nocny kościół: dół obrazka na podłodze 288 (jak w bg_l3_dawn: lewy górny róg 310,38)
        proboszczAt: [75, 238],     // stopy proboszcza na schodach (px w obrazku kościoła 240x250)
        castMs: 1700, castWindupMs: 260, spellSpeed: 260, spellDamage: 1, spellRange: 330,
        tiredEvery: 5,              // po tylu czarach proboszcz siada
        sitOriginY: 151 / 164,      // proboszcz_tired_sit: linia siedzenia (13 px nad dołem płótna) ląduje na stopniu
        tiredMs: 4200,
        waveBreakMs: 2400,
        waves: [
            { n: 6, set: ['duszek'], gapMs: 1000 },
            { n: 8, set: ['duszek', 'duszek', 'phantom'], gapMs: 850 },
            { n: 10, set: ['duszek', 'phantom', 'upior'], gapMs: 750 },
        ],
        doorBonus: 100,             // punkty za każdy punkt życia drzwi na koniec
    },

    rafal: {                        // boss Level 3: kościelny Rafał opętany przez upiora
        hp: 24, scale: 0.45, bodyW: 34, bodyH: 66, gromDamage: 5, hurtMs: 140,
        floatSpeed: 70, keepDist: 90, bobAmp: 4, bobFreq: 1.6, hover: 0, arenaPad: 30,   // hover: grafika float sama unosi stopy 6-8 px
        keyScale: 1,
        swingRange: 70, swingWindupMs: 420, swingMs: 300, swingReach: 64,
        throwWindupMs: 380, keySpeed: 210, keySpin: 720, keyLifeMs: 2600, keyW: 16, keyH: 16,
        screamMs: 1000, enterMs: 1200,
        phases: [
            { from: 1.0, speedMul: 1.0, keys: 1, summon: 2, restMs: 1400 },
            { from: 0.6, speedMul: 1.2, keys: 2, summon: 3, restMs: 1100 },
            { from: 0.3, speedMul: 1.4, keys: 3, summon: 3, restMs: 800, enraged: true },
        ],
        dazedMs: 1600,
    },

    dawn: { fadeMs: 2600, depth: 5.5 },

    devil: {                        // Czerwony Diabeł (koniec Level 3 i Level 4): tylko cutscenki
        scale: 0.45, exitFxScale: 0.9, brimstoneScale: 0.8,
        flyMs: 1800, riseMs: 2600, riseDepth: 1.5,
        redAlpha: 0.38, redMs: 900, redColor: 0xb01010,
    },

    swampFog: [                     // Level 4: zielona mgła nad bagnem (fx_swamp_fog_1/2, zamiennik = mgła z L3 w zieleni)
        { key: 'fx_swamp_fog_2', y: 230, speed: 6, par: 0.6, alpha: 0.55, depth: 7.3 },
        { key: 'fx_swamp_fog_1', y: 256, speed: 12, par: 0.9, alpha: 0.65, depth: 7.4 },
    ],

    bog: {                          // Level 4: bagienne doły (jak rzeki: wpadnięcie = życie mniej, powrót przed dołem)
        lilyW: 40, lilyH: 8, surfaceY: 294,   // surfaceY: środek lilii / pnia na tafli bagna
                                             // lilie wodne: stałe platformy (hitbox px)
        logSpeed: 55, logMargin: 8,                               // pnie: pływają tam i z powrotem jak kładka
    },

    repellent: {                    // Level 4: święcona woda na komary (item_repellent): aura wokół Kamila
        ms: 9000, radius: 46, bigPush: 220, auraScale: 0.55, warnMs: 2000,
    },

    adrian: {                       // boss Level 4: czarnoksiężnik Adrian
        hp: 26, scale: 0.45, bodyW: 30, bodyH: 66, gromDamage: 5, hurtMs: 140, blessDamage: 2,
        summonTint: 0xc8f0b8,       // delikatna zieleń przy przywoływaniu komarów (na finalnej grafice mocny tint wyglądał jak zamiennik)
        hurtFootDx: 11,             // adrian_hurt_1 (132 px): stopy 11 px w prawo od środka klatki (odchyla się do tyłu)
        spots: [130, 290, 450],     // miejsca teleportu: x na ekranie areny
        enterMs: 900, castWindupMs: 520, orbSpeed: 120, orbTurn: 2.6, orbLifeMs: 4200, orbW: 14, orbH: 14, orbScale: 0.7,
        summonMs: 900, teleportMs: 420, keepAway: 110,
        phases: [
            { from: 1.0, orbs: 1, swarm: 1, restMs: 1500, teleportEvery: 3 },
            { from: 0.6, orbs: 2, swarm: 2, restMs: 1200, teleportEvery: 2 },
            { from: 0.3, orbs: 3, swarm: 2, restMs: 900, teleportEvery: 1, enraged: true },
        ],
        heroStandOff: 210,
    },

    hut: { floorY: 288, door: { x: 83, y: 100 } },   // chata Adriana na palach: lewy górny róg drzwi w obrazku (260x240)

    car: { scale: 0.45, driveMs: 2600, enterMs: 500 }, // auto Adriana (car_*.png 219x100, przodem w prawo)   // świt: bg_l3_dawn nad kościołem i drzwiami, pod postaciami (proboszcz 6, Kamil 10)

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
        crow: 90, boar: 180, wisp: 110, hans: 3000, tenZloty: 1000,
        duszek: 60, phantom: 120, upior: 200, blessing: 500, rafal: 5000,
        mosquito_small: 40, mosquito_big: 130, frog: 150, bogman: 220, repellent: 200, adrian: 6000 },

    enemies: {
        // skala postaci = jak Kamil (0.45); bodyW/bodyH = hitbox na ekranie (px)
        dog:    { hp: 1, speed: 150, scale: 0.45, weight: 4, bodyW: 38, bodyH: 22 },
        wolf:   { hp: 2, speed: 85, scale: 0.45, weight: 2, jumpEveryMs: 1500, jumpV: 300, bodyW: 50, bodyH: 28 },
        bat:    { hp: 1, speed: 105, scale: 0.45, weight: 3, wave: 3, gap: 36, amp: 22, freq: 3.2, yMin: 170, yMax: 222, bodyW: 24, bodyH: 14 },
        spider: { hp: 1, dropSpeed: 90, dropTo: 244, holdMs: 1100, scale: 0.45, weight: 2, bodyW: 22, bodyH: 20 },
        // Level 2
        crow:   { hp: 1, speed: 120, scale: 0.6,  weight: 3, yMin: 90, yMax: 140, diveRange: 150, diveSpeed: 230, pullUpY: 250, bodyW: 30, bodyH: 18, center: true },
        boar:   { hp: 2, speed: 70, chargeSpeed: 260, chargeRange: 250, windupMs: 380, scale: 0.45, weight: 2, bodyW: 52, bodyH: 30 },
        // Level 3: duchy (ghost: true = ogień nie działa, przenikają przeszkody)
        duszek:  { hp: 1, scale: 0.45, weight: 4, ghost: true, speed: 70, bob: 18, bobFreq: 3, yMin: 150, yMax: 230, bodyW: 20, bodyH: 22, center: true },
        phantom: { hp: 2, scale: 0.45, weight: 2, ghost: true, center: true, groundGap: 2, appearMs: 300, flickerMs: 750, dashSpeed: 240, bodyW: 46, bodyH: 30 },
        upior:   { hp: 3, scale: 0.45, weight: 2, ghost: true, warnMs: 800, riseMs: 900, speed: 38, bodyW: 26, bodyH: 50 },
        // Level 4: bagno (ogień działa)
        mosquito_small: { hp: 1, scale: 0.45, weight: 4, swarm: 4, gap: 22, speed: 120, home: 1.6, amp: 16, freq: 5, yMin: 150, yMax: 235, bodyW: 12, bodyH: 10, center: true },
        mosquito_big:   { hp: 2, scale: 0.45, weight: 2, speed: 90, yMin: 110, yMax: 160, diveRange: 120, diveSpeed: 240, stingMs: 500, pullUpY: 255, bodyW: 30, bodyH: 22, center: true },
        frog:           { hp: 2, scale: 0.45, weight: 2, jumpEveryMs: 1400, jumpVX: 110, jumpV: 260, tongueRange: 58, tongueReach: 50, tongueMs: 420,   // tongueReach: czubek długiego języka 112 px płótna × 0.45
                           tongueCdMs: 1600, bodyW: 30, bodyH: 20 },
        bogman:         { hp: 3, scale: 0.45, weight: 2, warnMs: 900, riseMs: 1000, speed: 42, bodyW: 28, bodyH: 54 },
        wisp:   { hp: 1, scale: 0.45, weight: 2, radius0: 150, radius1: 30, shrinkPerS: 16, angSpeed: 2.2, follow: 3.0, lifeMs: 9000, yMin: 150, yMax: 220, bodyW: 16, bodyH: 18, center: true },
    },
    spawn: { minMs: 1300, maxMs: 2600, maxAlive: 6 },
    spawnRate: {                    // ułamek wylosowanych spawnów danego typu, który naprawdę się pojawia (reszta = pusta kolejka; inni wrogowie bez zmian)
        byLevel: [{}, { bat: 0.8 }, {}, {}],     // Level 2: o 20% mniej nietoperzy
    },

    items: { scale: 0.45 },         // diamenciki, pioruny, efekt "poof" (skala postaci)
    obstacles: {                    // hitbox przeszkód (px na ekranie, od ziemi w górę)
        fence: { w: 44, h: 24 },
        trash_bin: { w: 22, h: 30 },
        dug_road: { w: 64, h: 16 },
        fallen_tree: { w: 80, h: 30 },
        stump: { w: 32, h: 26 },
        reeds: { w: 30, h: 22 },
    },
    debug: false,
};
