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

## Grafiki
Assety w `assets/` (skopiowane z Fibi-Run). Nowe grafiki wikarego Kamila (patrzy w prawo, stopy na dole płótna, origin 0.5,1; każdy plik ma też wersję `_x4`):
- `assets/sprites/wikary_kamil_run_1..6`, `idle_1..2`, `jump_1..3`, `flip_1..6` (salto), `attack_fire_1..4`, `attack_cross_1..4`, `bless_1..4`, `pray_1..2`
- efekty: `assets/sprites/fx_fireball_1..4`, `fx_cross_1..4`, `fx_bless_1..6`, `fx_pray_aura_1..4`
- portret z bliska z frontu: `assets/portraits/wikary_kamil_closeup_open` (oczy otwarte) i `wikary_kamil_closeup_closed` (oczy zamknięte, skupienie w modlitwie)
