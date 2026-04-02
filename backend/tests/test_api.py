import unittest
from pathlib import Path
import sys
from unittest.mock import patch

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.main import app


class MutualFundApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_health_endpoint(self) -> None:
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_list_mutual_funds_returns_seed_data(self) -> None:
        response = self.client.get("/api/mutual-funds")

        self.assertEqual(response.status_code, 200)
        funds = response.json()
        self.assertGreater(len(funds), 0)
        self.assertIn("ticker", funds[0])
        self.assertIn("name", funds[0])

    @patch("src.routes.mutual_fund.calculate_future_performance")
    def test_future_value_endpoint_returns_calculation(
        self,
        mock_calculate_future_performance,
    ) -> None:
        mock_calculate_future_performance.return_value = {
            "ticker": "VFIAX",
            "fund_name": "Vanguard 500 Index Fund; Admiral",
            "principal": 1000.0,
            "years": 5,
            "risk_free_rate": 0.0408,
            "beta": 1.02,
            "expected_return_rate": 0.11,
            "future_value": 1659.34,
        }

        response = self.client.post(
            "/api/future-value",
            json={"ticker": "VFIAX", "principal": 1000, "years": 5},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["future_value"], 1659.34)
        mock_calculate_future_performance.assert_called_once_with(
            ticker="VFIAX",
            principal=1000.0,
            years=5,
        )

    def test_future_value_endpoint_rejects_invalid_payload(self) -> None:
        response = self.client.post(
            "/api/future-value",
            json={"ticker": "VFIAX", "principal": -50, "years": 0},
        )

        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
