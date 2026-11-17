"""Tablica wyników (tylko localStorage): pusta lista, zapis nicku, sortowanie, limit."""
import time

from wikary import finish_game, leaderboard, start_level, teleport, hold, type_nick, wait_scene


def test_empty_scores_screen(game):
    assert game.evaluate("localStorage.getItem('wikary_leaderboard')") is None
    game.keyboard.press("ArrowDown")
    game.keyboard.press("Enter")
    assert wait_scene(game, "Scores")


def test_sanitize_and_nick_limit(game):
    assert game.evaluate("Leaderboard.sanitize('ks. kamil-ąę!@#')") == "KS KAMIL-ĄĘ"
    assert len(game.evaluate("Leaderboard.sanitize('ABCDEFGHIJKLMNOP')")) == 12


def test_sorting_and_limit_20(game):
    game.evaluate("""(()=>{for(let i=0;i<25;i++) Leaderboard.add('P'+i, (i*37)%100, 100-i);})()""")
    lb = leaderboard(game)
    assert len(lb) == 20
    keys = [(-e["score"], e["time"]) for e in lb]
    assert keys == sorted(keys)


def test_win_nick_with_polish_letter_saved(game):
    start_level(game)
    game.evaluate("__wikary.GS.lives=3")
    finish_game(game)
    type_nick(game, "KS. TEST-1")
    game.evaluate("window.dispatchEvent(new KeyboardEvent('keydown',{key:'ą',code:'KeyA',keyCode:65}))")
    time.sleep(0.3)
    game.keyboard.press("Enter")
    assert wait_scene(game, "Scores", 3)
    lb = leaderboard(game)
    assert len(lb) == 1 and lb[0]["nick"] == "KS TEST-1Ą", lb
    assert game.evaluate("localStorage.getItem('wikary_last_nick')") == "KS TEST-1Ą"
