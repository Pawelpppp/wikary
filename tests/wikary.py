"""Pomocnicze funkcje do sterowania grą w testach (używają hooka window.__wikary z ?debug=1)."""
import json
import time

from pathlib import Path

W, H = 568, 320
REPO_ROOT = Path(__file__).resolve().parent.parent


def open_game(page, base_url, debug=True):
    page.goto(base_url + ("?debug=1" if debug else ""))
    if debug:
        page.wait_for_function("window.__wikary && window.__wikary.scene().includes('Title')", timeout=30000)
    else:
        page.wait_for_function("document.querySelector('canvas') !== null", timeout=30000)
    time.sleep(0.8)


def scenes(page):
    return page.evaluate("__wikary.scene()")


def wait_scene(page, name, timeout=15):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            if name in scenes(page):
                return True
        except Exception:
            pass
        time.sleep(0.1)
    return False


def state(page):
    return page.evaluate("""(()=>{const g=__wikary.GS,l=__wikary.level(),act=__wikary.scene().includes('Level'),c=act?l.cameras.main:null;
      return {score:g.score,lives:g.lives,meter:g.meter,cross:g.hasCross,time:g.timeMs,
      hx: act?l.hero.x:null, hy: act?l.hero.y:null, cam: c?c.scrollX:null, d: act?l.heroD():null,
      enemies: act?l.enemies.countActive(true):0, ended: act?l.ended:null, dead: act?l.dead:null}})()""")


def fmt(s):
    return json.dumps(s, ensure_ascii=False)


def on_screen(s):
    return s["hx"] is not None and s["cam"] - 1 <= s["hx"] <= s["cam"] + W + 1


def start_level(page):
    """Z ekranu tytułowego: START -> intro -> pominięcie Spacją -> Level 1."""
    page.keyboard.press("Enter")
    assert wait_scene(page, "Intro", 5), "intro nie wystartowało"
    time.sleep(0.6)
    page.keyboard.press("Space")
    assert wait_scene(page, "Level", 5), "Spacja nie pominęła intro"
    time.sleep(0.6)


def teleport(page, d):
    page.evaluate(f"__wikary.teleport({d})")
    time.sleep(0.3)


def hold(page, key, secs):
    page.keyboard.down(key)
    time.sleep(secs)
    page.keyboard.up(key)


def make_invulnerable(page, ms=8000):
    page.evaluate(f"(()=>{{const l=__wikary.level(); l.invulnUntil=l.time.now+{ms};}})()")


def pick_cross(page):
    """Daje krzyż bez cutscenki (do testów, które go potrzebują)."""
    page.evaluate("__wikary.giveCross()")


def drown_once(page):
    teleport(page, 940)
    hold(page, "ArrowRight", 1.2)
    time.sleep(0.6)


def leaderboard(page):
    return page.evaluate("JSON.parse(localStorage.getItem('wikary_leaderboard') || '[]')")


def type_nick(page, text):
    for _ in range(14):
        page.keyboard.press("Backspace")
    page.keyboard.type(text)
