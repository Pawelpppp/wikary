"""Powtórzenie poziomu po przegranej: po GAME OVER raz na rozgrywkę pytanie „POWTÓRZYĆ POZIOM?” TAK / NIE.
TAK = ten sam poziom od początku, wynik zostaje, życia startowe, moce jak na starcie poziomu; NIE albo druga
przegrana = nick. Nowa gra z tytułu zeruje licznik."""
import time

from wikary import open_game, start_level, wait_js, wait_scene

PROMPT = "!!(__wikary.level() && __wikary.level().retryPrompt)"


def start(page, idx):
    page.evaluate(f"__wikary.start({idx})")
    wait_js(page, f"__wikary.scene().includes('Level') && __wikary.level().L.id === {idx + 1} && !__wikary.level().dead", 8)
    time.sleep(0.6)


def die(page):
    page.evaluate("(()=>{const l=__wikary.level(); __wikary.GS.lives = 0; l.gameOver();})()")


def prompt_text(page):
    return page.evaluate("__wikary.level().retryPrompt.objs.filter(o=>o.type==='Text').map(o=>o.text).join('|')")


def test_yes_restarts_level_keeps_score_then_second_loss_goes_to_nick(game):
    start(game, 0)
    game.evaluate("__wikary.GS.score = 1234; __wikary.level().debugTeleport(1500)")
    die(game)
    wait_js(game, PROMPT, 6)
    assert "POWTÓRZYĆ POZIOM?" in prompt_text(game) and "TAK" in prompt_text(game) and "NIE" in prompt_text(game)
    assert game.evaluate("__wikary.level().retryPrompt.sel") == 0               # domyślnie TAK
    game.keyboard.press("Enter")
    wait_js(game, "__wikary.scene().includes('Level') && !__wikary.level().dead && !__wikary.level().retryPrompt", 6)
    time.sleep(0.5)
    s = game.evaluate("""(()=>{const l=__wikary.level(),G=__wikary.GS; return {id:l.L.id, score:G.score, lives:G.lives, used:G.retryUsed,
        n:G.retries, d:Math.round(l.heroD())}})()""")
    # wynik zostaje (po starcie poziomu Kamil może zdążyć zebrać diament: +50)
    assert s["id"] == 1 and 1234 <= s["score"] <= 1234 + 200 and s["lives"] == game.evaluate("__wikary.CFG.hero.lives"), s
    assert s["used"] is True and s["n"] == 1 and s["d"] < 400, s                  # od początku poziomu
    # druga przegrana: bez pytania, prosto do nicku
    die(game)
    seen = False
    for _ in range(30):
        if game.evaluate("__wikary.scene().includes('Nick')"):
            break
        seen = seen or game.evaluate(PROMPT)
        time.sleep(0.2)
    assert not seen, "pytanie pojawiło się drugi raz"
    assert wait_scene(game, "Nick", 5)


def test_no_goes_to_nick(game):
    start(game, 0)
    die(game)
    wait_js(game, PROMPT, 6)
    game.keyboard.press("ArrowRight")
    assert game.evaluate("__wikary.level().retryPrompt.sel") == 1
    game.keyboard.press("Space")
    assert wait_scene(game, "Nick", 5)
    assert game.evaluate("__wikary.GS.retries") == 0


def test_powers_as_at_level_start_and_touch_yes(new_page, base_url):
    pg = new_page(viewport={"width": 667, "height": 375}, has_touch=True, is_mobile=True)
    open_game(pg, base_url)
    start(pg, 1)                                                                  # Level 2: krzyż tak, ogień jeszcze nie
    pg.evaluate("(()=>{const G=__wikary.GS; G.hasFire = true; G.meter = 0.9; G.score = 777;})()")   # znicz zdobyty w trakcie
    die(pg)
    wait_js(pg, PROMPT, 6)
    xy = pg.evaluate("""(()=>{const b=__wikary.game.canvas.getBoundingClientRect(), r=__wikary.level().retryPrompt.buttons[0].r;
        return [b.x + r.x / __wikary.CFG.W * b.width, b.y + r.y / __wikary.CFG.H * b.height]})()""")
    pg.touchscreen.tap(*xy)
    wait_js(pg, "__wikary.scene().includes('Level') && !__wikary.level().dead && !__wikary.level().retryPrompt", 6)
    s = pg.evaluate("(()=>{const G=__wikary.GS; return {id:__wikary.level().L.id, cross:G.hasCross, fire:G.hasFire, meter:G.meter, score:G.score}})()")
    assert s == {"id": 2, "cross": True, "fire": False, "meter": 0, "score": 777}, s


def test_new_game_from_title_resets_retry(game):
    start(game, 0)
    die(game)
    wait_js(game, PROMPT, 6)
    game.keyboard.press("Enter")
    wait_js(game, "__wikary.GS.retryUsed === true && !__wikary.level().dead", 6)
    game.evaluate("__wikary.startScene('Title')")
    assert wait_scene(game, "Title", 5)
    time.sleep(0.5)
    start_level(game)
    assert game.evaluate("__wikary.GS.retries === 0 && __wikary.GS.retryUsed === false")
    die(game)
    wait_js(game, PROMPT, 6)                                                      # w nowej grze znowu można
