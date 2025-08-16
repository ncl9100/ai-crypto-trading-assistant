import requests
from datetime import datetime, timedelta
import yfinance as yf


# --- User credentials ---

email = "your@email.com"  # <-- Replace with your email
username = "yourusername"  # <-- Replace with your username
password = "yourpassword"  # <-- Replace with your password

# Step 1: Register user (ignore errors if already exists)

register_resp = requests.post(
    "http://localhost:5000/auth/register",
    headers={"Content-Type": "application/json"},
    json={"email": email, "username": username, "password": password}
)
if register_resp.status_code == 201:
    print("User registered.")
else:
    try:
        print("Registration response:", register_resp.json())
    except Exception:
        print("Registration response (raw):", register_resp.text)

# Step 2: Login and get token
login_resp = requests.post(
    "http://localhost:5000/auth/login",
    headers={"Content-Type": "application/json"},
    json={"email": email, "password": password}
)
login_data = login_resp.json()
token = login_data.get("token")
if not token:
    print("Login failed:", login_data)
    exit(1)

headers = {"Authorization": f"Bearer {token}"}


# Step 3: Get prediction from backend
resp = requests.get("http://localhost:5000/predict", headers=headers)
data = resp.json()


# Ensure btc_predicted and btc_dates are lists
btc_predicted = data["BTC"].get("predicted_price")
btc_dates = data["BTC"].get("dates")
if not isinstance(btc_predicted, list):
    btc_predicted = [btc_predicted]
if not isinstance(btc_dates, list):
    btc_dates = [btc_dates]


# Step 3: Get historical dates from CoinGecko
def fetch_historical_dates_yf(ticker, num_days=30):
    # Get last num_days dates from Yahoo Finance
    data = yf.Ticker(ticker).history(period=f"{num_days}d")
    return [d.strftime("%Y-%m-%d") for d in data.index]


btc_dates = fetch_historical_dates_yf("BTC-USD", 30)


print("Date       | Predicted      | Actual         | Absolute Error")
print("--------------------------------------------------------------")
for date_str in btc_dates:
    # Request model prediction for this date
    pred_resp = requests.get(f"http://localhost:5000/predict?date={date_str}", headers=headers)
    try:
        pred_data = pred_resp.json()
    except Exception as e:
        print(f"[DEBUG] Backend response not JSON for {date_str}: {pred_resp.text}")
        pred_data = {}
    print(f"[DEBUG] Backend response for {date_str}: {pred_data}")
    pred = pred_data.get("BTC", {}).get("predicted_price")

    # Fetch actual price from Yahoo Finance
    actual_price = None
    try:
        # Try direct lookup
        data = yf.Ticker("BTC-USD").history(start=date_str, end=(datetime.strptime(date_str, "%Y-%m-%d") + timedelta(days=1)).strftime("%Y-%m-%d"))
        if not data.empty:
            # Convert both to tz-naive for subtraction
            target_dt = datetime.strptime(date_str, "%Y-%m-%d")
            idx_naive = [d.tz_convert(None).replace(tzinfo=None) if hasattr(d, 'tzinfo') and d.tzinfo else d.replace(tzinfo=None) for d in data.index]
            diffs = [abs((d - target_dt).days) for d in idx_naive]
            closest_idx = diffs.index(min(diffs))
            actual_price = float(data.iloc[closest_idx]["Close"])
        else:
            print(f"[YF-DEBUG] No data for {date_str}, trying ±1 day...")
            # Try ±1 day range
            start_dt = datetime.strptime(date_str, "%Y-%m-%d") - timedelta(days=1)
            end_dt = datetime.strptime(date_str, "%Y-%m-%d") + timedelta(days=2)
            data = yf.Ticker("BTC-USD").history(start=start_dt.strftime("%Y-%m-%d"), end=end_dt.strftime("%Y-%m-%d"))
            if not data.empty:
                target_dt = datetime.strptime(date_str, "%Y-%m-%d")
                idx_naive = [d.tz_convert(None).replace(tzinfo=None) if hasattr(d, 'tzinfo') and d.tzinfo else d.replace(tzinfo=None) for d in data.index]
                diffs = [abs((d - target_dt).days) for d in idx_naive]
                closest_idx = diffs.index(min(diffs))
                actual_price = float(data.iloc[closest_idx]["Close"])
    except Exception as e:
        print(f"[YF-DEBUG] Exception for {date_str}: {e}")
        actual_price = None

    if actual_price is not None and pred is not None:
        error = abs(pred - actual_price)
        print(f"{date_str} | {pred:13.2f} | {actual_price:13.2f} | {error:14.2f}")
    else:
        print(f"{date_str} | {pred if pred is not None else 'N/A':13} | {'N/A':13} | {'N/A':14}")
        if actual_price is None:
            print(f"[YF-DEBUG] Actual price missing for {date_str}")
        if pred is None:
            print(f"[YF-DEBUG] Predicted price missing for {date_str}")

