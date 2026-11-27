"""Level 4 „Bagna”: nowe zakończenie Level 3 (diabeł wychodzi z Rafała), przenoszenie stanu, zielona mgła,
bagienne doły (lilie, pływające pnie), komary / żaby / bagienne stwory, święcona woda, ogień na bagnie,
czarnoksiężnik Adrian (kule, roje, teleport, fazy, pasek HP), diabeł spod ziemi, auto Adriana i nick."""
import time

from wikary import (beat_adrian, beat_rafal, hold, reach_adrian, reach_defense, skip_dialogs_until, start_l3, start_l4,
                    teleport, wait_js, wait_rafal, wait_scene)


def quiet(page):
    page.evaluate("(()=>{const l=__wikary.level(); l.invulnUntil=1e12; l.nextSpawn=1e12; l.spawnAcc=0;"
                  " l.enemies.getChildren().slice().forEach(e=>e.destroy());})()")


def spawn(page, type_, dx, mv=-1):
    """wróg Level 4 przed Kamilem; zwraca nic (sprite w window.__e = ostatni utworzony)"""
    page.evaluate(f"""(()=>{{const l=__wikary.level(), n=l.enemies.getLength();
        l.spawnEnemy4('{type_}', l.hero.x+{dx}, {mv});
        window.__e=l.enemies.getChildren()[l.enemies.getLength()-1]; window.__n=l.enemies.getLength()-n;}})(); 0""")


# ---------- koniec Level 3: diabeł i przejście ----------

def test_level3_ending_devil_leaves_rafal_and_leads_to_level4_with_carry_over(game):
    start_l3(game, "boss")
    reach_defense(game)
    wait_rafal(game)
    game.evaluate("__wikary.level().invulnUntil = 1e12")
    lines = []
    game.evaluate("(()=>{const l=__wikary.level(),r=__wikary.rafal(); r.hp=1; l.damageEnemy(r,1);})()")
    wait_js(game, "!!__wikary.devil()", 10)                       # piorun, diabeł wychodzi z Rafała
    for _ in range(120):
        if game.evaluate("__wikary.level().summaryShown"):
            break
        t = game.evaluate("(()=>{const d=__wikary.level().talk.dialog; return d ? d.name + ':' + d.full : ''})()")
        if t and (not lines or lines[-1] != t):
            lines.append(t)
        if t:
            time.sleep(0.3)
            game.keyboard.press("Enter")
        time.sleep(0.25)
    joined = " ".join(lines)
    assert "DIABEŁ:" in joined and "Adriana" in joined and "bagna" in joined.lower(), lines
    assert game.evaluate("__wikary.level().devilGone"), "diabeł nie odleciał"
    txt = game.evaluate("__wikary.level().children.list.filter(o=>o.type==='Text').map(o=>o.text).join('|')")
    assert "KONIEC" not in txt and "LEVEL 4" in txt, txt
    before = game.evaluate("({s:__wikary.GS.score, l:__wikary.GS.lives, c:__wikary.GS.hasCross, f:__wikary.GS.hasFire, b:__wikary.GS.hasBless})")
    game.keyboard.press("Enter")
    wait_js(game, "__wikary.scene().includes('Level') && __wikary.level().L.id === 4", 8)
    time.sleep(0.5)
    after = game.evaluate("({s:__wikary.GS.score, l:__wikary.GS.lives, c:__wikary.GS.hasCross, f:__wikary.GS.hasFire, b:__wikary.GS.hasBless})")
    assert after == before and after["b"], (before, after)


# ---------- bagno ----------

def test_level4_swamp_setup(game):
    start_l4(game)
    lv = game.evaluate("""(()=>{const l=__wikary.level(); return {dir:l.L.dir, fogs:(l.fogs||[]).length, rivers:l.rivers.length,
        lily:l.planks.filter(p=>p.kind==='platform_lily').length, logs:l.planks.filter(p=>p.kind==='platform_log').length,
        hut:!!l.hut, door:!!l.hutDoor, music:l.L.music}})()""")
    assert lv == {"dir": 1, "fogs": 2, "rivers": 6, "lily": 4, "logs": 2, "hut": True, "door": True, "music": "level4"}, lv
    assert game.evaluate("__wikary.level().kamil.flipX") is False
    st = game.evaluate("__wikary.LEVELS[3].enemies.stages")
    bog = [s["set"].count("bogman") / len(s["set"]) for s in st]
    assert bog == sorted(bog) and bog[-1] > 0, bog


def test_lily_pads_stand_still_and_log_drifts(game):
    start_l4(game)
    quiet(game)
    p0 = game.evaluate("__wikary.level().planks.map(p=>Math.round(p.x))")
    time.sleep(1.0)
    p1 = game.evaluate("__wikary.level().planks.map(p=>Math.round(p.x))")
    kinds = game.evaluate("__wikary.level().planks.map(p=>p.kind)")
    for k, a, b in zip(kinds, p0, p1):
        assert (a == b) == (k == "platform_lily"), (k, a, b)
    # Kamil stoi na lilii nad bagnem
    game.evaluate("""(()=>{const l=__wikary.level(),p=l.planks.find(p=>p.kind==='platform_lily');
        l.hero.body.reset(p.x, p.body.top - __wikary.CFG.hero.bodyH/2 - 2); l.cameras.main.scrollX=p.x-200;})()""")
    time.sleep(0.8)
    on = game.evaluate("(()=>{const l=__wikary.level(); return {lives:__wikary.GS.lives, y:Math.round(l.hero.body.bottom), down:l.hero.body.touching.down}})()")
    assert on["down"] and abs(on["y"] - game.evaluate("__wikary.CFG.GROUND_Y")) <= 2, on


def test_falling_into_bog_costs_a_life(game):
    start_l4(game)
    quiet(game)
    game.evaluate("__wikary.level().invulnUntil = 0")
    lives = game.evaluate("__wikary.GS.lives")
    teleport(game, 970)                                       # środek pierwszego dołu (900..1040)
    wait_js(game, f"__wikary.GS.lives === {lives - 1}", 5)


# ---------- wrogowie ----------

def test_mosquito_swarm_homes_in_and_repellent_kills_small_pushes_big(game):
    start_l4(game)
    quiet(game)
    spawn(game, "mosquito_small", 170)
    n = game.evaluate("window.__n")
    assert n == game.evaluate("__wikary.CFG.enemies.mosquito_small.swarm"), n
    d0 = game.evaluate("Math.min(...__wikary.level().enemies.getChildren().map(e=>Math.abs(e.x-__wikary.level().hero.x)))")
    time.sleep(0.8)
    d1 = game.evaluate("Math.min(...__wikary.level().enemies.getChildren().map(e=>Math.abs(e.x-__wikary.level().hero.x)))")
    assert d1 < d0, (d0, d1)
    # święcona woda: zbierana z mapy (1150)
    teleport(game, 1100)
    hold(game, "ArrowRight", 0.5)
    wait_js(game, "!!__wikary.level().repelAura", 3)
    spawn(game, "mosquito_small", 60)
    wait_js(game, "__wikary.level().repelKills >= 1", 4)
    spawn(game, "mosquito_big", 30)
    game.evaluate("__e.y = __wikary.level().hero.y - 10")
    wait_js(game, "__e.state === 'up' && __e.body.velocity.y < 0", 3)


def test_big_mosquito_dives_with_sting(game):
    start_l4(game)
    quiet(game)
    spawn(game, "mosquito_big", 120)
    wait_js(game, "__e.state === 'sting'", 5)
    assert game.evaluate("__e.anims.currentAnim.key") == "mosq_sting"


def test_frog_jumps_and_tongue_hurts(game):
    start_l4(game)
    quiet(game)
    spawn(game, "frog", 200)
    wait_js(game, "__e.state === 'jump'", 4)
    quiet(game)
    game.evaluate("__wikary.level().invulnUntil = 0")
    lives = game.evaluate("__wikary.GS.lives")
    spawn(game, "frog", 40)
    wait_js(game, "__wikary.level().tongues >= 1", 4)
    wait_js(game, f"__wikary.GS.lives < {lives} || __wikary.level().hurtUntil > __wikary.level().time.now || __e.tongueHit", 3)
    assert game.evaluate("__e.tongueHit")


def test_bogman_bubbles_then_rises_and_walks(game):
    start_l4(game)
    quiet(game)
    spawn(game, "bogman", 0)
    w = game.evaluate("({s:__e.state, vis:__e.visible, body:__e.body.enable, fx:!!(__e.warnFx&&__e.warnFx.active)})")
    assert w == {"s": "warn", "vis": False, "body": False, "fx": True}, w
    wait_js(game, "__e.state === 'rise'", 3)
    wait_js(game, "__e.state === 'walk' && __e.body.enable && !__e.harmless", 4)


def test_fire_works_on_swamp_creatures(game):
    start_l4(game)
    quiet(game)
    game.evaluate("""(()=>{const l=__wikary.level(); __wikary.GS.hasFire=true; l.facing=1; l.kamil.setFlipX(false);
        window.__b=l.spawnBogman(l.hero.x+110, -1); __b.until=0;})(); 0""")
    wait_js(game, "__b.state === 'walk'", 4)
    game.evaluate("__b.setVelocityX(0); __b.state='test'; __wikary.level().lastFire=-99999")
    game.keyboard.press("z")
    wait_js(game, "__b.dead || !__b.active || __b.hp < __wikary.CFG.enemies.bogman.hp", 3)
    assert game.evaluate("(__wikary.level().fizzles||0)") == 0


# ---------- Adrian ----------

def test_adrian_arena_intro_hp_bar_and_attacks(game):
    start_l4(game, "boss")
    reach_adrian(game)
    a = game.evaluate("(()=>{const l=__wikary.level(),a=__wikary.adrian(); return {hp:a.hp, max:a.maxHp, bar:!!(l.bossBar&&l.bossBar.fill.visible)}})()")
    assert a["hp"] == a["max"] == game.evaluate("__wikary.CFG.adrian.hp") and a["bar"], a
    game.evaluate("__wikary.level().invulnUntil = 1e12")
    wait_js(game, "__wikary.level().orbsCast >= 1", 8)
    assert game.evaluate("__wikary.level().hostile.getChildren().some(o=>o.homing)") or game.evaluate("__wikary.level().orbsCast >= 1")
    wait_js(game, "__wikary.level().swarmsSummoned >= 1", 12)
    wait_js(game, "__wikary.level().teleports >= 1", 15)
    # grom ograniczony (w trakcie teleportu Adrian jest nietykalny), fazy
    wait_js(game, "!__wikary.adrian().harmless && __wikary.adrian().state !== 'tp'", 4)
    hp = game.evaluate("(()=>{const a=__wikary.adrian(); __wikary.level().damageEnemy(a, 999, true); return a.hp})()")
    assert hp == game.evaluate("__wikary.CFG.adrian.hp - __wikary.CFG.adrian.gromDamage")
    game.evaluate("__wikary.adrian().hp = 3")
    assert game.evaluate("__wikary.level().adrianPhase(__wikary.adrian()).enraged") is True


def test_adrian_defeat_devil_rises_car_drives_left_then_nick(game):
    start_l4(game, "boss")
    reach_adrian(game)
    s0 = game.evaluate("__wikary.GS.score")
    game.evaluate("(()=>{const l=__wikary.level(),a=__wikary.adrian(); l.invulnUntil=1e12; a.hp=1; a.harmless=false; l.damageEnemy(a,1);})()")
    wait_js(game, "!!__wikary.level().red && __wikary.level().red.alpha > 0.2", 6)          # czerwony ekran
    wait_js(game, "!!__wikary.devil()", 6)                                                  # diabeł spod ziemi
    lines, car_x = [], []
    for _ in range(160):
        if game.evaluate("__wikary.level().summaryShown"):
            break
        t = game.evaluate("(()=>{const d=__wikary.level().talk.dialog; return d ? d.name + ':' + d.full : ''})()")
        if t and (not lines or lines[-1] != t):
            lines.append(t)
        if t:
            time.sleep(0.3)
            game.keyboard.press("Enter")
        elif game.evaluate("!!__wikary.level().car && __wikary.level().car.active"):
            car_x.append(game.evaluate("__wikary.level().car.x"))
        time.sleep(0.2)
    joined = " ".join(lines)
    assert "DIABEŁ:" in joined and "ADRIAN:" in joined and "auto" in joined, lines
    assert game.evaluate("__wikary.level().devilGone")
    assert game.evaluate("__wikary.level().carGone"), "auto nie odjechało"
    assert len(car_x) >= 2 and car_x[-1] < car_x[0], car_x                                   # w lewo
    assert game.evaluate("__wikary.GS.score") - s0 >= game.evaluate("__wikary.CFG.score.adrian")
    txt = game.evaluate("__wikary.level().children.list.filter(o=>o.type==='Text').map(o=>o.text).join('|')")
    assert "LEVEL 5" in txt, txt
    game.keyboard.press("Enter")                                                             # dalej: Level 5 „Bernard”
    wait_js(game, "__wikary.scene().includes('Level') && __wikary.level().L.id === 5 && !!__wikary.level().l5", 8)


def test_beat_adrian_helper(game):
    start_l4(game, "boss")
    reach_adrian(game)
    beat_adrian(game)
    assert game.evaluate("__wikary.level().summaryShown")


# ---------- debug i grafika ----------

def test_debug_url_level4(page, base_url):
    page.goto(base_url + "?debug=1&level=4")
    wait_js(page, "window.__wikary && __wikary.scene().includes('Level') && __wikary.level().L.id === 4", 30)
    assert page.evaluate("__wikary.GS.hasCross && __wikary.GS.hasFire && __wikary.GS.hasBless")


def test_adrian_final_art_no_fallback(game):
    miss = game.evaluate("__wikary.artMissing()")
    assert not [k for k in miss if "adrian" in k], miss
    anims = game.evaluate("""(()=>{const o={}; for (const k of ['adrian_idle','adrian_talk','adrian_cast','adrian_spell'])
        o[k]=__wikary.game.anims.get(k).frames.map(f=>f.textureKey); return o})()""")
    assert anims == {"adrian_idle": ["adrian_idle_1", "adrian_idle_2"], "adrian_talk": ["adrian_talk_1", "adrian_talk_2"],
                     "adrian_cast": ["adrian_cast_1", "adrian_cast_2", "adrian_cast_3"],
                     "adrian_spell": ["proj_adrian_spell_1", "proj_adrian_spell_2", "proj_adrian_spell_3"]}, anims


ADR = """(()=>{const l=__wikary.level(),a=__wikary.adrian(),h=l.hero; return {key:a.texture.key, tint:a.isTinted, flip:a.flipX,
    heroLeft:h.x<a.x, x:a.x, y:a.y, ox:a.originX, oy:a.originY, bodyMid:a.body.center.x, bodyBottom:a.body.bottom, h:a.displayHeight,
    doorX:l.doorX, doorBottom:l.doorBottom, G:__wikary.CFG.GROUND_Y}})()"""
PORTRAIT = "(()=>{const d=__wikary.level().talk.dialog; return d && d.portrait ? [d.portrait.texture.key, d.portrait.isTinted] : null})()"


def test_adrian_final_art_door_flip_feet_hurt_portraits_ending(game):
    start_l4(game, "boss")
    game.evaluate("__wikary.GS.lives = 6; __wikary.level().invulnUntil = 1e12")
    teleport(game, game.evaluate("__wikary.LEVELS[3].arenaAt") - 60)
    hold(game, "ArrowRight", 0.8)
    wait_js(game, "!!__wikary.adrian() && !!__wikary.level().talk.dialog", 20)
    a = game.evaluate(ADR)
    # pojawia się w drzwiach chaty, bez fioletowego tintu zamiennika, patrzy na Kamila
    assert a["key"].startswith("adrian_") and not a["tint"], a
    assert abs(a["x"] - a["doorX"]) < 1 and abs(a["y"] - a["doorBottom"]) < 1, a
    assert a["flip"] == a["heroLeft"], a
    assert 66 <= a["h"] <= 76, a                                         # ok. 155 px postaci × 0.45 jak inne [P]
    assert game.evaluate(PORTRAIT) == ["adrian_closeup_open", False]
    reach_adrian(game)
    game.evaluate("__wikary.level().invulnUntil = 1e12")
    time.sleep(0.3)
    a = game.evaluate(ADR)
    assert a["y"] == a["G"] and abs(a["bodyBottom"] - a["G"]) < 1.5 and abs(a["bodyMid"] - a["x"]) < 1.5, a   # stopy i hitbox na ziemi
    assert a["flip"] == a["heroLeft"] and a["ox"] == 0.5 and a["oy"] == 1, a
    # cast: klatki 140 px, hitbox dalej pod stopami
    game.evaluate("(()=>{const a=__wikary.adrian(); a.play('adrian_cast');})()")
    time.sleep(0.15)
    c = game.evaluate(ADR)
    assert c["key"].startswith("adrian_cast_") and abs(c["bodyMid"] - c["x"]) < 1.5, c
    # hurt: stopy 11 px od środka klatki 132 px (lustrzanie przy flipX), hitbox pod stopami
    wait_js(game, "!__wikary.adrian().harmless && __wikary.adrian().state === 'idle'", 10)
    game.evaluate("(()=>{const l=__wikary.level(),a=__wikary.adrian(); a.hp = 20; l.adrianHit(a, 1);})()")
    hu = game.evaluate(ADR)
    dx = 11 / 132
    assert hu["key"] == "adrian_hurt_1", hu
    assert abs(hu["ox"] - (0.5 - dx if hu["flip"] else 0.5 + dx)) < 1e-6 and abs(hu["bodyMid"] - hu["x"]) < 1.5, hu
    wait_js(game, "__wikary.adrian().texture.key !== 'adrian_hurt_1'", 3)
    assert game.evaluate("__wikary.adrian().originX") == 0.5
    # klęka pokonany, końcówka z zawstydzonym portretem
    game.evaluate("(()=>{const l=__wikary.level(),a=__wikary.adrian(); a.hp=1; a.harmless=false; l.damageEnemy(a,1);})()")
    wait_js(game, "__wikary.adrian().dead", 3)
    d = game.evaluate(ADR)
    assert d["key"] == "adrian_defeated_1" and not d["tint"] and d["y"] == d["G"], d
    skip_dialogs_until(game, "(()=>{const d=__wikary.level().talk.dialog; return !!(d && d.portrait && d.portrait.texture.key === 'adrian_closeup_ashamed')})()", 40, key="Enter")
    assert game.evaluate(PORTRAIT) == ["adrian_closeup_ashamed", False]
