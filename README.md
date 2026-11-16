# Przygody Księdza Kamila
Retro 16-bit gra w przeglądarce (Phaser 3), repo `wikary`.

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
2. Proboszcz zagląda do koszyczka z tacy: „Wszyscy dali pięknie... tylko pan **Zenek spod lasu** wrzucił guzik i dwa grosze. Idź do niego, porozmawiaj, niech się nawróci”.
3. Wikary: „Do Zenka? Przecież tam po drodze same wilki i błoto...”. Proboszcz: „Pan Bóg cię prowadzi. I weź parasol, bo będzie padać”.
4. Wikary wychodzi z kościoła i **tym razem idzie w lewo**, tą samą drogą, którą przyszedł.

### Level 2: „Wizyta u skąpego parafianina”
- **Kierunek odwrócony:** ekran przesuwa się **w lewo**, a gracz idzie w stronę, z której przyszedł. Ta sama okolica, ale **wieczorem i w deszczu** (ciemniejsze niebo, kałuże, błyskawice w tle).
- **Trudniej niż w Level 1:** więcej przeszkód (rozkopana droga, przewrócone drzewa, dwie rzeki, w tym jedna z ruchomą kładką) i **więcej potworów** naraz.
- **Nowi przeciwnicy:** **wrony** (pikują na gracza z góry), **dziki** (szarżują, trzeba je przeskoczyć albo trafić dwa razy), a nocą **błędne ogniki** (lewitują i krążą wokół gracza).
- **Nowy item, ogień:** w połowie drogi wikary znajduje **znicz**, po którym (piorun i przyciemnienie jak przy krzyżu) dostaje **atak ogniem**, który przebija kilku wrogów naraz.
- **Koniec poziomu:** dom pana Zenka. Zenek wychodzi na próg, ale zamiast rozmowy wypuszcza na wikarego **psa-bestię Burka** (mini-boss). Po wygranej Zenek ze wstydem dorzuca na tacę „całe dziesięć złotych”, a wikary wraca do proboszcza, który mu **gratuluje** i daje kolejne zadanie.

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
- Świeczka na ekran tytułowy: `assets/sprites/candle_1..8.png` (64×64, migoczący płomień, 8 klatek, origin 0.5,1). Źródło: [Lit And Unlit Candle](https://cindersphoenix.itch.io/lit-and-unlit-candle) autorstwa CindersPhoenix (darmowe do dowolnego użytku, podziękowania dla autora).
