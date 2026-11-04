"""Проверка сайта без сети: ссылки, якоря, заголовки, описания, карта сайта. Код выхода 1 при ошибках."""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.duplicates = []
        self.links = []
        self.h1 = 0
        self.has_description = False
        self.title = ""
        self.in_title = False
        self.h2_count = 0
        self.in_main = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            if attrs["id"] in self.ids:
                self.duplicates.append(attrs["id"])
            self.ids.add(attrs["id"])
        if tag == "main":
            self.in_main = True
        if tag == "h1":
            self.h1 += 1
        if tag == "h2" and self.in_main:
            self.h2_count += 1
            self.ids.add(f"sec-{self.h2_count}")
        if tag == "title":
            self.in_title = True
        if tag == "meta" and attrs.get("name") == "description" and attrs.get("content"):
            self.has_description = True
        for name in ("href", "src"):
            if attrs.get(name) and tag != "link" or (tag == "link" and name == "href" and attrs.get("rel") in ("stylesheet", "icon", "apple-touch-icon")):
                if attrs.get(name):
                    self.links.append(attrs[name])

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "main":
            self.in_main = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


def main():
    pages = {}
    for path in sorted(ROOT.glob("*.html")):
        page = Page()
        page.feed(path.read_text(encoding="utf-8"))
        pages[path.name] = page

    errors = []
    for name, page in pages.items():
        if page.h1 != 1:
            errors.append(f"{name}: заголовков h1 — {page.h1}, нужен один")
        for duplicate in page.duplicates:
            errors.append(f"{name}: повторяется id {duplicate}")
        if not page.title.strip():
            errors.append(f"{name}: нет title")
        if not page.has_description and name != "404.html":
            errors.append(f"{name}: нет description")
        for link in page.links:
            parts = urlsplit(link)
            if parts.scheme or link.startswith(("//", "mailto:", "tel:", "data:")):
                continue
            # Страница 404 открывается с любого адреса, поэтому её ссылки абсолютные
            target = unquote(parts.path).removeprefix("/PyWebGuide/") or (name if not parts.path else "index.html")
            if not (ROOT / target).exists():
                errors.append(f"{name}: нет файла {link}")
            elif parts.fragment and target in pages and parts.fragment not in pages[target].ids:
                errors.append(f"{name}: нет якоря {link}")

    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    listed = {Path(urlsplit(url).path).name for url in re.findall(r"<loc>(.*?)</loc>", sitemap)}
    for name in pages:
        if name not in ("404.html", "index.html") and name not in listed:
            errors.append(f"sitemap.xml: нет страницы {name}")

    for error in errors:
        print("ОШИБКА", error)
    print(f"Страниц: {len(pages)}, ошибок: {len(errors)}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
