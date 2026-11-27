# Level 5: „Bernard” (Benek matematyk) – projekt

Status: **zaimplementowane** (v1.48, `src/level5.js`, `CFG.level5`, `CFG.mathQuiz`). Grafiki paczki 1 są w repo, paczka 2 (tła, droga, znak, konie, `car_front_kamil`) ma zamienniki. Rozmiary sprite'ów w paczce 1 są inne niż w tabeli niżej (postacie 140×164, motor 200×130/150, karetka 220×110); obowiązują pliki. Ujęcie „zza pleców” jest na razie zwykłym widokiem z boku.

Pierwotny opis: Próbne grafiki zamawiamy w Pixel Art Photo Processor (styl Mustache Protocol / early 90s, chunky pixels). Kod powstaje dopiero po akceptacji grafik przez Pawła. Benek ma przypominać twarz z załączonego zdjęcia (okulary).

## 1. Przebieg

1. **Po pokonaniu Adriana:** Kamil wsiada do auta Adriana (jak teraz w Level 4).
2. **Jazda samochodem, ok. 5 s:** na razie to poziom-zaślepka (TODO, rozgrywka dojdzie później). Kamil jedzie w stronę kościoła, z gotowymi grafikami `car_*.png`.
3. **Zielony znak miejscowości „SOLNICZKI”:** nazwa nie ma nic wspólnego z solą. Za znakiem w tle stoją **konie** (humorystyczny detal). Zaraz po wjeździe startuje intro.
4. **Filmowe intro:** tryb cutscenki, sterowanie zablokowane, Spacja / dotknięcie pomija. Szczegóły w punkcie 2.
5. **Walka z Benkiem (boss):** szczegóły w punkcie 3.
6. **Po walce:**
   - Diabeł wylatuje z Benka, ucieka do karetki, a karetka odjeżdża.
   - Dialog:
     - Kamil: „Mam nadzieję, że poczujesz się lepiej. Noga zagoi się do wesela!”
     - Benek: „Dzięki, księże… Następnym razem dam mniej gazu.”
7. **Zakończenie:** krótka jazda (ok. 3 s), podsumowanie poziomu, „CIĄG DALSZY NASTĄPI”, wpisanie nicku.

## 2. Intro – lista ujęć

| # | Ujęcie | Co się dzieje | Dymki |
|---|--------|---------------|-------|
| 1 | Widok auta od przodu (szyba) | Widać twarz Kamila i jego ręce na kierownicy; w tle przesuwa się droga. | – |
| 2 | Bok drogi | Z prawej Kamila wyprzedza Benek na **jaskrawoczerwonym sportowym motorze**, ze spalinami. | – |
| 3 | Bok drogi | Motor się chybocze, Benek się przewraca, motor sunie i iskrzy. Auto Kamila staje. | „ŁUUUP!” (napis efektu) |
| 4 | Bok drogi | Kamil wysiada; od drugiej strony podbiega **przechodzień** (blondyn, zwykły facet, telefon w ręku). | – |
| 5 | Kamera za plecami Kamila i przechodnia | Benek leży i trzyma się za łydkę. | Benek: „Czy rana jest duża? Coś poważnego?” |
| 6 | To samo | Kamil i przechodzień spoglądają na siebie i od razu, razem odpowiadają. | Obaj: „Nic takiego!” |
| 7 | To samo | Rozmowa o tym, co się stało. | Kamil: „Co się stało?” / Przechodzień: „Pożyczyłem mu motor na pierwszą przejażdżkę… i kazałem dać więcej gazu.” |
| 8 | To samo | Przechodzień przykłada telefon do ucha. | Kamil: „Nic się nie stało, ale lepiej wezwać karetkę.” / Przechodzień: „Halo, pogotowie?” |
| 9 | Droga | Przyjeżdża karetka (koguty migają) i wysiada dwóch sanitariuszy. W ich oczach na moment błyska **czerwony błysk**. | Sanitariusz: „Spokojnie, zajmiemy się nim…” |
| 10 | Droga | **Decyzja: sanitariusze są opętani od początku.** Czerwony Diabeł wylatuje z nich jak dym; sanitariusze mrugają zdezorientowani. | Diabeł: „Mówiłem, że o mnie usłyszysz, księżulku!” |
| 11 | Zbliżenie na Benka | Diabeł wchodzi w Benka. Transformacja jest karykaturalna i humorystyczna: czerwone oczy, wyrastające małe rogi, wokół unoszą się ∫ √ △ π, a okulary błyszczą na czerwono. | Benek (opętany): „Policzymy się, księże… CAŁKOWICIE!” |
| 12 | Powrót do gry | Benek wstaje i lewituje. Rusza pasek życia bossa. | – |

## 3. Walka

- **Pociski Benka:**
  - **Całka ∫:** leci łukiem, czasem po dwie.
  - **Pierwiastek √:** leci prosto, z liczbą (np. √49).
- **Atak co jakiś czas: duży trójkąt △.** Wolny, większy, z ostrzeżeniem (błyska przed wystrzałem). Można go przeskoczyć albo przykucnąć.
- **Trafienie trójkątem → zadanie matematyczne:**
  - Gra się pauzuje i pokazuje okno z zadaniem oraz **timerem 15 s**.
  - Rodzaje zadań: dodawanie, odejmowanie, mnożenie, dzielenie, proste pierwiastki i potęgi. Przykłady: `∛125`, `√144`, `13×16`, `84:7`, `2⁵`, `57+68`.
  - **Dobra odpowiedź:** trójkąt pęka i znika, bez utraty życia (+bonus punktów).
  - **Zła odpowiedź albo koniec czasu:** -1 życie, pokazanie dobrej odpowiedzi.
- **Wpisywanie odpowiedzi:**
  - **Komputer:** cyfry z klawiatury, Backspace, Enter, a `-` dla wyniku ujemnego (choć wyniki planujemy tylko dodatnie).
  - **Telefon:** na środku okna **ekranowa klawiatura numeryczna** 3×4 (`1–9`, `⌫`, `0`, `OK`) z dużymi polami (min. 40 px). W tym czasie joystick i przyciski są nieaktywne.
- **Trudność:**
  - ŁATWY: 20 s, tylko + − ×.
  - NORMALNY: 15 s.
  - TRUDNY: 12 s, większe liczby.
- **Fazy:** jak u Adriana; z każdą fazą częstsze pociski i trójkąt.
- **Grom z Nieba:** zabiera ograniczoną część paska.
- **Po walce:** Benek wraca do normalnego wyglądu (bez rogów), leży i trzyma się za łydkę.

## 4. Planowany CFG (szkic)

```js
CFG.level5 = {
    driveMs: 5000,                 // zaślepka jazdy przed Solniczkami
    driveOutMs: 3000,              // jazda po walce
    signAt: 0.85,                  // kiedy pojawia się znak (część jazdy)
    intro: { skippable: true, shotMs: 1800 },
    boss: { hp: 30, speed: 70, phases: [0.66, 0.33],
            integral: { everyMs: 1600, speed: 150, dmg: 1 },
            sqrt: { everyMs: 1300, speed: 190, dmg: 1 },
            triangle: { everyMs: 9000, warnMs: 700, speed: 110, w: 64, h: 56 } },
    gromShare: 0.25,
};
CFG.mathQuiz = {
    timeMs: 15000,                 // ŁATWY 20000, TRUDNY 12000 (CFG.difficulty)
    ops: ['add', 'sub', 'mul', 'div', 'sqrt', 'cbrt', 'pow'],
    ranges: { add: [10, 99], mul: [2, 19], sqrt: [4, 15], cbrt: [2, 6], pow: [2, 10] },
    rightBonus: 300, wrongDmg: 1,
    keypad: { key: 40, gap: 6 },   // klawiatura ekranowa na telefonie
};
```

## 5. Grafiki do zamówienia

Pliki PNG z przezroczystym tłem i jednolitą paletą jak reszta gry. Benek stoi przodem w prawo, a w grze jest odbijany. Rozmiary są bazowe, czyli takie jak w `src/art.js`; do zamówienia dodatkowo wersje `_x4`.

| Plik | Rozmiar | Opis |
|------|---------|------|
| `sprites/benek_idle_1..2.png` | 64×96 | Benek w okularach, normalny |
| `sprites/benek_walk_1..4.png` | 64×96 | chód |
| `sprites/benek_cast_1..3.png` | 64×96 | opętany: czerwone oczy, rogi, rzut symbolem |
| `sprites/benek_hurt_1.png` | 64×96 | trafiony |
| `sprites/benek_defeated_1.png` | 96×64 | leży, trzyma łydkę (też do intro) |
| `sprites/benek_possessed_1..4.png` | 64×96 | transformacja: rogi rosną, symbole ∫ √ △ π |
| `game/moto_red_1..2.png` | 120×64 | Benek na czerwonym sportowym motorze, spaliny |
| `game/moto_crash_1..3.png` | 120×64 | wywrotka, iskry; leżący motor |
| `sprites/passerby_idle_1..2.png`, `passerby_phone_1.png` | 56×96 | blondyn, telefon |
| `sprites/paramedic_a_1..2.png`, `paramedic_b_1..2.png` | 56×96 | dwaj sanitariusze (+ wariant z czerwonym błyskiem oczu) |
| `game/ambulance_1..2.png` | 220×110 | karetka, koguty (2 klatki) |
| `sprites/devil_smoke_1..3.png` | 64×96 | diabeł wylatujący jak dym (istnieje już Czerwony Diabeł – reużycie) |
| `game/car_front_kamil.png` | 568×320 | ujęcie z przodu auta: twarz i ręce na kierownicy |
| `game/sign_solniczki.png` | 96×64 | zielony znak „SOLNICZKI” |
| `game/horses_1..2.png` | 120×60 | konie za znakiem (tło) |
| `game/proj_integral.png`, `proj_sqrt.png` | 20×28 | pociski ∫ i √ |
| `game/proj_triangle_1..2.png` | 64×56 | duży trójkąt (2 klatki błysku) |
| `portraits/benek_closeup_normal.png`, `_possessed.png`, `_hurt.png` | 192×192 | portrety do dymków |
| `portraits/passerby_closeup.png` | 192×192 | portret przechodnia |
| `game/bg_solniczki_*.png` | jak tła L1 | wieś Solniczki: pola, płoty, kościół w oddali |

## 6. Otwarte kwestie

- **Kierunek jazdy:** README Level 4 mówi „rusza w lewo”, a jazda ma prowadzić do kościoła. Do ustalenia przy kodzie, czy jazda idzie w lewo (odbite auto).
- **Dokładne teksty dymków:** do akceptacji przez Pawła.
