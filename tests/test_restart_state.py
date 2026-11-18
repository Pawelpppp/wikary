"""Kolejne podejścia: stan gry resetuje się w create(), bez pozostałości po poprzedniej grze."""
import time

from wikary import finish_game, drown_once, fmt, hold, leaderboard, state, start_level, teleport, type_nick, wait_scene

CLEAN = "(()=>{const l=__wikary.level();return !l.ended&&!l.dead&&!l.cutscene&&!l.praying&&l.dim.alpha===0&&l.items.some(i=>i.itemType==='cross')})()"


def _assert_fresh(game):
    s = state(game)
    assert s["lives"] == 3 and s["score"] == 0 and not s["cross"] and s["time"] < 2500 and s["meter"] == 0, fmt(s)
    assert game.evaluate(CLEAN)
    assert game.evaluate("__wikary.level().lifeIcons.length") == game.evaluate("__wikary.CFG.hero.maxLives")
    assert game.evaluate("__wikary.level().lifeIcons.filter(i=>i.alpha===1).length") == 3
    assert game.evaluate("__wikary.game.scene.getScenes(false).filter(s=>s.scene.key==='Level').length") == 1


def _win(game, nick):
    start_level(game)
    game.evaluate("__wikary.giveCross(); __wikary.setMeter(50)")
    finish_game(game)
    type_nick(game, nick)
    game.keyboard.press("Enter")
    assert wait_scene(game, "Scores", 3)
    time.sleep(0.5)


def test_second_run_after_win_is_clean(game):
    _win(game, "PIERWSZY")
    game.keyboard.press("Enter")
    assert wait_scene(game, "Title")
    time.sleep(0.5)
    start_level(game)
    _assert_fresh(game)


def test_game_over_then_third_run_is_clean(game):
    _win(game, "PIERWSZY")
    game.keyboard.press("Escape")
    assert wait_scene(game, "Title")
    time.sleep(0.5)
    start_level(game)
    _assert_fresh(game)
    for _ in range(3):
        drown_once(game)
        time.sleep(2.0)
    assert wait_scene(game, "Nick", 6), "game over nie przeszedł do nicku"
    time.sleep(0.5)
    type_nick(game, "DRUGI")
    game.keyboard.press("Enter")
    assert wait_scene(game, "Scores", 3)
    lb = leaderboard(game)
    assert len(lb) == 2 and lb[0]["score"] >= lb[1]["score"], lb
    game.keyboard.press("Escape")
    assert wait_scene(game, "Title")
    time.sleep(0.5)
    start_level(game)
    _assert_fresh(game)
