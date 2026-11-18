'use strict';
/* =====================================================================
   Dźwięk: chiptune w Web Audio (bez plików). Organy na tytule i w intro,
   szybki chiptune w poziomie, mocny bas (kwadrat + sub-sinus + półka basowa).
   API: WikaryAudio.unlock() / play(name) / stop() / sfx(name) / ring(on)
        / toggleMute() / muted
   ===================================================================== */
const WikaryAudio = (function () {
    const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const midi = (n) => { const m = /^([A-G])(#|b)?(-?\d)$/.exec(n); return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
    const hz = (n) => 440 * Math.pow(2, ((typeof n === 'number' ? n : midi(n)) - 69) / 12);
    const T = (s) => s.trim().split(/\s+/);

    /* ---------- utwory: kroki = ósemki (8 na takt) ---------- */
    const SONGS = {
        title: {   // organowy, a-moll, spokojny
            bpm: 84, organVol: 0.07, leadVol: 0.07, bassVol: 0.34, drums: null, leadWave: 'organ',
            chords: T('Am F C G Am Dm E E Am F C G F Dm E Am'),
            lead: T(`A4 - C5 - E5 - A5 - | F5 - E5 - C5 - A4 - | G4 - C5 - E5 - G5 - | D5 - - - B4 - - - |
                     C5 - E5 - A5 - C6 - | A5 - F5 - D5 - F5 - | E5 - G#5 - B5 - E5 - | E5 - - - . . . . |
                     A5 - G5 - E5 - C5 - | F5 - A5 - C6 - A5 - | G5 - E5 - C5 - E5 - | D5 - G5 - B5 - D6 - |
                     C6 - A5 - F5 - A5 - | D5 - F5 - A5 - D6 - | B5 - G#5 - E5 - G#5 - | A5 - - - - - . . |`.replace(/\|/g, ' ')),
            bass: 'r . r . o . r .',
        },
        prayer: {  // intro: cicha modlitwa na organach
            bpm: 60, organVol: 0.06, leadVol: 0.035, bassVol: 0.2, drums: null, leadWave: 'organ',
            chords: T('Am F C E'),
            lead: T('E5 - - - - - - - C5 - - - - - - - E5 - - - G5 - - - G#5 - - - B5 - - -'),
            bass: 'r - - - - - - -',
        },
        level1: { // "Droga na plebanię": szybki, wesoły, C-dur / a-moll
            bpm: 144, organVol: 0.0, arpVol: 0.035, leadVol: 0.085, bassVol: 0.36, drums: 'beat', leadWave: 'pulse',
            chords: T('C G Am F C G F G Am F C G Am F G G'),
            lead: T(`E5 . G5 . C6 - B5 A5 | G5 - - D5 G5 . B5 . | A5 . C6 . E6 - D6 C6 | A5 - - - F5 . A5 . |
                     E5 . G5 . C6 - E6 D6 | D6 - B5 - G5 - B5 D6 | C6 - A5 - F5 - A5 C6 | D6 - - - - - . . |
                     A5 . A5 . C6 . E6 . | F5 . F5 . A5 . C6 . | G5 . G5 . C6 . E6 . | D6 - B5 - G5 - D5 - |
                     E5 . A5 . C6 - B5 A5 | F5 . A5 . C6 - D6 E6 | D6 - C6 - B5 - A5 - | B5 - - - D6 - G6 - |`.replace(/\|/g, ' ')),
            bass: 'r r o r r o r o',
        },
        level2: { // "Wizyta u skąpego parafianina": wieczór, deszcz, d-moll, trochę tajemniczo
            bpm: 132, organVol: 0.0, arpVol: 0.03, leadVol: 0.08, bassVol: 0.36, drums: 'beat', leadWave: 'pulse',
            chords: T('Dm Bb C Am Dm Bb A A Gm Dm Bb C Dm Gm A Dm'),
            lead: T(`D5 . F5 . A5 - G5 F5 | F5 - D5 - Bb4 . D5 . | E5 . G5 . C6 - Bb5 A5 | A5 - - - E5 . A5 . |
                     D5 . F5 . A5 - D6 C6 | Bb5 - F5 - D5 - F5 - | E5 . C#5 . E5 - A5 G5 | A5 - - - - - . . |
                     G5 . Bb5 . D6 - C6 Bb5 | A5 - F5 - D5 - F5 A5 | Bb5 - A5 - G5 - F5 - | E5 - G5 - C6 - E5 - |
                     F5 . A5 . D6 - C6 A5 | Bb5 . G5 . D5 - G5 Bb5 | A5 - E5 - C#5 - E5 - | D5 - - - - - . . |`.replace(/\|/g, ' ')),
            bass: 'r r o r r o r o',
        },
        level3: { // "Noc duchów": h-moll, organy i tajemniczy puls
            bpm: 120, organVol: 0.04, arpVol: 0.03, leadVol: 0.075, bassVol: 0.34, drums: 'beat', leadWave: 'pulse',
            chords: T('Bm G Em F# Bm G A F# Em G Bm F# G Em F# Bm'),
            lead: T(`B4 . D5 . F#5 - E5 D5 | D5 - B4 - G4 . B4 . | G4 . B4 . E5 - D5 B4 | A#4 - - - C#5 . F#5 . |
                     B4 . D5 . F#5 - B5 A5 | G5 - D5 - B4 - D5 - | C#5 . E5 . A5 - G5 E5 | F#5 - - - - - . . |
                     E5 . G5 . B5 - A5 G5 | D5 - B4 - G4 - B4 D5 | F#5 - D5 - B4 - D5 - | C#5 - E5 - A#5 - F#5 - |
                     G5 . B5 . D6 - B5 G5 | E5 . G5 . B5 - G5 E5 | F#5 - C#5 - A#4 - C#5 - | B4 - - - - - . . |`.replace(/\|/g, ' ')),
            bass: 'r r o r r o r o',
        },
        boss: {   // Hans: szybko i groźnie, e-moll
            bpm: 168, organVol: 0.0, arpVol: 0.03, leadVol: 0.085, bassVol: 0.4, drums: 'beat', leadWave: 'pulse',
            chords: T('Em Em C D Em Em B B'),
            lead: T(`E5 . E5 . G5 . E5 . | B5 - A5 - G5 - F#5 - | E5 . E5 . C6 . B5 . | A5 - F#5 - D5 - F#5 - |
                     E5 . G5 . B5 . E6 . | D6 - B5 - G5 - B5 - | D#5 . F#5 . B5 . D#6 . | B5 - - - F#5 - D#5 - |`.replace(/\|/g, ' ')),
            bass: 'r o r o r o r o',
        },
    };
    const CH = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10] };
    function chord(name) {
        const m = /^([A-G])(#|b)?(m|7)?$/.exec(name);
        const pc = (NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
        const root = 48 + pc;
        return { root, tones: CH[m[3] || ''].map(i => root + i) };
    }

    let ctx = null, master = null, musicBus = null, sfxBus = null, noiseBuf = null;
    let muted = false, current = null, wanted = null, timer = null, ringNode = null, ringTimer = null;
    try { muted = localStorage.getItem('wikary_muted') === '1'; } catch (e) { /* brak storage */ }

    function init() {
        if (ctx) return true;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
        master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9;
        master.connect(comp); comp.connect(ctx.destination);
        sfxBus = ctx.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(master);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        return true;
    }
    function newMusicBus() {
        const g = ctx.createGain(); g.gain.value = 1;
        const shelf = ctx.createBiquadFilter(); shelf.type = 'lowshelf'; shelf.frequency.value = 140; shelf.gain.value = 6; // mocny bas
        g.connect(shelf); shelf.connect(master);
        g._out = shelf;
        return g;
    }

    /* ---------- instrumenty ---------- */
    function env(g, t, peak, dur, att, rel) {
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(peak, t + att);
        g.gain.setValueAtTime(peak, t + Math.max(att, dur));
        g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(att, dur) + rel);
    }
    function osc(type, f, t, dur, dest, gain) {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
        const g = ctx.createGain(); g.gain.value = gain; o.connect(g); g.connect(dest);
        o.start(t); o.stop(t + dur + 0.05); return o;
    }
    let pulseWave = null;
    function pulse25() {
        if (pulseWave) return pulseWave;
        const n = 32, re = new Float32Array(n), im = new Float32Array(n);
        for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25) * 1.2;
        pulseWave = ctx.createPeriodicWave(re, im); return pulseWave;
    }
    function organ(dest, t, f, dur, vol) {      // organy: kilka "piszczałek" (rejestry 8', 4', 2 2/3', 16')
        const g = ctx.createGain(); env(g, t, vol, dur, 0.03, 0.18); g.connect(dest);
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; lp.connect(g);
        [[1, 'square', 0.35], [2, 'triangle', 0.5], [3, 'sine', 0.22], [0.5, 'triangle', 0.45], [4, 'sine', 0.12]]
            .forEach(([m, type, a]) => osc(type, f * m, t, dur + 0.2, lp, a));
        const trem = ctx.createOscillator(); trem.frequency.value = 5.5; const tg = ctx.createGain(); tg.gain.value = vol * 0.12;
        trem.connect(tg); tg.connect(g.gain); trem.start(t); trem.stop(t + dur + 0.25);
    }
    function lead(dest, t, f, dur, vol) {
        const g = ctx.createGain(); env(g, t, vol, dur * 0.92, 0.005, 0.06); g.connect(dest);
        const o = ctx.createOscillator(); o.setPeriodicWave(pulse25()); o.frequency.value = f;
        const v = ctx.createOscillator(); v.frequency.value = 6; const vg = ctx.createGain(); vg.gain.value = f * 0.006;
        v.connect(vg); vg.connect(o.frequency);
        o.connect(g); o.start(t); o.stop(t + dur + 0.1); v.start(t); v.stop(t + dur + 0.1);
    }
    function bass(dest, t, f, dur, vol) {        // kwadrat przez filtr + sinus (sub) = mocny bas
        const g = ctx.createGain(); env(g, t, vol, dur * 0.85, 0.004, 0.05); g.connect(dest);
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 820; lp.Q.value = 3; lp.connect(g);
        osc('square', f, t, dur, lp, 0.55);
        osc('sine', f, t, dur, g, 0.9);
        osc('sine', f / 2, t, dur, g, 0.45);
    }
    function noise(dest, t, dur, vol, type, freq, endFreq) {
        const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
        const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t);
        if (endFreq) f.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
        const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.02);
    }
    function kick(dest, t, vol) {
        const o = ctx.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
        const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.3);
    }
    function snare(dest, t, vol) { noise(dest, t, 0.16, vol, 'highpass', 1400); osc('triangle', 190, t, 0.06, dest, vol * 0.5); }
    function hat(dest, t, vol) { noise(dest, t, 0.04, vol, 'highpass', 7000); }
    function sweep(type, f0, f1, dur, vol, t) {
        t = t || ctx.currentTime;
        const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
        const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.02);
        o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + dur + 0.05);
    }
    function bell(t, f, vol, dest) {
        [[1, 1], [2.76, 0.35], [5.4, 0.15], [0.5, 0.3]].forEach(([m, a]) => {
            const g = ctx.createGain(); g.gain.setValueAtTime(vol * a, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
            g.connect(dest || sfxBus); osc('sine', f * m, t, 1.6, g, 1);
        });
    }

    /* ---------- sekwencer ---------- */
    function startSong(name) {
        const s = SONGS[name]; if (!s || !ctx) return;
        const bus = newMusicBus();
        const lead = s.lead.filter(x => x);
        current = { name, s, bus, step: 0, next: ctx.currentTime + 0.08, len: Math.max(lead.length, s.chords.length * 8), leadT: lead };
        clearInterval(timer); timer = setInterval(tick, 25); tick();
    }
    function tick() {
        if (!current || !ctx) return;
        const c = current, s = c.s, stepDur = 60 / s.bpm / 2;
        while (c.next < ctx.currentTime + 0.15) {
            const i = c.step % c.len, t = c.next, bar = Math.floor(i / 8), pos = i % 8;
            const ch = chord(s.chords[bar % s.chords.length]);
            // organowe akordy (cały takt)
            if (pos === 0 && s.organVol) ch.tones.forEach(n => organ(c.bus, t, hz(n), stepDur * 8 - 0.05, s.organVol));
            // arpeggio (16-tki) w poziomie
            if (s.arpVol) for (let k = 0; k < 2; k++) {
                const n = ch.tones[(pos * 2 + k) % 3] + 12;
                const o = ctx.createOscillator(); o.setPeriodicWave(pulse25()); o.frequency.value = hz(n);
                const g = ctx.createGain(); env(g, t + k * stepDur / 2, s.arpVol, stepDur / 2 * 0.7, 0.003, 0.03);
                o.connect(g); g.connect(c.bus); o.start(t + k * stepDur / 2); o.stop(t + k * stepDur / 2 + stepDur / 2 + 0.05);
            }
            // melodia
            const tok = c.leadT[i % c.leadT.length];
            if (tok && tok !== '.' && tok !== '-') {
                let n = 1; while (c.leadT[(i + n) % c.leadT.length] === '-' && n < 16) n++;
                if (s.leadWave === 'organ') organ(c.bus, t, hz(tok), stepDur * n - 0.03, s.leadVol);
                else lead(c.bus, t, hz(tok), stepDur * n, s.leadVol);
            }
            // bas
            const bt = s.bass.split(' ')[pos];
            if (bt === 'r' || bt === 'o') {
                let n = 1; while (s.bass.split(' ')[pos + n] === '-') n++;
                bass(c.bus, t, hz(ch.root - 12 + (bt === 'o' ? 12 : 0)), stepDur * n, s.bassVol);
            }
            // perkusja
            if (s.drums === 'beat') {
                if (pos === 0 || pos === 3 || pos === 4 && bar % 2 === 1) kick(c.bus, t, 0.9);
                if (pos === 2 || pos === 6) snare(c.bus, t, 0.22);
                hat(c.bus, t, 0.07); hat(c.bus, t + stepDur / 2, 0.035);
            }
            c.step++; c.next += stepDur;
        }
    }
    function stopSong(fade) {
        clearInterval(timer); timer = null;
        if (current && ctx) {
            const b = current.bus, now = ctx.currentTime;
            b.gain.cancelScheduledValues(now); b.gain.setValueAtTime(b.gain.value, now); b.gain.linearRampToValueAtTime(0.0001, now + (fade || 0.25));
            setTimeout(() => { try { b._out.disconnect(); b.disconnect(); } catch (e) { /* ok */ } }, ((fade || 0.25) + 0.5) * 1000);
        }
        current = null;
    }

    /* ---------- efekty ---------- */
    const SFX = {
        jump: () => sweep('square', 260, 620, 0.13, 0.16),
        salto: () => { sweep('square', 300, 1100, 0.28, 0.14); sweep('triangle', 150, 600, 0.3, 0.2); },
        throw: () => { const t = ctx.currentTime; noise(sfxBus, t, 0.16, 0.25, 'bandpass', 2600, 500); sweep('square', 900, 1400, 0.06, 0.08); },
        hit: () => { sweep('square', 420, 70, 0.16, 0.2); noise(sfxBus, ctx.currentTime, 0.1, 0.3, 'lowpass', 3000, 400); },
        kill: () => { sweep('square', 700, 90, 0.22, 0.18); noise(sfxBus, ctx.currentTime, 0.18, 0.3, 'bandpass', 1800, 300); },
        hurt: () => { sweep('sawtooth', 520, 110, 0.35, 0.2); },
        splash: () => { const t = ctx.currentTime; noise(sfxBus, t, 0.45, 0.45, 'lowpass', 2200, 250); sweep('sine', 500, 120, 0.25, 0.25); },
        puddle: () => noise(sfxBus, ctx.currentTime, 0.18, 0.2, 'bandpass', 1500, 600),
        diamond: () => { const t = ctx.currentTime; sweep('square', 1318, 1318, 0.05, 0.09, t); sweep('square', 1975, 1975, 0.09, 0.09, t + 0.05); },
        pickup: () => { const t = ctx.currentTime; ['C6', 'E6', 'G6', 'C7'].forEach((n, i) => sweep('square', hz(n), hz(n), 0.07, 0.1, t + i * 0.06)); },
        boost: () => { sweep('square', 200, 1400, 0.35, 0.12); sweep('triangle', 100, 700, 0.35, 0.2); },
        thunder: () => {
            const t = ctx.currentTime;
            noise(sfxBus, t, 0.25, 0.9, 'highpass', 1500);
            noise(sfxBus, t + 0.05, 1.8, 0.9, 'lowpass', 900, 120);
            [0.15, 0.4, 0.7].forEach(d => noise(sfxBus, t + d, 0.5, 0.5, 'lowpass', 500, 80));
            sweep('sine', 70, 30, 1.6, 0.5);
        },
        slam: () => { kick(sfxBus, ctx.currentTime, 0.9); noise(sfxBus, ctx.currentTime, 0.2, 0.6, 'lowpass', 600, 100); },
        click: () => sweep('square', 880, 880, 0.03, 0.08),
        select: () => { sweep('square', 660, 1320, 0.1, 0.12); },
        pick_phone: () => { sweep('square', 300, 200, 0.05, 0.1); },
        charge: () => { sweep('triangle', 200, 900, 1.0, 0.18); sweep('square', 400, 1800, 1.0, 0.04); },
        grom: () => {
            SFX.thunder();
            const t = ctx.currentTime;
            ['C4', 'E4', 'G4', 'C5', 'G5'].forEach(n => organ(sfxBus, t + 0.05, hz(n), 1.2, 0.08));
            bell(t + 0.1, hz('C6'), 0.12);
        },
        win: () => { const t = ctx.currentTime; ['C5', 'E5', 'G5', 'C6', 'G5', 'C6'].forEach((n, i) => bell(t + i * 0.22, hz(n), 0.16)); },
        gameover: () => { const t = ctx.currentTime; ['E5', 'D#5', 'D5', 'C#5'].forEach((n, i) => { const g = ctx.createGain(); g.connect(sfxBus); lead(g, t + i * 0.3, hz(n), i === 3 ? 0.9 : 0.26, 0.12); }); bass(sfxBus, t + 0.9, hz('C#2'), 0.9, 0.35); },
        blink: () => {},
        fire: () => { const t = ctx.currentTime; noise(sfxBus, t, 0.3, 0.35, 'bandpass', 900, 3000); sweep('sawtooth', 180, 520, 0.2, 0.1); },
        bark: () => { const t = ctx.currentTime; [0, 0.18].forEach(d => { sweep('sawtooth', 340, 140, 0.12, 0.22, t + d); noise(sfxBus, t + d, 0.1, 0.25, 'bandpass', 900, 400); }); },
        caw: () => { const t = ctx.currentTime; sweep('sawtooth', 900, 600, 0.16, 0.08, t); sweep('sawtooth', 850, 560, 0.16, 0.07, t + 0.2); },
        grunt: () => { sweep('sawtooth', 160, 80, 0.25, 0.18); noise(sfxBus, ctx.currentTime, 0.2, 0.2, 'lowpass', 500, 200); },
        coin: () => { const t = ctx.currentTime; sweep('square', 988, 988, 0.08, 0.1, t); sweep('square', 1319, 1319, 0.3, 0.1, t + 0.08); },
        rumble: () => { const t = ctx.currentTime; noise(sfxBus, t, 1.6, 0.35, 'lowpass', 300, 60); sweep('sine', 55, 30, 1.4, 0.25); },
        door: () => { sweep('square', 220, 140, 0.25, 0.06); noise(sfxBus, ctx.currentTime, 0.2, 0.15, 'lowpass', 800, 300); },
        fizzle: () => { const t = ctx.currentTime; noise(sfxBus, t, 0.35, 0.25, 'highpass', 4000, 1500); sweep('sine', 600, 200, 0.2, 0.06); },
        bless: () => { const t = ctx.currentTime; ['E5', 'G#5', 'B5', 'E6'].forEach((n, i) => bell(t + i * 0.05, hz(n), 0.1)); sweep('triangle', 300, 1200, 0.4, 0.12); },
        scream: () => { const t = ctx.currentTime; sweep('sawtooth', 900, 300, 0.7, 0.12, t); sweep('square', 1300, 500, 0.7, 0.05, t); noise(sfxBus, t, 0.7, 0.25, 'bandpass', 1500, 600); },
        bells: () => { const t = ctx.currentTime; ['G4', 'D5', 'G4', 'B4', 'D5', 'G5'].forEach((n, i) => bell(t + i * 0.42, hz(n), 0.2)); },
        exorcise: () => { const t = ctx.currentTime; sweep('triangle', 200, 1600, 1.2, 0.18, t); ['C6', 'E6', 'G6'].forEach((n, i) => bell(t + 0.3 + i * 0.12, hz(n), 0.12)); noise(sfxBus, t, 1.0, 0.2, 'highpass', 2000, 6000); },
        swing: () => { const t = ctx.currentTime; noise(sfxBus, t, 0.2, 0.3, 'bandpass', 800, 2400); },
        doorhit: () => { kick(sfxBus, ctx.currentTime, 0.8); noise(sfxBus, ctx.currentTime, 0.25, 0.4, 'lowpass', 900, 200); },
        spell: () => { const t = ctx.currentTime; sweep('sine', 700, 1500, 0.18, 0.1, t); bell(t, hz('A6'), 0.06); },
        rise: () => { const t = ctx.currentTime; noise(sfxBus, t, 0.6, 0.2, 'lowpass', 400, 120); sweep('sine', 90, 60, 0.6, 0.15); },
        wave: () => { kick(sfxBus, ctx.currentTime, 0.7); noise(sfxBus, ctx.currentTime, 0.35, 0.3, 'lowpass', 700, 120); },
    };
    function ringBurst() {        // retro dzwonek telefonu: szybki tryl dwóch tonów
        if (!ctx || !ringNode) return;
        const t = ctx.currentTime;
        for (let i = 0; i < 20; i++) {
            const f = i % 2 ? 1320 : 1660, tt = t + i * 0.05;
            const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f;
            const g = ctx.createGain(); g.gain.setValueAtTime(0.06, tt); g.gain.setValueAtTime(0.0001, tt + 0.045);
            o.connect(g); g.connect(ringNode); o.start(tt); o.stop(tt + 0.05);
        }
    }

    return {
        get muted() { return muted; },
        get state() { return ctx ? ctx.state : 'none'; },
        /** wstrzymanie dźwięku (telefon w pionie); zwraca true, gdy to my wstrzymaliśmy */
        suspend() { if (!ctx || ctx.state !== 'running') return false; try { ctx.suspend(); } catch (e) { return false; } return true; },
        resumeSuspended() { if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* */ } } },
        unlock() {
            if (!init()) return;
            if (ctx.state === 'suspended') ctx.resume();
            if (wanted && (!current || current.name !== wanted)) startSong(wanted);
        },
        play(name) {
            wanted = name;
            if (!ctx) return;
            if (current && current.name === name) return;
            stopSong(0.3); startSong(name);
        },
        stop(fade) { wanted = null; stopSong(fade); },
        sfx(name) { if (!ctx || muted) return; try { (SFX[name] || (() => {}))(); } catch (e) { /* ignoruj */ } },
        ring(on) {
            if (!ctx) return;
            clearInterval(ringTimer); ringTimer = null;
            if (ringNode) { try { ringNode.disconnect(); } catch (e) { /* ok */ } ringNode = null; }
            if (on) { ringNode = ctx.createGain(); ringNode.connect(sfxBus); ringBurst(); ringTimer = setInterval(ringBurst, 1500); }
        },
        toggleMute() {
            muted = !muted;
            try { localStorage.setItem('wikary_muted', muted ? '1' : '0'); } catch (e) { /* ok */ }
            if (ctx) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.02);
            return muted;
        },
    };
})();
