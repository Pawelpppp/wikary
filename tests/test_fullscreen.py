"""Pełny ekran: przycisk F (akcja na pointerup = gest uznawany na Androidzie) i klawisz F, na tytule, w levelu
i w intro (zoom obrazu nie przesuwa przycisków), wyjście przeglądarką, nick (F = litera), dotyk na F nie skacze
i nie pomija intro, iPhone (brak API) -> podpowiedź, odmowa przeglądarki -> bez błędów w konsoli."""
import time

from wikary import open_game, start_level, wait_js, wait_scene

FS = "!!document.fullscreenElement && __wikary.game.scale.isFullscreen"
NOT_FS = "!document.fullscreenElement && !__wikary.game.scale.isFullscreen"
UA_IPHONE = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 "
             "(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1")
NO_FS_API = ("for (const k of ['requestFullscreen','webkitRequestFullscreen','webkitRequestFullScreen']) "
             "{ delete Element.prototype[k]; delete HTMLElement.prototype[k]; } "
             "for (const k of ['exitFullscreen','webkitExitFullscreen','webkitCancelFullScreen']) delete Document.prototype[k]; "
             "Object.defineProperty(Document.prototype,'fullscreenEnabled',{get:()=>false});")


def f_button(pg):
    """środek przycisku F w pikselach strony"""
    return pg.evaluate("""(()=>{const b=__wikary.game.canvas.getBoundingClientRect(), s=__wikary.game.scene.getScenes(true)[0];
        const r=s.children.list.find(o=>o.type==='Rectangle' && o.input && Math.round(o.x)===__wikary.CFG.W-14);
        return [b.x + r.x / __wikary.CFG.W * b.width, b.y + r.y / __wikary.CFG.H * b.height];})()""")


def click_f(pg):
    x, y = f_button(pg)
    pg.mouse.click(x, y)


def touch_page(new_page, base_url, **extra):
    pg = new_page(viewport={"width": 667, "height": 375}, has_touch=True, is_mobile=True, **extra)
    open_game(pg, base_url)
    return pg


def test_title_button_and_key_toggle_fullscreen(game):
    click_f(game)
    wait_js(game, FS, 3)
    assert game.evaluate("__wikary.scene()") == ["Title"]
    click_f(game)
    wait_js(game, NOT_FS, 3)
    game.keyboard.press("f")
    wait_js(game, FS, 3)
    game.keyboard.press("f")
    wait_js(game, NOT_FS, 3)


def test_level_key_and_button_and_browser_exit(game):
    start_level(game)
    game.keyboard.press("f")
    wait_js(game, FS, 3)
    game.evaluate("document.exitFullscreen()")                  # wyjście przeglądarką (Esc / gest)
    wait_js(game, NOT_FS, 3)
    click_f(game)
    wait_js(game, FS, 3)
    assert game.evaluate("__wikary.game.canvas.getBoundingClientRect().width") > 500
    click_f(game)
    wait_js(game, NOT_FS, 3)


def test_intro_button_works_during_zoom_and_click_does_not_advance(game):
    game.evaluate("__wikary.startScene('Intro')")
    time.sleep(2.5)                                             # w trakcie przybliżenia pierwszego obrazu
    assert game.evaluate("__wikary.game.scene.getScene('Intro').cameras.main.zoom") == 1
    click_f(game)
    wait_js(game, FS, 3)
    assert game.evaluate("__wikary.scene()") == ["Intro"]
    click_f(game)
    wait_js(game, NOT_FS, 3)


def test_nick_f_types_letter_not_fullscreen(game):
    game.evaluate("__wikary.startScene('Nick', {result: 'win'})")
    assert wait_scene(game, "Nick", 5)
    time.sleep(0.5)
    game.keyboard.press("f")
    time.sleep(0.6)
    assert game.evaluate(NOT_FS)


def test_touch_title_fullscreen_on_pointerup_not_pointerdown(new_page, base_url):
    pg = touch_page(new_page, base_url)
    pg.evaluate("window.__locks = []; screen.orientation.lock = (o) => { window.__locks.push(o); return Promise.resolve(); }")
    x, y = f_button(pg)
    cdp = pg.context.new_cdp_session(pg)
    cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y}]})
    time.sleep(0.4)
    assert pg.evaluate(NOT_FS), "pełny ekran już na touchstart (powinien na pointerup)"
    cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    wait_js(pg, FS, 3)
    time.sleep(0.5)
    assert pg.evaluate("__wikary.scene()") == ["Title"], "dotyk F zmienił scenę"
    assert "landscape" in pg.evaluate("window.__locks")               # Android: blokada orientacji poziomej
    pg.touchscreen.tap(x, y)
    wait_js(pg, NOT_FS, 3)


def test_touch_f_in_level_does_not_jump(new_page, base_url):
    pg = touch_page(new_page, base_url)
    pg.evaluate("__wikary.start(0)")
    wait_js(pg, "__wikary.scene().includes('Level')", 8)
    time.sleep(1.0)
    pg.evaluate("__wikary.level().invulnUntil = 1e12")
    x, y = f_button(pg)
    pg.touchscreen.tap(x, y)
    time.sleep(0.05)
    assert pg.evaluate("__wikary.level().jumpAt") == -99999 and pg.evaluate("__wikary.level().jumps") == 0
    wait_js(pg, FS, 3)


def test_touch_f_in_intro_does_not_skip(new_page, base_url):
    pg = touch_page(new_page, base_url)
    pg.evaluate("__wikary.startScene('Intro')")
    time.sleep(2.5)
    x, y = f_button(pg)
    pg.touchscreen.tap(x, y)
    wait_js(pg, FS, 3)
    time.sleep(0.6)
    assert pg.evaluate("__wikary.scene()") == ["Intro"], "dotyk F pominął intro"


def test_iphone_without_fullscreen_api_shows_home_screen_hint(new_page, base_url):
    pg = new_page(viewport={"width": 667, "height": 375}, has_touch=True, is_mobile=True, user_agent=UA_IPHONE)
    pg.add_init_script(NO_FS_API)
    open_game(pg, base_url)
    assert pg.evaluate("__wikary.game.scale.fullscreen.available") is False
    pg.evaluate("window.__unsup = 0; __wikary.game.scale.on('fullscreenunsupported', () => window.__unsup++)")
    x, y = f_button(pg)
    pg.touchscreen.tap(x, y)
    time.sleep(0.4)
    assert pg.evaluate("window.__unsup") == 1
    hint = pg.evaluate("__wikary.game.scene.getScene('Title').children.list.filter(o=>o.type==='Container').map(c=>c.list.filter(t=>t.type==='Text').map(t=>t.text).join('')).join('|')")
    assert "DO EKRANU POCZĄTKOWEGO" in hint, hint
    assert pg.evaluate("__wikary.scene()") == ["Title"]


def test_refused_request_emits_failed_without_console_error(game):
    game.evaluate("""(()=>{Element.prototype.requestFullscreen = function () { return Promise.reject(new TypeError('Permissions check failed')); };
        window.__fail = 0; __wikary.game.scale.on('fullscreenfailed', () => window.__fail++);})()""")
    click_f(game)
    wait_js(game, "window.__fail === 1", 3)
    assert game.evaluate(NOT_FS)
    time.sleep(0.5)                                             # ewentualny „Uncaught (in promise)” złapie strażnik konsoli
