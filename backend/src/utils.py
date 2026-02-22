"""
stores formulas we need

1.  Mutual Fund Predicted Future Performance Formula - principal rate, risk free rate, beta, expected rate, time
"""


# Capital Asset Pricing Model (CAPM):
# r = rf + beta * (E[Rm] - rf), then compound: FV = P(1 + r)^t
def mutual_fund_predicted_future_value(
    principal: float,
    risk_free_rate: float,
    expected_market_return: float,
    beta: float,
    years: int

):
    r = risk_free_rate + beta * (expected_market_return - risk_free_rate)
    future_value = principal * ((1 + r) ** years)
    return future_value