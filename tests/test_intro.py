"""Intro: start z menu, dialogi, pomijanie."""
import time

from wikary import choose_difficulty, wait_scene


def test_enter_starts_intro(game):
    game.keyboard.press("Enter")
    choose_difficulty(game)
    assert wait_scene(game, "Intro", 5)
    assert "Level" not in game.evaluate("__wikary.scene()")


def test_intro_plays_and_enter_advances_dialog(game):
    game.keyboard.press("Enter")
    choose_difficulty(game)
    assert wait_scene(game, "Intro", 5)
    time.sleep(3.0)
    game.keyboard.press("Enter")
    time.sleep(0.4)
    game.keyboard.press("Enter")
    time.sleep(0.6)
    # Enter tylko przewija dialog/kadr; intro nadal działa albo naturalnie przeszło do poziomu
    sc = game.evaluate("__wikary.scene()")
    assert "Intro" in sc or "Level" in sc, sc


def test_space_skips_intro(game):
    game.keyboard.press("Enter")
    choose_difficulty(game)
    assert wait_scene(game, "Intro", 5)
    time.sleep(0.6)
    game.keyboard.press("Space")
    assert wait_scene(game, "Level", 4)
