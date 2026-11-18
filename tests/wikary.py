"""Pomocnicze funkcje do sterowania grą w testach (używają hooka window.__wikary z ?debug=1)."""
import json
import time

from pathlib import Path

W, H = 568, 320
REPO_ROOT = Path(__file__).resolve().parent.parent


def open_game(page, base_url, debug=True, query=""):
    q = "&".join(x for x in (("debug=1" if debug else ""), query) if x)
    page.goto(base_url + ("?" + q if q else ""))
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


def wait_js(page, expr, timeout=15):
    page.wait_for_function(expr, timeout=timeout * 1000)


def finish_level1(page):
    """Level 1: dojście do kościoła, podsumowanie, Enter -> kościół (rozmowa z proboszczem)."""
    page.evaluate("__wikary.GS.lives = Math.max(__wikary.GS.lives, 1)")
    teleport(page, 5250)
    hold(page, "ArrowRight", 1.6)
    wait_js(page, "__wikary.level().summaryShown", 8)
    page.keyboard.press("Enter")
    assert wait_scene(page, "Church", 5)


def skip_church(page):
    time.sleep(0.5)
    page.keyboard.press("Space")
    assert wait_scene(page, "Level", 5)
    wait_js(page, "__wikary.level().L.id === 2", 5)
    time.sleep(0.5)


def reach_arena(page):
    """Level 2: skok pod dom Krzysztofa, pominięcie rozmowy, czekanie na Hansa."""
    arena = page.evaluate("__wikary.LEVELS[1].arenaAt")
    teleport(page, arena - 60)
    hold(page, "ArrowLeft", 0.8)
    wait_js(page, "__wikary.level().arena", 5)
    for _ in range(40):
        if page.evaluate("!!__wikary.boss() && !__wikary.level().cutscene"):
            return
        if page.evaluate("!!__wikary.level().talk.dialog"):
            page.keyboard.press("Space")
        time.sleep(0.25)
    raise AssertionError("Hans się nie pojawił")


def beat_hans(page):
    """Hans z 1 HP, trafiony krzyżem; potem zakończenie z Krzysztofem i podsumowanie."""
    page.evaluate("""(()=>{const l=__wikary.level(),b=__wikary.boss(); b.hp=1; l.invulnUntil=l.time.now+20000; __wikary.GS.hasCross=true;})()""")
    for _ in range(20):
        if page.evaluate("__wikary.boss().dead"):
            break
        page.evaluate("(()=>{const l=__wikary.level(),b=__wikary.boss(); l.facing=Math.sign(b.x-l.hero.x)||-1; l.lastThrow=-99999;})()")
        page.keyboard.press("Alt")
        time.sleep(0.4)
    assert page.evaluate("__wikary.boss().dead"), "Hans nie padł"
    for _ in range(60):
        if page.evaluate("__wikary.level().summaryShown"):
            return
        if page.evaluate("!!__wikary.level().talk.dialog"):
            page.keyboard.press("Space")
        time.sleep(0.25)
    raise AssertionError("brak podsumowania po Hansie")


def finish_game(page):
    """Cała gra od Level 1 do wpisania nicku (Level 1 -> kościół -> Level 2 -> Hans)."""
    finish_level1(page)
    skip_church(page)
    reach_arena(page)
    beat_hans(page)
    page.keyboard.press("Enter")
    assert wait_scene(page, "Nick", 5)
    time.sleep(0.5)
