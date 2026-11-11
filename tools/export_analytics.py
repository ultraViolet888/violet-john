#!/usr/bin/env python3
"""Export a single UTC day's *aggregate* Umami Cloud stats for future visualizations.

No raw event records, IP addresses, city/region, URLs, identifiers, or API keys are exported.
The output is safe to review in a public repository but remains publicly visible.
"""
import datetime as dt
import json
import os
from pathlib import Path
import sys
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://api.umami.is/v1"
MIN_BREAKDOWN_COUNT = 5  # Suppress low-count per-category values.
MAX_ROWS = 100


def request_json(website_id, api_key, route, parameters):
    query = urllib.parse.urlencode(parameters)
    url = f"{BASE_URL}/websites/{urllib.parse.quote(website_id, safe='')}/{route}?{query}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "User-Agent": "violet-john-aggregate-export/1.0",
    })
    with urllib.request.urlopen(req, timeout=25) as response:
        return json.load(response)


def safe_breakdown(rows):
    """Keep only broadly represented values; bucket everything else as Other."""
    if not isinstance(rows, list):
        raise ValueError("Unexpected metrics API response")
    public = []
    other = 0
    for item in rows:
        if not isinstance(item, dict):
            raise ValueError("Unexpected metrics row")
        label, count = item.get("x"), item.get("y")
        if not isinstance(count, (int, float)) or isinstance(count, bool) or count < 0:
            raise ValueError("Invalid metric count")
        count = int(count)
        if isinstance(label, str) and 0 < len(label) <= 80 and count >= MIN_BREAKDOWN_COUNT:
            public.append({"label": label, "count": count})
        else:
            other += count
    if other:
        public.append({"label": "Other / suppressed", "count": other})
    return sorted(public, key=lambda item: (-item["count"], item["label"]))


def main():
    key = os.environ.get("UMAMI_API_KEY", "").strip()
    website_id = os.environ.get("UMAMI_WEBSITE_ID", "").strip()
    if not key or not website_id:
        raise SystemExit("UMAMI_API_KEY and UMAMI_WEBSITE_ID must be configured")

    # Always export yesterday, never an incomplete current-day interval.
    day = dt.datetime.now(dt.timezone.utc).date() - dt.timedelta(days=1)
    start = dt.datetime.combine(day, dt.time.min, tzinfo=dt.timezone.utc)
    end = start + dt.timedelta(days=1)
    interval = {"startAt": int(start.timestamp() * 1000), "endAt": int(end.timestamp() * 1000)}

    stats = request_json(website_id, key, "stats", interval)
    if not isinstance(stats, dict):
        raise ValueError("Unexpected summary API response")

    # No page URLs/referrer URLs or fine location are exported to the public repository.
    report = {
        "date": day.isoformat(),
        "timezone": "UTC",
        "schema_version": 1,
        "totals": {},
        "breakdowns": {},
        "privacy": {
            "no_visitor_level_records": True,
            "minimum_visible_category_count": MIN_BREAKDOWN_COUNT,
        },
    }
    for field in ("pageviews", "visitors", "visits", "bounces", "totaltime"):
        value = stats.get(field)
        if not isinstance(value, (int, float)) or isinstance(value, bool) or value < 0:
            raise ValueError(f"Missing or invalid stats field: {field}")
        report["totals"][field] = int(value)

    for dimension in ("country", "device", "browser", "os"):
        data = request_json(website_id, key, "metrics", {**interval, "type": dimension, "limit": MAX_ROWS})
        report["breakdowns"][dimension] = safe_breakdown(data)

    output = ROOT / "analytics" / "daily" / f"{day.isoformat()}.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Saved aggregate analytics for {day.isoformat()} to {output.relative_to(ROOT)}")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"Analytics export failed: {error}", file=sys.stderr)
        sys.exit(1)
