# Przygody Księdza Kamila
Retro 16-bit gra w przeglądarce (Phaser 3), repo `wikary`.

**Zagraj:** https://pawelpppp.github.io/wikary/

## Jak uruchomić
- Online: GitHub Pages z gałęzi `master` (link wyżej).
- Lokalnie: z katalogu repo `python3 -m http.server 8000`, potem http://localhost:8000/ (gra ładuje pliki, więc potrzebny jest serwer, a nie `file://`).

## Testy
Automatyczne testy (Python + pytest + Playwright, przeglądarka headless) są w katalogu [`tests/`](tests/README.md): `pip install -r tests/requirements.txt`, `playwright install chromium`, potem `pytest tests` (lokalnie) albo `pytest tests --base-url https://pawelpppp.github.io/wikary/` (na Pages).

## Technologia
- **Phaser 3.80** z CDN (jsDelivr), czysty JavaScript bez bundlera: `index.html`, `style.css`, `src/*.js`.
- Rozdzielczość bazowa **568×320**, `Scale.FIT` + wyśrodkowanie, `pixelArt`, `roundPixels`. Mieści się w całości na telefonie poziomo.
- **Wszystkie parametry rozgrywki** (prędkości, skok, grawitacja, auto-scroll, obrażenia, nietykalność, koszt ultimate, spawn wrogów, punkty) są w jednym bloku `CFG` w `src/config.js`.
- **Poziomy opisane danymi** w `src/levels.js` (kierunek `dir` w prawo/lewo, rzeki, przeszkody, znajdźki, zestaw wrogów, koniec poziomu). Są Level 1, Level 2, Level 3 (`defense`, `boss: 'rafal'`) i Level 4 (`boss: 'adrian'`, `nextText`: zapowiedź Level 5).
- Dźwięk: chiptune generowany w **Web Audio** (`src/audio.js`, bez plików): organy na tytule i w intro, szybki motyw w Level 1, mocny bas, efekty (skok, salto, trafienie, znajdźki, dzwonek telefonu, piorun, rzut krzyżem, ogień, szczekanie, kracz, moneta, grzmot, Grom z Nieba). Level 2 ma własny mroczny motyw, a Hans szybki motyw bossa. Level 3 ma nocny motyw (h-moll) i własne efekty: syk gasnącego ognia, błogosławieństwo, wrzask Rafała, zamach kluczami, uderzenie w drzwi, czar proboszcza, upiór spod ziemi, egzorcyzm i dzwony o świcie. Level 4 ma powolny, bagienny motyw (g-moll) i efekty: bzyczenie komarów, rechot i język żaby, bąble bagna, aura święconej wody, czar i teleport Adriana, głos diabła i silnik auta.
- Font: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) (SIL OFL, `assets/fonts/`).
- Wersja na ekranie tytułowym: `v1.N`, N = liczba commitów na `master` (`src/version.js`).
- Pliki: `src/boot.js` (ładowanie, animacje), `title.js`, `scores.js`, `intro.js`, `church.js` (kościół), `level.js` + `level2.js` (kładka, pogoda, nowi wrogowie, ogień, Hans) + `level3.js` (noc i mgła, duchy, błogosławieństwo, obrona kościoła, Rafał, świt) + `level4.js` (bagno i zielona mgła, lilie i pnie, komary / żaby / bagienne stwory, święcona woda, Adrian, Czerwony Diabeł, auto), `art.js` + `art_files.js` (grafiki i zamienniki), `nick.js`, `ui.js`, `leaderboard.js`, `main.js`.

## Sterowanie
| Akcja | Klawiatura | Dotyk |
|---|---|---|
| Bieg w lewo / prawo | ← / → | joystick z lewej (test): mocniej wychylony = szybciej; tryb przycisków: `<` / `>` |
| Kucnięcie (trzymaj; nietoperze i pająki mijają głowę, krzyż leci nisko, można z niego skoczyć) | ↓ | joystick w dół (test); tryb przycisków: `↓` |
| Skok / salto | Spacja, 2× Spacja (w powietrzu) | dotknięcie ekranu poza joystickiem i przyciskami (test), 2× = salto; zawsze też SKOK, 2× SKOK |
| Rzut krzyżem (po zdobyciu krzyża) | Alt | KRZYŻ |
| Kula ognia, przebija kilku wrogów (po zdobyciu znicza w Level 2; na duchy nie działa) | Z | OGIEŃ |
| Błogosławieństwo: fala wokół Kamila, zabija duchy w promieniu (po zdobyciu w Level 3, dłuższy cooldown) | X | BŁOG. |
| Grom z Nieba (pełny pasek) | trzymaj Shift 1 s, puść | trzymaj GROM, puść |
| Pełny ekran | F | przycisk F |
| Wycisz | M | przycisk M |
| Menu | ↑ ↓ + Enter / Spacja | dotknij przycisk |

Na dotyku przyciski są półprzezroczyste i pionowo na środku ekranu: GROM / (OGIEŃ od Level 2) / (BŁOG. od Level 3) / KRZYŻ / SKOK przy prawej krawędzi. Kamil nie wchodzi pod przyciski (margines `CFG.touch.heroMargin`).

**Pełny ekran:** klawisz F albo przycisk F w prawym górnym rogu każdej sceny (tytuł, intro, kościół, poziomy, wyniki, nick; w nicku F to litera). Działa na komputerze i na Androidzie: gra prosi o pełny ekran całej strony w samym geście (przycisk reaguje na puszczenie palca, bo samo dotknięcie Android nie uznaje za zgodę), a potem o blokadę orientacji poziomej. Dotknięcie F nie powoduje skoku ani nie pomija intro. Gdy przeglądarka odmówi, pojawia się krótka podpowiedź. iPhone nie ma pełnego ekranu dla stron (tylko dla filmów), więc F pokazuje podpowiedź „UDOSTĘPNIJ → DO EKRANU POCZĄTKOWEGO”: gra dodana do ekranu początkowego uruchamia się bez pasków Safari. Ustawienia: `CFG.fullscreen`.

**Powtórzenie poziomu:** po GAME OVER gra raz na rozgrywkę pyta „POWTÓRZYĆ POZIOM?” (TAK / NIE; strzałki + Spacja/Enter albo dotknięcie przycisku). TAK zaczyna ten sam poziom od początku: wynik zostaje, życia wracają do 3, krzyż/ogień/błogosławieństwo i pasek wracają do stanu ze startu poziomu. NIE albo druga przegrana prowadzi do wpisania nicku. Nowa gra z ekranu tytułowego zeruje licznik. Ustawienia: `CFG.retry` (`maxRetries`, `askDelayMs`).

**Telefon w pionie:** gra się zatrzymuje (fizyka, animacje, timery i czas poziomu stoją, dźwięk jest wstrzymany), a na całym ekranie widać komunikat „OBRÓĆ TELEFON POZIOMO”. Po obróceniu gra dopasowuje się do ekranu i rusza dalej od tego samego miejsca, także w trakcie dymka. Trzymany joystick i przyciski są wtedy puszczane, więc Kamil nie biegnie sam. Działa na każdym ekranie (tytuł, intro, kościół, poziomy, wyniki, nick), tylko na urządzeniach dotykowych; na komputerze komunikat nigdy się nie pokazuje. Ustawienia: `CFG.orientation` (`enabled`, `debounceMs`). Na iPhonie pole gry omija notch (`viewport-fit=cover` + `env(safe-area-inset-*)`), strona się nie przewija ani nie powiększa. Po wejściu w pełny ekran gra prosi o blokadę poziomej orientacji (Android; iOS po cichu odmawia). Sprawdzone w emulacji iPhone SE 2./3. gen (375×667), 13 mini (375×812) i 15 Pro Max (430×932). Minimalna testowana szerokość: 667 px w poziomie (iPhone SE 2./3. gen, 667×375); mniejszych urządzeń nie testujemy.

**Joystick (wersja testowa, domyślna na telefonie poziomo):** w lewych 40% ekranu (pod HUD-em) pojawia się pod palcem pływający joystick. Prędkość biegu zależy od wychylenia (martwa strefa 15%), a pociągnięcie w dół = kucnięcie. Palec może wyjechać poza strefę i dalej sterować. Dotknięcie gdziekolwiek indziej (poza przyciskami) = skok, drugie w powietrzu = salto. Gdy widać dymek albo podsumowanie, dotknięcie tylko je przewija. Wszystkie ustawienia są w `CFG.touch.joystick`. Tryb wybiera `CFG.touch.mode` (`'joystick'` albo `'buttons'`, czyli stare przyciski `<` `>` `↓` przy lewej krawędzi). Do testów A/B służy nadpisanie w adresie: `?touch=buttons` albo `?touch=joystick`.

| Scenka | Klawiatura | Dotyk |
|---|---|---|
| Intro | Spacja = pomiń, Enter = dalej | dotknij = pomiń |
| Kościół | Spacja / Esc = pomiń, Enter / klik = dalej | dotknij = dalej, POMIŃ |
| Rozmowy w poziomach (Level 2–4) | Enter / Spacja / klik = dalej | dotknij = dalej |

## Status (co już działa)
- ✅ Ekran tytułowy: złoty migoczący tytuł, kościół, mrugająca twarz Kamila, rząd świeczek, START NEW GAME / HIGH SCORES, wersja, M i F.
- ✅ HIGH SCORES: 20 wyników w dwóch kolumnach, wpisywanie nicku po GAME OVER i po wygranej (na telefonie systemowe okienko).
- ✅ Intro: modlitwa od tyłu, zbliżenie na twarz, telefon, rozmowa z proboszczem, wybiegnięcie z domu.
- ✅ Level 1 „Droga na plebanię”: auto-scroll, podpowiedzi, płotki, kosze na śmieci i kałuże, rzeka tylko z saltem (wpadnięcie = -1 życie i powrót przed rzekę), krzyż z piorunem i przyciemnieniem, rzut krzyżem, psy, wilki, nietoperze, pająki, diamenciki, pioruny (przyspieszenie), kościół i podsumowanie.
- ✅ Grom z Nieba (ultimate) i HUD: życia, punkty, czas, pasek ataku specjalnego.
- Czas w HUD liczy się w czasie gry na poziomach (intro się nie wlicza).
- ✅ Level 1 ma już docelowe grafiki: tła z paralaksą, bruk, rzeka, płotki, kosze na śmieci, kałuże, wrogowie, znajdźki, kościół z otwieranymi drzwiami, piorun i Grom z Nieba.
- ✅ Kościół po Level 1: rozmowa z proboszczem (dymki z mrugającymi portretami, animacja mówienia, błogosławieństwo), Kamil wychodzi w lewo do Level 2.
- ✅ Level 2 „Wizyta u skąpego parafianina”: ekran w lewo, wieczór, deszcz i dalekie błyskawice, rozkopana droga, zwalone drzewa, dwie rzeki (druga z ruchomą kładką), wrony, dziki, błędne ogniki, znicz i kula ognia (Z), dom Krzysztofa, boss Hans z paskiem życia, zakończenie z dziesięcioma złotymi.
- ✅ Punkty, życia, pasek, krzyż i czas przechodzą z poziomu na poziom; game over w Level 2 prowadzi (po pytaniu o powtórzenie) do wpisania nicku.
- ✅ Powtórzenie poziomu po GAME OVER (raz na rozgrywkę, wynik zostaje).
- ✅ Level 3 „Noc duchów”: noc, mgła i księżyc, duszki / fantomy / upiory (ogień na nie nie działa), błogosławieństwo (X), obrona drzwi kościoła z proboszczem (3 fale, pasek drzwi), boss kościelny Rafał, egzorcyzm, Czerwony Diabeł wychodzi z Rafała i ucieka na bagna, świt z dzwonami, proboszcz wysyła Kamila do Level 4.
- ✅ Level 4 „Bagna”: zmierzch i zielona mgła, bagienne doły (wpadnięcie = -1 życie), lilie wodne i pływające pnie, komary (małe roje i duże z żądłem), żaby z językiem, bagienne stwory spod ziemi, święcona woda (aura na komary), chata Adriana na palach, boss czarnoksiężnik Adrian (kule, roje, teleport, 3 fazy, pasek), czerwony ekran i diabeł spod ziemi, auto Adriana, „CIĄG DALSZY: LEVEL 5 – JAZDA SAMOCHODEM WKRÓTCE” i wpisanie nicku. Grafiki Adriana jeszcze nie dotarły (zamienniki).
- ⏳ Następne: grafiki Adriana, Level 5 (jazda samochodem, scenariusz niżej), wspólna tablica na Azure.

**Debug:** `?debug=1` na ekranie tytułowym: 1 = Level 1, 2 = kościół, 3 = Level 2, 4 = Level 2 tuż przed Hansem, 5 = Level 3, 6 = Level 3 obrona kościoła, 7 = Level 3 od razu Rafał, 8 = Level 4, 9 = Level 4 tuż przed chatą Adriana (także `?debug=1&level=2` / `level=3` / `level=4`). W konsoli: `__wikary.startL4('boss')`, `__wikary.adrian()`, `__wikary.devil()`.

## Bohater
Główną postacią jest **wikary Kamil**: rude krótkie włosy, czarna sutanna, plecak.

## Mechanika
- **Chodzenie i bieg** w lewo i w prawo (strzałki).
- **Podskok:** jedno wciśnięcie Spacji = zwykły podskok.
- **Skok z saltem:** dwa wciśnięcia Spacji = wyższy skok z saltem.
- **Naskok (stomp):** gdy Kamil spada i trafia stopami w wierzch wroga, nie traci życia. Wróg z 1 HP ginie (punkty, poof, czasem serduszko), a Kamil lekko się odbija. Twardszy wróg traci 1 HP (białe mignięcie), a Kamil odbija się wyżej; po odbiciu można jeszcze zrobić salto. Przez chwilę po odbiciu wrogowie go nie ranią. Działa na wszystkich zwykłych wrogach, także latających (nietoperze, wrony, komary, ogniki) i na duchach w Level 3; nie działa na bossach (Hans, Rafał, Adrian). Wejście we wroga z boku nadal zabiera życie. HP wrogów: pies, nietoperz, pająk, wrona, ognik, duszek, mały komar = 1; wilk, dzik, fantom, duży komar, żaba = 2; upiór, bagienny stwór = 3. Ustawienia: `CFG.stomp` (`bounceKill`, `bounceHit`, `tolerancePx`, `invulnMs`, `exclude`).
- **Życia:** start z 3 (`CFG.hero.lives`), najwyżej 6 (`CFG.hero.maxLives`); w HUD-zie puste miejsca są przyciemnione. Na poziomach leżą **serduszka** (+1 życie; 1 / 2 / 4 / 6 w Level 1–4, `CFG.lifePickup.countByLevel`), a pokonany wróg czasem upuszcza serduszko (15% w Level 1, rosnąco do 30% w Level 4, `dropChanceByLevel`). Przy komplecie żyć serduszka znikają.
- **Moce:**
  - uderzenie **ogniem**,
  - uderzenie **krzyżem**,
  - **błogosławieństwo krzyżem**,
  - **modlitwa**.

## Ekran tytułowy
- **Tytuł:** **PRZYGODY KSIĘDZA KAMILA**, duże pikselowe złote litery z ciemnym obrysem, lekko migoczące jak w blasku świec.
- **Tło:** ciemne wnętrze kościoła (witraż, ołtarz w półmroku), a w tle **duża twarz księdza Kamila** (portret z bliska, przyciemniony i półprzezroczysty). Co kilka sekund Kamil **mruga** (podmiana portretu na wersję z zamkniętymi oczami).
- **Świeczki:** na dole ekranu rząd **palących się świeczek** z animowanymi płomykami i delikatną poświatą, która lekko pulsuje.
- **Menu:**
  - **START NEW GAME** (Spacja / Enter / tap): odpala intro,
  - **HIGH SCORES** (tablica wyników).
- U dołu numer wersji `v1.N` (N = liczba commitów), przycisk wyciszenia (M) i pełnego ekranu (F).
- **Muzyka:** spokojny chiptune na organach z mocnym basem.

## Tablica wyników (High Scores)
Działa jak w Fibi Run:
- Po **GAME OVER** i po **wygranej** gracz wpisuje **nick** (maks. 12 znaków: wielkie litery, cyfry, spacja, myślnik, polskie znaki).
- Zapis: nick, **łączna liczba punktów** i **czas od START** do końca gry (`mm:ss`). Licznik czasu widać w HUD.
- Sortowanie: więcej punktów, a przy remisie krótszy czas.
- Tablicę otwiera przycisk **HIGH SCORES** z ekranu tytułowego (ranga, nick, punkty, czas).
- Na razie wyniki są zapisywane **lokalnie** (`localStorage`, klucz `wikary_leaderboard`, do 20 wyników).
- **TODO:** wspólna tablica dla wszystkich graczy na **Azure**, w **nowej, osobnej tabeli** (nie tej z Fibi Run). Lokalny zapis zostaje jako zapas, gdy API nie odpowiada. W testach API zawsze mockowane.

## Początek gry

### Intro (cutscenka, sterowanie zablokowane, można pominąć Spacją)
1. **Kamera za plecami:** ciemne, ciche wnętrze pokoju na plebanii, świeca na parapecie. Wikary klęczy i się **modli** (cicha melodia organowa w chiptune).
2. **Zmiana ujęcia:** kamera przechodzi na **front** i robi **przybliżenie na twarz**: portret z bliska, oczy **zamknięte**, skupienie.
3. **Dzwoni telefon** (głośny, retro dzwonek; telefon trzęsie się na stoliku). Wikary **otwiera oczy** (podmiana portretu na wersję z otwartymi oczami).
4. Wikary **sięga po telefon**. Dymek dialogowy z portretem: dzwoni proboszcz i **wzywa go na plebanię** („Kamil, pilnie na plebanię! Tylko się nie spóźnij!”). Wikary: „Już lecę, proszę księdza!”.
5. Wikary **wybiega z domu**, drzwi trzaskają, ekran przechodzi w **Level 1**.

### Level 1: „Droga na plebanię” (rozgrzewka)
- **Typ:** platformówka 2D z bocznym widokiem, **ekran sam przesuwa się w prawo**, a gracz biegnie, skacze i unika przeszkód.
- **Tło:** miasto i domki (kilka warstw paralaksy: niebo, dalsze bloki, bliższe domki z płotkami), a **na końcu poziomu stoi kościół**.
- **Rozgrzewka:** na początku są tylko proste przeszkody (płotki, kałuże, śmietniki) i **rzeka** do przeskoczenia, żeby gracz załapał zwykły skok i skok z saltem (rzeka jest szersza, bez salta się nie da). Wpadnięcie do wody = utrata życia i powrót przed rzekę. Na początku są krótkie podpowiedzi w dymkach („SPACJA = skok”, „2× SPACJA = salto”).
- **Pierwszy item, krzyż:** zaraz po przeskoczeniu rzeki na drodze leży świecący **krzyż**. Po podniesieniu **strzela piorun**, ekran się **przyciemnia**, wikary unosi krzyż i dostaje **pierwszą umiejętność: atak dystansowy krzyżem** (Alt). Dymek z podpowiedzią: „ALT = rzut krzyżem”. Od tej chwili można strzelać.
- **Przeciwnicy:**
  - z ziemi: **dzikie psy** (szybkie, biegną prosto na gracza) i **wilki** (wolniejsze, wytrzymalsze, skaczą),
  - z powietrza: **nietoperze** (lecą falą) i **pająki** (zjeżdżają z góry na nitce).
- **Do zebrania po drodze:**
  - **diamenciki** = punkty (do wyniku i do paska ataku specjalnego),
  - **pioruny** = chwilowe **przyspieszenie biegu**.
- **Koniec poziomu:** wikary dobiega do **kościoła**, krótki dymek („Zdążyłem!”), podsumowanie punktów i przejście dalej.

### Proboszcz (postać niezależna)
- Starszy, siwy ksiądz w białej piusce, z ciepłym, lekko przebiegłym uśmiechem. Szef wikarego: **daje mu zadania** przed każdą misją i **gratuluje** po jej ukończeniu.
- W rozmowach pokazuje się jako portret w dymku (jak Kamil), a w kościele stoi jako pełna postać przy ołtarzu.

### Kościelny Rafał (boss Level 3, „Upiorny Kościelny”)
- Parafialny **kościelny Rafał**, na co dzień poczciwy opiekun kluczy i dzwonów. W Level 3 jest **opętany przez upiora**: blada, sina twarz, świecące oczy i upiorna poświata.
- Walczy **pękiem kluczy**: **zamach wręcz** z bliska, **rzut kluczem** na dystans i **wrzask**, który przywołuje **duszki**.
- Po pokonaniu następuje **egzorcyzm**: uderza piorun i z Rafała **wychodzi Czerwony Diabeł**, a Rafał wraca do normy, zdezorientowany: „Co ja tu robię?”. Potem dołącza do końcowej sceny o świcie z proboszczem.
- Grafiki są w grze: upiorna wersja (`boss_rafal_*`: lot, chód, zamach, rzut, wrzask, trafienie, egzorcyzm; klucze `proj_key_1..2`; uciekający duch `fx_rafal_ghost_1..3`), normalna wersja po egzorcyzmie (`rafal_idle/talk/walk/dazed_*`) i portrety (`rafal_closeup_open/closed/confused`, `rafal_ghost_closeup_open/closed`). Podgląd: `docs/contact_rafal_ghost.png`, `docs/contact_rafal_normal.png`, `docs/contact_rafal_portraits.png`.

### Kościół po Level 1 (cutscenka z dymkami)
1. Wikary wbiega do kościoła, przy ołtarzu czeka **proboszcz** (obok koszyczek z tacy). Proboszcz: „No, jesteś wreszcie! Zuch chłopak, dobrze się spisałeś”.
2. Kamil: „Psy, wilki, nietoperze... Proszę księdza, ja tu biegłem jak na olimpiadzie!”. Proboszcz: „Dobrze, dobrze, olimpijczyku. Zajrzyjmy do koszyczka z tacy...”.
3. Proboszcz: „Wszyscy dali pięknie... tylko pan **Krzysztof „Dwa Grosze” spod lasu** wrzucił guzik i dwa grosze”. Kamil: „Guzik? A chociaż ładny?”. Proboszcz: „Od kalesonów. Idź do niego, porozmawiaj. Niech się chłop nawróci”.
4. Kamil: „Do Krzysztofa? Przecież tam po drodze same wilki i błoto...”. Proboszcz: „Pan Bóg cię prowadzi. I weź parasol, bo będzie padać”.
5. Proboszcz **błogosławi** Kamila na drogę, a wikary wychodzi z kościoła i **tym razem idzie w lewo**, tą samą drogą, którą przyszedł.

### Level 2: „Wizyta u skąpego parafianina”
- **Kierunek odwrócony:** ekran przesuwa się **w lewo**, a gracz idzie w stronę, z której przyszedł. Ta sama okolica, ale **wieczorem i w deszczu** (ciemniejsze niebo, kałuże, błyskawice w tle).
- **Trudniej niż w Level 1:** więcej przeszkód (rozkopana droga, przewrócone drzewa, dwie rzeki, w tym jedna z ruchomą kładką) i **więcej potworów** naraz.
- **Nowi przeciwnicy:** **wrony** (pikują na gracza z góry), **dziki** (szarżują, trzeba je przeskoczyć albo trafić dwa razy), a nocą **błędne ogniki** (lewitują i krążą wokół gracza).
- **Nowy item, ogień:** w połowie drogi wikary znajduje **znicz**, po którym (piorun i przyciemnienie jak przy krzyżu) dostaje **atak ogniem**, który przebija kilku wrogów naraz.
- **Kładka:** nad drugą rzeką pływa deska, na którą trzeba wskoczyć. Ekran czeka przy rzece, aż Kamil przepłynie.
- **Koniec poziomu:** dom pana Krzysztofa. Ekran się zatrzymuje, drzwi się otwierają i Krzysztof „Dwa Grosze” wychodzi na próg:
  - Krzysztof: „Czego?! Jak po kolędę, to w styczniu!”. Kamil: „Szczęść Boże, panie Krzysztofie! Proboszcz przysyła... w sprawie guzika”.
  - Krzysztof: „Guzik to też pieniądz! Inflacja, proszę księdza!”. Kamil: „Dwa grosze i guzik od kalesonów? Panie Krzysztofie...”.
  - Krzysztof: „Dość gadania! HANS! Do nogi! To znaczy... BIERZ GO!”.
- **Boss: pies-bestia Hans** (pasek życia u góry): chodzi za wikarym, **szarżuje** (trzeba przeskoczyć saltem) i **szczeka**, a szczeknięcie puszcza po ziemi **falę**, którą trzeba przeskoczyć (trafienie ogłusza i zabiera życie). Ma trzy fazy: im mniej życia, tym szybsze szarże, podwójne fale, a na końcu wpada w szał (czerwienieje). Grom z Nieba zabiera mu tylko kawałek paska.
- **Po wygranej** Krzysztof ze wstydem: „Hans... mój Hans... No dobrze już, dobrze, proszę księdza. Wstyd mi”. Wyjmuje monetę i dorzuca na tacę **całe dziesięć złotych** (+1000 pkt): „Tylko niech proboszcz nikomu nie mówi”. Kamil: „Bóg zapłać, panie Krzysztofie! A guzik oddaję, przyda się do kalesonów”. Potem podsumowanie („DALEJ: LEVEL 3 – NOC DUCHÓW”) i od razu Level 3, z tymi samymi punktami, życiami i mocami.

### Level 3: „Noc duchów” (powrót na plebanię i obrona kościoła)
**Część A, droga powrotna:**
- Ekran znów przesuwa się **w prawo**: ta sama trasa co w Level 2, ale **od końca**, a na końcu czeka **kościół**. Zapada **noc**, deszcz przestaje padać, a nad drogą wisi mgła i pełnia księżyca.
- Z początku są zwykli wrogowie z Level 2, ale **im bliżej kościoła, tym więcej duchów**:
  - **duszki** (lekkie, latają falą, giną od jednego trafienia),
  - **duchy przenikające** (przechodzą przez przeszkody i pojawiają się znikąd, chwilę migają przed atakiem),
  - **upiory z cmentarza** (wolne, wytrzymałe, wychodzą spod ziemi).
- Duchy są odporne na zwykły ogień (kula syczy i gaśnie, dymek „OGIEŃ NIE DZIAŁA NA DUCHY”), a działa na nie **krzyż** i **błogosławieństwo**. Gracz musi więc mądrze dobierać ataki. Upiór najpierw zapowiada się pęknięciem i kurzem, a fantom miga, zanim zaatakuje.
- Tutaj wikary zdobywa trzecią moc, **błogosławieństwo krzyżem** (X / BŁOG.): fala wokół Kamila zabija duchy w promieniu, ma dłuższy cooldown (`CFG.bless`). Zdobycie wygląda jak przy krzyżu i zniczu: piorun i przyciemnienie ekranu.

**Część B, obrona kościoła (arena):**
- Przed kościołem ekran się zatrzymuje. **Proboszcz** stoi na schodach i **ciska w duchy czary na dystans** (świetliste kule). Krótki dymek, proboszcz: „Kamil! Nie stój jak słup soli, pomóż mi!”.
- Rozgrywka typu **obrona**: duchy nadlatują **falami** z obu stron (3 fale), a gracz z proboszczem bronią **drzwi kościoła**. Drzwi mają własny pasek życia, a grafika drzwi zmienia się wraz z ich stanem. **Gdy pasek spadnie do zera, to koniec gry** (game over i wpisanie nicku). Ustawienia: `CFG.defense`.
- Proboszcz strzela sam, ale co jakiś czas **się męczy** (siada i ociera pot, rzuca żart w dymku), a wtedy cała obrona spada na wikarego.
- **Boss: kościelny Rafał, opętany przez upiora („Upiorny Kościelny”)**. Wychodzi z drzwi kościoła, lewituje i podlatuje do Kamila, walczy pękiem kluczy: zamach wręcz, rzut wirującymi kluczami i wrzask, który przywołuje duszki. Ma pasek życia i trzy fazy (szybszy, więcej kluczy, na końcu szał). Grom z Nieba zabiera mu tylko kawałek paska. Po wygranej egzorcyzm: upiór z niego wylatuje, a Rafał siedzi oszołomiony i wraca do normy („Co ja tu robię?”). Ustawienia: `CFG.rafal`.
- **Zakończenie (zrobione):** po pokonaniu Rafała **uderza grzmot** (błysk, wstrząs) i okazuje się, że kościelnego opętał sam **Czerwony Diabeł**: wychodzi z Rafała w kłębach siarki. Diabeł grozi: „Następnym razem zniszczę ten kościół i pokonam cię, księże wikary Kamilu!”, Kamil: „A kysz! Wynocha z naszej parafii!”, a diabeł **ucieka w prawo**. Rafał, jeszcze oszołomiony: „Co ja tu robię?...”, „Chyba opętał mnie diabeł... Pewnie poleciał teraz na bagna, do czarnoksiężnika Adriana”. Świt, biją dzwony, proboszcz: „Kamil, ruszaj za tym diabłem do czarnoksiężnika Adriana i rozpraw się z tymi szatanami!”. Podsumowanie („DALEJ: LEVEL 4 – BAGNA”) i od razu Level 4, z tymi samymi punktami, życiami i mocami.

### Level 4: „Bagna”
- Kamil idzie **w prawo przez bagna**, o zmierzchu, w **zielonej mgle** (`CFG.swampFog`). Ma wszystkie trzy moce: krzyż, ogień (na bagiennych stworach działa) i błogosławieństwo.
- **Bagienne doły:** wpadnięcie = -1 życie i powrót przed dół. Przez szersze doły prowadzą **lilie wodne** (stoją w miejscu) albo **pływające pnie** (pływają jak kładka w Level 2, ekran czeka). Na drodze **pnie** i **trzciny**. Ustawienia: `CFG.bog`.
- **Wrogowie:** **małe komary** (roje, lecą zygzakiem na Kamila), **duże komary** (krążą wyżej i nurkują z żądłem), **żaby** (skaczą w stronę Kamila, z bliska strzelają językiem), **bagienne stwory** (najpierw bąble, potem wychodzą spod ziemi i idą). Im bliżej chaty, tym więcej stworów.
- **Święcona woda** (item): na chwilę złota-zielona aura wokół Kamila, która zabija małe komary i odpycha duże (`CFG.repellent`).
- **Koniec:** chata czarnoksiężnika **Adriana na palach**. Ekran staje, drzwi się otwierają, Adrian wychodzi na próg i po krótkiej rozmowie zeskakuje na bagno.
- **Boss: czarnoksiężnik Adrian** (pasek życia): rzuca **fioletowe kule**, które lekko się naprowadzają, **przywołuje roje komarów** i **teleportuje się** w kłębach dymu (wtedy jest nietykalny). Trzy fazy: więcej kul, częstsze teleporty, na końcu szał. Grom z Nieba zabiera mu tylko kawałek paska. Ustawienia: `CFG.adrian`. Grafiki Adriana jeszcze nie dotarły: w grze jest przyciemniony, fioletowy Krzysztof (portret i kule: zamienniki).

**Po pokonaniu Adriana:**
- Ekran powoli **robi się czerwony**, ziemia drży, a z ziemi **powoli wyłania się Czerwony Diabeł**.
- Krótki dialog (propozycja):
  - Diabeł: „Brawo, księżulku. Pokonałeś mojego czarnoksiężnika... Ale to dopiero początek!”
  - Kamil: „Proszę pana, ja tu jestem służbowo. Mam w kieszeni święconą wodę i nie zawaham się jej użyć!”
  - Adrian: „Szefie, mówiłeś, że to będzie łatwa robota...”
  - Diabeł: „Milcz, Adrianie! Zemszczę się, wikary! Jeszcze o mnie usłyszysz!” I **odlatuje** w kłębach siarki.
- Pokonany Adrian przyznaje: „Diabeł wie, gdzie mieszka moja rodzina... Sam mu powiedziałem, przy herbatce. Teraz tego żałuję”.
- Żeby Kamil mógł **uratować jego rodzinę**, Adrian oddaje mu **swój samochód**: „Weź moje auto. Tylko uważaj na sprzęgło, trochę bierze wysoko”.
- Ksiądz Kamil wsiada do auta i **rusza w lewo**. Potem podsumowanie, „CIĄG DALSZY: LEVEL 5 – JAZDA SAMOCHODEM WKRÓTCE” i wpisanie nicku do tablicy.
- Grafiki samochodu (czerwony hatchback, 219×100, przodem w prawo, więc jazda w lewo = odbicie w poziomie) już są w repo:
  - `assets/game/car_1.png`, `car_2.png` (auto z Kamilem za kierownicą, 2 klatki jazdy) oraz `car_empty_1.png`, `car_empty_2.png` (puste auto),
  - `assets/sprites/ksiadz_kamil_car.png`, `ksiadz_kamil_car_1.png`, `ksiadz_kamil_car_2.png` (Kamil w aucie; z wersjami `_x4`).

### Level 5: jazda samochodem (scenariusz – do zrobienia)
- Następna misja: Kamil **jedzie samochodem w lewo**, żeby zdążyć przed diabłem do rodziny Adriana. Szczegóły rozgrywki zostaną jeszcze wymyślone.

### Pomysły na później (do dopracowania)
- Kolejne moce (modlitwa) jako itemy w następnych poziomach, z podobnym efektem pioruna i przyciemnienia.
- Na końcu Level 1 mały mini-boss, np. **przywódca watahy wilków**.

## Atak specjalny (ultimate)
- Wikary **zbiera punkty** do ataku specjalnego (pasek w HUD).
- Gdy pasek jest pełny, gracz **wciska i trzyma Shift**: wikary zaczyna się **modlić**.
- Po **1 sekundzie** modlitwy pojawia się **złota aura**, a ekran **stopniowo przyciemnia się do 75%**.
- Gdy gracz **puści Shift**, wikary odpala **ultimate-atak** i pasek się zeruje.
- **Ultimate-ataki** (na start dostępny jest pierwszy, kolejne odblokowują się wraz z rozwojem postaci i kolejnymi misjami):
  1. **Grom z Nieba** (podstawowy): z góry spada słup złotego światła z wielkim świecącym krzyżem i trafia wszystkich przeciwników na ekranie; ekran błyska na biało, a potem wraca do normalnej jasności.
  2. **Deszcz Święconej Wody** (do odblokowania): ulewa święconej wody z nieba zmywa przeciwników.
  3. **Dzwony Kościelne** (do odblokowania): fala dźwięku dzwonów odrzuca i ogłusza przeciwników.

## Grafiki
Assety w `assets/` (skopiowane z Fibi-Run). Nowe grafiki wikarego Kamila (patrzy w prawo, stopy na dole płótna, origin 0.5,1; każdy plik ma też wersję `_x4`):
- `assets/sprites/wikary_kamil_run_1..6`, `idle_1..2`, `jump_1..3`, `flip_1..6` (salto), `attack_fire_1..4`, `attack_cross_1..4`, `bless_1..4`, `pray_1..2`
- efekty: `assets/sprites/fx_fireball_1..4`, `fx_cross_1..4`, `fx_bless_1..6`, `fx_pray_aura_1..4`
- portret z bliska z frontu: `assets/portraits/wikary_kamil_closeup_open` (oczy otwarte) i `wikary_kamil_closeup_closed` (oczy zamknięte, skupienie w modlitwie)
- **Proboszcz:** portrety `assets/portraits/proboszcz_closeup_open` / `proboszcz_closeup_closed` (192×192) i sylwetka `assets/sprites/proboszcz_idle_1..2` (72×164), `proboszcz_talk_1..2` (118×164), `proboszcz_bless_1..2` (94×164), patrzy w prawo, origin 0.5,1. Podgląd: `docs/proboszcz_portraits.png`, `docs/proboszcz_sprites.png`.
- **Krzysztof „Dwa Grosze”:** portrety `assets/portraits/krzysztof_closeup_open` / `_closed` / `_ashamed` (192×192) i sylwetka `assets/sprites/krzysztof_idle_1..2` (66×160), `krzysztof_talk_1..2` (110×160), `krzysztof_coin_1..2` (94×160), patrzy w prawo, origin 0.5,1. Podgląd: `docs/krzysztof_contact.png`.
- Świeczka na ekran tytułowy: `assets/sprites/candle_1..8.png` (64×64, migoczący płomień, 8 klatek, origin 0.5,1). Źródło: [Lit And Unlit Candle](https://cindersphoenix.itch.io/lit-and-unlit-candle) autorstwa CindersPhoenix (darmowe do dowolnego użytku, podziękowania dla autora).
- **Level 1, postacie i znajdźki** (skala postaci jak Kamil, w grze ×0.45, patrzą w prawo, origin 0.5,1, wersje `_x4`), `assets/sprites/`:
  `enemy_dog_run_1..4` (120×72), `enemy_wolf_run_1..4` (150×90), `enemy_wolf_jump_1..2` (150×100), `enemy_bat_fly_1..4` (80×56), `enemy_spider_1..4` (64×64) + `enemy_spider_thread` (4×64, nitka powtarzana w pionie), oraz origin 0.5,0.5: `fx_enemy_poof_1..4` (96×96), `item_diamond_1..6` (40×40), `item_lightning_1..4` (40×56). Podgląd: `docs/level1_sprites.png`.
- **Level 1, otoczenie i efekty** (piksele ekranu 1:1), `assets/game/`: `bg_l1_sky` (568×320, stałe), `bg_l1_city_far` (568×200, paralaksa wolna), `bg_l1_houses_near` (568×150, paralaksa szybsza), `tile_ground_cobble` (64×32), `tile_water_1..4` (64×28) + `water_bank_left/right` (16×32), `obstacle_fence` (48×28), `obstacle_trash_bin` (26×32), `obstacle_puddle` (56×8), `church_exterior` (240×250) + `church_door_1..3` (48×72: zamknięte / uchylone / otwarte), `fx_lightning_strike_1..3` (64×300), `fx_grom_pillar_1..4` (140×320), `fx_grom_cross` (96×128). Podgląd: `docs/level1_game.png`, `docs/level1_scene.png`.
- **Kościół i Level 2** (`assets/game/`, piksele ekranu 1:1, wersje `_x4`): `bg_church_interior` (568×320, proboszcz stoi stopami w x=450, y=288), `prop_collection_basket`, `bg_l2_sky` (od 0,0), `bg_l2_city_far` (od y=16), `bg_l2_houses_near` (od y=138), `tile_ground_wet` (od y=288), `fx_rain_1..3` (64×64, kafelki deszczu), `obstacle_dug_road` (y=264), `obstacle_fallen_tree` (y=252), `platform_plank` (64×10, origin 0.5,0.5), `house_krzysztof` (260×230, dół na podłodze 288) + `house_krzysztof_door_1..2` (27×58, zamknięte / otwarte, w domu na 134,130).
- **Level 2, postacie** (`assets/sprites/`, skala jak Kamil, wersje `_x4`): `enemy_crow_fly_1..4`, `enemy_crow_dive_1..2` (wrona w grze ×0.6, bo jest mała: `CFG.enemies.crow.scale`), `enemy_boar_run_1..4`, `enemy_wisp_1..4`, `item_znicz_1..4`, `boss_hans_run_1..4`, `boss_hans_bark_1..2`, `boss_hans_hurt_1`, `boss_hans_defeated_1`.
- **Level 3, otoczenie** (`assets/game/`, piksele ekranu 1:1, wersje `_x4`): `bg_l3_sky` (od 0,0, księżyc w lewym górnym rogu), `bg_l3_city_far` (od y=16), `bg_l3_houses_near` (od y=138), `tile_ground_night` (od y=288), mgła `fx_fog_1` (284×64, niżej i gęściej, y≈256) i `fx_fog_2` (wyżej i rzadziej, y≈232), `church_exterior_night` (240×250, dół na podłodze 288) + `church_door_night_hp_1..3` (48×72, drzwi coraz bardziej zniszczone, w kościele na 51,162; proboszcz stoi stopami na 75,238), `bg_l3_dawn` (cała scena o świcie, kościół w tym samym miejscu).
- **Level 3, postacie i efekty** (`assets/sprites/`, patrzą w prawo, w grze ×0.45, wersje `_x4`): `enemy_duszek_1..4` (56×64, origin 0.5,0.5), `enemy_phantom_1..4` + `enemy_phantom_attack_1..2` (114×110, 0.5,0.5), `enemy_upior_rise_1..4` + `enemy_upior_walk_1..4` (158×130, 0.5,1), `fx_ghost_poof_1..4`, `item_blessing_1..4`, `fx_blessing_wave_1..4`, `proboszcz_cast_1..3` + `fx_proboszcz_spell_1..3`, `proboszcz_tired_sit_1..2` (linia siedzenia y=151 stoi na stopniu: origin 0.5,151/164), `wikary_kamil_blessing_1..3` (110×180; plik dostarczony jako `wikary_kamil_bless_1..3`, w repo pod tą nazwą, bo stare `wikary_kamil_bless_1..4` zostają dla krzyża, znicza i ultimate). Rafał: patrz wyżej.
- **Czerwony Diabeł** (`assets/sprites/`, w grze ×0.45, wersje `_x4`): `devil_rise_1..6` (wyłania się z ziemi), `devil_idle_1..2`, `devil_talk_1..2`, `devil_fly_1..4`, `fx_brimstone_1..4` (siarka), `fx_devil_exit_rafal_1..4` (wyjście z Rafała); portrety `assets/portraits/devil_closeup_open/closed/angry`. Podgląd: `docs/contact_devil.png`, `docs/contact_devil_portraits.png`.
- **Level 4, otoczenie** (`assets/game/`, piksele ekranu 1:1, wersje `_x4`): `bg_l4_sky` (od 0,0), `bg_l4_far` (od y=16), `bg_l4_near` (od y=138), `tile_ground_swamp` (od y=288), `tile_bog_1..4` (64×32, od y=288, pętla) + `bog_bank_left/right` (16×32), `platform_lily` (48×12) i `platform_log` (80×14) (środek y≈294 na tafli), `obstacle_stump` (40×32), `obstacle_reeds` (48×40), mgła `fx_swamp_fog_1..2` (284×64, y≈256 / 232), `hut_adrian` (260×240, dół na podłodze 288) + `hut_adrian_door_1..2` (18×54, zamknięte / otwarte, w chacie na 83,100; drzwi są małe, więc Kamil przez nie nie wchodzi, wychodzi z nich tylko Adrian).
- **Level 4, wrogowie** (`assets/sprites/`, patrzą w prawo, w grze ×0.45, wersje `_x4`): `enemy_mosquito_small_1..3` (40×32), `enemy_mosquito_big_1..4` + `enemy_mosquito_big_sting_1..2` (90×74), `enemy_frog_1..4` (136×84, origin 0.5,1, podskok wrysowany) + `enemy_frog_tongue_1..2` (230×84, te same stopy, czubek języka 81 / 112 px przed stopami), `enemy_bogman_rise_1..4` + `enemy_bogman_walk_1..4` (118×130, 0.5,1), `fx_splat_1..4` (48×48), `item_repellent_1..4` (40×56).
- **Adrian** (jeszcze nie ma; zamienniki: przyciemniony fioletowy Krzysztof, portret Krzysztofa, kule = czar proboszcza na fioletowo): `adrian_idle_1..2`, `adrian_talk_1..2`, `adrian_cast_1..3`, `adrian_hurt_1`, `adrian_defeated_1`, `adrian_closeup_open/closed/ashamed`, `proj_adrian_spell_1..3`.
- **Podmiana grafik:** `python3 tools/art_manifest.py` skanuje `assets/` i zapisuje listę plików do `src/art_files.js`. Gra ładuje tylko pliki z listy, a dla brakujących używa zamienników z `src/art.js` (`ART.SPEC`: istniejąca grafika + odcień/skala). Nową grafikę wystarczy wrzucić pod docelową nazwą i uruchomić skrypt. W `?debug=1` `__wikary.artMissing()` pokazuje, które zamienniki są w użyciu (teraz: tylko grafiki Adriana `adrian_*` i `proj_adrian_spell_*`).
