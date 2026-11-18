"""Level 3 „Noc duchów”: noc i mgła, duchy (duszek / fantom / upiór), ogień nie działa, krzyż działa,
błogosławieństwo (X) w promieniu, obrona drzwi kościoła z proboszczem (3 fale, drzwi = game over),
Kościelny Rafał (walka, egzorcyzm, diabeł, świt, dalej Level 4), przenoszenie stanu z Level 2."""
import time

from wikary import (beat_hans, beat_rafal, hold, reach_arena, reach_defense, skip_dialogs_until, start_l3,
                    teleport, wait_js, wait_rafal, wait_scene)

def quiet(page):
    page.evaluate("(()=>{const l=__wikary.level(); l.invulnUntil=1e12; l.nextSpawn=1e12; l.spawnAcc=0;"
                  " l.enemies.getChildren().slice().forEach(e=>e.destroy());})()")


# ---------- przejście z Level 2 i przenoszenie stanu ----------

def test_level2_win_leads_to_night_level3_with_carry_over(game):
    game.evaluate("__wikary.start(1)")
    wait_js(game, "__wikary.scene().includes('Level') && __wikary.level().L.id === 2", 8)
    reach_arena(game)
    beat_hans(game)
    before = game.evaluate("({s:__wikary.GS.score, l:__wikary.GS.lives, c:__wikary.GS.hasCross, f:__wikary.GS.hasFire, m:__wikary.GS.meter})")
    game.keyboard.press("Enter")
    wait_js(game, "__wikary.scene().includes('Level') && __wikary.level().L.id === 3", 8)
    time.sleep(0.6)
    after = game.evaluate("({s:__wikary.GS.score, l:__wikary.GS.lives, c:__wikary.GS.hasCross, f:__wikary.GS.hasFire, m:__wikary.GS.meter})")
    assert after == before, (before, after)
    lv = game.evaluate("(()=>{const l=__wikary.level();return {dir:l.L.dir, night:!!l.L.night, fogs:(l.fogs||[]).length, bless:__wikary.GS.hasBless}})()")
    assert lv["dir"] == 1 and lv["night"] and lv["fogs"] == 2 and not lv["bless"], lv


def test_ghost_density_grows_toward_church(game):
    st = game.evaluate("__wikary.LEVELS[2].enemies.stages")
    ghosts = [sum(t in ("duszek", "phantom", "upior") for t in s["set"]) / len(s["set"]) for s in st]
    assert ghosts == sorted(ghosts) and ghosts[-1] == 1, ghosts
    assert [s["maxAlive"] for s in st] == sorted(s["maxAlive"] for s in st)


# ---------- duchy ----------

def test_fire_fizzles_on_ghosts_and_shows_hint(game):
    start_l3(game)
    quiet(game)
    game.evaluate("""(()=>{const l=__wikary.level(),F=__wikary.CFG.fire; l.facing=1; l.kamil.setFlipX(false);
        window.__d=l.spawnGhost('duszek', l.hero.x+90, -1, l.hero.y+F.standDy); window.__d.state='test';})()""")
    game.evaluate("(()=>{const l=__wikary.level(); l.lastFire=-99999;})()")
    game.keyboard.press("z")
    wait_js(game, "(__wikary.level().fizzles||0) >= 1", 4)
    assert game.evaluate("window.__d.active && !window.__d.dead && window.__d.hp === 1")
    assert game.evaluate("__wikary.level().fireHintAt > 0")


def test_cross_kills_ghost(game):
    start_l3(game)
    quiet(game)
    game.evaluate("""(()=>{const l=__wikary.level(); l.facing=1; l.kamil.setFlipX(false); l.lastThrow=-99999;
        window.__d=l.spawnGhost('duszek', l.hero.x+90, -1, l.hero.y-4);})()""")
    s0 = game.evaluate("__wikary.GS.score")
    game.keyboard.press("Alt")
    wait_js(game, "window.__d.dead || !window.__d.active", 4)
    assert game.evaluate("__wikary.GS.score") - s0 >= game.evaluate("__wikary.CFG.score.duszek")


def test_upior_warns_with_dust_then_rises_and_walks(game):
    start_l3(game)
    quiet(game)
    game.evaluate("window.__u=__wikary.level().spawnGhost('upior', __wikary.level().hero.x+160, -1); 0")
    w = game.evaluate("({s:__u.state, vis:__u.visible, body:__u.body.enable, dust:!!(__u.warnFx&&__u.warnFx.active)})")
    assert w == {"s": "warn", "vis": False, "body": False, "dust": True}, w
    wait_js(game, "__u.state === 'rise'", 3)
    wait_js(game, "__u.state === 'walk' && __u.body.enable && !__u.harmless", 4)


def test_phantom_dashes_through_obstacles(game):
    start_l3(game)
    teleport(game, 1130)                                      # płot w 980
    time.sleep(0.5)
    quiet(game)
    ob = game.evaluate("""(()=>{const l=__wikary.level(); const o=l.solids.filter(z=>!l.groundSolids.includes(z) && z.x<l.hero.x).sort((a,b)=>b.x-a.x)[0];
        window.__p=l.spawnGhost('phantom', o.x-140, 1); return o.x;})()""")
    assert game.evaluate("__p.state") == "appear" and game.evaluate("__p.harmless")
    wait_js(game, "__p.state === 'dash'", 3)
    wait_js(game, f"!__p.active || __p.x > {ob} + 40", 3)       # przeleciał przez płot


def test_blessing_pickup_radius_and_cooldown(game):
    start_l3(game)
    at = game.evaluate("__wikary.LEVELS[2].items.find(i=>i.type==='blessing').at")
    teleport(game, at - 90)
    quiet(game)
    hold(game, "ArrowRight", 1.2)
    wait_js(game, "__wikary.GS.hasBless && !__wikary.level().cutscene", 8)
    assert game.evaluate("__wikary.level().hudBless.visible")
    time.sleep(0.4)
    quiet(game)
    r = game.evaluate("__wikary.CFG.bless.radius")
    game.evaluate(f"""(()=>{{const l=__wikary.level();
        window.__n=l.spawnGhost('duszek', l.hero.x+{r//2}, -1, l.hero.y-10); window.__n.state='test';
        window.__u2=l.spawnGhost('upior', l.hero.x-{r//2}, 1);
        window.__f=l.spawnGhost('duszek', l.hero.x+{r*2+60}, -1, l.hero.y-10); window.__f.state='test'; window.__f.body.setVelocity(0,0);
        l.lastBless=-99999;}})()""")
    game.keyboard.press("x")
    wait_js(game, "__wikary.level().blessCasts === 1", 3)
    time.sleep(0.3)
    res = game.evaluate("({near: __n.dead || !__n.active, up: __u2.dead || !__u2.active, far: __f.active && !__f.dead})")
    assert res == {"near": True, "up": True, "far": True}, res
    game.keyboard.press("x")                                   # cooldown: drugi raz od razu nic
    time.sleep(0.3)
    assert game.evaluate("__wikary.level().blessCasts") == 1


# ---------- obrona kościoła ----------

def test_defense_door_hp_bar_door_look_and_game_over(game):
    start_l3(game, "defense")
    reach_defense(game)
    d = game.evaluate("__wikary.defense()")
    assert d["state"] == "wave" and d["doorHp"] == d["doorMax"] == game.evaluate("__wikary.CFG.defense.doorHp"), d
    assert game.evaluate("__wikary.level().doorBar.fill.visible && __wikary.level().cameras.main.scrollX") == game.evaluate("__wikary.level().arenaCamX")
    look0 = game.evaluate("__wikary.level().doorLook")
    game.evaluate("(()=>{const l=__wikary.level(); __wikary.defense().doorHp=Math.ceil(__wikary.defense().doorMax/2)+1; l.doorHit(l.spawnGhost('duszek', l.doorX, -1));})()")
    look1 = game.evaluate("__wikary.level().doorLook")
    assert look0 == "church_door_night_hp_1" and look1 == "church_door_night_hp_2", (look0, look1)
    wait_js(game, "__wikary.level().doorBar.fill.width < 140", 2)       # pasek odświeża się w następnej klatce
    w0 = game.evaluate("__wikary.level().doorBar.fill.width")
    assert 60 < w0 < 140, w0
    # duch dochodzi do drzwi sam
    game.evaluate("(()=>{const l=__wikary.level(); __wikary.defense().doorHp=2; l.spawnGhost('upior', l.doorX-60, 1);})()")
    assert wait_scene(game, "Nick", 12), "drzwi = 0 nie skończyły gry"


def test_proboszcz_casts_spells_and_gets_tired(game):
    start_l3(game, "defense")
    reach_defense(game)
    game.evaluate("__wikary.level().invulnUntil = 1e12; __wikary.defense().doorHp = 999")
    wait_js(game, "__wikary.level().pState.casts >= 1", 12)
    every = game.evaluate("__wikary.CFG.defense.tiredEvery")
    game.evaluate(f"__wikary.level().pState.casts = {every - 1}")
    wait_js(game, "__wikary.level().pState.state === 'tired' && __wikary.level().pState.tiredCount >= 1", 15)
    assert game.evaluate("__wikary.level().proboszcz.anims.currentAnim.key") == "proboszcz_tired"


def test_three_waves_then_rafal(game):
    start_l3(game, "defense")
    game.evaluate("(()=>{const D=__wikary.CFG.defense; D.waves.forEach(w=>{w.n=2; w.gapMs=150;}); D.waveBreakMs=400;})()")
    reach_defense(game)
    game.evaluate("__wikary.level().invulnUntil = 1e12; __wikary.defense().doorHp = 999")
    seen = set()
    for _ in range(120):
        d = game.evaluate("__wikary.defense()")
        seen.add(d["wave"])
        if d["state"] == "boss":
            break
        game.evaluate("(()=>{const l=__wikary.level(); l.enemies.getChildren().slice().forEach(e=>{ if (e.ghost && !e.dead && e.state!=='warn' && e.state!=='rise') l.damageEnemy(e, 99); });})()")
        time.sleep(0.25)
    d = game.evaluate("__wikary.defense()")
    assert d["state"] == "boss" and d["cleared"] == 3 and seen == {0, 1, 2}, (d, seen)
    wait_rafal(game)


# ---------- Rafał ----------

def test_rafal_fight_attacks_phases_and_exorcism_ending(game):
    start_l3(game, "boss")
    reach_defense(game)
    wait_rafal(game)
    r = game.evaluate("(()=>{const l=__wikary.level(),r=__wikary.rafal(); return {hp:r.hp, max:r.maxHp, bar:l.bossBar.fill.visible}})()")
    assert r["hp"] == r["max"] == game.evaluate("__wikary.CFG.rafal.hp") and r["bar"], r
    game.evaluate("__wikary.level().invulnUntil = 1e12")
    # grom ograniczony, faza 3 = szał
    hp = game.evaluate("(()=>{const r=__wikary.rafal(); __wikary.level().damageEnemy(r, 999, true); return r.hp})()")
    assert hp == game.evaluate("__wikary.CFG.rafal.hp - __wikary.CFG.rafal.gromDamage")
    game.evaluate("__wikary.rafal().hp = 5")
    wait_js(game, "__wikary.level().rafalPhase(__wikary.rafal()).enraged === true", 3)
    # ataki: rzut kluczami i krzyk przywołujący duszki
    wait_js(game, "(__wikary.level().keysThrown||0) >= 1 || __wikary.level().hostile.getLength() > 0", 15)
    wait_js(game, "(__wikary.level().rafalScreams||0) >= 1", 20)
    s0 = game.evaluate("__wikary.GS.score")
    beat_rafal(game)
    assert game.evaluate("__wikary.level().exorcised")
    assert game.evaluate("__wikary.GS.score") - s0 >= game.evaluate("__wikary.CFG.score.rafal")
    end = game.evaluate("""(()=>{const l=__wikary.level(),r=__wikary.rafal(); return {normal: !!r.normal, dawn: !!(l.dawn && l.dawn.active && l.dawn.alpha>0),
        txt: l.children.list.filter(o=>o.type==='Text').map(o=>o.text).join('|')}})()""")
    assert end["normal"] and end["dawn"], end
    assert "KONIEC" not in end["txt"] and "LEVEL 4" in end["txt"], end["txt"]
    assert game.evaluate("__wikary.level().devilGone")               # diabeł wyszedł z Rafała i odleciał
    wait_js(game, "__wikary.level().dawn.alpha === 1", 4)          # świt dochodzi do końca
    game.keyboard.press("Enter")
    wait_js(game, "__wikary.scene().includes('Level') && __wikary.level().L.id === 4", 8)


def test_rafal_dialog_after_exorcism(game):
    start_l3(game, "boss")
    reach_defense(game)
    wait_rafal(game)
    game.evaluate("(()=>{const l=__wikary.level(),r=__wikary.rafal(); l.invulnUntil=1e12; r.hp=1; l.damageEnemy(r,1);})()")
    wait_js(game, "!!__wikary.level().talk.dialog", 15)
    lines = set()
    for _ in range(80):
        if game.evaluate("__wikary.level().summaryShown"):
            break
        t = game.evaluate("(()=>{const d=__wikary.level().talk.dialog; return d ? (d.name||'') + ':' + (d.full||'') : ''})()")
        if t:
            lines.add(t)
            time.sleep(0.5)
            game.keyboard.press("Enter")
        time.sleep(0.3)
    joined = " ".join(lines)
    assert "Co ja tu robię" in joined, lines


# ---------- debug i dotyk ----------

def test_debug_url_level3(page, base_url):
    page.goto(base_url + "?debug=1&level=3")
    wait_js(page, "window.__wikary && __wikary.scene().includes('Level') && __wikary.level().L.id === 3", 30)


def test_touch_bless_button_in_level3(new_page, base_url):
    pg = new_page(has_touch=True, is_mobile=True)
    pg.goto(base_url + "?debug=1&touch=buttons")
    pg.wait_for_function("window.__wikary && window.__wikary.scene().includes('Title')", timeout=30000)
    start_l3(pg)
    b = pg.evaluate("(()=>{const l=__wikary.level(),o={};for(const k in l.touchButtons){const b=l.touchButtons[k].getBounds();o[k]={x:b.x,y:b.y,w:b.width,h:b.height}}return o})()")
    assert {"ult", "fire", "bless", "attack", "jump"} <= set(b), b
    col = [b[k] for k in ("ult", "fire", "bless", "attack", "jump")]
    assert all(c["y"] >= 24 and c["y"] + c["h"] <= 320 for c in col), col
    pg.evaluate("(()=>{__wikary.GS.hasBless=true; const l=__wikary.level(); l.lastBless=-99999; l.invulnUntil=1e12;})()")
    c = b["bless"]
    pg.touchscreen.tap(c["x"] + c["w"] / 2, c["y"] + c["h"] / 2)
    wait_js(pg, "__wikary.level().blessCasts === 1", 3)
