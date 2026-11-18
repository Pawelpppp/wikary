"""Kościół po Level 1 i Level 2: kierunek w lewo, kładka, znicz -> ogień, nowi wrogowie, Hans,
przenoszenie stanu między poziomami, game over w Level 2."""
import time

from wikary import (beat_hans, finish_level1, fmt, hold, reach_arena, skip_church, start_level, state,
                    teleport, wait_js, wait_scene)


def start_l2(page, at=None):
    page.evaluate(f"__wikary.start(1{', ' + str(at) if at else ''})")
    wait_js(page, "__wikary.scene().includes('Level') && __wikary.level().L.id === 2", 8)
    time.sleep(0.6)


# ---------- kościół ----------

def test_church_cutscene_dialog_and_exit_to_level2(game):
    game.keyboard.press("2")                                   # debug: kościół
    assert wait_scene(game, "Church", 5)
    wait_js(game, "!!__wikary.church().talk.dialog", 10)       # Kamil doszedł, proboszcz mówi
    assert game.evaluate("__wikary.church().pro.anims.currentAnim.key") == "proboszcz_talk"
    s0 = game.evaluate("__wikary.church().step")
    for _ in range(4):
        game.keyboard.press("Enter")
        time.sleep(0.35)
    assert game.evaluate("__wikary.church().step") > s0        # Enter przewija dymki
    game.keyboard.press("Space")                               # Spacja pomija resztę
    wait_js(game, "__wikary.scene().includes('Level') && __wikary.level().L.id === 2", 6)


def test_church_plays_to_the_end_by_itself(game):
    game.keyboard.press("2")
    assert wait_scene(game, "Church", 5)
    for _ in range(80):                                        # same Entery: wszystkie dymki do końca
        if "Level" in game.evaluate("__wikary.scene()"):
            break
        if game.evaluate("!!(__wikary.church() && __wikary.church().talk.dialog)"):
            game.keyboard.press("Enter")
        time.sleep(0.25)
    wait_js(game, "__wikary.scene().includes('Level') && __wikary.level().L.id === 2", 10)


def test_level1_end_goes_through_church_and_carries_state(game):
    start_level(game)
    game.evaluate("__wikary.giveCross(); __wikary.setMeter(40); __wikary.GS.lives = 2; __wikary.GS.score = 1234")
    finish_level1(game)
    before = game.evaluate("({score: __wikary.GS.score, time: __wikary.GS.timeMs})")
    skip_church(game)
    s = state(game)
    assert s["lives"] == 2 and s["cross"] and s["meter"] == 40 and s["score"] == before["score"], fmt(s)
    assert s["time"] >= before["time"]
    assert game.evaluate("__wikary.level().lifeIcons.filter(i=>i.alpha===1).length") == 2


# ---------- Level 2 ----------

def test_level2_scrolls_left_and_kamil_faces_left(game):
    start_l2(game)
    lv = game.evaluate("(()=>{const l=__wikary.level();return {dir:l.L.dir, flip:l.kamil.flipX, cam:l.cameras.main.scrollX}})()")
    assert lv["dir"] == -1 and lv["flip"], lv
    time.sleep(1.0)
    assert game.evaluate("__wikary.level().cameras.main.scrollX") < lv["cam"] - 20   # auto-scroll w lewo
    x0, d0 = game.evaluate("[__wikary.level().hero.x, __wikary.level().heroD()]")
    hold(game, "ArrowLeft", 0.8)
    x1, d1 = game.evaluate("[__wikary.level().hero.x, __wikary.level().heroD()]")
    assert x1 < x0 - 60 and d1 > d0 + 60, (x0, x1, d0, d1)


def test_lightning_flash_in_background(game):
    start_l2(game)
    game.evaluate("__wikary.level().nextFlash = 0")
    time.sleep(0.3)
    assert game.evaluate("__wikary.level().flashes") >= 1


def test_plank_moves_and_carries_kamil(game):
    start_l2(game)
    teleport(game, 3260)
    game.evaluate("__wikary.level().invulnUntil = __wikary.level().time.now + 20000")
    p0 = game.evaluate("__wikary.level().planks[0].x")
    time.sleep(0.6)
    assert game.evaluate("__wikary.level().planks[0].x") != p0
    # postaw Kamila na kładce
    game.evaluate("""(()=>{const l=__wikary.level(),p=l.planks[0];
        l.hero.body.reset(p.x, p.body.top - __wikary.CFG.hero.bodyH/2 - 1);})()""")
    time.sleep(0.4)
    a = game.evaluate("(()=>{const l=__wikary.level();return [l.hero.x, l.planks[0].x, l.GSl]})()")
    time.sleep(0.8)
    b = game.evaluate("(()=>{const l=__wikary.level();return [l.hero.x, l.planks[0].x]})()")
    moved_plank, moved_hero = b[1] - a[1], b[0] - a[0]
    assert abs(moved_plank) > 20 and abs(moved_hero - moved_plank) < 8, (a, b)
    assert state(game)["lives"] == 3 and not game.evaluate("__wikary.level().respawning")


def test_screen_waits_at_plank_river(game):
    start_l2(game)
    game.evaluate("(()=>{const l=__wikary.level(); l.nextSpawn=1e12; l.enemies.getChildren().slice().forEach(e=>e.destroy());})()")   # bez wrogów: liczy się tylko rzeka
    teleport(game, 3230)
    time.sleep(4.0)
    lv = game.evaluate("(()=>{const l=__wikary.level();return {front:l.frontD(), lives:__wikary.GS.lives}})()")
    limit = game.evaluate("__wikary.LEVELS[1].rivers[1].at + __wikary.LEVELS[1].rivers[1].w + __wikary.CFG.plank.holdView")
    assert lv["front"] <= limit + 1 and lv["lives"] == 3, (lv, limit)


def test_znicz_gives_fire_that_pierces(game):
    start_l2(game)
    assert not game.evaluate("__wikary.GS.hasFire")
    teleport(game, 2450)
    hold(game, "ArrowLeft", 1.2)
    wait_js(game, "__wikary.GS.hasFire && !__wikary.level().cutscene", 6)
    time.sleep(0.4)
    assert game.evaluate("__wikary.level().dim.alpha") == 0
    # trzy psy w rzędzie przed Kamilem, jedna kula ognia
    game.evaluate("""(()=>{const l=__wikary.level(); l.invulnUntil=l.time.now+8000; l.facing=-1;
        for(let i=0;i<3;i++){ l.spawnEnemy('dog'); }
        l.enemies.getChildren().filter(e=>e.type==='dog').forEach((e,i)=>{ e.body.reset(l.hero.x-90-i*45, e.y); e.setVelocityX(0); });})()""")
    k0 = game.evaluate("__wikary.GS.kills")
    game.keyboard.down("ArrowDown")                           # psy są nisko: kula w kucnięciu (jak krzyż)
    time.sleep(0.15)
    game.keyboard.press("z")
    time.sleep(0.1)
    assert game.evaluate("__wikary.level().shots.getChildren().some(s=>s.kind==='fire')")
    time.sleep(1.0)
    game.keyboard.up("ArrowDown")
    assert game.evaluate("__wikary.GS.kills") - k0 >= 3


def test_new_enemies_behave(game):
    start_l2(game)
    game.evaluate("""(()=>{const l=__wikary.level(); l.invulnUntil=l.time.now+20000;
        ['crow','boar','wisp'].forEach(t=>l.spawnEnemy(t));})()""")
    types = game.evaluate("__wikary.level().enemies.getChildren().map(e=>e.type)")
    assert {"crow", "boar", "wisp"} <= set(types), types
    wait_js(game, "__wikary.level().enemies.getChildren().some(e=>e.type==='crow'&&e.state!=='fly')", 8)   # wrona pikuje
    wait_js(game, "__wikary.level().enemies.getChildren().some(e=>e.type==='boar'&&e.state==='charge') || !__wikary.level().enemies.getChildren().some(e=>e.type==='boar')", 8)
    # boar ma 2 HP
    hp = game.evaluate("(()=>{const l=__wikary.level();l.spawnEnemy('boar');const b=l.enemies.getChildren().filter(e=>e.type==='boar').pop(); l.damageEnemy(b,1); return [b.active, b.hp]})()")
    assert hp == [True, 1], hp


def test_game_over_in_level2_goes_to_nick(game):
    start_l2(game)
    game.evaluate("__wikary.GS.lives = 1")
    teleport(game, 1100)
    hold(game, "ArrowLeft", 1.4)
    assert wait_scene(game, "Nick", 8)


# ---------- Hans ----------

def test_hans_arena_intro_and_hp_bar(game):
    start_l2(game, game.evaluate("__wikary.LEVELS[1].arenaAt") - 140)
    reach_arena(game)
    b = game.evaluate("(()=>{const l=__wikary.level(),b=__wikary.boss();return {hp:b.hp,max:b.maxHp,bar:l.bossBar.fill.visible,w:l.bossBar.fill.width,cam:l.cameras.main.scrollX}})()")
    assert b["hp"] == b["max"] and b["bar"] and b["w"] > 190, b


def test_hans_bark_wave_hits_grounded_kamil_and_stuns(game):
    start_l2(game)
    reach_arena(game)
    game.evaluate("""(()=>{const l=__wikary.level(),b=__wikary.boss(); l.invulnUntil=0;
        b.state='walk'; b.attackN=1; b.until=0;})()""")       # następny atak = szczekanie (fala)
    lives = game.evaluate("__wikary.GS.lives")
    wait_js(game, f"__wikary.GS.lives < {lives}", 6)
    assert game.evaluate("__wikary.level().stunUntil > __wikary.level().time.now - 1000")
    assert game.evaluate("__wikary.CFG.boss.waveH") <= 16                                  # da się przeskoczyć


def test_hans_phases_and_grom_cap(game):
    start_l2(game)
    reach_arena(game)
    hp = game.evaluate("""(()=>{const l=__wikary.level(),b=__wikary.boss(); l.damageEnemy(b, 999, true); return b.hp})()""")
    assert hp == game.evaluate("__wikary.CFG.boss.hp - __wikary.CFG.boss.gromDamage")
    game.evaluate("__wikary.boss().hp = 4")
    time.sleep(0.2)
    assert game.evaluate("__wikary.boss().enraged")


def test_hans_win_ending_goes_to_level3(game):
    start_l2(game)
    reach_arena(game)
    s0 = game.evaluate("__wikary.GS.score")
    beat_hans(game)
    gain = game.evaluate("__wikary.GS.score") - s0
    assert gain >= game.evaluate("__wikary.CFG.score.hans + __wikary.CFG.score.tenZloty"), gain
    game.keyboard.press("Enter")                               # dalej: Level 3 – Noc duchów
    wait_js(game, "__wikary.scene().includes('Level') && __wikary.level().L.id === 3", 8)
