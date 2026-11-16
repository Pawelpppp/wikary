"""Wspólne fixtury testów gry Przygody Księdza Kamila.

- bez --base-url: startuje lokalny http.server (wolny port) z katalogiem głównym repo,
- z --base-url (np. https://pawelpppp.github.io/wikary/): testuje wskazaną stronę.
Każdy test kończy się porażką przy błędzie w konsoli, pageerror, odpowiedzi HTTP >= 400
albo próbie połączenia z obcym hostem (dozwolone: strona gry i cdn.jsdelivr.net z Phaserem).
"""
import functools
import http.server
import re
import threading
from pathlib import Path
from urllib.parse import urlparse

import pytest

REPO = Path(__file__).resolve().parent.parent
ARTIFACTS = Path(__file__).resolve().parent / "artifacts"
ALLOWED_EXTRA_HOSTS = {"cdn.jsdelivr.net"}


class _QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class _QuietServer(http.server.ThreadingHTTPServer):
    daemon_threads = True

    def handle_error(self, request, client_address):
        pass  # zerwane połączenia przy zamykaniu przeglądarki nie są błędem testu


@pytest.fixture(scope="session")
def base_url(pytestconfig):
    """Nadpisuje fixturę pytest-playwright: URL z --base-url albo lokalny serwer."""
    url = pytestconfig.getoption("base_url")
    if url:
        yield url if url.endswith("/") else url + "/"
        return
    handler = functools.partial(_QuietHandler, directory=str(REPO))
    srv = _QuietServer(("127.0.0.1", 0), handler)
    th = threading.Thread(target=srv.serve_forever, daemon=True)
    th.start()
    yield f"http://127.0.0.1:{srv.server_address[1]}/"
    srv.shutdown()


@pytest.fixture(scope="session")
def is_local(base_url):
    return urlparse(base_url).hostname in ("127.0.0.1", "localhost")


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    return {**browser_context_args, "viewport": {"width": 568, "height": 320}}


@pytest.fixture(scope="session")
def browser_type_launch_args(browser_type_launch_args):
    return {**browser_type_launch_args, "args": ["--no-sandbox"]}


def attach_guard(page, errors, base_url):
    """Zbiera błędy strony do listy `errors` i blokuje ruch do obcych hostów."""
    allowed = {urlparse(base_url).hostname} | ALLOWED_EXTRA_HOSTS

    def on_console(msg):
        if msg.type == "error":
            errors.append(f"console.error: {msg.text}")

    page.on("console", on_console)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on("response", lambda r: errors.append(f"HTTP {r.status}: {r.url}") if r.status >= 400 else None)

    def route(rt):
        u = urlparse(rt.request.url)
        if u.scheme in ("data", "blob") or u.hostname in allowed:
            rt.continue_()
        else:
            errors.append(f"blocked external request: {rt.request.url}")
            rt.abort()

    page.route("**/*", route)
    # tablica wyników tylko lokalnie - czyścimy ją przed startem gry
    page.add_init_script("try { if (!sessionStorage.getItem('__wk_clean')) { localStorage.removeItem('wikary_leaderboard'); localStorage.removeItem('wikary_last_nick'); sessionStorage.setItem('__wk_clean', '1'); } } catch (e) {}")


@pytest.fixture(autouse=True)
def _guard(request, page, base_url):
    request.node.wikary_errors = []
    request.node.wikary_pages = [page]
    attach_guard(page, request.node.wikary_errors, base_url)
    yield


@pytest.fixture
def new_page(request, browser, base_url):
    """Dodatkowa strona z własnymi opcjami kontekstu (np. dotyk), też pilnowana."""
    contexts = []

    def make(**ctx_args):
        ctx = browser.new_context(**{"viewport": {"width": 568, "height": 320}, **ctx_args})
        contexts.append(ctx)
        pg = ctx.new_page()
        attach_guard(pg, request.node.wikary_errors, base_url)
        request.node.wikary_pages.append(pg)
        return pg

    yield make
    for c in contexts:
        c.close()


@pytest.hookimpl(wrapper=True)
def pytest_runtest_call(item):
    res = yield
    errs = getattr(item, "wikary_errors", [])
    if errs:
        pytest.fail("Błędy strony:\n" + "\n".join(errs), pytrace=False)
    return res


@pytest.hookimpl(wrapper=True)
def pytest_runtest_makereport(item, call):
    rep = yield
    if rep.when == "call" and rep.failed:
        ARTIFACTS.mkdir(exist_ok=True)
        name = re.sub(r"[^\w.-]+", "_", item.nodeid)
        for i, pg in enumerate(getattr(item, "wikary_pages", [])):
            try:
                pg.screenshot(path=str(ARTIFACTS / f"{name}_{i}.png"))
            except Exception:
                pass
    return rep


@pytest.fixture
def game(page, base_url):
    """Gra na ekranie tytułowym z hookiem testowym (?debug=1)."""
    from wikary import open_game
    open_game(page, base_url)
    return page
