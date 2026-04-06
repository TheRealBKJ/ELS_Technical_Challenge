import unittest
from types import SimpleNamespace
from unittest.mock import patch

import pandas as pd

from src.services.market_return_rate_service import get_expected_return_rate


class MarketReturnRateServiceTests(unittest.TestCase):
    def test_get_expected_return_rate_accepts_multiindex_price_frame(self) -> None:
        fake_yfinance = SimpleNamespace(download=lambda *args, **kwargs: pd.DataFrame(
            {
                ("Close", "VFIAX"): [100.0, 110.0],
            }
        ))

        with patch.dict("sys.modules", {"yfinance": fake_yfinance}):
            expected_return_rate = get_expected_return_rate("VFIAX")

        self.assertAlmostEqual(expected_return_rate, 0.10)


if __name__ == "__main__":
    unittest.main()
