'use strict';
/* Tablica wyników: tylko lokalnie (localStorage, klucz wikary_leaderboard, max 20).
   TODO: wspólna tablica na Azure w nowej, osobnej tabeli (nie tej z Fibi Run). */
const Leaderboard = (function () {
    const KEY = 'wikary_leaderboard', NICK_KEY = 'wikary_last_nick', MAX = 20, NICK_MAX = 12;
    const cmp = (a, b) => (b.score - a.score) || (a.time - b.time) || (a.date - b.date);
    const sanitize = (s) => String(s || '').toLocaleUpperCase('pl-PL').replace(/[^A-Z0-9ĄĆĘŁŃÓŚŹŻ \-]/g, '').slice(0, NICK_MAX);
    function load() {
        try {
            const a = JSON.parse(localStorage.getItem(KEY) || '[]');
            if (!Array.isArray(a)) return [];
            return a.filter(e => e && typeof e.score === 'number' && typeof e.time === 'number')
                .map(e => ({ nick: sanitize(e.nick) || '???', score: e.score | 0, time: e.time | 0, date: e.date || 0,
                    diff: (typeof CFG !== 'undefined' && CFG.difficulty.levels[e.diff]) ? e.diff : '' }))   // stare wpisy: bez trudności
                .sort(cmp).slice(0, MAX);
        } catch (e) { return []; }
    }
    function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); } catch (e) { /* tryb prywatny */ } }
    return {
        MAX, NICK_MAX, sanitize, load,
        /** dodaje wynik; zwraca pozycję (0..19) albo -1, gdy nie wszedł do 20 */
        add(nick, score, timeSec, diff) {
            const entry = { nick: sanitize(nick).trim() || 'KSIĄDZ', score: score | 0, time: timeSec | 0, date: Date.now(), diff: diff || '' };
            const list = load(); list.push(entry); list.sort(cmp);
            const top = list.slice(0, MAX); save(top);
            try { localStorage.setItem(NICK_KEY, entry.nick); } catch (e) { /* ok */ }
            return top.indexOf(entry);
        },
        lastNick() { try { return sanitize(localStorage.getItem(NICK_KEY) || ''); } catch (e) { return ''; } },
        fmt(sec) { sec = Math.max(0, sec | 0); return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); },
    };
})();
