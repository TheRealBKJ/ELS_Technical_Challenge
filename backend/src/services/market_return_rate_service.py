from fastapi import HTTPException


def get_expected_return_rate(ticker: str) -> float:
    """
    Calculates last year's return using monthly close prices:
    return = (end_price - start_price) / start_price
    """

    try:
        import yfinance as yf
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="yfinance is not installed in the backend environment."
        ) from exc

    try:
        data = yf.download(
            ticker,
            period="1y",
            interval="1mo",
            progress=False,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Failed to fetch historical mutual fund data."
        ) from exc

    if data.empty or len(data) < 2:
        raise HTTPException(
            status_code=404,
            detail=f"Insufficient historical data for ticker '{ticker}'."
        )

    # Use adjusted close if available (better financial practice)
    column = "Adj Close" if "Adj Close" in data.columns else "Close"

    start_price = float(data[column].iloc[0])
    end_price = float(data[column].iloc[-1])

    if start_price <= 0:
        raise HTTPException(
            status_code=500,
            detail="Invalid starting price retrieved."
        )

    return (end_price - start_price) / start_price
