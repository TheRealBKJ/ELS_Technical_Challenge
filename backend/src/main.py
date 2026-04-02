from fastapi import FastAPI

from src.routes.mutual_fund import router as mutual_fund_router

app = FastAPI(
    title="Mutual Fund Calculator API",
    description="Backend APIs for mutual fund lookup and future value calculation.",
    version="1.0.0",
)

app.include_router(mutual_fund_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


def main() -> None:
    print("Run this app with: uvicorn src.main:app --reload")

if __name__ == "__main__":
    main()
