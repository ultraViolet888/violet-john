# Visitor analytics — Umami Cloud (free tier)

This site uses Umami Cloud for privacy-conscious analytics. **No GitHub Actions export, Umami API key, or analytics JSON snapshots are required.** All metrics stay in Umami's dashboard; there is no analytics dashboard in the public site UI.

## What is tracked

- Pageviews and Umami's aggregate visit/visitor counts
- Approximate country, browser, operating system, device class and referral breakdowns, where available
- Click events for Email, GitHub, LinkedIn and the 12 book covers
- Theme selection and timeline expansion
- Professional/Personal tab selection

Analytics is not a reliable source of age, gender or individual identity; do not attempt to infer them. No custom visitor identifiers, IPs, email addresses or other personal data are sent as event properties.

## Site configuration

The Umami website is already registered in the owner's account. Its public website ID is set in `index.html`:

```html
<meta name="umami-website-id" content="69f5e729-db71-42ea-af1f-0763abc2fc99">
<script defer src="analytics.js"></script>
```

The `analytics.js` loader loads the hosted Umami tracker only when the page is on `https://ultraviolet888.github.io/violet-john/` and the ID is valid. Opening `index.html` locally does not trigger tracking.

Once this PR is merged and published, open the live website and check the Umami dashboard to verify a pageview. Browser privacy protections and extensions can block the tracker, so metrics are estimates rather than a complete census.

## Future dashboard

A custom dashboard is still possible later, but Umami Cloud's free plan does **not** include API-key access. Options include:
- Keeping the free Umami dashboard as the only analytics view
- Using a different provider with a free aggregate-data API
- Self-hosting Umami if its extra infrastructure and maintenance are worthwhile

Do not put API keys into `index.html`, JavaScript or public GitHub files. Raw visitor data should not be committed to the public repository.

Review the appropriate privacy notice/consent obligations before enabling collection on a public website.

Reference: https://docs.umami.is/docs/collect-data
