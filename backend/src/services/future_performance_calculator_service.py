from src.services.mutual_fund_service import get_mutual_fund_by_ticker
from src.services.beta_call_service import get_beta
from src.services.market_return_rate_service import get_expected_market_return
from src.config import RISK_FREE_RATE
from src.utils import mutual_fund_predicted_future_value


def calculate_future_performance(
    ticker: str,
    principal: float,
    years: int
):
    """
    Top-level service that orchestrates the full CAPM-based future value calculation.

    CAPM Formula:
        r = rf + β * (E[Rm] - rf)

    Future Value Formula:
        FV = P * (1 + r)^t

    Where:
        rf = risk-free rate
        β  = beta of the mutual fund
        E[Rm] = expected market return (last year)
        P  = principal
        t  = years
    """

    # 1️⃣ Validate fund exists
    fund = get_mutual_fund_by_ticker(ticker)

    # 2️⃣ Fetch beta from Newton API
    beta = get_beta(ticker)

    # 3️⃣ Fetch expected market return (last year's return)
    expected_market_return = get_expected_market_return(ticker)

    # 4️⃣ Compute future value using CAPM + compounding
    future_value = mutual_fund_predicted_future_value(
        principal=principal,
        risk_free_rate=RISK_FREE_RATE,
        expected_market_return=expected_market_return,
        beta=beta,
        years=years
    )

    return {
        "ticker": ticker,
        "fund_name": fund["name"],
        "principal": principal,
        "years": years,
        "risk_free_rate": RISK_FREE_RATE,
        "beta": beta,
        "expected_market_return": expected_market_return,
        "future_value": future_value
    }