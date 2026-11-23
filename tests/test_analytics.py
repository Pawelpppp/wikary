"""Niewidoczne statystyki (GoatCounter, issue #2). Żadnych prawdziwych żądań: ruch do obcych hostów blokuje
conftest (każde takie żądanie = błąd testu), a gc.zgo.at / *.goatcounter.com są tu mockowane (route.fulfill).
Host i adres konta wymuszamy tylko w testach przez window.__wikaryAnalyticsOverride (init script)."""
import json
import time

from wikary import choose_difficulty, open_game, wait_scene

URL = "https://testowe-konto.goatcounter.com/count"
MOCK = """window.__gcLoads = (window.__gcLoads || 0) + 1;
window.__gcCalls = window.__gcCalls || [];
window.__gcData = document.currentScript && document.currentScript.getAttribute('data-goatcounter');
window.goatcounter = { count: function (ev) { window.__gcCalls.push(ev); } };"""


def mock_goatcounter(page, body=MOCK):
    hits = []

    def handle(route):
        hits.append(route.request.url)
        if "gc.zgo.at" in route.request.url:
            route.fulfill(status=200, content_type="application/javascript", body=body)
        else:
            route.fulfill(status=204, body="")
    page.route("**/gc.zgo.at/**", handle)
    page.route("**/*.goatcounter.com/**", handle)
    return hits


def override(page, **o):
    page.add_init_script("window.__wikaryAnalyticsOverride = " + json.dumps(o) + ";")


def start_new_game(page):
    page.keyboard.press("Enter")
    choose_difficulty(page)
    assert wait_scene(page, "Intro", 5)


def test_default_config_placeholder_and_hosts(game):
    c = game.evaluate("__wikary.CFG.analytics")
    assert "TWOJE-KONTO" in c["goatcounterUrl"] and c["allowedHosts"] == ["ksiadz.trawiasta.pl"], c
    assert c["scriptSrc"] == "https://gc.zgo.at/count.js"
    st = game.evaluate("__wikary.Analytics.state")
    assert st["enabled"] is False and st["reason"] == "brak adresu konta", st
    assert game.evaluate("document.getElementById('goatcounter-script')") is None


def test_localhost_never_loads_even_with_account(page, base_url):
    hits = mock_goatcounter(page)
    override(page, goatcounterUrl=URL, allowedHosts=["ksiadz.trawiasta.pl", "127.0.0.1", "localhost"])
    open_game(page, base_url)
    st = page.evaluate("__wikary.Analytics.state")
    assert st["enabled"] is False and st["reason"] == "lokalnie", st
    start_new_game(page)                                                  # zdarzenie bez skryptu: nic się nie dzieje
    assert page.evaluate("document.getElementById('goatcounter-script')") is None
    assert page.evaluate("typeof window.goatcounter") == "undefined"
    assert hits == []


def test_decide_rules(game):
    r = game.evaluate(f"""(()=>{{const A=__wikary.Analytics, C=__wikary.CFG.analytics, u='{URL}';
        const d=(o)=>A.decide(Object.assign({{}}, C, {{goatcounterUrl:u, protocol:'https:'}}, o));
        return {{ok:d({{hostname:'ksiadz.trawiasta.pl'}}), ghp:d({{hostname:'pawelpppp.github.io'}}), file:d({{hostname:'', protocol:'file:'}}),
            lh:d({{hostname:'localhost'}}), ip:d({{hostname:'127.0.0.1'}}), ph:d({{hostname:'ksiadz.trawiasta.pl', goatcounterUrl:C.goatcounterUrl}}),
            empty:d({{hostname:'ksiadz.trawiasta.pl', goatcounterUrl:''}})}}}})()""")
    assert r == {"ok": "", "ghp": "host spoza allowedHosts", "file": "lokalnie", "lh": "lokalnie", "ip": "lokalnie",
                 "ph": "brak adresu konta", "empty": "brak adresu konta"}, r


def test_forced_host_loads_script_and_counts_start(page, base_url):
    hits = mock_goatcounter(page)
    override(page, goatcounterUrl=URL, hostname="ksiadz.trawiasta.pl")
    open_game(page, base_url)
    page.wait_for_function("window.__gcLoads === 1", timeout=5000)
    s = page.evaluate("(()=>{const s=document.getElementById('goatcounter-script'); return {src:s.src, data:s.getAttribute('data-goatcounter'), async:s.async}})()")
    assert s == {"src": "https://gc.zgo.at/count.js", "data": URL, "async": True}, s
    assert page.evaluate("window.__gcData") == URL
    assert page.evaluate("document.querySelectorAll('body *:not(script):not(canvas):not(#game)').length") == 0   # nic widocznego
    start_new_game(page)
    calls = page.evaluate("window.__gcCalls")
    assert calls == [{"path": "start-gry", "title": "Start gry", "event": True}], calls
    assert all("gc.zgo.at" in h for h in hits) and len(hits) == 1, hits     # tylko (mock) skrypt, nic więcej


def test_forced_host_placeholder_does_not_load(page, base_url):
    hits = mock_goatcounter(page)
    override(page, hostname="ksiadz.trawiasta.pl")                       # adres konta = placeholder z configu
    open_game(page, base_url)
    assert page.evaluate("__wikary.Analytics.state.reason") == "brak adresu konta"
    assert page.evaluate("document.getElementById('goatcounter-script')") is None and hits == []


def test_other_host_not_counted(page, base_url):
    hits = mock_goatcounter(page)
    override(page, goatcounterUrl=URL, hostname="pawelpppp.github.io")
    open_game(page, base_url)
    assert page.evaluate("__wikary.Analytics.state.reason") == "host spoza allowedHosts" and hits == []


def test_script_without_goatcounter_object_game_still_starts(page, base_url):
    """count.js się załadował, ale nie zdefiniował goatcountera (np. bloker podmienił plik): gra startuje normalnie."""
    mock_goatcounter(page, body="window.__gcLoads = 1;")
    override(page, goatcounterUrl=URL, hostname="ksiadz.trawiasta.pl")
    open_game(page, base_url)
    page.wait_for_function("window.__gcLoads === 1", timeout=5000)
    start_new_game(page)
    time.sleep(0.5)
    page.keyboard.press("Space")
    assert wait_scene(page, "Level", 5)
    assert page.evaluate("__wikary.Analytics.state.sent") == []
