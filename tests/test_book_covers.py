"""Unit tests for the standard-library cover importer (no network access)."""
from pathlib import Path
from tempfile import TemporaryDirectory
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from cache_book_covers import cache_covers, COVER_PATTERN


class CoverImportTests(unittest.TestCase):
    def test_only_explicit_open_library_isbn_urls_match(self):
        html = ('https://covers.openlibrary.org/b/isbn/9780525657743-L.jpg?default=false '
                'https://example.com/a.jpg')
        self.assertEqual(COVER_PATTERN.findall(html), ["9780525657743"])

    def test_import_changes_url_only_after_successful_download(self):
        good = "https://covers.openlibrary.org/b/isbn/9780525657743-L.jpg?default=false"
        bad = "https://covers.openlibrary.org/b/isbn/9780593321201-L.jpg?default=false"
        with TemporaryDirectory() as temp:
            index = Path(temp) / "index.html"
            folder = Path(temp) / "assets/books"
            index.write_text(f'<img src="{good}"><img src="{bad}">', encoding="utf-8")

            def fake_fetch(url):
                if url == bad:
                    raise ValueError("Cover unavailable")
                return b"\xff\xd8\xffimage bytes"

            count, failures = cache_covers(index, folder, fake_fetch)
            updated = index.read_text(encoding="utf-8")
            self.assertEqual(count, 1)
            self.assertEqual(len(failures), 1)
            self.assertIn('src="assets/books/isbn-9780525657743.jpg"', updated)
            self.assertIn(bad, updated)
            self.assertTrue((folder / "isbn-9780525657743.jpg").exists())

            count_again, _ = cache_covers(index, folder, fake_fetch)
            self.assertEqual(count_again, 0)
            self.assertEqual(updated, index.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
