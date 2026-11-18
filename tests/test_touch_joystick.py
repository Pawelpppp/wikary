"""Dotyk, tryb joysticka (test, domyślny CFG.touch.mode): pływający joystick w lewej strefie (analogowa prędkość,
kucanie w dół), dotknięcie ekranu = skok, drugie w powietrzu = salto, dymki nadal przewijane dotknięciem,
przyciski KRZYŻ / OGIEŃ / GROM / SKOK bez zmian (także jednocześnie z joystickiem)."""
import time

import pytest

from wikary import fmt, open_game, start_level, state

JX, JY = 110, 220            # start palca w strefie joysticka
R = 34                       # CFG.touch.joystick.radius
TAP_X, TAP_Y = 330, 180      # poza joystickiem i przyciskami


class Touch:
    """Wielodotyk przez CDP: każdy palec ma id, a każde zdarzenie podaje wszystkie aktywne palce."""
    def __init__(self, pg):
        self.pg, self.cdp, self.pts = pg, pg.context.new_cdp_session(pg), {}

    def _send(self, kind):
        pts = [{"x": x, "y": y, "id": i} for i, (x, y) in self.pts.items()]
        self.cdp.send("Input.dispatchTouchEvent", {"type": kind, "touchPoints": pts})

    def down(self, i, x, y):
        self.pts[i] = (x, y)
        self._send("touchStart")

    def move(self, i, x, y):
        self.pts[i] = (x, y)
        self._send("touchMove")

    def up(self, i):
        x, y = self.pts.pop(i)          # Chrome: touchEnd z listą palców puszcza właśnie te palce
        self.cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": [{"x": x, "y": y, "id": i}]})

    def tap(self, i, x, y):
        self.down(i, x, y); time.sleep(0.05); self.up(i)


def _joy_level(new_page, base_url, level=0):
    pg = new_page(has_touch=True, is_mobile=True)
    open_game(pg, base_url)
    assert pg.evaluate("IS_TOUCH && TOUCH_MODE === 'joystick'")
    if level == 0:
        start_level(pg)
    else:
        pg.evaluate(f"__wikary.start({level})")
        pg.wait_for_function(f"__wikary.scene().includes('Level') && __wikary.level().L.id === {level + 1}", timeout=8000)
    time.sleep(0.8)
    return pg


VX = "__wikary.level().hero.body.velocity.x"


def test_joystick_analog_speed_and_follow_finger(new_page, base_url):
    pg = _joy_level(new_page, base_url)
    assert set(pg.evaluate("Object.keys(__wikary.level().touchButtons)")) == {"ult", "attack", "jump"}
    t = Touch(pg)
    pg.evaluate("__wikary.teleport(150)")
    t.down(0, JX, JY)
    j = pg.evaluate("(()=>{const j=__wikary.level().joy;return {x:j.base.x,y:j.base.y,a:j.base.alpha}})()")
    assert abs(j["x"] - JX) < 2 and abs(j["y"] - JY) < 2 and j["a"] == 1, j      # baza pod palcem
    t.move(0, JX + R * 0.1, JY)                                                 # martwa strefa
    time.sleep(0.15)
    assert pg.evaluate(VX) == 0
    t.move(0, JX + R * 0.45, JY)
    time.sleep(0.15)
    slow = pg.evaluate(VX)
    t.move(0, JX + R * 3, JY)                                                   # pełne wychylenie (gałka na brzegu)
    time.sleep(0.15)
    fast = pg.evaluate(VX)
    full = pg.evaluate("__wikary.CFG.hero.speed")
    assert 0 < slow < fast * 0.6 and abs(fast - full) < 1, (slow, fast, full)
    knob = pg.evaluate("(()=>{const j=__wikary.level().joy;return Math.hypot(j.knob.x-j.base.x,j.knob.y-j.base.y)})()")
    assert abs(knob - R) < 1.5, knob
    t.move(0, 420, JY - 10)                                                      # palec wyjeżdża ze strefy: dalej steruje
    time.sleep(0.1)
    assert pg.evaluate(VX) > 0
    t.move(0, JX - R, JY)                                                       # w lewo
    time.sleep(0.15)
    assert pg.evaluate(VX) < 0 and pg.evaluate("__wikary.level().facing") == -1
    t.up(0)
    time.sleep(0.15)
    assert pg.evaluate(VX) == 0 and pg.evaluate("__wikary.level().joy.id") is None


def test_joystick_pull_down_crouches(new_page, base_url):
    pg = _joy_level(new_page, base_url)
    t = Touch(pg)
    t.down(0, JX, JY - 40)
    t.move(0, JX + 4, JY - 40 + R)
    time.sleep(0.2)
    s = pg.evaluate("(()=>{const l=__wikary.level();return {c:l.crouching,h:l.hero.body.height,vx:l.hero.body.velocity.x}})()")
    assert s["c"] and s["h"] == pg.evaluate("__wikary.CFG.hero.crouchH") and s["vx"] == 0, s
    t.move(0, JX + R, JY - 40 + R * 0.6)                                       # ukośnie: bieg, nie kucanie
    time.sleep(0.2)
    assert not pg.evaluate("__wikary.level().crouching")
    t.move(0, JX, JY - 40 + R)
    time.sleep(0.2)
    t.up(0)
    time.sleep(0.2)
    assert not pg.evaluate("__wikary.level().crouching")


def test_tap_jumps_and_double_tap_saltos(new_page, base_url):
    pg = _joy_level(new_page, base_url)
    t = Touch(pg)
    t.tap(0, TAP_X, TAP_Y)
    time.sleep(0.15)
    s = state(pg)
    assert s["hy"] < 250 and pg.evaluate("__wikary.level().jumps") == 1, fmt(s)
    t.tap(0, TAP_X, TAP_Y)
    time.sleep(0.1)
    assert pg.evaluate("__wikary.level().jumps") == 2 and pg.evaluate("__wikary.level().flipping")


def test_tap_in_joystick_zone_does_not_jump(new_page, base_url):
    pg = _joy_level(new_page, base_url)
    t = Touch(pg)
    t.tap(0, JX, JY)
    time.sleep(0.2)
    assert pg.evaluate("__wikary.level().jumps") == 0


def test_tap_during_dialog_advances_and_does_not_jump(new_page, base_url):
    pg = _joy_level(new_page, base_url)
    pg.evaluate("void __wikary.level().talk.say('wikary_kamil_closeup_open', 'KAMIL', 'Test dymka, dotknij, żeby przewinąć.')")
    time.sleep(0.2)
    t = Touch(pg)
    t.tap(0, TAP_X, TAP_Y)                     # dopisuje tekst
    time.sleep(0.1)
    assert pg.evaluate("__wikary.level().talk.dialog.done")
    t.tap(0, TAP_X, TAP_Y)                     # zamyka dymek
    time.sleep(0.2)
    assert pg.evaluate("__wikary.level().talk.dialog") is None
    assert pg.evaluate("__wikary.level().jumps") == 0 and state(pg)["hy"] >= 255


def test_spell_buttons_work_while_steering(new_page, base_url):
    pg = _joy_level(new_page, base_url)
    pg.evaluate("__wikary.giveCross(); __wikary.teleport(150)")
    b = pg.evaluate("(()=>{const o={};const t=__wikary.level().touchButtons;for(const k in t){const g=t[k].getBounds();o[k]=[g.centerX,g.centerY]}return o})()")
    t = Touch(pg)
    t.down(0, JX, JY); t.move(0, JX + R, JY)             # bieg w prawo...
    time.sleep(0.2)
    t.down(1, *b["attack"]); time.sleep(0.05); t.up(1)   # ...i jednocześnie KRZYŻ
    time.sleep(0.1)
    assert pg.evaluate("__wikary.level().shots.countActive()") >= 1
    assert pg.evaluate(VX) > 0 and pg.evaluate("__wikary.level().jumps") == 0
    t.down(1, *b["jump"]); time.sleep(0.05); t.up(1)     # SKOK zostaje
    time.sleep(0.12)
    assert pg.evaluate("__wikary.level().jumps") == 1
    time.sleep(0.9)
    pg.evaluate("__wikary.setMeter(__wikary.CFG.ult.max)")
    t.down(1, *b["ult"]); time.sleep(0.3)               # GROM: trzymanie = modlitwa
    assert pg.evaluate("__wikary.level().praying")
    t.up(1); t.up(0)


def test_fire_button_in_level2_with_joystick(new_page, base_url):
    pg = _joy_level(new_page, base_url, level=1)
    pg.evaluate("__wikary.GS.hasFire = true")
    b = pg.evaluate("(()=>{const g=__wikary.level().touchButtons.fire.getBounds();return [g.centerX,g.centerY]})()")
    t = Touch(pg)
    t.down(0, JX, JY); t.move(0, JX - R, JY)             # Level 2: w lewo
    time.sleep(0.2)
    t.down(1, *b); time.sleep(0.05); t.up(1)
    time.sleep(0.1)
    assert pg.evaluate("__wikary.level().shots.getChildren().some(s=>s.kind==='fire')")
    assert pg.evaluate(VX) < 0
    t.up(0)


def test_buttons_mode_still_available(new_page, base_url):
    pg = new_page(has_touch=True, is_mobile=True)
    open_game(pg, base_url, query="touch=buttons")
    start_level(pg)
    time.sleep(0.6)
    assert pg.evaluate("TOUCH_MODE") == "buttons" and pg.evaluate("__wikary.level().joy") is None
    assert {"left", "right", "down"} <= set(pg.evaluate("Object.keys(__wikary.level().touchButtons)"))
    t = Touch(pg)
    t.tap(0, TAP_X, TAP_Y)                               # w starym układzie dotknięcie ekranu nie skacze
    time.sleep(0.15)
    assert pg.evaluate("__wikary.level().jumps") == 0
