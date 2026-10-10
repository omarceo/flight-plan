#!/usr/bin/env python3
"""Bundle the project into one self-contained file: dist/flight-plan.html

Usage:  python3 tools/build.py
No dependencies. Inlines css/*.css and js/*.js in the order listed in index.html.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent


def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


html = read("index.html")
html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', lambda m: "<style>\n" + read(m.group(1)) + "\n</style>", html)
html = re.sub(r'<script src="(js/[^"]+)"></script>', lambda m: "<script>\n" + read(m.group(1)) + "\n</script>", html)
html = re.sub(r'\s*<link rel="manifest"[^>]*>', "", html)

out = ROOT / "dist" / "flight-plan.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf-8")
print(f"Wrote {out.relative_to(ROOT)} ({len(html) // 1024} KB)")
