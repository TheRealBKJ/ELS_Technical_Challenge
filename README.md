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

### 2. Get Mutual Funds

**GET** `/api/mutual-funds`

Returns the hardcoded list of mutual funds for the frontend dropdown.

**Response**

```json
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
```

**Frontend Use**
- Use `ticker` as the submitted value
- Use `name` as the dropdown label

---

### 3. Calculate Future Value

**POST** `/api/future-value`

Calculates the predicted future value of an investment using:
- selected mutual fund
- initial investment amount
- investment duration in years

**Request Body**

```json
{
  "ticker": "VFIAX",
  "principal": 1000,
  "years": 5
}
```

**Field Rules**
- `ticker`: required string
- `principal`: required number, must be greater than `0`
- `years`: required integer, must be greater than `0`

**Response**

```json
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
```

**Response Fields**
- `ticker`: mutual fund ticker
- `fund_name`: full mutual fund name
- `principal`: original amount entered by the user
- `years`: investment duration
- `risk_free_rate`: hardcoded risk-free rate
- `beta`: beta returned from Newton Analytics
- `expected_return_rate`: 1-year historical return rate for the selected mutual fund
- `future_value`: projected future value of the investment

---

## Error Handling

### Invalid Input
If invalid values are sent, the backend returns `422 Unprocessable Entity`.

**Example**

```json
{
  "ticker": "VFIAX",
  "principal": -100,
  "years": 0
}
```

### Unknown Ticker
If the ticker is not found in the backend mutual fund list, the backend returns `404`.

### External API Failure
If beta data or return-rate data cannot be retrieved, the backend may return `502`.

---

## Frontend Integration Notes

- Call `/api/mutual-funds` on page load to populate the dropdown
- Submit the calculator form to `/api/future-value`
- Display `future_value` as the main result
- Format money values as currency
- Format rate values as percentages
- Show a user-friendly error for `404`, `422`, or `502`

---

## Suggested Frontend Flow

1. Fetch mutual funds on initial load
2. Render the dropdown, principal input, and years input
3. Submit form data to `/api/future-value`
4. Display the returned calculation details

---

## Local Run Command

```bash
PYTHONPATH=backend uvicorn src.main:app --reload
```


