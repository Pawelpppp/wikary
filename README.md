# wikary
Wikary - retro 16-bit gra w przeglądarce (Phaser 3)

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
