import unittest
from unittest.mock import Mock, patch

from src.services.beta_call_service import get_beta


class BetaCallServiceTests(unittest.TestCase):
    @patch("src.services.beta_call_service.requests.get")
    def test_get_beta_accepts_scalar_data_payload(self, mock_get) -> None:
        response = Mock()
        response.json.return_value = {
            "status": 200,
            "data": 1.07,
        }
        response.raise_for_status.return_value = None
        mock_get.return_value = response

        beta = get_beta("VFIAX")

        self.assertEqual(beta, 1.07)


if __name__ == "__main__":
    unittest.main()
