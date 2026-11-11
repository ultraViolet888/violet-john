#!/usr/bin/env python3
"""Import book covers into assets/books and switch the site's image paths.

Run from the repository root: python tools/import_book_covers.py

This is a one-time asset import, not a scraper. Please review cover-art usage rights
before distributing the resulting images in a public repository.
"""
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
import re

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
DEST = ROOT / "assets" / "books"
ISBN_PATTERN = re.compile(
    r'src="https://covers\.openlibrary\.org/b/isbn/([0-9Xx]+)-M\.jpg\?default=false"'
)
MAX_BYTES = 2_000_000

def main():
    html = INDEX.read_text(encoding="utf-8")
    isbns = list(dict.fromkeys(ISBN_PATTERN.findall(html)))
    if not isbns:
        raise SystemExit("No external Open Library ISBN cover URLs found in index.html.")
    print(f"Preparing {len(isbns)} book covers...")
    DEST.mkdir(parents=True, exist_ok=True)
    successes, failures = [], []

    for isbn in isbns:
        target = DEST / f"{isbn}.jpg"
        url = f"https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg?default=false"
        try:
            if not target.exists():
                req = Request(url, headers={"User-Agent": "VioletJohnPortfolio/1.0 (personal book shelf)"})
                with urlopen(req, timeout=20) as response:
                    content_type = response.headers.get("Content-Type", "").lower()
                    if "image/" not in content_type:
                        raise ValueError(f"Unexpected content type: {content_type}")
                    data = response.read(MAX_BYTES + 1)
                if len(data) > MAX_BYTES or not data.startswith(b"\xff\xd8"):
                    raise ValueError("Invalid or oversized JPEG response")
                target.write_bytes(data)
            successes.append(isbn)
            print(f"  OK: {isbn}.jpg ({target.stat().st_size:,} bytes)")
        except (HTTPError, URLError, TimeoutError, ValueError, OSError) as error:
            failures.append((isbn, str(error)))
            print(f"  FAILED: {isbn}: {error}")

    for isbn in successes:
        html = html.replace(
            f'https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg?default=false',
            f'assets/books/{isbn}.jpg'
        )
    if successes:
        INDEX.write_text(html, encoding="utf-8")
        print(f"Updated {len(successes)} image paths in index.html.")
    if failures:
        print("External image URLs remain for covers that could not be downloaded.")
        for isbn, reason in failures:
            print(f"  {isbn}: {reason}")
        raise SystemExit(1)
    print("All files are ready. Review assets/books and commit them with index.html.")

if __name__ == "__main__":
    main()
