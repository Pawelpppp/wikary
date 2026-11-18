"""Dotyk i różne rozmiary ekranu. Stary układ przycisków (< > ↓) testowany z ?touch=buttons; joystick w test_touch_joystick.py."""
import time

import pytest

from wikary import fmt, open_game, start_level, state, wait_scene


def test_fit_1280x720(game):
    start_level(game)
    game.set_viewport_size({"width": 1280, "height": 720})
    time.sleep(0.8)
    box = game.evaluate("(()=>{const c=document.querySelector('canvas').getBoundingClientRect();return [c.width,c.height]})()")
    assert abs(box[0] - 1280) < 4 and box[1] <= 720.5, box


def test_touch_start_skip_and_jump(new_page, base_url):
    pg = new_page(has_touch=True, is_mobile=True)
    open_game(pg, base_url)
    pg.touchscreen.tap(284, 150)
    assert wait_scene(pg, "Intro", 3), "dotyk START"
    time.sleep(1.0)
    pg.touchscreen.tap(284, 200)
    assert wait_scene(pg, "Level", 3), "dotyk nie pominął intro"
    time.sleep(1.0)
    assert pg.evaluate("IS_TOUCH")
    jx, jy = button_center(pg, "jump")
    pg.touchscreen.tap(jx, jy)
    time.sleep(0.2)
    s = state(pg)
    assert s["hy"] < 250, fmt(s)


def test_touch_mode_forced_by_query(new_page, base_url):
    pg = new_page()
    pg.goto(base_url + "?debug=1&touch=1")
    pg.wait_for_function("window.__wikary && window.__wikary.scene().includes('Title')", timeout=30000)
    assert pg.evaluate("IS_TOUCH")


BUTTONS = "(()=>{const l=__wikary.level(),o={};for(const k in l.touchButtons){const b=l.touchButtons[k].getBounds();o[k]={x:b.x,y:b.y,w:b.width,h:b.height,a:l.touchButtons[k].fillAlpha}}return o})()"


def button_center(pg, name):
    b = pg.evaluate(BUTTONS)[name]
    return b["x"] + b["w"] / 2, b["y"] + b["h"] / 2


def _touch_level(new_page, base_url, mode="buttons"):
    pg = new_page(has_touch=True, is_mobile=True)
    open_game(pg, base_url, query="touch=" + mode)
    pg.touchscreen.tap(284, 150)
    assert wait_scene(pg, "Intro", 3)
    time.sleep(0.8)
    pg.touchscreen.tap(284, 200)
    assert wait_scene(pg, "Level", 3)
    time.sleep(0.8)
    return pg


def _hold(pg, x, y, secs):
    """Przytrzymanie palca (Playwright ma tylko tap) przez CDP."""
    cdp = pg.context.new_cdp_session(pg)
    cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y}]})
    time.sleep(secs)
    res = pg.evaluate(BODY_STATE)
    cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    return res


BODY_STATE = "(()=>{const l=__wikary.level();return {crouching:l.crouching,h:l.hero.body.height,x:l.hero.x-l.cameras.main.scrollX}})()"


def test_touch_layout_vertically_centered_at_edges(new_page, base_url):
    pg = _touch_level(new_page, base_url)
    b = pg.evaluate(BUTTONS)
    assert set(b) == {"left", "right", "down", "ult", "attack", "jump"}
    mid = 24 + (320 - 24) / 2
    left, right = [b[k] for k in ("left", "right", "down")], [b[k] for k in ("ult", "attack", "jump")]
    for col in (left, right):
        top, bottom = min(c["y"] for c in col), max(c["y"] + c["h"] for c in col)
        assert abs((top + bottom) / 2 - mid) <= 2, (top, bottom)
    assert all(c["x"] <= 4 and c["x"] + c["w"] <= 48 for c in left), left
    assert all(c["x"] + c["w"] >= 564 for c in right), right
    assert all(c["a"] < 0.5 for c in b.values())
    assert b["left"]["y"] < b["right"]["y"] < b["down"]["y"]
    assert b["ult"]["y"] < b["attack"]["y"] < b["jump"]["y"]


# lewa krawędź widocznych (nieprzezroczystych) pikseli sprite'a Kamila, w px ekranu
VISIBLE_LEFT = """(()=>{const l=__wikary.level(),k=l.kamil,img=k.texture.getSourceImage();
  const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);
  const d=x.getImageData(0,0,c.width,c.height).data;let lo=c.width,hi=-1;
  for(let i=3;i<d.length;i+=4){if(d[i]>20){const px=((i-3)/4)%c.width;if(px<lo)lo=px;if(px>hi)hi=px;}}
  const s=k.scaleX,left0=k.x-k.displayOriginX*s; // bez odbicia
  const vis=k.flipX? left0+(c.width-1-hi)*s : left0+lo*s;
  return vis-l.cameras.main.scrollX;})()"""


def test_kamil_never_under_left_buttons(new_page, base_url):
    pg = _touch_level(new_page, base_url)
    edge = max(v["x"] + v["w"] for k, v in pg.evaluate(BUTTONS).items() if k in ("left", "right", "down"))
    lx, ly = button_center(pg, "left")
    _hold(pg, lx, ly, 2.0)          # bieg w lewo do oporu
    worst = 9999
    for _ in range(15):             # stanie w miejscu, auto-scroll pcha
        k = pg.evaluate(VISIBLE_LEFT)
        worst = min(worst, k)
        time.sleep(0.1)
    assert worst > edge, (worst, edge)


def test_touch_crouch_button(new_page, base_url):
    pg = _touch_level(new_page, base_url)
    dx, dy = button_center(pg, "down")
    held = _hold(pg, dx, dy, 0.5)
    time.sleep(0.2)
    after = pg.evaluate(BODY_STATE)
    assert held["crouching"] and held["h"] == pg.evaluate("__wikary.CFG.hero.crouchH"), held
    assert not after["crouching"], after


@pytest.mark.parametrize("mode", ["buttons", "joystick"])
def test_touch_level2_has_fire_button_in_centered_right_column(new_page, base_url, mode):
    pg = new_page(has_touch=True, is_mobile=True)
    pg.goto(base_url + "?debug=1&touch=" + mode)
    pg.wait_for_function("window.__wikary && window.__wikary.scene().includes('Title')", timeout=30000)
    pg.evaluate("__wikary.start(1)")
    pg.wait_for_function("__wikary.scene().includes('Level') && __wikary.level().L.id === 2", timeout=8000)
    time.sleep(0.8)
    b = pg.evaluate(BUTTONS)
    expected = {"ult", "fire", "attack", "jump"} | ({"left", "right", "down"} if mode == "buttons" else set())
    assert set(b) == expected, b
    col = [b[k] for k in ("ult", "fire", "attack", "jump")]
    top, bottom = min(c["y"] for c in col), max(c["y"] + c["h"] for c in col)
    assert abs((top + bottom) / 2 - (24 + (320 - 24) / 2)) <= 2, (top, bottom)
    assert bottom <= 320 and top >= 24
    pg.evaluate("__wikary.GS.hasFire = true")
    fx, fy = button_center(pg, "fire")
    pg.touchscreen.tap(fx, fy)
    time.sleep(0.15)
    assert pg.evaluate("__wikary.level().shots.getChildren().some(s=>s.kind==='fire')")
