#!/usr/bin/env python3
"""Cache the Personal shelf's Open Library covers in assets/books.

Run from the repository root: python tools/cache_book_covers.py
No packages or API credentials required. A missing cover stays external.
"""
from pathlib import Path
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
DESTINATION = ROOT / "assets" / "books"
COVER_PATTERN = re.compile(
    r'https://covers\.openlibrary\.org/b/isbn/(\d{13})-L\.jpg\?default=false'
)
MAX_BYTES = 5 * 1024 * 1024


def fetch_cover(url):
    """Return JPEG bytes only; do not save Open Library's missing-cover placeholder."""
    request = Request(url, headers={"User-Agent": "violet-john-book-cover-importer/1.0"})
    with urlopen(request, timeout=25) as response:
        content_type = response.headers.get_content_type()
        data = response.read(MAX_BYTES + 1)
    if content_type not in ("image/jpeg", "image/jpg"):
        raise ValueError(f"Unexpected content type: {content_type}")
    if len(data) > MAX_BYTES or not data.startswith(b"\xff\xd8\xff"):
        raise ValueError("Response is not a valid-sized JPEG")
    return data


def cache_covers(index=INDEX, folder=DESTINATION, fetch=fetch_cover):
    html = index.read_text(encoding="utf-8")
    urls = sorted(set(COVER_PATTERN.findall(html)))
    saved = 0
    failures = []
    for isbn in urls:
        remote = f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false"
        local = f"assets/books/isbn-{isbn}.jpg"
        path = folder / f"isbn-{isbn}.jpg"
        try:
            if not path.is_file() or not path.read_bytes().startswith(b"\xff\xd8\xff"):
                cover = fetch(remote)
                folder.mkdir(parents=True, exist_ok=True)
                path.write_bytes(cover)
            html = html.replace(remote, local)
            saved += 1
        except (HTTPError, URLError, TimeoutError, OSError, ValueError) as exc:
            failures.append((isbn, str(exc)))
    if saved:
        index.write_text(html, encoding="utf-8")
    print(f"Locally cached {saved} covers; {len(failures)} still use external URLs.")
    for isbn, reason in failures:
        print(f"  {isbn}: {reason}")
    return saved, failures


if __name__ == "__main__":
    cache_covers()
