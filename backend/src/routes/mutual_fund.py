from fastapi import APIRouter

from src.schemas.investment import (
    FutureValueRequest,
    FutureValueResponse,
    MutualFundResponse,
    PortfolioAdvisorRequest,
    PortfolioAdvisorResponse,
)
from src.services.ai_portfolio_service import generate_portfolio_suggestion
from src.services.future_performance_calculator_service import (
    calculate_future_performance,
)
from src.services.mutual_fund_service import get_all_mutual_funds

router = APIRouter(prefix="/api", tags=["mutual-funds"])


@router.get("/mutual-funds", response_model=list[MutualFundResponse])
def list_mutual_funds() -> list[MutualFundResponse]:
    return get_all_mutual_funds()


@router.post("/future-value", response_model=FutureValueResponse)
def get_future_value(payload: FutureValueRequest) -> FutureValueResponse:
    result = calculate_future_performance(
        ticker=payload.ticker,
        principal=payload.principal,
        years=payload.years,
    )
    return FutureValueResponse(**result)


@router.post("/ai/portfolio-suggestion", response_model=PortfolioAdvisorResponse)
def get_portfolio_suggestion(
    payload: PortfolioAdvisorRequest,
) -> PortfolioAdvisorResponse:
    result = generate_portfolio_suggestion(
        risk_tolerance=payload.risk_tolerance,
        principal=payload.principal,
        years=payload.years,
        goal=payload.goal,
        notes=payload.notes,
    )
    return PortfolioAdvisorResponse(**result)
