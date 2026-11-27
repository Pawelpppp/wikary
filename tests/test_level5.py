"""Level 5 „Bernard” (Solniczki): jazda + filmowe intro (do pominięcia), walka z Benkiem matematykiem
(całki, pierwiastki, trójkąt = zadanie na czas), zadanie dobrze / źle / koniec czasu, klawiatura ekranowa
na telefonie, zakończenie z karetką i „CIĄG DALSZY NASTĄPI”."""
import time

import pytest

from wikary import game_xy, open_game, wait_js, wait_scene

L = "__wikary.level()"


def start_l5(page, part=None):
    page.evaluate(f"__wikary.startL5({repr(part) if part else ''})")
    wait_js(page, f"__wikary.scene().includes('Level') && {L}.L.id === 5 && !!{L}.l5", 8)
    time.sleep(0.5)


def calm(page):
    """Benek stoi (bez ataków), pociski znikają: do testów zadania."""
    page.evaluate(f"(()=>{{const l={L}; l.benek.until=1e12; l.benek.nextTri=1e12; l.benek.state='idle'; l.hostile.clear(true,true);}})()")


def hit_by_triangle(page):
    page.evaluate(f"""(()=>{{const l={L}; l.invulnUntil=0; const t=l.benekTriangle(l.benek);
        t.body.reset(l.hero.x, l.hero.y); t.setVelocity(0,0);}})()""")
    wait_js(page, f"!!{L}.quiz", 3)


def test_l5_drive_intro_runs_to_fight(game):
    start_l5(game)
    assert game.evaluate(f"[{L}.cutscene, {L}.kamil.alpha, {L}.l5.phase]") == [True, 0, "drive"]
    names = set()
    t0 = time.time()
    while time.time() - t0 < 60 and game.evaluate(f"{L}.l5.phase") != "fight":
        d = game.evaluate(f"(()=>{{const d={L}.talk.dialog; return d ? d.name : ''}})()")
        if d:
            names.add(d)
            game.keyboard.press("Enter"); time.sleep(0.15); game.keyboard.press("Enter")
        time.sleep(0.25)
    assert game.evaluate(f"{L}.l5.phase") == "fight"
    assert {"BENEK", "KAMIL", "PRZECHODZIEŃ", "SANITARIUSZ", "DIABEŁ"} <= names, names


def test_l5_intro_skippable(game):
    start_l5(game)
    time.sleep(1.0)
    game.keyboard.press("Space")
    wait_js(game, f"{L}.l5.phase === 'fight'", 3)
    s = game.evaluate(f"""(()=>{{const l={L}, c=l.cameras.main; return {{cut:l.cutscene, alpha:l.kamil.alpha, body:l.hero.body.enable,
        cam:c.scrollX, ax:l.l5.ax, props:l.l5.props.length, boss:!!l.benek && !l.benek.dead, hx:l.hero.x, amb:!!l.ambulance && l.ambulance.active}}}})()""")
    assert s["cut"] is False and s["alpha"] == 1 and s["body"] and s["boss"] and s["amb"] and s["props"] == 0, s
    assert s["cam"] == s["ax"] and s["ax"] < s["hx"] < s["ax"] + 568, s


def test_benek_attacks_integral_sqrt_triangle(game):
    start_l5(game, "boss")
    game.evaluate(f"(()=>{{const l={L}; l.invulnUntil=1e12; l.benek.nextTri=l.time.now+1500;}})()")
    time.sleep(6)
    s = game.evaluate(f"({{shots:{L}.l5.shots, tri:{L}.l5.triangles, hp:{L}.benek.hp, lives:__wikary.GS.lives}})")
    assert s["shots"] >= 2 and s["tri"] >= 1, s


def test_quiz_correct_breaks_triangle(game):
    start_l5(game, "boss")
    calm(game)
    lives, score = game.evaluate("[__wikary.GS.lives, __wikary.GS.score]")
    hit_by_triangle(game)
    q = game.evaluate(f"({{a:{L}.quiz.p.answer, paused:{L}.physics.world.isPaused, t:{L}.quiz.timeMs}})")
    assert q["paused"] and q["t"] == 15000, q
    game.keyboard.type(str(q["a"]) + "9")
    game.keyboard.press("Backspace")
    assert game.evaluate(f"{L}.quiz.input") == str(q["a"])
    game.keyboard.press("Enter")
    wait_js(game, f"!{L}.quiz", 3)
    s = game.evaluate(f"({{lives:__wikary.GS.lives, score:__wikary.GS.score, right:{L}.l5.right, paused:{L}.physics.world.isPaused, cut:{L}.cutscene}})")
    assert s["lives"] == lives and s["score"] == score + 300 and s["right"] == 1 and not s["paused"] and not s["cut"], s


def test_quiz_wrong_and_timeout_cost_life(game):
    start_l5(game, "boss")
    calm(game)
    game.evaluate("__wikary.GS.lives = 3")
    hit_by_triangle(game)
    a = game.evaluate(f"{L}.quiz.p.answer")
    game.keyboard.type(str(a + 1))
    game.keyboard.press("Enter")
    wait_js(game, f"!{L}.quiz", 3)
    assert game.evaluate("__wikary.GS.lives") == 2
    game.evaluate(f"(()=>{{const l={L}; l.invulnUntil=0; l.openQuiz(); l.quiz.until=l.time.now+300;}})()")
    wait_js(game, f"!{L}.quiz", 4)
    assert game.evaluate(f"[__wikary.GS.lives, {L}.l5.wrong]") == [1, 2]


def test_quiz_time_and_ops_by_difficulty_and_answers(game):
    start_l5(game, "boss")
    r = game.evaluate(f"""(()=>{{const l={L}, G=__wikary.GS, out={{}};
        for (const d of ['easy','normal','hard']) {{ G.difficulty=d; const s=l.quizSettings(); out[d]=[s.timeMs, s.ops.join(',')]; }}
        G.difficulty='normal'; const s=l.quizSettings(), bad=[], ops=new Set();
        const SUPV={{'\\u00b2':2,'\\u00b3':3,'\\u2074':4,'\\u2075':5}};
        for (let i=0;i<400;i++) {{ const p=l.makeProblem(s.ops, s.ranges); ops.add(p.op); let v;
            const t=p.text.replace('\\u00d7','*').replace('\\u2212','-').replace(' : ','/');
            if (p.op==='sqrt') v=Math.sqrt(+t.slice(1)); else if (p.op==='cbrt') v=Math.round(Math.cbrt(+t.slice(1)));
            else if (p.op==='pow') v=Math.pow(+t.slice(0,-1), SUPV[t.slice(-1)]); else v=Function('return '+t)();
            if (v!==p.answer || !Number.isInteger(p.answer) || p.answer<0) bad.push(p); }}
        out.bad=bad.slice(0,3); out.ops=[...ops].sort(); return out; }})()""")
    assert r["easy"] == [20000, "add,sub,mul"] and r["normal"][0] == 15000 and r["hard"][0] == 12000, r
    assert r["bad"] == [] and r["ops"] == sorted(["add", "sub", "mul", "div", "sqrt", "cbrt", "pow"]), r


def test_quiz_touch_keypad_phone(new_page, base_url):
    pg = new_page(viewport={"width": 667, "height": 375}, has_touch=True, is_mobile=True)
    open_game(pg, base_url)
    start_l5(pg, "boss")
    calm(pg)
    lives = pg.evaluate("__wikary.GS.lives")
    hit_by_triangle(pg)
    keys = pg.evaluate(f"{L}.quiz.keys")
    assert [k["label"] for k in keys] == ["1", "2", "3", "4", "5", "6", "7", "8", "9", "\u232b", "0", "OK"]
    assert all(20 <= k["x"] <= 548 and 26 <= k["y"] <= 300 for k in keys), keys
    pos = {k["label"]: (k["x"], k["y"]) for k in keys}
    for ch in list(str(pg.evaluate(f"{L}.quiz.p.answer"))) + ["OK"]:
        pg.touchscreen.tap(*game_xy(pg, *pos[ch]))
        time.sleep(0.12)
    wait_js(pg, f"!{L}.quiz", 3)
    assert pg.evaluate(f"[__wikary.GS.lives, {L}.l5.right, {L}.jumps]") == [lives, 1, 0]


def test_benek_defeat_ending_to_nick(game):
    start_l5(game, "boss")
    s0 = game.evaluate("__wikary.GS.score")
    game.evaluate(f"(()=>{{const l={L}; l.invulnUntil=1e12; l.benek.hp=1; l.damageEnemy(l.benek, 1);}})()")
    lines = []
    for _ in range(200):
        if game.evaluate(f"{L}.summaryShown"):
            break
        t = game.evaluate(f"(()=>{{const d={L}.talk.dialog; return d ? d.name + ':' + d.full : ''}})()")
        if t and (not lines or lines[-1] != t):
            lines.append(t)
        if t:
            time.sleep(0.3); game.keyboard.press("Enter")
        time.sleep(0.2)
    joined = " ".join(lines)
    assert "DIABEŁ:" in joined and "do wesela" in joined, lines
    assert game.evaluate(f"[{L}.l5.ambulanceGone, {L}.carGone]") == [True, True]
    assert game.evaluate("__wikary.GS.score") - s0 >= game.evaluate("__wikary.CFG.score.benek")
    txt = game.evaluate(f"{L}.children.list.filter(o=>o.type==='Text').map(o=>o.text).join('|')")
    assert "CIĄG DALSZY NASTĄPI" in txt, txt
    game.keyboard.press("Enter")
    assert wait_scene(game, "Nick", 5)
