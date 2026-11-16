"""Ekran tytułowy: ładowanie, wersja, dopasowanie do okna, wyciszanie, menu."""
import re
import subprocess
import time

import pytest

from wikary import REPO_ROOT, wait_scene


def test_title_loads(game):
    assert "Title" in game.evaluate("__wikary.scene()")
    assert game.evaluate("!!document.querySelector('canvas')")


def test_version_format(game):
    ver = game.evaluate("window.WIKARY_VERSION")
    assert re.fullmatch(r"1\.\d+", ver or ""), ver


def test_version_matches_git_commit_count(game, is_local):
    if not is_local:
        pytest.skip("wersja vs git tylko lokalnie (pomijane przy --base-url)")
    try:
        count = int(subprocess.check_output(["git", "rev-list", "--count", "HEAD"], cwd=REPO_ROOT, text=True).strip())
        dirty = subprocess.check_output(["git", "status", "--porcelain", "src/version.js"], cwd=REPO_ROOT, text=True).strip()
    except (OSError, subprocess.CalledProcessError, ValueError):
        pytest.skip("brak kopii git")
    # jeśli src/version.js jest zmieniony i niezacommitowany, wersja wskazuje na następny commit
    expected = f"1.{count + 1}" if dirty else f"1.{count}"
    assert game.evaluate("window.WIKARY_VERSION") == expected


def test_canvas_fits_568x320(game):
    box = game.evaluate("(()=>{const c=document.querySelector('canvas').getBoundingClientRect();return [c.width,c.height,document.documentElement.scrollHeight]})()")
    assert box[0] <= 568.5 and box[1] <= 320.5 and box[2] <= 320, box


def test_m_toggles_mute_once_per_press(game):
    m0 = game.evaluate("WikaryAudio.muted")
    game.keyboard.press("m")
    m1 = game.evaluate("WikaryAudio.muted")
    game.keyboard.press("m")
    m2 = game.evaluate("WikaryAudio.muted")
    assert m1 != m0 and m2 == m0


def test_keyboard_menu_opens_scores_and_escape_returns(game):
    game.keyboard.press("ArrowDown")
    game.keyboard.press("Enter")
    assert wait_scene(game, "Scores")
    time.sleep(0.4)
    game.keyboard.press("Escape")
    assert wait_scene(game, "Title")


def test_click_top_edge_of_high_scores_opens_scores(game):
    game.mouse.click(284, 179)
    assert wait_scene(game, "Scores", 3)
    assert "Intro" not in game.evaluate("__wikary.scene()")
