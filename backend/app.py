"""
AI-Powered Crypto Trading Assistant Backend
------------------------------------------
This Flask backend provides endpoints for:
- /ping: Health check
- /price: Live crypto prices
- /predict: Price prediction
- /sentiment: Fetches real Reddit headlines for BTC and ETH (for sentiment analysis)

Reddit Integration:
- Uses PRAW (Python Reddit API Wrapper) to fetch headlines from r/Bitcoin and r/Ethereum.
- Credentials are loaded securely from a .env file (never hardcoded).
- Headlines are fetched live every time /sentiment is called.

How to use:
- Set up a Reddit app (type: script) and store credentials in backend/.env
- Install dependencies: pip install flask flask-cors praw python-dotenv requests scikit-learn numpy
- Run: python app.py

See code comments for detailed explanations.
"""
from flask import Flask, jsonify  # importing Flask and jsonify from the flask module
# This code sets up a basic Flask application with a single route.
from flask_cors import CORS
# CORS is used to handle Cross-Origin Resource Sharing (CORS) in Flask applications.
import requests
# requests is a Python library for making HTTP requests.
import time
# time is used for caching the API response
from sklearn.linear_model import LinearRegression
import numpy as np
from datetime import datetime, timedelta
import os  # For environment variables
from dotenv import load_dotenv  # To load .env file
import praw  # Reddit API wrapper
import feedparser  # For parsing RSS feeds
from textblob import TextBlob  # For basic sentiment analysis

app = Flask(__name__)  # creates flask app named app
CORS(app)  # enables CORS for the Flask app

# Cache variables to avoid CoinGecko rate limits
cached_price = None
last_fetched = 0
CACHE_DURATION = 15  # duration (in seconds) to cache the API response

# Add cache for /predict endpoint
predict_cache = None
predict_cache_time = 0
PREDICT_CACHE_DURATION = 60  # seconds

# Load environment variables from .env file
# Why: Keeps your secrets (API keys, passwords) out of your codebase
load_dotenv()

# Set up Reddit API client using credentials from .env
# Why: Authenticates your app with Reddit so you can fetch posts programmatically
reddit = praw.Reddit(
    client_id=os.getenv('REDDIT_CLIENT_ID'),
    client_secret=os.getenv('REDDIT_CLIENT_SECRET'),
    user_agent=os.getenv('REDDIT_USER_AGENT'),
    username=os.getenv('REDDIT_USERNAME'),
    password=os.getenv('REDDIT_PASSWORD')
)

# Helper function to fetch headlines from a subreddit
# Why: Lets you easily fetch top post titles for any subreddit (e.g., r/Bitcoin, r/Ethereum)
def get_reddit_headlines(subreddit_name, limit=10):
    """
    Fetches the most recent (non-stickied) post titles from a given subreddit.
    Args:
        subreddit_name (str): The name of the subreddit (e.g., 'Bitcoin')
        limit (int): Number of headlines to fetch
    Returns:
        list of str: List of post titles (headlines)
    """
    headlines = []
    try:
        subreddit = reddit.subreddit(subreddit_name)
        for submission in subreddit.hot(limit=limit):
            # Only include non-stickied posts
            if not submission.stickied:
                headlines.append(submission.title)
    except Exception as e:
        print(f"Error fetching from r/{subreddit_name}: {e}")
    return headlines

# Helper function to fetch headlines from an RSS feed
# Why: Lets you easily get the latest news headlines from crypto news sites like CoinDesk and CoinTelegraph
# Uses the feedparser library to parse RSS feeds

def get_rss_headlines(feed_url, limit=10):
    """
    Fetches the latest headlines from an RSS feed.
    Args:
        feed_url (str): The RSS feed URL.
        limit (int): Number of headlines to fetch.
    Returns:
        list of str: List of news headlines.
    """
    headlines = []
    try:
        feed = feedparser.parse(feed_url)
        for entry in feed.entries[:limit]:
            headlines.append(entry.title)
    except Exception as e:
        print(f"Error fetching RSS feed {feed_url}: {e}")
    return headlines

# Helper function to compute sentiment polarity for a single text
# Why: TextBlob returns a polarity score between -1 (negative) and +1 (positive)
def get_sentiment_score(text):
    """
    Returns the sentiment polarity of the text.
    -1 = very negative, 0 = neutral, +1 = very positive
    Args:
        text (str): The text to analyze
    Returns:
        float: Sentiment polarity score
    """
    return TextBlob(text).sentiment.polarity

# Helper function to compute average sentiment for a list of headlines
# Why: Aggregates sentiment across multiple news items for a broader view
def analyze_headlines_sentiment(headlines):
    """
    Computes the average sentiment score for a list of headlines.
    Args:
        headlines (list of str): List of news headlines
    Returns:
        dict: { 'average': float, 'scores': list of float }
    """
    if not headlines:
        return {'average': 0.0, 'scores': []}
    scores = [get_sentiment_score(h) for h in headlines]
    avg = sum(scores) / len(scores)
    return {'average': avg, 'scores': scores}

@app.route('/ping')  # @ is a decorator,
# ping is the endpoint that will respond to HTTP GET requests
# HTTP Get requests is a method used to request data from a specified resource
def ping():  # ping() is a function that will be called when the endpoint is accessed
    # This function returns a simple JSON response.
    # a JSON response is a way to send data in a structured format
    return {"message": "pong"}

@app.route('/price')  # another endpoint for price
def price():
    # This function returns live BTC/ETH prices from CoinGecko with basic caching
    global cached_price, last_fetched  # use global to store and update cache

    now = time.time()
    if not cached_price or (now - last_fetched > CACHE_DURATION):
        print("Fetching fresh price from CoinGecko...")
        url = 'https://api.coingecko.com/api/v3/simple/price'
        params = {  # this is stuff you're passing to the API
            'ids': 'bitcoin,ethereum',  # Cryptocurrency IDs
            # ids are unique identifiers for cryptocurrencies
            'vs_currencies': 'usd'  # Price in USD
        }
        try:
            response = requests.get(url, params=params)  # makes a GET request to the specified URL with the given parameters
            response.raise_for_status()  # raises an error if the request failed (e.g., rate limited)
            cached_price = response.json()  # parses the JSON response from the API
            last_fetched = now  # update the time of last successful fetch
        except requests.exceptions.RequestException as e:
            print("CoinGecko error:", e)
            return jsonify({"error": "Failed to fetch price"}), 503
    else:
        print("Serving cached price")

    return jsonify(cached_price)  # returns the parsed data as a JSON response

@app.route('/predict')
def predict():
    global predict_cache, predict_cache_time
    now = time.time()
    if predict_cache and (now - predict_cache_time < PREDICT_CACHE_DURATION):
        return jsonify(predict_cache)
    results = {}
    for symbol, coingecko_id in [('BTC', 'bitcoin'), ('ETH', 'ethereum')]:
        url = f'https://api.coingecko.com/api/v3/coins/{coingecko_id}/market_chart'
        params = {
            'vs_currency': 'usd',
            'days': 30,
            'interval': 'daily'
        }
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            prices = data.get('prices', [])
            print(f"{symbol} data points: {len(prices)}")
            if len(prices) < 2:
                results[symbol] = {'error': 'Not enough data for prediction'}
                continue
            # Deduplicate by date: keep only the last price for each date
            date_to_price = {}
            for price in prices:
                date_str = datetime.utcfromtimestamp(price[0] / 1000).strftime('%Y-%m-%d')
                date_to_price[date_str] = price[1]  # overwrite, so last price for each date remains
            dedup_dates = sorted(date_to_price.keys())
            dedup_prices = [date_to_price[d] for d in dedup_dates]
            # Append next day for prediction
            last_date_obj = datetime.strptime(dedup_dates[-1], '%Y-%m-%d')
            next_date_obj = last_date_obj + timedelta(days=1)
            next_date = next_date_obj.strftime('%Y-%m-%d')
            dedup_dates.append(next_date)
            model = LinearRegression()
            X = np.arange(len(dedup_prices)).reshape(-1, 1)
            y = np.array(dedup_prices)
            model.fit(X, y)
            next_day = np.array([[len(dedup_prices)]])
            predicted_price = model.predict(next_day)[0]
            results[symbol] = {
                'symbol': symbol,
                'history': y.tolist(),
                'dates': dedup_dates,
                'predicted_price': float(predicted_price)
            }
            print("Backend is using UTC for dates:", dedup_dates)
        except Exception as e:
            print(f'Prediction error for {symbol}:', e)
            results[symbol] = {'error': 'Prediction failed'}
    predict_cache = results
    predict_cache_time = now
    return jsonify(results)

@app.route('/sentiment')
def sentiment():
    """
    Fetches real Reddit headlines for BTC and ETH, and crypto news headlines from CoinDesk and CoinTelegraph.
    Applies TextBlob sentiment analysis to each group of headlines and returns the average sentiment.
    - Calls get_reddit_headlines for r/Bitcoin and r/Ethereum
    - Calls get_rss_headlines for CoinDesk and CoinTelegraph
    - Analyzes sentiment for each group
    - Returns all headlines and sentiment scores in the API response
    """
    # Fetch real headlines from Reddit for BTC and ETH
    btc_headlines = get_reddit_headlines('Bitcoin', limit=10)
    eth_headlines = get_reddit_headlines('Ethereum', limit=10)
    # Fetch crypto news headlines from CoinDesk and CoinTelegraph
    coindesk_headlines = get_rss_headlines('https://feeds.feedburner.com/CoinDesk', limit=10)
    cointelegraph_headlines = get_rss_headlines('https://cointelegraph.com/rss', limit=10)
    # Analyze sentiment for each group of headlines
    btc_sentiment = analyze_headlines_sentiment(btc_headlines)
    eth_sentiment = analyze_headlines_sentiment(eth_headlines)
    coindesk_sentiment = analyze_headlines_sentiment(coindesk_headlines)
    cointelegraph_sentiment = analyze_headlines_sentiment(cointelegraph_headlines)
    # Return all headlines and sentiment in the response
    return {
        "BTC": {
            "symbol": "BTC",
            "reddit_headlines": btc_headlines,
            "reddit_sentiment": btc_sentiment,
            "coindesk_headlines": coindesk_headlines,
            "coindesk_sentiment": coindesk_sentiment,
            "cointelegraph_headlines": cointelegraph_headlines,
            "cointelegraph_sentiment": cointelegraph_sentiment
        },
        "ETH": {
            "symbol": "ETH",
            "reddit_headlines": eth_headlines,
            "reddit_sentiment": eth_sentiment,
            "coindesk_headlines": coindesk_headlines,
            "coindesk_sentiment": coindesk_sentiment,
            "cointelegraph_headlines": cointelegraph_headlines,
            "cointelegraph_sentiment": cointelegraph_sentiment
        }
    }

# Temporary route to test Reddit API integration
# Why: Lets you quickly verify that your credentials and helper function work before integrating into main app logic
@app.route('/test_reddit')
def test_reddit():
    """
    Test route to fetch and return the top 5 headlines from r/Bitcoin.
    Visit /test_reddit in your browser to see if Reddit integration works.
    """
    headlines = get_reddit_headlines('Bitcoin', limit=5)
    return jsonify(headlines)

if __name__ == '__main__':  # this line checks if the script is being run directly
    # If so, it starts the Flask application.
    app.run(debug=True)

# This is a simple Flask application that responds to a ping request.
# It defines routes like `/ping`, `/price`, `/predict`, and `/sentiment`.
# To run this application, save it as `app.py` and execute it with Python.
# Make sure to install Flask and requests using `pip install Flask requests`.

# To run the application, use the command: python app.py
# Ensure you have Flask installed in your Python environment.
# You can test the endpoints by navigating to http://localhost:5000/price, etc.
