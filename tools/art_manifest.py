#!/usr/bin/env python3
"""Generuje src/art_files.js: listę grafik obecnych w assets/{game,sprites,portraits}.

Gra ładuje tylko pliki z tej listy, a dla brakujących używa zamienników z src/art.js
(bez żądań 404). Po wrzuceniu nowych grafik do assets/ uruchom:
    python3 tools/art_manifest.py
Test tests/test_art.py pilnuje, żeby lista była aktualna.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIRS = ["assets/game", "assets/sprites", "assets/portraits"]


def build():
    files = {}
    for d in DIRS:
        for p in sorted((ROOT / d).glob("*.png")):
            if p.stem.endswith("_x4"):
                continue
            files.setdefault(p.stem, f"{d}/{p.name}")
    lines = ",\n".join(f"    '{k}': '{v}'" for k, v in sorted(files.items()))
    return ("'use strict';\n/* PLIK GENEROWANY: python3 tools/art_manifest.py (nie edytuj ręcznie).\n"
            "   Grafiki obecne w repo: klucz -> ścieżka. */\nconst ART_FILES = {\n" + lines + ",\n};\n")


if __name__ == "__main__":
    out = ROOT / "src" / "art_files.js"
    out.write_text(build(), encoding="utf-8")
    print(f"zapisano {out.relative_to(ROOT)}")
