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


class PortfolioAdvisorRequest(BaseModel):
    risk_tolerance: str = Field(..., min_length=1, examples=["Medium"])
    principal: float = Field(..., gt=0, examples=[10000.0])
    years: int = Field(..., gt=0, examples=[10])
    goal: str = Field(..., min_length=1, examples=["Balanced"])
    notes: str = Field(default="", examples=["I already have bond exposure elsewhere."])


class PortfolioAllocationResponse(BaseModel):
    ticker: str
    name: str
    beta: float
    percentage: int
    expected_return: float
    invested: float
    future_value: float


class PortfolioAdvisorResponse(BaseModel):
    allocations: list[PortfolioAllocationResponse]
    reasoning: str
    principal: float
    totalFV: float
    totalGain: float
