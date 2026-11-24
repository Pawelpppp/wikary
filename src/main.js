'use strict';
/* Start gry: czeka na pikselowy font, potem uruchamia Phasera. */
(function () {
    function start() {
        const game = new Phaser.Game({
            type: Phaser.AUTO,
            parent: 'game',
            width: CFG.W, height: CFG.H,
            backgroundColor: '#0c0818',
            pixelArt: true, roundPixels: true,
            audio: { noAudio: true },                       // dźwięk robi własny silnik (WikaryAudio)
            input: { activePointers: 4 },
            physics: { default: 'arcade', arcade: { gravity: { y: CFG.gravity }, debug: CFG.debug } },
            scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
            scene: [BootScene, TitleScene, DifficultyScene, ScoresScene, IntroScene, LevelScene, ChurchScene, NickScene],
        });
        // Alt nie może aktywować menu przeglądarki (Alt = rzut krzyżem). Rejestrowane PO Phaserze,
        // bo Phaser ignoruje zdarzenia z defaultPrevented.
        game.events.once('ready', () => ['keydown', 'keyup'].forEach(t => window.addEventListener(t, (e) => {
            if (e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight') e.preventDefault();
        })));
        game.events.once('ready', () => Orientation.init(game));
        if (DEBUG) {                                        // tylko do testów: ?debug=1
            window.__wikary = {
                game, GS, CFG, LEVELS,
                scene: () => game.scene.getScenes(true).map(s => s.scene.key),
                level: () => game.scene.getScene('Level'),
                Analytics, Difficulty, diffScene: () => game.scene.getScene('Difficulty'),
                setMeter: (v) => { GS.meter = v; },
                giveCross: () => { GS.hasCross = true; },
                giveFire: () => { GS.hasFire = true; },
                church: () => game.scene.getScene('Church'),
                start: (idx, startAt, extra) => debugStart(game.scene.getScenes(true)[0], idx, startAt, extra),
                startScene: (key, data) => { const s = game.scene.getScenes(true)[0]; s.scene.start(key, data || {}); },
                boss: () => { const l = game.scene.getScene('Level'); return l && l.boss; },
                artMissing: () => ART.missing(),
                rafal: () => { const l = game.scene.getScene('Level'); return l && l.rafal; },
                defense: () => { const l = game.scene.getScene('Level'); return l && l.defense; },
                startL3: (part) => { const s = game.scene.getScenes(true)[0]; debugStart(s, 2, part ? LEVELS[2].arenaAt - 60 : undefined, part === 'boss' ? { skipTo: 'boss' } : null); GS.hasBless = !!part; },
                adrian: () => { const l = game.scene.getScene('Level'); return l && l.adrian; },
                devil: () => { const l = game.scene.getScene('Level'); return l && l.devil; },
                startL4: (part) => { const s = game.scene.getScenes(true)[0]; debugStart(s, 3, part ? LEVELS[3].arenaAt - 60 : undefined); },
                orientation: () => ({ overlay: Orientation.paused, gamePaused: game.isPaused, byUs: Orientation.pausedByUs }),
                teleport: (d) => game.scene.getScene('Level').debugTeleport(d),
            };
        }
    }
    const f = document.fonts && document.fonts.load ? document.fonts.load('16px "PressStart"', 'PRZYGODY KSIĘDZA') : Promise.resolve();
    Promise.race([f, new Promise(r => setTimeout(r, 2500))]).catch(() => {}).then(start);
})();
