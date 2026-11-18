"""Telefon w pionie: pauza całej gry i komunikat „OBRÓĆ TELEFON POZIOMO”, po obróceniu wznowienie
i dopasowanie do ekranu. Emulacja iPhone'ów w Chromium (isMobile + hasTouch + UA Safari), bo WebKit
nie da się uruchomić na tej maszynie (brak bibliotek systemowych).
Minimalny testowany rozmiar: iPhone SE 2./3. gen (375×667 w pionie, 667×375 w poziomie); mniejszych urządzeń nie testujemy."""
import time

import pytest

from wikary import start_level, wait_scene

IOS_UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 "
          "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")
# (nazwa, szerokość, wysokość w pionie, dpr, notch: minimalne wcięcie z boku w poziomie)
PHONES = [
    ("iphone_se3", 375, 667, 2, 0),
    ("iphone_13_mini", 375, 812, 3, 50),
    ("iphone_15_pro_max", 430, 932, 3, 59),
]
IDS = [p[0] for p in PHONES]
OVERLAY = "(()=>{const o=document.getElementById('rotate');if(!o)return null;const r=o.getBoundingClientRect();return {vis:getComputedStyle(o).display!=='none',w:r.width,h:r.height,text:o.innerText}})()"


def phone(new_page, base_url, spec, landscape=False, query=""):
    _, w, h, dpr, _ = spec
    vw, vh = (h, w) if landscape else (w, h)
    pg = new_page(viewport={"width": vw, "height": vh}, device_scale_factor=dpr, is_mobile=True, has_touch=True, user_agent=IOS_UA)
    pg.goto(base_url + "?debug=1" + query)
    pg.wait_for_function("window.__wikary && __wikary.game.isBooted", timeout=30000)
    if landscape:
        assert wait_scene(pg, "Title", 15)
    time.sleep(0.6)
    return pg


def rotate(pg, spec, landscape):
    _, w, h, _, _ = spec
    pg.set_viewport_size({"width": h, "height": w} if landscape else {"width": w, "height": h})
    time.sleep(0.6)                      # debounce + późne odświeżenie skali


def orient(pg):
    return pg.evaluate("__wikary.orientation()")


def check_fit(pg, spec):
    """Canvas w całości na ekranie (FIT), bez przewijania strony, przyciski/joystick w środku, z dala od notcha."""
    r = pg.evaluate("""(()=>{const c=document.querySelector('canvas').getBoundingClientRect(),d=document.documentElement;
        return {x:c.x,y:c.y,w:c.width,h:c.height,vw:innerWidth,vh:innerHeight,sw:d.scrollWidth,sh:d.scrollHeight,
                sy:scrollY,sx:scrollX}})()""")
    assert r["x"] >= -0.5 and r["y"] >= -0.5 and r["x"] + r["w"] <= r["vw"] + 0.5 and r["y"] + r["h"] <= r["vh"] + 0.5, r
    assert abs(r["w"] - r["vw"]) < 2 or abs(r["h"] - r["vh"]) < 2, r                 # FIT: jedna krawędź dotyka
    assert abs(r["w"] / r["h"] - 568 / 320) < 0.02, r
    assert r["sw"] <= r["vw"] and r["sh"] <= r["vh"] and r["sx"] == 0 and r["sy"] == 0, r
    notch = spec[4]
    if notch:
        assert r["x"] >= notch and r["vw"] - (r["x"] + r["w"]) >= notch, ("pod notchem", r)
    return r


def test_viewport_meta_and_css_for_ios(new_page, base_url):
    pg = phone(new_page, base_url, PHONES[0], landscape=True)
    meta = pg.evaluate("document.querySelector('meta[name=viewport]').content")
    assert "user-scalable=no" in meta and "viewport-fit=cover" in meta and "maximum-scale=1" in meta, meta
    css = pg.evaluate("(()=>{const b=getComputedStyle(document.body),g=getComputedStyle(document.getElementById('game'));return {ta:b.touchAction,ov:b.overflow,pos:g.position}})()")
    assert css["ta"] == "none" and css["ov"] == "hidden" and css["pos"] == "fixed", css


@pytest.mark.parametrize("spec", PHONES, ids=IDS)
def test_portrait_pauses_landscape_resumes_level(new_page, base_url, spec):
    pg = phone(new_page, base_url, spec)                       # start w pionie
    o = pg.evaluate(OVERLAY)
    assert o and o["vis"] and "OBRÓĆ TELEFON" in o["text"] and o["w"] >= spec[1] - 1 and o["h"] >= spec[2] - 1, o
    assert orient(pg)["gamePaused"]
    rotate(pg, spec, True)
    assert not pg.evaluate(OVERLAY)["vis"] and not orient(pg)["gamePaused"]
    assert wait_scene(pg, "Title", 10)
    check_fit(pg, spec)
    start_level(pg)
    time.sleep(0.5)
    r = check_fit(pg, spec)
    # przyciski i joystick (w pikselach strony) mieszczą się na ekranie
    els = pg.evaluate("""(()=>{const l=__wikary.level(),o=[];for(const k in l.touchButtons){const b=l.touchButtons[k].getBounds();o.push([k,b.x,b.y,b.right,b.bottom])}
        const j=l.joy; if(j) o.push(['joy', j.base.x-j.base.radius, j.base.y-j.base.radius, j.base.x+j.base.radius, j.base.y+j.base.radius]); return o})()""")
    s = r["w"] / 568
    for k, x0, y0, x1, y1 in els:
        assert r["x"] + x0 * s >= 0 and r["y"] + y0 * s >= 0 and r["x"] + x1 * s <= r["vw"] and r["y"] + y1 * s <= r["vh"], (k, x0, y0, x1, y1, r)
    assert any(e[0] == "joy" for e in els)
    # obrót w trakcie poziomu: wszystko stoi
    rotate(pg, spec, False)
    assert pg.evaluate(OVERLAY)["vis"] and orient(pg)["gamePaused"]
    a = pg.evaluate("[__wikary.GS.timeMs, __wikary.level().cameras.main.scrollX, __wikary.level().hero.x]")
    time.sleep(1.0)
    b = pg.evaluate("[__wikary.GS.timeMs, __wikary.level().cameras.main.scrollX, __wikary.level().hero.x]")
    assert a == b, (a, b)
    rotate(pg, spec, True)
    assert not pg.evaluate(OVERLAY)["vis"] and not orient(pg)["gamePaused"]
    time.sleep(0.6)
    c = pg.evaluate("[__wikary.GS.timeMs, __wikary.level().cameras.main.scrollX]")
    assert c[0] > b[0] + 300 and c[0] < b[0] + 2000 and c[1] != b[1], (b, c)   # czas liczy dalej, bez skoku o czas pauzy
    check_fit(pg, spec)


def test_rotate_mid_dialog_keeps_dialog(new_page, base_url):
    spec = PHONES[1]
    pg = phone(new_page, base_url, spec, landscape=True)
    start_level(pg)
    pg.evaluate("void __wikary.level().talk.say('wikary_kamil_closeup_open', 'KAMIL', 'Długi dymek do testu obracania telefonu w trakcie rozmowy z proboszczem.')")
    time.sleep(0.3)
    rotate(pg, spec, False)
    t1 = pg.evaluate("__wikary.level().talk.dialog.list.map(o=>o.text||'').join('|')")
    time.sleep(0.8)
    assert pg.evaluate("__wikary.level().talk.dialog.list.map(o=>o.text||'').join('|')") == t1    # pisanie stoi
    rotate(pg, spec, True)
    time.sleep(0.4)
    assert pg.evaluate("!!__wikary.level().talk.dialog")
    assert len(pg.evaluate("__wikary.level().talk.dialog.list.map(o=>o.text||'').join('|')")) > len(t1)


def test_resume_only_what_we_paused(new_page, base_url):
    spec = PHONES[0]
    pg = phone(new_page, base_url, spec, landscape=True)
    start_level(pg)
    pg.evaluate("__wikary.game.scene.pause('Level')")            # scena zatrzymana przez kogoś innego
    rotate(pg, spec, False)
    rotate(pg, spec, True)
    assert pg.evaluate("__wikary.game.scene.isPaused('Level')")
    pg.evaluate("__wikary.game.scene.resume('Level'); __wikary.game.pause()")   # cała gra zatrzymana przez kogoś innego
    rotate(pg, spec, False)
    assert orient(pg)["overlay"] and not orient(pg)["byUs"]
    rotate(pg, spec, True)
    assert pg.evaluate("__wikary.game.isPaused")
    pg.evaluate("__wikary.game.resume()")


def test_held_joystick_released_after_rotation(new_page, base_url):
    spec = PHONES[0]
    pg = phone(new_page, base_url, spec, landscape=True)
    start_level(pg)
    cdp = pg.context.new_cdp_session(pg)
    cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": 110, "y": 220, "id": 0}]})
    cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": 150, "y": 220, "id": 0}]})
    time.sleep(0.2)
    assert pg.evaluate("__wikary.level().hero.body.velocity.x") > 0
    assert pg.evaluate("WikaryAudio.state") == "running"           # dotyk odblokował dźwięk
    rotate(pg, spec, False)
    assert pg.evaluate("WikaryAudio.state") == "suspended"         # w pionie cisza
    rotate(pg, spec, True)
    assert pg.evaluate("WikaryAudio.state") == "running"
    time.sleep(0.2)
    assert pg.evaluate("__wikary.level().joy.id") is None and pg.evaluate("__wikary.level().hero.body.velocity.x") == 0
    cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": [{"x": 150, "y": 220, "id": 0}]})


@pytest.mark.parametrize("scene,data", [("Title", None), ("Intro", None), ("Church", {"next": 1}), ("Scores", None), ("Nick", {"won": False})])
def test_portrait_pauses_every_scene(new_page, base_url, scene, data):
    spec = PHONES[0]
    pg = phone(new_page, base_url, spec, landscape=True)
    assert wait_scene(pg, "Title", 10)
    if scene != "Title":
        pg.evaluate(f"__wikary.startScene('{scene}', {'null' if data is None else str(data).replace(chr(39), chr(34)).replace('False', 'false')})")
        assert wait_scene(pg, scene, 5)
    time.sleep(0.4)
    rotate(pg, spec, False)
    assert orient(pg)["gamePaused"] and pg.evaluate(OVERLAY)["vis"]
    assert scene in pg.evaluate("__wikary.scene()")
    rotate(pg, spec, True)
    assert not orient(pg)["gamePaused"] and scene in pg.evaluate("__wikary.scene()")
    check_fit(pg, spec)


def test_desktop_never_shows_overlay(new_page, base_url):
    pg = new_page(viewport={"width": 400, "height": 800})       # wąskie okno komputera, bez dotyku
    pg.goto(base_url + "?debug=1")
    pg.wait_for_function("window.__wikary && __wikary.scene().includes('Title')", timeout=30000)
    time.sleep(0.4)
    assert pg.evaluate(OVERLAY) is None and not orient(pg)["gamePaused"]
