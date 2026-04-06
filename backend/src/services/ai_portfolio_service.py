import json

from fastapi import HTTPException

from src.config import OPENAI_MODEL, RISK_FREE_RATE
from src.utils import mutual_fund_predicted_future_value

ADVISOR_FUNDS = [
    {"ticker": "VFINX", "name": "Vanguard 500 Index Fund", "beta": 1.00},
    {"ticker": "FXAIX", "name": "Fidelity 500 Index Fund", "beta": 1.01},
    {"ticker": "AGTHX", "name": "American Funds Growth Fund", "beta": 1.10},
    {"ticker": "VTSMX", "name": "Vanguard Total Stock Market", "beta": 1.00},
    {"ticker": "PRGFX", "name": "T. Rowe Price Growth Stock", "beta": 1.15},
    {"ticker": "FCNTX", "name": "Fidelity Contrafund", "beta": 1.08},
    {"ticker": "ANCFX", "name": "American Funds Fundamental", "beta": 0.95},
    {"ticker": "VWELX", "name": "Vanguard Wellington Fund", "beta": 0.72},
    {"ticker": "DODFX", "name": "Dodge & Cox International", "beta": 0.90},
]

MARKET_RETURN = 0.105


def _risk_beta_guidance(risk_tolerance: str) -> str:
    if risk_tolerance == "Low":
        return "Weighted-average portfolio beta should stay below 0.80."
    if risk_tolerance == "High":
        return "Weighted-average portfolio beta should be above 1.10."
    return "Weighted-average portfolio beta should stay near the market, around 0.85 to 1.15."


def _goal_guidance(goal: str) -> str:
    if goal == "Growth":
        return "Favor higher-beta growth-oriented funds while staying within the stated risk tolerance."
    if goal == "Income":
        return "Prefer steadier core funds and avoid concentrating entirely in higher-volatility growth funds."
    if goal == "Balanced":
        return "Blend defensive and market-like funds to balance upside and downside."
    if goal == "Capital Preservation":
        return "Favor the lowest-beta funds and avoid aggressive growth-heavy allocations."
    return "Align the portfolio with the client's stated goal."


def _build_prompt(
    risk_tolerance: str,
    principal: float,
    years: int,
    goal: str,
    notes: str,
) -> str:
    fund_lines = "\n".join(
        f'- {fund["ticker"]}: {fund["name"]} | beta={fund["beta"]:.2f}'
        for fund in ADVISOR_FUNDS
    )

    note_line = f"Additional client context: {notes}" if notes else "Additional client context: none"

    return f"""
You are a portfolio analyst. Return valid JSON only.

Client:
- risk tolerance: {risk_tolerance}
- principal: ${principal:.2f}
- years: {years}
- goal: {goal}
- {_risk_beta_guidance(risk_tolerance)}
- {_goal_guidance(goal)}
- {note_line}

Available funds:
{fund_lines}

Rules:
- Recommend 2 to 4 funds.
- Use only the listed tickers.
- Percentages must be integers that sum exactly to 100.
- Keep the recommendation consistent with the risk tolerance, time horizon, and goal.
- In the reasoning, explain tradeoffs clearly in 4 to 6 sentences.
""".strip()


def generate_portfolio_suggestion(
    risk_tolerance: str,
    principal: float,
    years: int,
    goal: str,
    notes: str = "",
):
    try:
        from openai import OpenAI
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="The OpenAI SDK is not installed in the backend environment."
        ) from exc

    try:
        client = OpenAI()
        response = client.responses.create(
            model=OPENAI_MODEL,
            input=_build_prompt(
                risk_tolerance=risk_tolerance,
                principal=principal,
                years=years,
                goal=goal,
                notes=notes,
            ),
            text={
                "format": {
                    "type": "json_schema",
                    "name": "portfolio_recommendation",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "allocations": {
                                "type": "array",
                                "minItems": 2,
                                "maxItems": 4,
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "ticker": {"type": "string"},
                                        "percentage": {"type": "integer"},
                                    },
                                    "required": ["ticker", "percentage"],
                                    "additionalProperties": False,
                                },
                            },
                            "reasoning": {"type": "string"},
                        },
                        "required": ["allocations", "reasoning"],
                        "additionalProperties": False,
                    },
                }
            },
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Failed to generate an AI portfolio recommendation."
        ) from exc

    try:
        parsed = json.loads(response.output_text)
    except (AttributeError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=502,
            detail="The AI response was not valid JSON."
        ) from exc

    enriched_allocations = []
    seen_tickers = set()

    for allocation in parsed["allocations"]:
        ticker = allocation["ticker"]

        if ticker in seen_tickers:
            raise HTTPException(
                status_code=502,
                detail="The AI response contained duplicate fund tickers."
            )
        seen_tickers.add(ticker)

        fund = next((fund for fund in ADVISOR_FUNDS if fund["ticker"] == ticker), None)
        if not fund:
            raise HTTPException(
                status_code=502,
                detail=f"The AI response included an unknown ticker: {ticker}."
            )

        expected_return = RISK_FREE_RATE + fund["beta"] * (MARKET_RETURN - RISK_FREE_RATE)
        invested = principal * (allocation["percentage"] / 100)
        future_value = mutual_fund_predicted_future_value(
            principal=invested,
            risk_free_rate=RISK_FREE_RATE,
            expected_market_return=MARKET_RETURN,
            beta=fund["beta"],
            years=years,
        )

        enriched_allocations.append({
            "ticker": ticker,
            "name": fund["name"],
            "beta": fund["beta"],
            "percentage": allocation["percentage"],
            "expected_return": expected_return,
            "invested": invested,
            "future_value": future_value,
        })

    total_percentage = sum(item["percentage"] for item in enriched_allocations)
    if total_percentage != 100:
        raise HTTPException(
            status_code=502,
            detail="The AI response allocations did not add up to 100%."
        )

    total_future_value = sum(item["future_value"] for item in enriched_allocations)

    return {
        "allocations": enriched_allocations,
        "reasoning": parsed["reasoning"],
        "principal": principal,
        "totalFV": total_future_value,
        "totalGain": total_future_value - principal,
    }
