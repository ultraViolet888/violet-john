"""Offline unit tests for safe public analytics aggregation."""
import importlib.util
from pathlib import Path
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "tools" / "export_analytics.py"
SPEC = importlib.util.spec_from_file_location("export_analytics", SCRIPT)
mod = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)


class SafeBreakdownTests(unittest.TestCase):
    def test_suppresses_low_count_categories(self):
        rows = [
            {"x": "US", "y": 14}, {"x": "DK", "y": 2}, {"x": "FR", "y": 1},
            {"x": "CA", "y": 5},
        ]
        self.assertEqual(mod.safe_breakdown(rows), [
            {"label": "US", "count": 14},
            {"label": "CA", "count": 5},
            {"label": "Other / suppressed", "count": 3},
        ])

    def test_rejects_bad_aggregates(self):
        with self.assertRaises(ValueError):
            mod.safe_breakdown([{"x": "US", "y": -1}])
        with self.assertRaises(ValueError):
            mod.safe_breakdown([{"x": "US", "y": "two"}])

    def test_empty_metrics_are_valid(self):
        self.assertEqual(mod.safe_breakdown([]), [])


if __name__ == "__main__":
    unittest.main()
