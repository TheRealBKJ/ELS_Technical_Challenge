import json
from pathlib import Path
from fastapi import HTTPException

#path to our data we take
MUTUAL_FUND_DATA = Path(__file__).resolve().parent.parent / "data" / "mutual_fund.json"



def get_all_mutual_funds():
    with open(DATA_PATH, "r") as f:
        return json.load(f)


def get_mutual_fund_by_ticker(ticker: str):
    funds = get_all_mutual_funds()

    for fund in funds:
        if fund["ticker"].upper() == ticker.upper():
            return fund

    # If not found
    raise HTTPException(
        status_code=404,
        detail=f"Mutual fund with ticker '{ticker}' not found."
    )