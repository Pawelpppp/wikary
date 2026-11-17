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
- **Poziomy opisane danymi** w `src/levels.js` (kierunek `dir` w prawo/lewo, rzeki, przeszkody, znajdźki, zestaw wrogów, koniec poziomu). Level 2 i 3 dojdą jako kolejne wpisy.
- Dźwięk: chiptune generowany w **Web Audio** (`src/audio.js`, bez plików): organy na tytule i w intro, szybki motyw w Level 1, mocny bas, efekty (skok, salto, trafienie, znajdźki, dzwonek telefonu, piorun, rzut krzyżem, Grom z Nieba).
- Font: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) (SIL OFL, `assets/fonts/`).
- Wersja na ekranie tytułowym: `v1.N`, N = liczba commitów na `master` (`src/version.js`).
- Pliki: `src/boot.js` (ładowanie, animacje), `title.js`, `scores.js`, `intro.js`, `level.js`, `nick.js`, `ui.js`, `leaderboard.js`, `main.js`.

## Sterowanie
| Akcja | Klawiatura | Dotyk |
|---|---|---|
| Bieg w lewo / prawo | ← / → | `<` / `>` |
| Kucnięcie (trzymaj; nietoperze przelatują nad głową, można z niego skoczyć) | ↓ | `↓` |
| Skok / salto | Spacja, 2× Spacja (w powietrzu) | SKOK, 2× SKOK |
| Rzut krzyżem (po zdobyciu krzyża) | Alt | KRZYŻ |
| Grom z Nieba (pełny pasek) | trzymaj Shift 1 s, puść | trzymaj GROM, puść |
| Pełny ekran | F | przycisk F |
| Wycisz | M | przycisk M |
| Menu | ↑ ↓ + Enter / Spacja | dotknij przycisk |

Na dotyku przyciski są półprzezroczyste i pionowo na środku ekranu: `<` `>` `↓` przy lewej krawędzi, GROM / KRZYŻ / SKOK przy prawej. Kamil nie wchodzi pod przyciski (margines `CFG.touch.heroMargin`).
| Intro | Spacja = pomiń, Enter = dalej | dotknij = pomiń |

## Status (co już działa)
- ✅ Ekran tytułowy: złoty migoczący tytuł, kościół, mrugająca twarz Kamila, rząd świeczek, START NEW GAME / HIGH SCORES, wersja, M i F.
- ✅ HIGH SCORES: 20 wyników w dwóch kolumnach, wpisywanie nicku po GAME OVER i po wygranej (na telefonie systemowe okienko).
- ✅ Intro: modlitwa od tyłu, zbliżenie na twarz, telefon, rozmowa z proboszczem, wybiegnięcie z domu.
- ✅ Level 1 „Droga na plebanię”: auto-scroll, podpowiedzi, płotki, kosze na śmieci i kałuże, rzeka tylko z saltem (wpadnięcie = -1 życie i powrót przed rzekę), krzyż z piorunem i przyciemnieniem, rzut krzyżem, psy, wilki, nietoperze, pająki, diamenciki, pioruny (przyspieszenie), kościół i podsumowanie.
- ✅ Grom z Nieba (ultimate) i HUD: życia, punkty, czas, pasek ataku specjalnego.
- Czas w HUD liczy się w czasie gry na poziomach (intro się nie wlicza).
- ✅ Level 1 ma już docelowe grafiki: tła z paralaksą, bruk, rzeka, płotki, kosze na śmieci, kałuże, wrogowie, znajdźki, kościół z otwieranymi drzwiami, piorun i Grom z Nieba.
- ⏳ Następne: cutscenka w kościele z proboszczem, Level 2 i Level 3, wspólna tablica na Azure.

## Bohater
Główną postacią jest **wikary Kamil**: rude krótkie włosy, czarna sutanna, plecak.

## Mechanika
- **Chodzenie i bieg** w lewo i w prawo (strzałki).
- **Podskok:** jedno wciśnięcie Spacji = zwykły podskok.
- **Skok z saltem:** dwa wciśnięcia Spacji = wyższy skok z saltem.
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

### Kościół po Level 1 (cutscenka z dymkami)
1. Wikary wbiega do kościoła, w środku czeka **proboszcz**. Proboszcz: „No, jesteś wreszcie! Zuch chłopak, dobrze się spisałeś”.
2. Proboszcz zagląda do koszyczka z tacy: „Wszyscy dali pięknie... tylko pan **Krzysztof „Dwa Grosze” spod lasu** wrzucił guzik i dwa grosze. Idź do niego, porozmawiaj, niech się nawróci”.
3. Wikary: „Do Krzysztofa? Przecież tam po drodze same wilki i błoto...”. Proboszcz: „Pan Bóg cię prowadzi. I weź parasol, bo będzie padać”.
4. Wikary wychodzi z kościoła i **tym razem idzie w lewo**, tą samą drogą, którą przyszedł.

### Level 2: „Wizyta u skąpego parafianina”
- **Kierunek odwrócony:** ekran przesuwa się **w lewo**, a gracz idzie w stronę, z której przyszedł. Ta sama okolica, ale **wieczorem i w deszczu** (ciemniejsze niebo, kałuże, błyskawice w tle).
- **Trudniej niż w Level 1:** więcej przeszkód (rozkopana droga, przewrócone drzewa, dwie rzeki, w tym jedna z ruchomą kładką) i **więcej potworów** naraz.
- **Nowi przeciwnicy:** **wrony** (pikują na gracza z góry), **dziki** (szarżują, trzeba je przeskoczyć albo trafić dwa razy), a nocą **błędne ogniki** (lewitują i krążą wokół gracza).
- **Nowy item, ogień:** w połowie drogi wikary znajduje **znicz**, po którym (piorun i przyciemnienie jak przy krzyżu) dostaje **atak ogniem**, który przebija kilku wrogów naraz.
- **Koniec poziomu:** dom pana Krzysztofa. Krzysztof „Dwa Grosze” wychodzi na próg, ale zamiast rozmowy wypuszcza na wikarego **psa-bestię Hansa** (mini-boss). Po wygranej Krzysztof ze wstydem dorzuca na tacę „całe dziesięć złotych”, Wikary rusza z powrotem na plebanię (Level 3).

### Level 3: „Noc duchów” (powrót na plebanię i obrona kościoła)
**Część A, droga powrotna:**
- Ekran znów przesuwa się **w prawo**: ta sama trasa co w Level 2, ale **od końca**, a na końcu czeka **kościół**. Zapada **noc**, deszcz przestaje padać, a nad drogą wisi mgła i pełnia księżyca.
- Z początku są zwykli wrogowie z Level 2, ale **im bliżej kościoła, tym więcej duchów**:
  - **duszki** (lekkie, latają falą, giną od jednego trafienia),
  - **duchy przenikające** (przechodzą przez przeszkody i pojawiają się znikąd, chwilę migają przed atakiem),
  - **upiory z cmentarza** (wolne, wytrzymałe, wychodzą spod ziemi).
- Duchy są odporne na zwykły ogień, a najlepiej działa na nie **krzyż** i **błogosławieństwo**. Gracz musi więc mądrze dobierać ataki.
- Tutaj wikary zdobywa trzecią moc, **błogosławieństwo krzyżem** (atak obszarowy wokół siebie). Działa jak przy krzyżu i zniczu: piorun i przyciemnienie ekranu.

**Część B, obrona kościoła (arena):**
- Przed kościołem ekran się zatrzymuje. **Proboszcz** stoi na schodach i **ciska w duchy czary na dystans** (świetliste kule). Krótki dymek, proboszcz: „Kamil! Nie stój jak słup soli, pomóż mi!”.
- Rozgrywka typu **obrona**: duchy nadlatują **falami** z obu stron (3 fale), a gracz z proboszczem bronią **drzwi kościoła**. Drzwi mają własny pasek życia, a gdy spadnie do zera, trzeba powtórzyć część B.
- Proboszcz strzela sam, ale co jakiś czas **się męczy** (siada i ociera pot), a wtedy cała obrona spada na wikarego.
- **Boss: Upiorny Kościelny**, duch dawnego kościelnego z pękiem kluczy. Rzuca kluczami i próbuje zamknąć wikarego w konfesjonale. Najlepiej pokonać go **ultimatem** (Grom z Nieba).
- **Zakończenie:** świt, biją dzwony, a proboszcz **gratuluje** wikaremu („No, Kamil, z ciebie będzie jeszcze proboszcz!”) i daje kolejne zadanie.

### Pomysły na później (do dopracowania)
- Kolejne moce (ogień, błogosławieństwo krzyżem, modlitwa) jako itemy w następnych poziomach, z podobnym efektem pioruna i przyciemnienia.
- Na końcu Level 1 mały mini-boss, np. **przywódca watahy wilków**.
- Dzwony kościoła na końcu poziomu jako dźwięk wygranej.

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
