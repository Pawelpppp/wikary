# Architektura projektu

## Przegląd

„Przygody Księdza Kamila” to statyczna gra przeglądarkowa 2D oparta na Phaser 3.80.1. Aplikacja używa czystego JavaScriptu ładowanego przez znaczniki `<script>` w `index.html`; nie ma procesu kompilacji ani bundlera. Scena bazowa ma rozmiar 568×320, skaluje się przez `Phaser.Scale.FIT`, a renderowanie jest skonfigurowane pod pixel art.

## Start i kolejność ładowania

`index.html` tworzy kontener gry, ładuje `style.css`, Phaser z CDN, a następnie skrypty projektu w ustalonej kolejności. Wspólna konfiguracja (`CFG`), manifest grafik (`ART_FILES`), obsługa zamienników (`ART`), dane poziomów (`LEVELS`) i moduły pomocnicze są ładowane przed definicjami scen i `src/main.js`.

`src/main.js` tworzy `Phaser.Game`, ustawia fizykę Arcade, skalowanie, obsługę wielu wskaźników i wyłącza wbudowane audio Phasera. Po gotowości gry inicjuje obsługę orientacji. `BootScene` ładuje grafiki, tworzy animacje i przechodzi do menu tytułowego. W trybie `?debug=1` udostępnia też `window.__wikary` do testów oraz wyboru sceny lub poziomu.

## Sceny i przepływ gry

- `BootScene` ładuje zasoby i rejestruje animacje.
- `TitleScene` prowadzi do `IntroScene` lub `ScoresScene`.
- `IntroScene` rozpoczyna nową rozgrywkę i przechodzi do `LevelScene`.
- `LevelScene` obsługuje podstawową rozgrywkę; rozszerzenia w `src/level2.js`, `src/level3.js` i `src/level4.js` dodają mechaniki, wrogów i bossów dla kolejnych poziomów.
- Po Level 1 gracz przechodzi przez `ChurchScene`; podsumowania poziomów i dialogi prowadzą do następnych etapów.
- `NickScene` zapisuje wynik, a `ScoresScene` wyświetla lokalną tablicę wyników.

Większość poziomów korzysta z tej samej sceny `Level` i wspólnego silnika rozgrywki. `src/levels.js` dostarcza dane poziomu, a klasa sceny dobiera zachowanie na podstawie jego konfiguracji, w tym kierunek ruchu, teren, fale wrogów i walkę z bossem.

## Stan i konfiguracja

`CFG` z `src/config.js` zawiera balans, wymiary świata, sterowanie i parametry poszczególnych mechanik. `LEVELS` z `src/levels.js` opisuje rozmieszczenie elementów i ustawienia poziomów. Współdzielony obiekt `GS`, zdefiniowany w `src/ui.js`, przechowuje stan bieżącej rozgrywki, między innymi życia, punkty i odblokowane moce. Dane są przekazywane między scenami, aby kontynuować tę samą rozgrywkę.

## Grafiki i dźwięk

Grafiki znajdują się w `assets/game/`, `assets/sprites/` i `assets/portraits/`. `tools/art_manifest.py` skanuje te katalogi i generuje `src/art_files.js`, czyli mapę dostępnych plików. `src/art.js` opisuje klucze docelowe i zamienniki (na przykład przyciemnione lub przeskalowane istniejące grafiki). `BootScene` ładuje dostępne pliki i tworzy animacje na podstawie ich klatek.

Dźwięk generuje `src/audio.js` przez Web Audio; pliki audio nie są częścią zasobów gry. Phaser ma ustawione `noAudio: true`.

## Sterowanie, ekran i wyniki

Sterowanie klawiaturą i dotykiem jest obsługiwane w scenach oraz wspólnych narzędziach UI. `src/orientation.js` wykrywa pionową orientację urządzeń dotykowych, wstrzymuje grę i pokazuje komunikat o obróceniu telefonu. Szczegóły sterowania i ustawień znajdują się w README.

`src/leaderboard.js` przechowuje maksymalnie 20 wyników w `localStorage` pod kluczem `wikary_leaderboard`; ostatni nick jest zapisywany osobno. Projekt nie korzysta obecnie z backendu tablicy wyników.

## Testy i publikacja

Testy w `tests/` używają pytest, pytest-playwright i Chromium do sprawdzania gry end-to-end, w tym scen, sterowania dotykowego, orientacji, zasobów i błędów konsoli. `tests/ci-workflow-example.yml` jest przykładową konfiguracją, a nie aktywnym workflow. README opisuje uruchamianie testów i serwera lokalnego.

Gra jest statyczną stroną; README wskazuje publikację przez GitHub Pages. Phaser jest ładowany z jsDelivr, więc przeglądarka potrzebuje dostępu do tego CDN.

## Stan funkcji i ograniczenia

Zaimplementowane są poziomy 1–4. Level 4 kończy się zapowiedzią „Level 5 – jazda samochodem wkrótce”; mechanika i scenariusz Level 5 nie są jeszcze zaimplementowane. README i komentarze w `src/art.js` opisują zastępcze grafiki Adriana używane do czasu dostarczenia docelowych assetów. W razie rozbieżności dokumentację funkcjonalną aktualizuj na podstawie kodu i testów, rozróżniając działające zachowanie od planów.
