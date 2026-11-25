"""Czary Kamila: grafiki i rozmiar na ekranie bez zmian, większe oddziaływanie (CFG.spells).
Hitbox krzyża i ognia ×1.5 + zasięg w dół/górę: stojący Kamil trafia psa przy ziemi i nietoperza tuż nad pociskiem.
Krzyż ma krótszy zasięg (crossRange), ogień leci do krawędzi ekranu. Błogosławieństwo: promień ×1.5."""
import time

import pytest

from wikary import start_l3, wait_js


def setup_l1(page, fire=False):
    page.evaluate("__wikary.start(0)")
    wait_js(page, "__wikary.scene().includes('Level') && !__wikary.level().dead", 8)
    time.sleep(0.6)
    page.evaluate(f"""(()=>{{const l=__wikary.level(), G=__wikary.GS; G.hasCross=true; G.hasFire={str(fire).lower()};
        l.nextSpawn=1e12; l.invulnUntil=1e12; l.enemies.getChildren().slice().forEach(e=>e.destroy()); l.shots.clear(true,true);}})()""")


def place(page, type_, dx, y_expr):
    """Wróg nieruchomo (body.moves=false) dx px przed Kamilem; y_expr = JS: pozycja y sprite'a."""
    page.evaluate(f"""(()=>{{const l=__wikary.level(); l.spawnEnemy('{type_}');
        const all=l.enemies.getChildren().filter(e=>e.type==='{type_}'), e=all.pop(); all.forEach(o=>o.destroy());
        const x=l.hero.x+{dx}, y=(({y_expr}))(l, e); e.body.moves=false; e.setVelocity(0,0); e.setPosition(x,y);
        window.__e=e;}})()""")
    time.sleep(0.15)                                                  # body dogania pozycję w następnym kroku fizyki


SHOT = "(()=>{const s=__wikary.level().shots.getChildren().slice(-1)[0], S=__wikary.CFG.spells; return {top:s.y-s.displayHeight/2, bottom:s.y+s.displayHeight/2, dh:s.displayHeight, dw:s.displayWidth, hitTop:s.y-s.hitH/2+(S.reachDown-S.reachUp)/2, hitBottom:s.y+s.hitH/2+(S.reachDown-S.reachUp)/2, bw:s.hitW, bh:s.hitH, srcW:s.body.sourceWidth*Math.abs(s.scaleX), srcH:s.body.sourceHeight*Math.abs(s.scaleY)}})()"


@pytest.mark.parametrize("kind", ["cross", "fire"])
def test_standing_kamil_hits_low_dog(game, kind):
    setup_l1(game, fire=kind == "fire")
    place(game, "dog", 110, "(l)=>__wikary.CFG.GROUND_Y")
    dog = game.evaluate("({top: __e.body.top, bottom: __e.body.bottom})")
    game.evaluate(f"(()=>{{const l=__wikary.level(); l.setCrouch(false, 0); __e.x = l.hero.x + 110; l.{'throwCross' if kind == 'cross' else 'throwFire'}(l.time.now);}})()")
    s = game.evaluate(SHOT)
    # grafika bez zmian: krzyż 24x32 × 0.8, ogień 32x24 × 1
    assert (round(s["dw"], 1), round(s["dh"], 1)) == ((19.2, 25.6) if kind == "cross" else (32, 24)), s
    assert dog["top"] > s["bottom"], (dog, s)                  # pies przebiegłby pod grafiką...
    assert s["hitBottom"] > dog["top"] + 4, (dog, s)                  # ...ale hitbox sięga niżej
    wait_js(game, "__e.dead || !__e.active", 2)


@pytest.mark.parametrize("kind", ["cross", "fire"])
def test_bat_just_above_projectile_is_hit(game, kind):
    setup_l1(game, fire=kind == "fire")
    sy = game.evaluate(f"(()=>{{const l=__wikary.level(), C=__wikary.CFG; return l.hero.y + C.{kind}.standDy}})()")
    half = 12.8 if kind == "cross" else 12
    target_bottom = sy - half - 2                                   # 2 px nad górną krawędzią grafiki pocisku
    place(game, "bat", 120, f"(l,e)=>{target_bottom} - e.body.height/2")
    game.evaluate(f"__e.setPosition(__e.x, __e.y + ({target_bottom} - __e.body.bottom))")   # body bat-a nie jest w środku klatki
    time.sleep(0.15)
    assert abs(game.evaluate("__e.body.bottom") - target_bottom) < 0.5
    b = game.evaluate("__e.body.bottom")
    assert b < sy - half, b
    game.evaluate(f"(()=>{{const l=__wikary.level(); __e.x = l.hero.x + 110; l.{'throwCross' if kind == 'cross' else 'throwFire'}(l.time.now);}})()")
    wait_js(game, "__e.dead || !__e.active", 2)


def test_hitbox_scale_and_config(game):
    c = game.evaluate("__wikary.CFG.spells")
    assert c == {"hitScale": 1.5, "reachDown": 10, "reachUp": 6, "crossRange": 205, "fireRange": "screen"}, c
    setup_l1(game, fire=True)
    game.evaluate("(()=>{const l=__wikary.level(); l.throwCross(l.time.now);})()")
    s = game.evaluate(SHOT)
    assert abs(s["bw"] - 16 * 1.5) < 0.01 and abs(s["bh"] - (19.2 * 1.5 + 16)) < 0.01 and abs(s["srcW"] - s["bw"]) < 0.01 and abs(s["srcH"] - s["bh"]) < 0.01, s
    game.evaluate("(()=>{const l=__wikary.level(); l.throwFire(l.time.now);})()")
    s = game.evaluate(SHOT)
    assert abs(s["bw"] - 26 * 1.5) < 0.01 and abs(s["bh"] - (18 * 1.5 + 16)) < 0.01 and abs(s["srcW"] - s["bw"]) < 0.01 and abs(s["srcH"] - s["bh"]) < 0.01, s


def test_cross_shorter_range(game):
    setup_l1(game)
    game.evaluate("(()=>{const l=__wikary.level(); l.throwCross(l.time.now); window.__s=l.shots.getChildren().slice(-1)[0]; window.__t0=performance.now();})()")
    wait_js(game, "!__s.active", 2)
    r = game.evaluate("({d: __s.travelled, ms: performance.now() - __t0})")
    assert 205 <= r["d"] <= 205 + 20, r                             # wcześniej ok. 342 px
    assert r["ms"] < 900, r                                          # wcześniej 900 ms


def test_fire_flies_to_screen_edge(game):
    setup_l1(game, fire=True)
    game.evaluate("(()=>{const l=__wikary.level(); l.throwFire(l.time.now); window.__s=l.shots.getChildren().slice(-1)[0];})()")
    wait_js(game, "!__s.active", 4)
    r = game.evaluate("({edge: !!__s.reachedEdge, x: __s.x, startX: __s.startX, camRight: __wikary.level().cameras.main.scrollX + __wikary.CFG.W})")
    assert r["edge"] and r["x"] >= r["camRight"], r
    assert r["x"] - r["startX"] > 330, r                            # dalej niż dawne 330 px


def test_blessing_radius_scaled(game):
    start_l3(game)
    game.evaluate("(()=>{const l=__wikary.level(); __wikary.GS.hasBless=true; l.nextSpawn=1e12; l.invulnUntil=1e12; l.enemies.getChildren().slice().forEach(e=>e.destroy());})()")
    r = game.evaluate("__wikary.CFG.bless.radius * __wikary.CFG.spells.hitScale")
    assert r == 180
    game.evaluate("""(()=>{const l=__wikary.level();
        window.__n=l.spawnGhost('duszek', l.hero.x+150, -1, l.hero.y); __n.state='test'; __n.body.setVelocity(0,0);
        window.__f=l.spawnGhost('duszek', l.hero.x+215, -1, l.hero.y); __f.state='test'; __f.body.setVelocity(0,0);
        l.lastBless=-99999; l.castBlessing(l.time.now);})()""")
    time.sleep(0.3)
    assert game.evaluate("({near: __n.dead || !__n.active, far: __f.active && !__f.dead})") == {"near": True, "far": True}


def _start_diff(page, diff, idx=0):
    page.evaluate(f"__wikary.start({idx}, undefined, {{difficulty: '{diff}'}})")
    wait_js(page, "__wikary.scene().includes('Level') && !__wikary.level().dead", 8)
    time.sleep(0.6)
    page.evaluate("""(()=>{const l=__wikary.level(), G=__wikary.GS; G.hasCross=true; G.hasFire=true; G.hasBless=true;
        l.nextSpawn=1e12; l.invulnUntil=1e12; l.enemies.getChildren().slice().forEach(e=>e.destroy()); l.shots.clear(true,true);})()""")


def _measure(page):
    page.evaluate("(()=>{const l=__wikary.level(); l.throwCross(l.time.now); window.__c=l.shots.getChildren().slice(-1)[0];})()")
    page.evaluate("(()=>{const l=__wikary.level(); l.throwFire(l.time.now); window.__f=l.shots.getChildren().slice(-1)[0];})()")
    wait_js(page, "!__c.active && !__f.active", 4)
    return page.evaluate("""({cw:__c.hitW, ch:__c.hitH, cd:Math.round(__c.travelled||0), fw:__f.hitW, fh:__f.hitH, fd:Math.round(__f.travelled||0),
        fedge:!!__f.reachedEdge, s:__wikary.Difficulty.spells()})""")


def test_hard_keeps_old_spell_values(game):
    """TRUDNY: czary jak przed v1.43 – stary hitbox (krzyż 16x19.2, ogień 26x18), krzyż ok. 342 px, ogień 330 px, błogosławieństwo 120 px."""
    _start_diff(game, "hard")
    r = _measure(game)
    assert (round(r["cw"], 2), round(r["ch"], 2), round(r["fw"], 2), round(r["fh"], 2)) == (16, 19.2, 26, 18), r
    assert 342 <= r["cd"] <= 342 + 20 and 330 <= r["fd"] <= 330 + 20 and not r["fedge"], r
    assert r["s"]["hitScale"] == 1 and r["s"]["reachDown"] == 0 and r["s"]["reachUp"] == 0, r
    # stary hitbox: pies przy ziemi przebiega pod krzyżem stojącego Kamila
    place(game, "dog", 110, "(l)=>__wikary.CFG.GROUND_Y")
    game.evaluate("(()=>{const l=__wikary.level(); l.throwCross(l.time.now); window.__c=l.shots.getChildren().slice(-1)[0];})()")
    wait_js(game, "!__c.active", 3)
    assert game.evaluate("__e.active && !__e.dead")
    assert game.evaluate("__wikary.CFG.bless.radius * __wikary.Difficulty.spells().hitScale") == 120


@pytest.mark.parametrize("diff", ["easy", "normal"])
def test_easy_and_normal_use_new_spell_values(game, diff):
    _start_diff(game, diff)
    r = _measure(game)
    assert (round(r["cw"], 2), round(r["ch"], 2), round(r["fw"], 2), round(r["fh"], 2)) == (24, 44.8, 39, 43), r
    assert 205 <= r["cd"] <= 225 and r["fedge"], r
