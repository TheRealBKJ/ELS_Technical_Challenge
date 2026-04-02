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
