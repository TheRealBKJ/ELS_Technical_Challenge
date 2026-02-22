# backend/config.py

# 10-year US Treasury yield (risk-free rate)
# Current rate: 4.08% (hardcoded per project specification)
RISK_FREE_RATE = 0.0408


# Newton Analytics API configuration
NEWTON_BETA_URL = "https://api.newtonanalytics.com/stock-beta/"
NEWTON_INDEX = "^GSPC"
NEWTON_INTERVAL = "1mo"
NEWTON_OBSERVATIONS = 12