"""Poziom 1: ruch, kamera, rzeka (utonięcie, skok, salto), krzyż, wrogowie, koniec."""
import time

from wikary import fmt, hold, make_invulnerable, on_screen, start_level, state, teleport, wait_scene


def test_fresh_state(game):
    start_level(game)
    s = state(game)
    assert s["lives"] == 3 and s["score"] == 0 and not s["cross"] and s["meter"] == 0, fmt(s)


def test_moves_right_and_jumps(game):
    start_level(game)
    game.keyboard.down("ArrowRight")
    time.sleep(0.9)
    game.keyboard.press("Space")
    time.sleep(1.2)
    game.keyboard.up("ArrowRight")
    s = state(game)
    assert s["d"] > 200, fmt(s)


def test_hero_stays_on_screen_during_autoscroll(game):
    start_level(game)
    hold(game, "ArrowRight", 1.0)
    bad = []
    for _ in range(40):
        s = state(game)
        if not on_screen(s):
            bad.append(s)
        time.sleep(0.1)
    assert not bad, fmt(bad[:3])


def test_drowning_costs_life_and_respawns_before_river(game):
    start_level(game)
    teleport(game, 900)
    lives0 = state(game)["lives"]
    hold(game, "ArrowRight", 1.3)
    time.sleep(1.5)
    s = state(game)
    assert s["lives"] == lives0 - 1 and s["d"] < 1000 and on_screen(s), fmt(s)


def test_single_jump_does_not_cross_river(game):
    start_level(game)
    teleport(game, 960)
    time.sleep(0.2)
    l0 = state(game)["lives"]
    game.keyboard.down("ArrowRight")
    time.sleep(0.2)
    game.keyboard.press("Space")
    time.sleep(1.4)
    game.keyboard.up("ArrowRight")
    time.sleep(0.8)
    s = state(game)
    assert s["lives"] == l0 - 1, fmt(s)


def test_salto_crosses_river(game):
    start_level(game)
    teleport(game, 960)
    time.sleep(0.2)
    l0 = state(game)["lives"]
    game.keyboard.down("ArrowRight")
    time.sleep(0.2)
    game.keyboard.press("Space")
    time.sleep(0.25)
    game.keyboard.press("Space")
    time.sleep(1.0)
    s = state(game)
    game.keyboard.up("ArrowRight")
    assert s["d"] > 1150 and s["lives"] == l0, fmt(s)


def test_cross_pickup(game):
    start_level(game)
    teleport(game, 1170)
    hold(game, "ArrowRight", 0.9)
    time.sleep(2.5)
    s = state(game)
    assert s["cross"], fmt(s)
    assert not game.evaluate("__wikary.level().items.some(i=>i.active&&i.itemType==='cross')")


def test_enemies_spawn_and_cross_attack(game):
    start_level(game)
    game.evaluate("__wikary.giveCross()")
    make_invulnerable(game, 8000)
    game.evaluate("(()=>{const l=__wikary.level(); ['dog','wolf','bat','spider'].forEach(t=>l.spawnEnemy(t));})()")
    time.sleep(0.5)
    assert state(game)["enemies"] >= 1
    hold(game, "ArrowRight", 2.0)
    make_invulnerable(game, 6000)
    for _ in range(10):
        game.keyboard.press("Alt")
        time.sleep(0.35)
    s = state(game)
    assert not s["dead"] and s["lives"] == 3, fmt(s)


def test_reaching_church_ends_level_and_goes_to_church_scene(game):
    start_level(game)
    teleport(game, 5250)
    hold(game, "ArrowRight", 1.6)
    time.sleep(3.2)
    s = state(game)
    assert s["ended"], fmt(s)
    game.keyboard.press("Enter")
    assert wait_scene(game, "Church", 4)
