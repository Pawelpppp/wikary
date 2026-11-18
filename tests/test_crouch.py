"""Kucanie (strzałka w dół): niższy hitbox, brak biegu, skok z kucnięcia, nietoperze nad głową."""
import time

from wikary import fmt, hold, no_life_pickups, start_level, state

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
    no_life_pickups(game)
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
    no_life_pickups(game)
    start_level(game)
    lives0 = state(game)["lives"]
    _bat_at_lowest_reach(game)
    game.wait_for_function(f"__wikary.GS.lives < {lives0}", timeout=12000)


def _spider_on_hero(page):
    """Spuszcza pająka dokładnie nad Kamilem (tuż nad końcem nici, żeby Kamil nie zdążył odjechać z auto-scrollem)."""
    page.evaluate("""(()=>{const l=__wikary.level(),C=__wikary.CFG.enemies.spider; l.spawnEnemy('spider');
        const s=l.enemies.getChildren().filter(e=>e.type==='spider').pop();
        s.body.reset(l.hero.x, C.dropTo - 30); s.setVelocityY(C.dropSpeed);})()""")
    page.wait_for_function("__wikary.level().enemies.getChildren().some(e=>e.type==='spider'&&e.state==='hold')", timeout=8000)


def test_spider_misses_crouching_hero(game):
    start_level(game)
    hold(game, "ArrowRight", 1.0)   # na środek ekranu, z dala od lewej krawędzi
    game.keyboard.down("ArrowDown")
    time.sleep(0.4)
    lives0 = state(game)["lives"]
    _spider_on_hero(game)
    sb = game.evaluate("__wikary.level().enemies.getChildren().find(e=>e.type==='spider').body.bottom")
    assert sb < body(game)["top"], (sb, body(game))
    time.sleep(0.8)  # pająk wisi nad głową
    s = state(game)
    game.keyboard.up("ArrowDown")
    assert s["lives"] == lives0, fmt(s)


def test_spider_hits_standing_hero(game):
    start_level(game)
    hold(game, "ArrowRight", 1.0)
    lives0 = state(game)["lives"]
    _spider_on_hero(game)
    game.wait_for_function(f"__wikary.GS.lives < {lives0}", timeout=4000)


def _throw_y(page):
    page.evaluate("__wikary.level().lastThrow = -99999")
    page.keyboard.press("Alt")
    page.wait_for_function("__wikary.level().shots.getChildren().some(s=>s.active)", timeout=3000)
    y = page.evaluate("Math.max(...__wikary.level().shots.getChildren().filter(s=>s.active).map(s=>s.y))")
    page.wait_for_function("__wikary.level().shots.getChildren().every(s=>!s.active)", timeout=3000)
    return y


def test_crouched_cross_flies_lower_and_hero_stays_crouched(game):
    start_level(game)
    game.evaluate("__wikary.giveCross()")
    time.sleep(2.5)  # krótka cutscenka po krzyżu
    stand_y = _throw_y(game)
    game.keyboard.down("ArrowDown")
    time.sleep(0.4)
    crouch_y = _throw_y(game)
    b = body(game)
    game.keyboard.up("ArrowDown")
    ground = game.evaluate("__wikary.CFG.GROUND_Y")
    assert crouch_y > stand_y + 10, (stand_y, crouch_y)
    assert ground - crouch_y <= 30, crouch_y
    assert b["crouching"] and b["tex"].startswith("wikary_kamil_crouch_"), b
