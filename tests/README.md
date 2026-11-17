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
| `test_level1.py` | ruch, kamera, rzeka (utonięcie, zwykły skok, salto), krzyż, wrogowie, dojście do kościoła |
| `test_crouch.py` | kucanie: niższy hitbox, brak biegu, skok z kucnięcia, nietoperz i pająk nad głową kucającego / trafiają stojącego |
| `test_ultimate.py` | Grom z Nieba: ładowanie, wyzwolenie, anulowanie, brak bez pełnego paska |
| `test_restart_state.py` | kolejne podejścia po wygranej i game over mają czysty stan |
| `test_touch_mobile.py` | dotyk (START, pominięcie intro, skok, przycisk ↓), układ przycisków (pionowo na środku przy krawędziach, półprzezroczyste, Kamil nie wchodzi pod nie), `?touch=1`, skalowanie 1280×720 |
| `test_console_errors.py` | zwykłe uruchomienie bez debug, krótka rozgrywka, ładowanie wszystkich grafik |

## CI
Przykładowy workflow GitHub Actions jest w `tests/ci-workflow-example.yml`. Żeby go włączyć, skopiuj go do `.github/workflows/tests.yml` (wymaga uprawnienia `workflow` przy wypychaniu).
