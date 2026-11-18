"""Grafiki: lista src/art_files.js aktualna, wszystkie grafiki docelowe (Level 1–3) załadowane, bez zamienników."""
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


def test_all_art_loaded_no_fallbacks(game):
    missing = game.evaluate("__wikary.artMissing()")
    assert missing == [], missing
    bad = game.evaluate("Object.keys(ART.SPEC).filter(k => !__wikary.game.textures.exists(ART.key(k)))")
    assert bad == [], bad
