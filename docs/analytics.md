# Visitor analytics setup and data model

This portfolio uses **Umami Cloud** to collect aggregated website analytics. Collection is **off by default** until you supply a website ID. There is no public analytics dashboard in the website UI. Local file previews and localhost are never tracked.

## What is collected

Umami can report pageviews, estimated unique visitors, visits, countries, device categories, browser, operating system, and referring sources. It also supports click events. Location is approximate and inferred from network information. Browser language and device characteristics are **not** evidence of nationality, age, gender, or a person's identity.

Configured custom events in this site:
- `contact-click` with one of `email`, `github`, `linkedin`
- `book-click` with the public book title
- `timeline-expand` with the public milestone/role label
- `theme-change` with the selected theme name

Do not add email addresses, names, IP addresses, precise locations, arbitrary URL query strings, or other personal data to custom event payloads. Do not implement visitor fingerprinting, unique identifiers, or cross-site tracking.

## Enable collection (one-time)

1. Make a **Umami Cloud** account (the Hobby tier is suitable for a low-traffic personal website).
2. Add a website with domain `ultraviolet888.github.io`. Use **the hostname only**, not `/violet-john/`.
3. In Umami, open that website's tracking-code settings and copy its **website ID** (a UUID). The site ID is public configuration, **not an API key**.
4. In `index.html`, set `<meta name="umami-website-id" content="YOUR-WEBSITE-UUID">` to that UUID, then review and merge the change.
5. Visit the **published** `https://ultraviolet888.github.io/violet-john/` page and check your Umami dashboard for a pageview. `file://`, localhost, and other hosts are intentionally ignored. Ad/tracker blockers can affect results.

The small `analytics.js` loader dynamically loads Umami's tracker only after a valid ID is set and the published hostname/path match. Pageviews are tracked automatically by Umami; do not double-record them manually. This configuration uses no own-party cookies or custom stable visitor IDs.

If your domain changes, adjust the hostname/path check and `data-domains` in `analytics.js`.

## Save aggregated statistics on GitHub (optional)

**Do not store raw visitor events in this repository**. Even a private repository can later become public. The exporter writes daily *aggregates only* to `analytics/daily/YYYY-MM-DD.json` for future graphs.

To enable the included GitHub Actions workflow:

1. In Umami Cloud: **Settings → API keys**. Create an API key for exports. Never put it into `index.html`, `analytics.js`, or a committed file.
2. In GitHub: **Repository → Settings → Secrets and variables → Actions**:
   - **Secret** `UMAMI_API_KEY` = your Umami Cloud API key (keep private).
   - **Variable** `UMAMI_WEBSITE_ID` = your website UUID.
3. After this PR is merged to `main`, open **Actions → Export aggregate visitor analytics → Run workflow** on `main` to test. The workflow also runs daily at 09:20 UTC.
4. Review the generated `analytics/daily/` JSON files. The workflow commits the previous UTC day's totals and coarse breakdowns to `main`; grant **Read and write permissions** to GitHub Actions if your repository requires this. Branch protection rules can prevent bot commits and may require a different workflow.

The script uses the Umami Cloud API via `https://api.umami.is/v1`. It exports daily `pageviews`, `visitors`, `visits`, `bounces`, `totaltime`, and country/device/browser/OS buckets. It does **not** export city, region, referring URLs, visitor IDs, IPs, or individual activities. Category values with fewer than **five** counts are rolled into a single **Other / suppressed** bucket. For a particularly low-traffic site, consider keeping even aggregated location reports private; daily totals alone may be enough.

The resulting JSON is **publicly accessible** in a public GitHub repository, and is deliberately separate from Umami's full analytics database. The exporter runs only if the GitHub variable is set; the website can collect data in Umami even if GitHub exports are disabled.

### Example JSON structure (illustrative, not real traffic)

```json
{
  "date": "2026-11-10",
  "timezone": "UTC",
  "schema_version": 1,
  "totals": {
    "pageviews": 24,
    "visitors": 18,
    "visits": 21,
    "bounces": 8,
    "totaltime": 1250
  },
  "breakdowns": {
    "country": [{"label": "US", "count": 12}, {"label": "Other / suppressed", "count": 6}],
    "device": [{"label": "desktop", "count": 13}, {"label": "Other / suppressed", "count": 5}],
    "browser": [{"label": "Chrome", "count": 10}, {"label": "Other / suppressed", "count": 8}],
    "os": [{"label": "Windows", "count": 11}, {"label": "Other / suppressed", "count": 7}]
  },
  "privacy": {
    "no_visitor_level_records": true,
    "minimum_visible_category_count": 5
  }
}
```

Metrics may use different denominators (views versus visitors), so do not assume the category totals always equal pageviews.

## Future dashboard

A future PR can load and visualize these JSON files as charts (e.g. visitor trends by day, device mix, country trends) without exposing any private API key or adding analytics to the public site UI. For richer visualizations, make authenticated calls to Umami from a **server-side job**, not from public browser JavaScript.

## Privacy and accuracy notes

- A static GitHub Pages site cannot safely write visitor events directly into a GitHub repo: a writable GitHub token in page JavaScript would expose credentials.
- Umami processes network information to estimate locations and visits. Its analytics records do not store IPs as ordinary event fields, though provider infrastructure may process/log them. Its browser data is imperfect and ad blockers reduce observed counts.
- Umami does not provide reliable **age, gender, or other personal demographics** from anonymous browser visits. More invasive collection is neither warranted nor accurate for this portfolio.
- Review applicable privacy/consent obligations and publish a clear visitor-facing analytics notice **before enabling production collection**. This PR does not turn collection on automatically.

## References

- [Umami: Collect data](https://docs.umami.is/docs/collect-data)
- [Umami: Track events](https://docs.umami.is/docs/track-events)
- [Umami: API keys](https://docs.umami.is/docs/cloud/api-key)
- [Umami: API guide](https://docs.umami.is/docs/api)
- [Umami: Metric definitions](https://docs.umami.is/docs/metric-definitions)
