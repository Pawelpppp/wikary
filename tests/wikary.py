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


def skip_dialogs_until(page, expr, timeout=20, key="Space"):
    """Pomija dymki (Spacja), aż warunek JS będzie prawdziwy."""
    end = time.time() + timeout
    while time.time() < end:
        if page.evaluate(expr):
            return
        if page.evaluate("!!(__wikary.level() && __wikary.level().talk.dialog)"):
            page.keyboard.press(key)
        time.sleep(0.25)
    raise AssertionError("nie doczekano: " + expr)


def start_l3(page, part=None):
    """Level 3 z debug: part=None (start), 'defense' (pod kościołem), 'boss' (od razu Rafał)."""
    page.evaluate(f"__wikary.startL3({repr(part) if part else ''})")
    wait_js(page, "__wikary.scene().includes('Level') && __wikary.level().L.id === 3", 8)
    time.sleep(0.6)


def reach_defense(page):
    """Level 3: pod kościół, pominięcie rozmowy z proboszczem, start 1. fali (albo Rafała przy skipTo)."""
    page.evaluate("__wikary.GS.lives = Math.max(__wikary.GS.lives, 1)")
    if not page.evaluate("!!__wikary.defense()"):
        teleport(page, page.evaluate("__wikary.LEVELS[2].arenaAt") - 60)
        hold(page, "ArrowRight", 0.8)
    wait_js(page, "!!__wikary.defense()", 5)
    skip_dialogs_until(page, "__wikary.defense().state !== 'intro' && !__wikary.level().cutscene")


def skip_waves(page):
    """Ostatnia fala 'zaliczona' od ręki -> Rafał wychodzi z drzwi; czeka aż zacznie walczyć."""
    page.evaluate("""(()=>{const l=__wikary.level(),Df=__wikary.defense(),W=__wikary.CFG.defense.waves;
        if (Df.state !== 'boss') { Df.wave=W.length-1; Df.state='wave'; Df.spawned=W[Df.wave].n; Df.cleared=W.length-1; }
        l.enemies.getChildren().slice().forEach(e=>{ if (e.ghost) e.destroy(); });})()""")
    wait_rafal(page)


def wait_rafal(page):
    skip_dialogs_until(page, "!!__wikary.rafal() && __wikary.rafal().state !== 'enter' && !__wikary.level().cutscene")


def beat_rafal(page):
    """Rafał z 1 HP, trafiony krzyżem; egzorcyzm, świt, rozmowa, podsumowanie."""
    page.evaluate("""(()=>{const l=__wikary.level(),r=__wikary.rafal(); r.hp=1; l.invulnUntil=l.time.now+60000; __wikary.GS.hasCross=true;})()""")
    for _ in range(25):
        if page.evaluate("__wikary.rafal().dead"):
            break
        page.evaluate("""(()=>{const l=__wikary.level(),r=__wikary.rafal(); l.facing=Math.sign(r.x-l.hero.x)||1; l.lastThrow=-99999;
            r.y=Math.max(r.y, l.hero.y);})()""")
        page.keyboard.press("Alt")
        time.sleep(0.4)
    assert page.evaluate("__wikary.rafal().dead"), "Rafał nie padł"
    skip_dialogs_until(page, "__wikary.level().summaryShown", 40)


def finish_game(page):
    """Cała gra do wpisania nicku: Level 1 -> kościół -> Level 2 (Hans) -> Level 3 (obrona, Rafał) -> Level 4 (Adrian)."""
    finish_level1(page)
    skip_church(page)
    reach_arena(page)
    beat_hans(page)
    page.keyboard.press("Enter")
    wait_js(page, "__wikary.scene().includes('Level') && __wikary.level().L.id === 3", 8)
    time.sleep(0.5)
    page.evaluate("__wikary.level().invulnUntil = 1e12")
    reach_defense(page)
    skip_waves(page)
    beat_rafal(page)
    page.keyboard.press("Enter")
    wait_js(page, "__wikary.scene().includes('Level') && __wikary.level().L.id === 4", 8)
    time.sleep(0.5)
    page.evaluate("__wikary.level().invulnUntil = 1e12")
    reach_adrian(page)
    beat_adrian(page)
    page.keyboard.press("Enter")
    assert wait_scene(page, "Nick", 5)
    time.sleep(0.5)


def start_l4(page, part=None):
    """Level 4 z debug: part=None (start), 'boss' (tuż przed chatą Adriana)."""
    page.evaluate(f"__wikary.startL4({repr(part) if part else ''})")
    wait_js(page, "__wikary.scene().includes('Level') && __wikary.level().L.id === 4", 8)
    time.sleep(0.6)


def reach_adrian(page):
    """Level 4: skok pod chatę, pominięcie rozmowy, czekanie aż Adrian zacznie walkę."""
    page.evaluate("__wikary.GS.lives = Math.max(__wikary.GS.lives, 1)")
    if not page.evaluate("__wikary.level().arena"):
        teleport(page, page.evaluate("__wikary.LEVELS[3].arenaAt") - 60)
        hold(page, "ArrowRight", 0.8)
        wait_js(page, "__wikary.level().arena", 5)
    skip_dialogs_until(page, "!!__wikary.adrian() && __wikary.adrian().state !== 'enter' && !__wikary.level().cutscene", 30)


def beat_adrian(page):
    """Adrian z 1 HP, trafiony; diabeł, wyznanie, auto, podsumowanie."""
    page.evaluate("""(()=>{const l=__wikary.level(),a=__wikary.adrian(); l.invulnUntil=1e12;
        a.hp=1; a.harmless=false; l.damageEnemy(a, 1);})()""")
    wait_js(page, "__wikary.adrian().dead", 3)
    skip_dialogs_until(page, "__wikary.level().summaryShown", 60)


def no_life_pickups(page):
    """Wyłącza serduszka (znajdźki i dropy) w tej karcie: dla testów, które liczą życia. Wołać przed startem poziomu."""
    page.evaluate("(()=>{const C=__wikary.CFG.lifePickup; C.countByLevel=C.countByLevel.map(()=>0); C.dropChanceByLevel=C.dropChanceByLevel.map(()=>0);})()")
