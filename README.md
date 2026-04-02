# ELS_Technical_Challenge
Our Technical Challenge for Goldman Sachs ELS Summit

Tech Stack:

Frontend:
React + ShadCN for UI Library

Backend:

Fastapi and postgres


# Mutual Fund Calculator Backend Contract

## Overview
This backend provides the data needed for the frontend mutual fund calculator demo.

It currently supports:
- fetching a hardcoded list of mutual funds for a dropdown
- submitting an investment scenario and receiving a calculated future value

The calculation uses:
- a hardcoded risk-free rate
- beta pulled from the Newton Analytics API
- the selected mutual fund's 1-year historical return rate
- CAPM-based future value calculation

## Base URL
Use whatever local/backend host is running the API.

Example local dev URL:
`http://localhost:8000`

## Endpoints

### 1. Health Check
**GET** `/health`

Used to verify the backend is running.

#### Response
```json
{
  "status": "ok"
}
2. Get Mutual Funds
GET /api/mutual-funds

Returns the hardcoded mutual fund list for the frontend dropdown.

Response
[
  {
    "ticker": "VFIAX",
    "name": "Vanguard 500 Index Fund; Admiral"
  },
  {
    "ticker": "FXAIX",
    "name": "Fidelity 500 Index Fund"
  }
]
Frontend usage
populate the mutual fund select/dropdown
use ticker as the submitted value
use name as the display label
3. Calculate Future Value
POST /api/future-value

Calculates the predicted future value of an investment based on:

selected mutual fund
initial investment amount
investment duration in years
Request Body
{
  "ticker": "VFIAX",
  "principal": 1000,
  "years": 5
}
Field Rules
ticker: required string, must match one of the available mutual funds
principal: required number, must be greater than 0
years: required integer, must be greater than 0
Success Response
{
  "ticker": "VFIAX",
  "fund_name": "Vanguard 500 Index Fund; Admiral",
  "principal": 1000.0,
  "years": 5,
  "risk_free_rate": 0.0408,
  "beta": 1.02,
  "expected_return_rate": 0.11,
  "future_value": 1659.34
}
Response Field Meanings
ticker: selected mutual fund ticker
fund_name: display name for the selected fund
principal: original amount entered by the user
years: investment duration
risk_free_rate: hardcoded risk-free rate used in calculation
beta: beta returned from Newton Analytics
expected_return_rate: selected mutual fund's 1-year historical return rate
future_value: calculated projected value of the investment
Validation / Error Behavior
Invalid Input
If the frontend sends invalid values, the backend returns 422 Unprocessable Entity.

Example invalid request:

{
  "ticker": "VFIAX",
  "principal": -100,
  "years": 0
}
Unknown Ticker
If the ticker does not exist in the backend mutual fund list, the backend returns 404.

Upstream Data Failure
If beta or return-rate data cannot be retrieved from external services, the backend may return 502.

Frontend Integration Notes
Load /api/mutual-funds on page load to populate the dropdown
Submit calculator form data to /api/future-value
Treat future_value as the main output to display
Consider formatting:
currency fields with Intl.NumberFormat
rate fields as percentages
Show a user-friendly error if the backend returns 404, 422, or 502
Suggested Frontend Flow
Fetch mutual funds on initial load
Render dropdown, principal input, and years input
On submit, call /api/future-value
Display:
fund name
principal
years
expected return rate
beta
risk-free rate
projected future value
Local Dev Run Command
From the repo root:
PYTHONPATH=backend uvicorn src.main:app --reload


If you want, I can also turn this into a `BACKEND_API.md` file in the repo.
