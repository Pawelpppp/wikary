"""Naskok (stomp): Kamil spada stopami na wierzch wroga -> wróg z 1 HP ginie (lekkie odbicie),
wróg z większą liczbą HP traci 1 HP (wyższe odbicie); Kamil nie traci życia. Bossy są wyłączone."""
import time

from wikary import no_life_pickups, reach_arena, wait_js

DROP = """(([type, h]) => {
    const l = __wikary.level();
    l.nextSpawn = 1e12; l.spawnAcc = 0; l.invulnUntil = 0;
    l.enemies.getChildren().slice().forEach(e => e.destroy());
    l.spawnEnemy(type);
    const e = l.enemies.getChildren()[l.enemies.getLength() - 1];
    const x = l.hero.x;
    e.body.reset(x, e.y); e.body.moves = false; e.harmless = false;
    if (e.state === 'warn' || e.state === 'rise' || e.state === 'appear' || e.state === 'flicker') { e.state = 'test'; e.setVisible(true); e.body.enable = true; }
    l.hero.body.reset(x, e.body.top - h - __wikary.CFG.hero.bodyH / 2);
    l.hero.body.setVelocity(0, 0);
    window.__e = e; window.__lives = __wikary.GS.lives; window.__score = __wikary.GS.score;
})"""


def start(page, idx):
    no_life_pickups(page)                                                    # dropy serduszek nie mieszają w liczeniu żyć
    page.evaluate(f"__wikary.start({idx})")
    wait_js(page, f"__wikary.scene().includes('Level') && __wikary.level().L.id === {idx + 1}", 8)
    time.sleep(0.6)


def drop(page, type_, h=50):
    page.evaluate(f"{DROP}(['{type_}', {h}])")


def test_stomp_kills_one_hp_enemy_and_bounces_lightly(game):
    start(game, 0)
    drop(game, "dog")
    assert game.evaluate("__e.hp") == 1
    wait_js(game, "__wikary.level().stomps >= 1", 3)
    r = game.evaluate("""({dead: __e.dead || !__e.active, vy: __wikary.level().hero.body.velocity.y, log: __wikary.level().stompLog[0],
        score: __wikary.GS.score - __score})""")
    assert r["dead"] and r["log"] == {"type": "dog", "kill": True, "hpLeft": 0}, r
    assert r["vy"] < 0 and r["score"] >= game.evaluate("__wikary.CFG.score.dog"), r
    time.sleep(0.8)
    assert game.evaluate("__wikary.GS.lives === __lives")


def test_stomp_bounces_off_tougher_enemy_without_damage(game):
    start(game, 0)
    drop(game, "wolf")
    assert game.evaluate("__e.hp") == 2
    wait_js(game, "__wikary.level().stomps >= 1", 3)
    first = game.evaluate("__wikary.level().stompLog[0]")
    assert first == {"type": "wolf", "kill": False, "hpLeft": 1}, first
    vy = game.evaluate("__wikary.level().hero.body.velocity.y")
    assert vy < -game.evaluate("__wikary.CFG.stomp.bounceKill"), vy        # wyżej niż po zabiciu
    time.sleep(1.5)                                                          # spada znowu na wilka: drugi naskok go zabija
    assert game.evaluate("__wikary.GS.lives === __lives"), "Kamil stracił życie przy odbiciu"
    log = game.evaluate("__wikary.level().stompLog")
    assert log[1:2] == [] or log[1] == {"type": "wolf", "kill": True, "hpLeft": 0}, log


def test_stomp_kill_can_drop_a_life(game):
    start(game, 0)
    game.evaluate("__wikary.CFG.lifePickup.dropChanceByLevel[0] = 1")      # zwykła ścieżka zabicia: drop serduszka
    drop(game, "dog")
    wait_js(game, "__wikary.level().stomps >= 1", 3)
    assert game.evaluate("__wikary.level().items.some(i => i.itemType === 'life' && (i.active || i.taken))") \
        or game.evaluate("__wikary.GS.lives > __lives")                        # serduszko leży albo Kamil już je złapał


def test_walking_into_enemy_still_hurts(game):
    start(game, 0)
    drop(game, "dog", 0)
    game.evaluate("__wikary.level().hero.body.reset(__e.x - 6, __wikary.CFG.GROUND_Y - __wikary.CFG.hero.bodyH / 2 - 1)")
    wait_js(game, "__wikary.GS.lives === __lives - 1", 3)
    assert game.evaluate("__wikary.level().stomps") == 0


def test_stomp_works_on_flying_enemies(game):
    start(game, 1)                                                           # Level 2: wrona
    drop(game, "crow", 40)
    wait_js(game, "__wikary.level().stomps >= 1", 3)
    assert game.evaluate("__wikary.level().stompLog[0].kill") is True
    start(game, 3)                                                           # Level 4: duży komar (2 HP)
    drop(game, "mosquito_big", 40)
    wait_js(game, "__wikary.level().stomps >= 1", 3)
    assert game.evaluate("__wikary.level().stompLog[0]") == {"type": "mosquito_big", "kill": False, "hpLeft": 1}
    time.sleep(0.6)
    assert game.evaluate("__wikary.GS.lives === __lives")


def test_stomp_works_on_ghosts(game):
    start(game, 2)                                                           # Level 3: duszek (1 HP), upiór (3 HP)
    drop(game, "duszek", 40)
    wait_js(game, "__wikary.level().stomps >= 1", 3)
    assert game.evaluate("__wikary.level().stompLog[0]") == {"type": "duszek", "kill": True, "hpLeft": 0}
    time.sleep(0.8)
    drop(game, "upior", 40)
    wait_js(game, "__wikary.level().stomps >= 2", 4)
    assert game.evaluate("__wikary.level().stompLog[1]") == {"type": "upior", "kill": False, "hpLeft": 2}


def test_bosses_are_not_stompable(game):
    start(game, 1)
    reach_arena(game)
    wait_js(game, "!!__wikary.boss() && !__wikary.level().cutscene && !__wikary.boss().harmless", 20)
    hp = game.evaluate("""(()=>{const l=__wikary.level(), b=__wikary.boss(); l.invulnUntil=1e12; b.body.moves=false;
        l.hero.body.reset(b.x, b.body.top - 50 - __wikary.CFG.hero.bodyH/2); l.hero.body.setVelocity(0,0); return b.hp})()""")
    time.sleep(1.0)
    assert game.evaluate("__wikary.level().stomps") == 0
    assert game.evaluate("__wikary.boss().hp") == hp
    assert "hans" in game.evaluate("__wikary.CFG.stomp.exclude") and "rafal" in game.evaluate("__wikary.CFG.stomp.exclude") \
        and "adrian" in game.evaluate("__wikary.CFG.stomp.exclude")
