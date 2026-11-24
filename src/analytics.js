'use strict';
/* Niewidoczne statystyki odwiedzin: GoatCounter (CFG.analytics). Wejście na stronę liczy sam count.js,
   „start gry” to zdarzenie wysyłane przy starcie nowej gry. Nic nie jest wyświetlane na stronie.
   Skrypt ładuje się tylko, gdy adres konta jest wpisany (nie placeholder) i host jest na liście allowedHosts;
   localhost, 127.0.0.1 i file: nigdy nie są liczone. Brak skryptu (blokada, offline) niczego nie psuje. */
const Analytics = (function () {
    const PLACEHOLDER = /TWOJE-KONTO/i, LOCAL = ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'];
    const state = { enabled: false, reason: '', loaded: false, queue: [], sent: [] };
    /** konfiguracja; window.__wikaryAnalyticsOverride ustawiają tylko testy (przed załadowaniem strony) */
    function conf() {
        const o = (typeof window !== 'undefined' && window.__wikaryAnalyticsOverride) || {};
        return Object.assign({}, CFG.analytics, o);
    }
    function decide(C) {
        const url = String(C.goatcounterUrl || '').trim();
        const host = String(C.hostname !== undefined ? C.hostname : location.hostname).toLowerCase();
        const proto = C.protocol !== undefined ? C.protocol : location.protocol;
        if (!url || PLACEHOLDER.test(url)) return 'brak adresu konta';
        if (proto === 'file:' || !host || LOCAL.includes(host) || host.endsWith('.localhost')) return 'lokalnie';
        if (!(C.allowedHosts || []).map(h => String(h).toLowerCase()).includes(host)) return 'host spoza allowedHosts';
        return '';
    }
    function send(ev) {
        try {
            const gc = window.goatcounter;
            if (gc && typeof gc.count === 'function') { gc.count(ev); state.sent.push(ev.path); return true; }
        } catch (e) { /* skrypt zablokowany lub zmieniony: gra działa dalej */ }
        return false;
    }
    function init() {
        const C = conf();
        state.reason = decide(C);
        state.enabled = !state.reason;
        if (!state.enabled) return;
        try {
            const s = document.createElement('script');
            s.async = true; s.src = C.scriptSrc; s.id = 'goatcounter-script';
            s.setAttribute('data-goatcounter', String(C.goatcounterUrl).trim());
            s.onload = () => { state.loaded = true; state.queue.splice(0).forEach(send); };
            s.onerror = () => { state.loaded = false; state.queue.length = 0; };
            document.head.appendChild(s);
        } catch (e) { state.enabled = false; state.reason = 'błąd ładowania'; }
    }
    return {
        state, init, decide,
        /** zdarzenie „start gry” (po wybraniu poziomu trudności); bez skryptu = nic */
        startGame() {
            if (!state.enabled) return;
            const E = conf().startEvent || {};
            const ev = { path: E.path || 'start-gry', title: E.title || 'Start gry', event: true };
            if (!send(ev) && !state.loaded) state.queue.push(ev);
        },
    };
})();
Analytics.init();
