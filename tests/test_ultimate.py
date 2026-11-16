"""Grom z Nieba: modlitwa (Shift), ładowanie, wyzwolenie, anulowanie."""
import time

from wikary import fmt, make_invulnerable, start_level, state


def _prep(game):
    start_level(game)
    make_invulnerable(game, 10000)
    time.sleep(0.5)


def test_praying_with_full_meter_charges_and_dims(game):
    _prep(game)
    game.evaluate("__wikary.setMeter(100)")
    game.keyboard.down("Shift")
    try:
        game.wait_for_function("__wikary.level().charged && __wikary.level().dim.alpha >= __wikary.CFG.ult.dim - 0.01", timeout=4000)
    finally:
        game.keyboard.up("Shift")


def test_grom_spends_meter_kills_enemies_and_clears_dim(game):
    _prep(game)
    game.evaluate("(()=>{const l=__wikary.level(); ['dog','bat'].forEach(t=>l.spawnEnemy(t));})()")
    game.evaluate("__wikary.setMeter(100)")
    time.sleep(0.6)
    e0 = state(game)["enemies"]
    game.keyboard.down("Shift")
    time.sleep(1.4)
    game.keyboard.up("Shift")
    time.sleep(1.5)
    s = state(game)
    assert s["meter"] < 30, fmt(s)
    assert game.evaluate("__wikary.level().dim.alpha") == 0
    assert not game.evaluate("__wikary.level().praying")
    assert s["enemies"] < e0 or e0 == 0, (e0, fmt(s))


def test_early_release_cancels_without_cost(game):
    _prep(game)
    game.evaluate("__wikary.setMeter(100)")
    game.keyboard.down("Shift")
    time.sleep(0.3)
    game.keyboard.up("Shift")
    time.sleep(0.5)
    s = state(game)
    assert s["meter"] >= 100 and not game.evaluate("__wikary.level().charged"), fmt(s)
    assert game.evaluate("__wikary.level().dim.alpha") == 0


def test_no_prayer_without_full_meter(game):
    _prep(game)
    game.evaluate("__wikary.setMeter(10)")
    game.keyboard.down("Shift")
    time.sleep(1.4)
    praying = game.evaluate("__wikary.level().praying")
    game.keyboard.up("Shift")
    assert not praying
