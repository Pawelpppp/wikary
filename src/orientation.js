'use strict';
/* =====================================================================
   Telefon w pionie: gra się pauzuje (cała pętla Phasera: fizyka, tweeny, timery, czas poziomu)
   i dźwięk jest wstrzymany, a na wierzchu jest komunikat „OBRÓĆ TELEFON POZIOMO” (HTML).
   Po obróceniu: odświeżenie skali, wznowienie tylko tego, co sami zatrzymaliśmy,
   i wyzerowanie trzymanych przycisków / joysticka. Tylko dotyk (IS_TOUCH); na komputerze nigdy.
   ===================================================================== */
const Orientation = (function () {
    let game = null, overlay = null, timer = null, pausedByUs = false, audioByUs = false, started = false;
    const vp = () => {
        const v = window.visualViewport;            // iOS: innerHeight / 100vh potrafią kłamać, visualViewport nie
        return v ? { w: v.width, h: v.height } : { w: window.innerWidth, h: window.innerHeight };
    };
    function isPortrait() {
        const { w, h } = vp();
        if (w && h && w !== h) return h > w;        // rozmiar jest pewniejszy niż matchMedia tuż po obrocie
        return !!(window.matchMedia && window.matchMedia('(orientation: portrait)').matches);
    }
    function makeOverlay() {
        const o = document.createElement('div');
        o.id = 'rotate';
        o.setAttribute('role', 'alert');
        o.innerHTML = '<div class="rotate-phone"><div class="rotate-screen"></div></div>' +
            '<div class="rotate-text">OBRÓĆ TELEFON<br>POZIOMO</div>' +
            '<div class="rotate-sub">GRA JEST ZATRZYMANA</div>';
        document.body.appendChild(o);
        return o;
    }
    function resetHeldInput() {
        game.scene.getScenes(true).forEach(s => {
            if (s.input && s.input.keyboard) s.input.keyboard.resetKeys();
            if (typeof s.resetHeldInput === 'function') s.resetHeldInput();
        });
    }
    function pause() {
        if (overlay.classList.contains('show')) return;
        overlay.classList.add('show');
        if (!game.isPaused) { game.pause(); pausedByUs = true; }   // pauza zrobiona przez kogoś innego zostaje jego
        audioByUs = WikaryAudio.suspend();
        resetHeldInput();
    }
    function resume() {
        if (!overlay.classList.contains('show')) return;
        overlay.classList.remove('show');
        try { game.scale.refresh(); } catch (e) { /* */ }
        setTimeout(() => { try { game.scale.refresh(); } catch (e) { /* */ } }, CFG.orientation.refreshLateMs);   // iOS podaje wymiary z opóźnieniem
        resetHeldInput();
        if (pausedByUs) { pausedByUs = false; game.resume(); }
        if (audioByUs) { audioByUs = false; WikaryAudio.resumeSuspended(); }
    }
    function check() { if (isPortrait()) pause(); else resume(); }
    function schedule() { clearTimeout(timer); timer = setTimeout(check, CFG.orientation.debounceMs); }
    function lockLandscape() {                          // po wejściu w pełny ekran (Android); iOS po cichu odmawia
        try {
            const so = screen.orientation;
            const p = so && so.lock ? so.lock('landscape') : null;
            if (p && p.catch) p.catch(() => {});
        } catch (e) { /* brak wsparcia */ }
    }
    return {
        init(g) {
            if (started) return; started = true;        // raz na stronę: restart scen nie dubluje nasłuchów
            game = g;
            if (!CFG.orientation.enabled || !IS_TOUCH) return;
            overlay = makeOverlay();
            window.addEventListener('resize', schedule);
            window.addEventListener('orientationchange', schedule);
            if (window.visualViewport) window.visualViewport.addEventListener('resize', schedule);
            const mq = window.matchMedia && window.matchMedia('(orientation: portrait)');
            if (mq && mq.addEventListener) mq.addEventListener('change', schedule);
            game.scale.on('enterfullscreen', lockLandscape);
            check();                                    // od razu przy starcie (bez czekania)
        },
        get paused() { return !!(overlay && overlay.classList.contains('show')); },
        get pausedByUs() { return pausedByUs; },
        check,
    };
})();
