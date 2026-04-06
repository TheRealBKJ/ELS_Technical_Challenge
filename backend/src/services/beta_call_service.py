import requests
from fastapi import HTTPException
from src.config import (
    NEWTON_BETA_URL,
    NEWTON_INDEX,
    NEWTON_INTERVAL,
    NEWTON_OBSERVATIONS
)

def get_beta(ticker:str) -> float:
    params = {
        "ticker": ticker,
        "index": NEWTON_INDEX,
        "interval": NEWTON_INTERVAL,
        "observations": NEWTON_OBSERVATIONS
    }
    try:
        response = requests.get(NEWTON_BETA_URL, params=params, timeout=10)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail="Failed to fetch beta from Newton Analytics API."
        ) from exc

    try:
        data = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=502,
            detail="Received an invalid response from Newton Analytics API."
        ) from exc

    if "data" not in data:
        raise HTTPException(
            status_code=404,
            detail=f"Beta not available for ticker '{ticker}'."
        )

    beta_data = data["data"]

    if isinstance(beta_data, dict):
        beta_value = beta_data.get("beta")
    else:
        beta_value = beta_data
    
    try:
        return float(beta_value)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=500,
            detail="Invalid beta format received from API."
        )







