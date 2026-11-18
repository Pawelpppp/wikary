# Wskazówki dla agentów

## Projekt

To przeglądarkowa gra platformowa „Przygody Księdza Kamila”, napisana w JavaScripcie z Phaser 3. Repozytorium nie używa bundlera ani menedżera pakietów dla aplikacji: `index.html` ładuje skrypty i Phaser 3.80.1 z jsDelivr. Szczegóły gry i sterowania opisuje [README.md](README.md), a podział komponentów [architecture.md](architecture.md).

## Gdzie wprowadzać zmiany

- `src/config.js` (`CFG`) zawiera parametry rozgrywki i rozmiar bazowy sceny. Nie rozrzucaj nowych stałych balansu po kodzie poziomów.
- `src/levels.js` (`LEVELS`) opisuje poziomy jako dane: kierunek, przeszkody, znajdźki, wrogów i przejścia.
- `src/level.js` zawiera wspólną implementację rozgrywki; `level2.js`–`level4.js` rozszerzają ją o mechaniki konkretnych poziomów.
- `src/ui.js` zawiera współdzielony stan gry (`GS`) i pomocnicze funkcje interfejsu.
- `src/art.js` definiuje zamienniki brakujących grafik, a `src/art_files.js` jest generowany na podstawie plików w `assets/`.
- `index.html` ustala kolejność ładowania skryptów. Przy dodaniu nowego skryptu zachowaj kolejność zależności i dodaj go przed `src/main.js`, jeśli jest używany podczas startu gry.

## Zasady implementacji

- Zachowuj obecny model: klasyczny JavaScript w globalnym zakresie, bez modułów, bundlera i nowych zależności aplikacji, o ile zmiana nie wymaga świadomej przebudowy konfiguracji.
- Pamiętaj, że kolejność `<script>` w `index.html` jest kolejnością inicjalizacji. Wspólne symbole muszą być zdefiniowane przed skryptami, które z nich korzystają.
- Utrzymuj zgodność z rozdzielczością bazową 568×320, renderowaniem pixel art i obsługą klawiatury oraz dotyku.
- Assety umieszczaj w odpowiednim katalogu `assets/`. Po dodaniu lub usunięciu grafik uruchom `python3 tools/art_manifest.py`; nie edytuj ręcznie `src/art_files.js`.
- Przy brakujących assetach używaj mechanizmu `ART` z `src/art.js`, jeśli scena ma działać przed dostarczeniem docelowej grafiki.
- Tablica wyników działa lokalnie przez `localStorage`. Nie dodawaj żądań do produkcyjnych usług ani zewnętrznych hostów bez zmiany wymagań projektu.
- Traktuj opisy przyszłych poziomów i brakujących grafik w README jako plany, nie jako działające elementy gry.

## Uruchamianie i testy

- Lokalnie uruchom serwer statyczny z katalogu repozytorium: `python3 -m http.server 8000`, a następnie otwórz `http://localhost:8000/`.
- Testy end-to-end: `pip install -r tests/requirements.txt`, `playwright install chromium`, następnie `pytest tests`.
- Testy mogą działać przeciwko opublikowanej stronie przez `pytest tests --base-url https://pawelpppp.github.io/wikary/`.
- Workflow z `tests/ci-workflow-example.yml` jest przykładowy; sam plik nie oznacza, że CI jest aktywne.
- `src/version.js` jest powiązany z liczbą commitów; test `test_version_matches_git_commit_count` w `tests/test_title.py` sprawdza tę zależność w lokalnej kopii git.
