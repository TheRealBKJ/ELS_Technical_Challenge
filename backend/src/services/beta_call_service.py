import requests 
from fastapi import HTTPException
from src.config import (
    NEWTON_BETA_URL,
    NEWTON_INDEX,
    NEWTON_INTERVAL,
    NEWTON_OBSERVATIONS
)



def get_beta(ticker:str) -> float:
    params ={
        "ticker": ticker,
        "index": NEWTON_INDEX,
        "interval": NEWTON_INTERVAL,
        "observations": NEWTON_OBSERVATIONS
    }
    try:
        response = requests.get(NEWTON_BETA_URL, params= params)
        

    except requests.RequestException:
        raise HTTPException(
            status_code=502,
            detail="Failed to fetch beta from Newton Analytics API."
        )

    data = response.json()

    #cant find data for ticker
    if "data" not in data or "beta" not in data["data"]:
        raise HTTPException(
            status_code=404,
            detail=f"Beta not available for ticker '{ticker}'."
        )
    
    try:
        return float(data["data"]["beta"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=500,
            detail="Invalid beta format received from API."
        )









