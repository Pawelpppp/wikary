# Testy gry „Przygody Księdza Kamila”

Testy end-to-end w **Python + pytest + pytest-playwright**: prawdziwa gra w headless Chromium, sterowanie klawiaturą, myszą i dotykiem.

## Instalacja
```bash
pip install -r tests/requirements.txt
playwright install chromium
```

## Uruchomienie
```bash
# lokalnie: testy same startują http.server na wolnym porcie (katalog główny repo)
pytest tests

# na GitHub Pages (albo innym adresie)
pytest tests --base-url https://pawelpppp.github.io/wikary/
```
Przydatne opcje pytest-playwright: `--headed` (widoczna przeglądarka), `--browser-channel chrome` (systemowy Chrome zamiast pobranego Chromium), `-k salto` (wybrane testy), `-x` (stop po pierwszym błędzie).

## Zasady
- Każdy test kończy się porażką, gdy na stronie pojawi się `console.error`, `pageerror`, odpowiedź HTTP ≥ 400 albo żądanie do obcego hosta (dozwolone są tylko strona gry i `cdn.jsdelivr.net` z Phaserem; pozostałe żądania są blokowane). Pilnuje tego fixture `_guard` w `conftest.py`.
- Żadnych wywołań produkcyjnych API: tablica wyników jest tylko w `localStorage`, a testy czyszczą ją przed startem (każdy test ma też nowy, pusty kontekst przeglądarki).
- `?debug=1` (hook `window.__wikary`: teleport, pasek ultimate, krzyż, stan sceny) jest używany tylko tam, gdzie test musi sprawdzić lub ustawić stan gry. `test_console_errors.py` gra bez niego.
- Wersja: testy nie zależą od numeru, poza `test_version_matches_git_commit_count`, który lokalnie w kopii git sprawdza `WIKARY_VERSION == 1.(git rev-list --count HEAD)` (albo +1, gdy `src/version.js` jest zmieniony i jeszcze niezacommitowany). Z `--base-url` ten test jest pomijany.
- Zrzuty ekranu nieudanych testów trafiają do `tests/artifacts/` (w `.gitignore`).

## Pliki
| Plik | Co sprawdza |
|---|---|
| `conftest.py` | serwer lokalny / `--base-url`, pilnowanie błędów, zrzuty przy porażce |
| `wikary.py` | funkcje pomocnicze (start poziomu, teleport, stan gry) |
| `test_title.py` | ekran tytułowy, wersja, dopasowanie 568×320, wyciszanie M, menu |
| `test_highscores.py` | tablica wyników: pusta, sanityzacja nicku, sortowanie i limit 20, zapis nicku z polską literą |
| `test_intro.py` | start intro, Enter w dialogach, pomijanie Spacją |
| `test_level1.py` | ruch, kamera, rzeka (utonięcie, zwykły skok, salto), krzyż, wrogowie, dojście do kościoła (przejście do sceny Church) |
| `test_level2.py` | kościół (dymki, Enter, Spacja, przejście do Level 2), przenoszenie stanu L1→L2, kierunek w lewo, błyskawice, kładka (ruch, wożenie Kamila, ekran czeka), znicz → ogień przebijający 3 psy, wrony / dziki / ogniki, game over w L2 → nick, Hans (pasek, fala szczeknięcia ogłusza, fazy, wygrana → zakończenie → Level 3) |
| `test_art.py` | `src/art_files.js` aktualny (lokalnie), wszystkie grafiki docelowe załadowane, brak zamienników (także Adrian) |
| `test_crouch.py` | kucanie: niższy hitbox, brak biegu, skok z kucnięcia, nietoperz i pająk nad głową kucającego / trafiają stojącego |
| `test_ultimate.py` | Grom z Nieba: ładowanie, wyzwolenie, anulowanie, brak bez pełnego paska |
| `test_restart_state.py` | kolejne podejścia po wygranej i game over mają czysty stan |
| `test_touch_mobile.py` | dotyk (START, pominięcie intro, skok, przycisk ↓), stary układ przycisków z `?touch=buttons` (pionowo na środku przy krawędziach, OGIEŃ w Level 2 w obu trybach, półprzezroczyste, Kamil nie wchodzi pod nie), `?touch=1`, skalowanie 1280×720 |
| `test_touch_joystick.py` | joystick (test): prędkość zależna od wychylenia, martwa strefa, palec poza strefą, kucanie w dół; dotknięcie = skok, 2× = salto; stuknięcie w joystick = skok, 2× = salto na poziomach 1–4 (telefon 667×375), przeciągnięcie jedzie bez skoku, długie przytrzymanie nie skacze, progi w `CFG`; dymek przewijany bez skoku; KRZYŻ / SKOK / GROM / OGIEŃ razem z joystickiem (wielodotyk przez CDP); tryb `?touch=buttons` |
| `test_orientation.py` | telefon w pionie (iPhone SE 2./3. gen jako minimum, 13 mini, 15 Pro Max w emulacji Chromium; mniejszych nie testujemy): komunikat i pauza (czas, kamera, Kamil stoją, dźwięk wstrzymany), wznowienie po obróceniu, dopasowanie FIT bez przewijania, przyciski i joystick na ekranie i z dala od notcha, obrót w trakcie dymka, wznawianie tylko własnej pauzy, puszczenie joysticka, każda scena, brak komunikatu na komputerze, meta viewport i CSS pod iOS |
| `test_level3.py` | Level 3: przejście z Level 2 i przenoszenie stanu, noc i mgła, coraz więcej duchów, ogień syczy na duchach (dymek), krzyż je zabija, upiór (kurz, wyjście spod ziemi, chód), fantom przelatuje przez przeszkody, błogosławieństwo (zdobycie, promień, cooldown), drzwi z paskiem i grafiką wg HP, drzwi = 0 to game over, proboszcz rzuca czary i się męczy, 3 fale, Rafał (pasek, fazy, limit Gromu, klucze, wrzask), egzorcyzm, świt, dialog „Co ja tu robię?”, diabeł wychodzi z Rafała, podsumowanie „DALEJ: LEVEL 4” -> Level 4, `?debug=1&level=3` |
| `test_level4.py` | Level 4: zakończenie L3 z diabłem i przenoszenie stanu (z błogosławieństwem), bagno (mgła, doły, lilie stoją, pnie pływają, Kamil stoi na lilii), wpadnięcie do bagna = -1 życie, rój komarów, święcona woda (zabija małe, odpycha duże), duży komar nurkuje z żądłem, żaba skacze i strzela językiem, bagienny stwór (bąble, wyjście, chód), ogień działa na bagnie, Adrian (pasek, kule, roje, teleport, limit Gromu, fazy), czerwony ekran, diabeł spod ziemi, dialog, auto odjeżdża w lewo, „LEVEL 5” -> nick, `?debug=1&level=4`, finalna grafika Adriana: animacje z plików, w drzwiach chaty, bez tintu, patrzy na Kamila, stopy i hitbox na ziemi (idle, cast, hurt z przesunięciem stóp 11 px), portret w dymku, klęczy po pokonaniu, zawstydzony portret na końcu |
| `test_stomp.py` | naskok: wróg z 1 HP ginie, Kamil lekko się odbija i nie traci życia; wróg z 2 HP traci 1 HP, Kamil odbija się wyżej bez obrażeń; wejście z boku nadal rani; działa na latających (wrona, duży komar) i duchach (duszek, upiór); bossy (Hans) wyłączone |
| `test_fullscreen.py` | pełny ekran: przycisk i klawisz F na tytule i w levelu, wyjście przeglądarką, intro w trakcie przybliżenia (przycisk działa, klik nie przewija), nick (F = litera), dotyk na tytule: pełny ekran dopiero na puszczeniu palca (pointerup), bez zmiany sceny; dotyk F w levelu nie skacze, w intro nie pomija; iPhone bez Fullscreen API: podpowiedź „DO EKRANU POCZĄTKOWEGO”; odmowa przeglądarki: `fullscreenfailed` bez błędów konsoli |
| `test_retry.py` | pytanie „POWTÓRZYĆ POZIOM?” po GAME OVER: TAK (Enter) = ten sam poziom od początku, wynik zostaje, 3 życia, druga przegrana bez pytania do nicku; NIE (strzałka + Spacja) do nicku; dotyk TAK, moce ze startu poziomu; nowa gra z tytułu zeruje licznik |
| (w `test_level2.py`) | `test_level2_has_20_percent_fewer_bats`: w Level 2 spawnuje się 80% ±3% wylosowanych nietoperzy (40 000 losowań, oba zestawy), inni wrogowie i Level 1 bez zmian |
| `test_difficulty.py` | ekran wyboru trudności (klawiatura, Esc, dotyk, zapamiętany wybór); każdy profil: życia, HP i prędkość wrogów, HP bossa, powtórka; serca częściej na łatwym; trudny bez powtórki, trudność na ekranie nicku i w tabeli wyników (stare wpisy bez trudności) |
| `test_analytics.py` | GoatCounter (issue #2), bez prawdziwych żądań (gc.zgo.at mockowany): domyślnie placeholder i `allowedHosts` = ksiadz.trawiasta.pl; na localhost skrypt się nie ładuje nawet z kontem; reguły (file:, 127.0.0.1, inny host, pusty adres); z wymuszonym hostem: `count.js` z właściwym `data-goatcounter`, nic widocznego, zdarzenie „start gry” przy nowej grze; placeholder lub inny host = brak skryptu; skrypt bez `goatcounter` nie psuje startu gry |
| `test_spells.py` | czary (CFG.spells): grafika krzyża i ognia bez zmian, hitbox ×1.5 + zasięg w dół/górę; stojący Kamil trafia psa przy ziemi krzyżem i ogniem (pies jest poniżej grafiki), nietoperz 2 px nad grafiką pocisku trafiony; krzyż znika po ok. 205 px (wcześniej niż 900 ms); ogień doleci do krawędzi ekranu; promień błogosławieństwa 180 px; TRUDNY: stare wartości (hitbox 16×19.2 / 26×18, krzyż 342 px, ogień 330 px, pies przebiega pod krzyżem, błogosławieństwo 120 px), ŁATWY i NORMALNY: nowe |
| `test_devstart.py` | `?dev=true`: po wyborze trudności lista startów (INTRO + 9 punktów), strzałkami do Level 4 (TRUDNY: 2 życia), dotykiem do Adriana (ŁATWY: 5 żyć), kościół Spacją, Esc wraca, INTRO; bez `?dev=true` brak listy |
| `test_console_errors.py` | zwykłe uruchomienie bez debug, krótka rozgrywka, ładowanie wszystkich grafik |

## CI
Przykładowy workflow GitHub Actions jest w `tests/ci-workflow-example.yml`. Żeby go włączyć, skopiuj go do `.github/workflows/tests.yml` (wymaga uprawnienia `workflow` przy wypychaniu).
