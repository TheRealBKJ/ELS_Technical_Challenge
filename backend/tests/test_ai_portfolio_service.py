import json
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from src.services.ai_portfolio_service import generate_portfolio_suggestion


class AiPortfolioServiceTests(unittest.TestCase):
    def test_generate_portfolio_suggestion_enriches_allocations(self) -> None:
        fake_response = SimpleNamespace(
            output_text=json.dumps(
                {
                    "allocations": [
                        {"ticker": "VWELX", "percentage": 40},
                        {"ticker": "FXAIX", "percentage": 60},
                    ],
                    "reasoning": "A balanced mix keeps downside in check while preserving upside.",
                }
            )
        )

        class FakeResponses:
            def create(self, **kwargs):
                return fake_response

        class FakeOpenAI:
            def __init__(self):
                self.responses = FakeResponses()

        with patch.dict("sys.modules", {"openai": SimpleNamespace(OpenAI=FakeOpenAI)}):
            result = generate_portfolio_suggestion(
                risk_tolerance="Medium",
                principal=10000,
                years=10,
                goal="Balanced",
                notes="",
            )

        self.assertEqual(len(result["allocations"]), 2)
        self.assertEqual(sum(item["percentage"] for item in result["allocations"]), 100)
        self.assertGreater(result["totalFV"], 0)
        self.assertIn("reasoning", result)


if __name__ == "__main__":
    unittest.main()
