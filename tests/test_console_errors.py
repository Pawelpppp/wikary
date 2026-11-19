"""Czysta konsola: zwykłe uruchomienie (bez ?debug=1) i krótka rozgrywka.

Same błędy wyłapuje fixture _guard z conftest.py (console.error, pageerror, HTTP >= 400,
żądania do obcych hostów), więc te testy tylko przechodzą przez typowe ekrany.
"""
import time

from wikary import open_game


def test_plain_load_without_debug(page, base_url):
    open_game(page, base_url, debug=False)
    time.sleep(1.5)
    assert page.evaluate("window.__wikary === undefined")
    assert page.evaluate("typeof Phaser !== 'undefined' && !!window.WIKARY_VERSION")


def test_plain_playthrough_start(page, base_url):
    open_game(page, base_url, debug=False)
    time.sleep(1.5)
    page.keyboard.press("Enter")
    time.sleep(1.0)
    page.keyboard.press("Enter")                    # wybór trudności (NORMALNY)
    time.sleep(1.5)
    page.keyboard.press("Space")
    time.sleep(0.8)
    page.keyboard.down("ArrowRight")
    time.sleep(1.5)
    page.keyboard.press("Space")
    time.sleep(1.0)
    page.keyboard.up("ArrowRight")
    page.keyboard.press("Alt")
    time.sleep(1.0)


def test_all_assets_load(game):
    # każda tekstura z loadera musi się załadować (missing -> __MISSING)
    missing = game.evaluate("""(()=>{const t=__wikary.game.textures; return t.getTextureKeys().filter(k=>{const s=t.get(k).getSourceImage(); return !s || !s.width;})})()""")
    assert missing == [], missing
