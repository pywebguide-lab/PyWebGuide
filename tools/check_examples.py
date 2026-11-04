"""Проверка примеров кода: блоки data-run запускаются, остальные блоки *.py проверяются на синтаксис."""
import ast
import subprocess
import sys
import tempfile
import textwrap
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NOT_PYTHON = ("Терминал", ".html", "SQL", "JSON", ".gitignore", "requirements", "JavaScript", ".js", "HTTP", ".md")


class Blocks(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks = []
        self.depth = 0
        self.block = None
        self.in_label = False
        self.in_code = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "div" and "code-block" in (attrs.get("class") or "").split():
            self.block = {"run": "data-run" in attrs, "label": "", "code": "", "depth": self.depth}
        if tag == "div":
            self.depth += 1
        if self.block is not None and tag == "span" and not self.block["label"]:
            self.in_label = True
        if self.block is not None and tag == "code":
            self.in_code = True

    def handle_endtag(self, tag):
        if tag == "span":
            self.in_label = False
        if tag == "code":
            self.in_code = False
        if tag == "div":
            self.depth -= 1
            if self.block is not None and self.depth == self.block["depth"]:
                self.blocks.append(self.block)
                self.block = None

    def handle_data(self, data):
        if self.in_label:
            self.block["label"] += data
        elif self.in_code:
            self.block["code"] += data


def main():
    failed = checked = ran = 0
    for path in sorted(ROOT.glob("*.html")):
        parser = Blocks()
        parser.feed(path.read_text(encoding="utf-8"))
        for block in parser.blocks:
            label = block["label"].strip()
            if block["run"]:
                ran += 1
                with tempfile.TemporaryDirectory() as folder:
                    result = subprocess.run([sys.executable, "-c", block["code"]], cwd=folder, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=60, env={**__import__("os").environ, "PYTHONIOENCODING": "utf-8"})
                if result.returncode:
                    failed += 1
                    print(f"ОШИБКА запуска {path.name} «{label}»:\n{result.stderr[-600:]}")
            elif label.endswith(".py") or "WSGI" in label or not any(mark in label for mark in NOT_PYTHON):
                checked += 1
                try:
                    ast.parse(textwrap.dedent(block["code"]))
                except SyntaxError as error:
                    failed += 1
                    print(f"ОШИБКА синтаксиса {path.name} «{label}»: {error}")
    print(f"Запущено: {ran}, проверено на синтаксис: {checked}, ошибок: {failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
