"""?dev=true: po wyborze poziomu trudności lista punktów startu (INTRO + skróty debug 1–9) z szybkim przejściem.
Bez ?dev=true wybór trudności prowadzi prosto do intro."""
import time

from wikary import choose_difficulty, game_xy, open_game, wait_js, wait_scene

LABELS = ["INTRO (ZWYKŁY START)", "1. LEVEL 1", "2. KOŚCIÓŁ", "3. LEVEL 2", "4. L2: PRZED HANSEM", "5. LEVEL 3",
          "6. L3: OBRONA KOŚCIOŁA", "7. L3: RAFAŁ", "8. LEVEL 4", "9. L4: ADRIAN", "10. LEVEL 5", "11. L5: BENEK"]


def open_dev(page, base_url, diff="normal"):
    open_game(page, base_url, query="dev=true")
    assert page.evaluate("__wikary.DEV") is True
    page.keyboard.press("Enter")
    choose_difficulty(page, diff)
    assert wait_scene(page, "DevStart", 5), "brak listy startów"
    time.sleep(0.4)


def test_dev_list_visible_and_keyboard_to_level4(page, base_url):
    open_dev(page, base_url, "hard")
    d = page.evaluate("(()=>{const s=__wikary.devScene(); return {labels:s.items.map(i=>i.t.text), sel:s.sel, diff:s.diff}})()")
    assert d == {"labels": LABELS, "sel": 0, "diff": "hard"}, d
    assert "Intro" not in page.evaluate("__wikary.scene()")
    page.keyboard.press("ArrowRight")                      # druga kolumna: 6. L3: OBRONA KOŚCIOŁA
    for _ in range(2):
        page.keyboard.press("ArrowDown")                   # -> 8. LEVEL 4
    assert page.evaluate("__wikary.devScene().sel") == 8
    page.keyboard.press("Enter")
    wait_js(page, "__wikary.scene().includes('Level') && __wikary.level().L.id === 4 && !__wikary.level().dead", 8)
    assert page.evaluate("[__wikary.GS.difficulty, __wikary.GS.lives, __wikary.GS.hasBless]") == ["hard", 2, True]


def test_dev_touch_adrian_keeps_difficulty(new_page, base_url):
    pg = new_page(viewport={"width": 667, "height": 375}, has_touch=True, is_mobile=True)
    open_game(pg, base_url, query="dev=true")
    pg.touchscreen.tap(*game_xy(pg, 284, 150))
    assert wait_scene(pg, "Difficulty", 5)
    time.sleep(0.6)
    y = pg.evaluate("(()=>{const d=__wikary.diffScene(); return d.items[d.ids.indexOf('easy')].y})()")
    pg.touchscreen.tap(*game_xy(pg, 284, y))
    assert wait_scene(pg, "DevStart", 5)
    time.sleep(0.6)
    xy = pg.evaluate("(()=>{const it=__wikary.devScene().items[9]; return [it.x, it.y]})()")
    pg.touchscreen.tap(*game_xy(pg, *xy))
    wait_js(pg, "__wikary.scene().includes('Level') && __wikary.level().L.id === 4", 8)
    wait_js(pg, "__wikary.level().arena || __wikary.level().heroD() > __wikary.LEVELS[3].arenaAt - 200", 5)
    assert pg.evaluate("[__wikary.GS.difficulty, __wikary.GS.lives]") == ["easy", 5]


def test_dev_church_and_escape_back(page, base_url):
    open_dev(page, base_url, "easy")
    page.keyboard.press("Escape")
    assert wait_scene(page, "Difficulty", 5)
    time.sleep(0.4)
    page.keyboard.press("Enter")                           # zapamiętany ŁATWY
    assert wait_scene(page, "DevStart", 5)
    time.sleep(0.4)
    page.keyboard.press("ArrowDown"); page.keyboard.press("ArrowDown")    # 2. KOŚCIÓŁ
    page.keyboard.press("Space")
    assert wait_scene(page, "Church", 5)
    assert page.evaluate("[__wikary.GS.difficulty, __wikary.GS.lives]") == ["easy", 5]


def test_dev_intro_option(page, base_url):
    open_dev(page, base_url)
    page.keyboard.press("Enter")
    assert wait_scene(page, "Intro", 5)


def test_without_dev_no_list(game):
    assert game.evaluate("__wikary.DEV") is False
    game.keyboard.press("Enter")
    choose_difficulty(game, "hard")
    assert wait_scene(game, "Intro", 5)
    assert "DevStart" not in game.evaluate("__wikary.scene()")
    assert game.evaluate("__wikary.GS.difficulty") == "hard"
