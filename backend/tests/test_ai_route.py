import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from src.main import app


class AiRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    @patch("src.routes.mutual_fund.generate_portfolio_suggestion")
    def test_ai_portfolio_suggestion_route(self, mock_generate_portfolio_suggestion) -> None:
        mock_generate_portfolio_suggestion.return_value = {
            "allocations": [
                {
                    "ticker": "VWELX",
                    "name": "Vanguard Wellington Fund",
                    "beta": 0.72,
                    "percentage": 40,
                    "expected_return": 0.0834,
                    "invested": 4000,
                    "future_value": 8900,
                },
                {
                    "ticker": "FXAIX",
                    "name": "Fidelity 500 Index Fund",
                    "beta": 1.01,
                    "percentage": 60,
                    "expected_return": 0.1061,
                    "invested": 6000,
                    "future_value": 16500,
                },
            ],
            "reasoning": "This mix balances core equity exposure with a steadier allocation.",
            "principal": 10000,
            "totalFV": 25400,
            "totalGain": 15400,
        }

        response = self.client.post(
            "/api/ai/portfolio-suggestion",
            json={
                "risk_tolerance": "Medium",
                "principal": 10000,
                "years": 10,
                "goal": "Balanced",
                "notes": "",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["principal"], 10000)
        self.assertEqual(len(response.json()["allocations"]), 2)


if __name__ == "__main__":
    unittest.main()
