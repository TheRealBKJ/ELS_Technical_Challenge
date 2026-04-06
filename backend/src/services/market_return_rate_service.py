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

    price_series = data[column]

    # yfinance can return a DataFrame/Series depending on ticker shape and version.
    if hasattr(price_series, "ndim") and price_series.ndim > 1:
        if ticker in price_series.columns:
            price_series = price_series[ticker]
        else:
            price_series = price_series.iloc[:, 0]

    start_price = float(price_series.iloc[0])
    end_price = float(price_series.iloc[-1])

    if start_price <= 0:
        raise HTTPException(
            status_code=500,
            detail="Invalid starting price retrieved."
        )

    return (end_price - start_price) / start_price
