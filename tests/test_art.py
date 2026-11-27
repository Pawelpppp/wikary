"""Grafiki: lista src/art_files.js aktualna, wszystkie grafiki docelowe załadowane, bez zamienników
(także Adrian z Level 4 ma już finalną grafikę)."""
import sys

import pytest

from wikary import REPO_ROOT


def test_art_manifest_up_to_date(game, is_local):
    if not is_local:
        pytest.skip("tylko lokalnie (porównanie z plikami w repo)")
    sys.path.insert(0, str(REPO_ROOT / "tools"))
    import art_manifest
    assert (REPO_ROOT / "src" / "art_files.js").read_text(encoding="utf-8") == art_manifest.build(), \
        "uruchom: python3 tools/art_manifest.py"


# Level 5: paczka 2 grafik (tła Solniczek, droga, znak, konie, ujęcie z przodu auta) jeszcze nie dotarła -> zamienniki
PENDING_L5 = {"bg_solniczki_sky", "bg_solniczki_far", "bg_solniczki_near", "tile_ground_road", "sign_solniczki",
              "horses_1", "horses_2", "car_front_kamil"}


def test_all_art_loaded_no_fallbacks(game):
    missing = set(game.evaluate("__wikary.artMissing()"))
    assert missing <= PENDING_L5, sorted(missing - PENDING_L5)
    bad = game.evaluate("Object.keys(ART.SPEC).filter(k => !__wikary.game.textures.exists(ART.key(k)))")
    assert set(bad) <= {"sign_solniczki"}, bad          # znak bez pliku = prosty znak rysowany w level5.js
