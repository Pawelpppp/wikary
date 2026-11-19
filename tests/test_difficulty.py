"""Poziomy trudności: ekran wyboru po START NEW GAME (klawiatura i dotyk, zapamiętany w localStorage),
profile CFG.difficulty (życia, HP i prędkość wrogów, serca, HP bossów, powtórka), trudność przy wpisie wyników."""
import time

import pytest

from wikary import choose_difficulty, game_xy, open_game, tap_difficulty, wait_js, wait_scene

PROFILES = {"easy": (5, 0.8, -1, 0.75, True), "normal": (3, 1.0, 0, 1.0, True), "hard": (2, 1.2, 1, 1.25, False)}


def start(page, idx, diff):
    page.evaluate(f"__wikary.start({idx}, undefined, {{difficulty: '{diff}'}})")
    wait_js(page, f"__wikary.scene().includes('Level') && __wikary.level().L.id === {idx + 1} && !__wikary.level().dead", 8)
    time.sleep(0.6)


def test_select_screen_keyboard_and_remembered(game):
    game.keyboard.press("Enter")
    assert wait_scene(game, "Difficulty", 5)
    time.sleep(0.4)
    d = game.evaluate("(()=>{const d=__wikary.diffScene(); return {ids:d.ids, sel:d.ids[d.sel], labels:d.items.map(i=>i.t.text)}})()")
    assert d == {"ids": ["easy", "normal", "hard"], "sel": "normal", "labels": ["ŁATWY", "NORMALNY", "TRUDNY"]}, d
    assert "Intro" not in game.evaluate("__wikary.scene()")
    game.keyboard.press("ArrowUp")
    game.keyboard.press("Enter")
    assert wait_scene(game, "Intro", 5)
    assert game.evaluate("[__wikary.GS.difficulty, __wikary.GS.lives, localStorage.getItem('wikary_difficulty')]") == ["easy", 5, "easy"]
    game.evaluate("__wikary.startScene('Title')")
    assert wait_scene(game, "Title", 5)
    time.sleep(0.5)
    game.keyboard.press("Enter")
    assert wait_scene(game, "Difficulty", 5)
    assert game.evaluate("(()=>{const d=__wikary.diffScene(); return d.ids[d.sel]})()") == "easy"   # ostatni wybór
    time.sleep(0.4)
    game.keyboard.press("Escape")
    assert wait_scene(game, "Title", 5)
    assert game.evaluate("__wikary.GS.difficulty") == "easy"            # Esc nie zaczyna nowej gry


def test_touch_select_hard(new_page, base_url):
    pg = new_page(viewport={"width": 667, "height": 375}, has_touch=True, is_mobile=True)
    open_game(pg, base_url)
    pg.touchscreen.tap(*game_xy(pg, 284, 150))                          # START NEW GAME
    assert wait_scene(pg, "Difficulty", 5)
    time.sleep(0.6)
    assert "Intro" not in pg.evaluate("__wikary.scene()"), "dotyk START od razu wybrał poziom"
    tap_difficulty(pg, "hard")
    assert wait_scene(pg, "Intro", 5)
    assert pg.evaluate("[__wikary.GS.difficulty, __wikary.GS.lives]") == ["hard", 2]


@pytest.mark.parametrize("diff", ["easy", "normal", "hard"])
def test_profile_lives_enemy_hp_speed_boss(game, diff):
    lives, spd, dhp, boss, retry = PROFILES[diff]
    start(game, 1, diff)                                                # Level 2: dzik (2 HP), pies, Hans
    assert game.evaluate("[__wikary.GS.difficulty, __wikary.GS.lives]") == [diff, lives]
    r = game.evaluate("""(()=>{const l=__wikary.level(); l.spawnEnemy('boar'); l.spawnEnemy('dog');
        const e=l.enemies.getChildren(), boar=e.filter(x=>x.type==='boar').pop(), dog=e.filter(x=>x.type==='dog').pop();
        return {boar: boar.hp, dogHp: dog.hp, dogV: Math.abs(dog.body.velocity.x)}})()""")
    assert r["boar"] == max(1, 2 + dhp) and r["dogHp"] == max(1, 1 + dhp), r
    assert abs(r["dogV"] - 150 * spd) < 1, r
    hans = game.evaluate("(()=>{const l=__wikary.level(); l.spawnBoss(); const h=l.enemies.getChildren().filter(x=>x.type==='hans').pop(); return [h.hp, h.maxHp]})()")
    assert hans == [round(20 * boss)] * 2, hans
    assert game.evaluate("[__wikary.Difficulty.bossHp(__wikary.CFG.rafal.hp), __wikary.Difficulty.bossHp(__wikary.CFG.adrian.hp)]") == \
        [max(1, round(24 * boss + 1e-9)), max(1, int(26 * boss + 0.5))]
    assert game.evaluate("__wikary.Difficulty.retryAllowed()") is retry


def test_heart_drop_more_often_on_easy(game):
    out = {}
    for diff in ("easy", "normal", "hard"):
        start(game, 0, diff)                                            # Level 1: szansa 0.15 × mnożnik
        out[diff] = game.evaluate("""(()=>{const l=__wikary.level(); __wikary.GS.lives=1; let n=0;
            const R=Math.random; const cnt=()=>l.items.filter(i=>i.itemType==='life'&&i.active).length; const n0=cnt();
            for (const p of [0.1, 0.2]) { l.spawnEnemy('dog'); const d=l.enemies.getChildren().filter(x=>x.type==='dog').pop();
                Math.random=()=>p; try { l.damageEnemy(d, 9); } finally { Math.random=R; } }
            return cnt()-n0})()""")
    assert out == {"easy": 2, "normal": 1, "hard": 0}, out             # 0.225 / 0.15 / 0.075


def test_hard_no_retry_nick_and_scores_show_difficulty(game):
    start(game, 0, "hard")
    game.evaluate("__wikary.GS.score = 4321; (()=>{const l=__wikary.level(); __wikary.GS.lives=0; l.gameOver();})()")
    seen = False
    for _ in range(40):
        if game.evaluate("__wikary.scene().includes('Nick')"):
            break
        seen = seen or game.evaluate("!!(__wikary.level() && __wikary.level().retryPrompt)")
        time.sleep(0.15)
    assert not seen, "na trudnym nie ma powtórki"
    assert wait_scene(game, "Nick", 5)
    assert game.evaluate("__wikary.game.scene.getScene('Nick').diffText.text") == "POZIOM TRUDNOŚCI: TRUDNY"
    time.sleep(0.4)
    game.keyboard.type("HARDY")
    game.keyboard.press("Enter")
    assert wait_scene(game, "Scores", 5)
    lb = game.evaluate("JSON.parse(localStorage.getItem('wikary_leaderboard'))")
    assert lb[0]["diff"] == "hard" and lb[0]["score"] == 4321, lb
    lines = game.evaluate("__wikary.game.scene.getScene('Scores').children.list.filter(o=>o.type==='Text').map(o=>o.text)")
    assert any(l.startswith(" 1 HARDY") and l.rstrip().endswith(" T") for l in lines), lines
    assert any("TR." in l for l in lines)


def test_easy_retry_keeps_difficulty_and_lives(game):
    start(game, 0, "easy")
    game.evaluate("(()=>{const l=__wikary.level(); __wikary.GS.lives=0; l.gameOver();})()")
    wait_js(game, "!!(__wikary.level() && __wikary.level().retryPrompt)", 6)
    game.keyboard.press("Enter")
    wait_js(game, "__wikary.GS.retryUsed && !__wikary.level().dead && !__wikary.level().retryPrompt", 6)
    assert game.evaluate("[__wikary.GS.difficulty, __wikary.GS.lives]") == ["easy", 5]


def test_old_leaderboard_entries_without_difficulty(game):
    game.evaluate("localStorage.setItem('wikary_leaderboard', JSON.stringify([{nick:'STARY', score:10, time:5, date:1}]))")
    game.evaluate("__wikary.startScene('Scores')")
    assert wait_scene(game, "Scores", 5)
    lines = game.evaluate("__wikary.game.scene.getScene('Scores').children.list.filter(o=>o.type==='Text').map(o=>o.text)")
    assert any(l.startswith(" 1 STARY") and l.rstrip().endswith("-") for l in lines), lines
