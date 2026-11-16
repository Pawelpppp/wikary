"""Dotyk i różne rozmiary ekranu."""
import time

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
    pg.touchscreen.tap(528, 306)
    time.sleep(0.2)
    s = state(pg)
    assert s["hy"] < 250, fmt(s)


def test_touch_mode_forced_by_query(new_page, base_url):
    pg = new_page()
    pg.goto(base_url + "?debug=1&touch=1")
    pg.wait_for_function("window.__wikary && window.__wikary.scene().includes('Title')", timeout=30000)
    assert pg.evaluate("IS_TOUCH")
