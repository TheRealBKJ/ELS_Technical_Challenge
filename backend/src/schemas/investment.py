from pydantic import BaseModel, Field


class MutualFundResponse(BaseModel):
    ticker: str = Field(..., examples=["VFIAX"])
    name: str = Field(..., examples=["Vanguard 500 Index Fund; Admiral"])


class FutureValueRequest(BaseModel):
    ticker: str = Field(..., min_length=1, examples=["VFIAX"])
    principal: float = Field(..., gt=0, examples=[1000.0])
    years: int = Field(..., gt=0, examples=[5])


class FutureValueResponse(BaseModel):
    ticker: str
    fund_name: str
    principal: float
    years: int
    risk_free_rate: float
    beta: float
    expected_return_rate: float
    future_value: float
