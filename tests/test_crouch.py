"""Kucanie (strzałka w dół): niższy hitbox, brak biegu, skok z kucnięcia, nietoperze nad głową."""
import time

from wikary import fmt, start_level, state

BODY = "(()=>{const l=__wikary.level(),b=l.hero.body;return {crouching:l.crouching,h:b.height,bottom:b.bottom,top:b.top,tex:l.kamil.texture.key,anim:l.kamil.anims.currentAnim&&l.kamil.anims.currentAnim.key}})()"


def body(page):
    return page.evaluate(BODY)


def test_down_crouches_and_shrinks_hitbox(game):
    start_level(game)
    stand = body(game)
    hc = game.evaluate("__wikary.CFG.hero")
    assert not stand["crouching"] and stand["h"] == hc["bodyH"]
    game.keyboard.down("ArrowDown")
    time.sleep(0.5)
    c = body(game)
    assert c["crouching"] and c["h"] == hc["crouchH"], c
    assert abs(c["bottom"] - stand["bottom"]) <= 1, (stand, c)
    assert c["tex"].startswith("wikary_kamil_crouch_"), c
    game.keyboard.up("ArrowDown")
    time.sleep(0.2)
    s = body(game)
    assert not s["crouching"] and s["h"] == hc["bodyH"], s


def test_no_running_while_crouched(game):
    start_level(game)
    speed = game.evaluate("__wikary.CFG.hero.crouchSpeed")
    d0 = state(game)["d"]
    game.keyboard.down("ArrowDown")
    game.keyboard.down("ArrowRight")
    time.sleep(0.8)
    d1 = state(game)["d"]
    game.keyboard.up("ArrowRight")
    game.keyboard.up("ArrowDown")
    assert d1 - d0 <= speed * 0.8 + 3, (d0, d1)


def test_jump_from_crouch(game):
    start_level(game)
    game.keyboard.down("ArrowDown")
    time.sleep(0.4)
    y0 = state(game)["hy"]
    game.keyboard.press("Space")
    time.sleep(0.25)
    s = state(game)
    b = body(game)
    game.keyboard.up("ArrowDown")
    assert s["hy"] < y0 - 20 and not b["crouching"], (y0, fmt(s), b)


def _bat_at_lowest_reach(page):
    """Wypuszcza nietoperze lecące płasko na najniższej wysokości, jaką pozwala CFG (yMax + amp)."""
    return page.evaluate("""(()=>{const l=__wikary.level(),C=__wikary.CFG.enemies.bat;const low=C.yMax+C.amp;
        C.amp=0; l.spawnEnemy('bat');
        const bats=l.enemies.getChildren().filter(e=>e.type==='bat');
        bats.forEach(e=>{e.baseY=low;e.y=low;e.body.updateFromGameObject&&e.body.updateFromGameObject();});
        return bats.length;})()""")


def test_lowest_bat_passes_over_crouched_hero(game):
    start_level(game)
    game.keyboard.down("ArrowDown")
    time.sleep(0.4)
    lives0 = state(game)["lives"]
    n = _bat_at_lowest_reach(game)
    assert n >= 1
    bb = game.evaluate("Math.max(...__wikary.level().enemies.getChildren().filter(e=>e.type==='bat').map(e=>e.body.bottom))")
    assert bb < body(game)["top"], (bb, body(game))
    # czekamy aż stado przeleci nad Kamilem
    game.wait_for_function("__wikary.level().enemies.getChildren().filter(e=>e.type==='bat'&&e.active).every(e=>e.x < __wikary.level().hero.x - 60)", timeout=12000)
    game.keyboard.up("ArrowDown")
    s = state(game)
    assert s["lives"] == lives0, fmt(s)


def test_lowest_bat_hits_standing_hero(game):
    start_level(game)
    lives0 = state(game)["lives"]
    _bat_at_lowest_reach(game)
    game.wait_for_function(f"__wikary.GS.lives < {lives0}", timeout=12000)
