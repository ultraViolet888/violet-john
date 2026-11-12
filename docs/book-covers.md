# Book cover importer

The original **12 Professional** covers are already local files in `assets/books`. The **29 Personal** covers currently load from Open Library's public Covers API.

`tools/cache_book_covers.py` scans `index.html` for Open Library ISBN cover URLs, downloads available JPEGs into `assets/books/isbn-<ISBN>.jpg`, and replaces only successfully downloaded image URLs with local paths. The book links, notes and tooltips stay unchanged.

## Automatic import in this PR

The workflow `.github/workflows/cache-book-covers.yml` runs when commits are pushed to `feature/cache-personal-book-covers`. After tests pass, it downloads available covers and commits the images plus updated `index.html` **to that feature branch**, so the result is visible in the same PR for review. It does **not** write directly to `main`.

Open **Actions → Cache personal book covers** to monitor the run. If GitHub Actions write permissions are restricted by repository policy, the automated commit can fail; the importer can still be run locally.

## Reuse for future books

Run `python tools/cache_book_covers.py` from the repository root after adding book cards that point to `https://covers.openlibrary.org/b/isbn/ISBN-L.jpg?default=false`. Commit the resulting local JPEG files and `index.html`. No additional packages or API keys are required.

If a requested ISBN has no image, a download fails, or the response is not JPEG, the source URL remains unchanged and the tool prints a warning. You can then choose another edition/cover and rerun it. This is intentionally not a scraper for arbitrary websites.

Images are publisher-owned cover art. Review cover matches before merging, and retain attribution where required. The provider's cover data may be incomplete or change.
