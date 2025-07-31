"""
AI-Powered Crypto Trading Assistant Backend
------------------------------------------
This Flask backend provides endpoints for:
- /ping: Health check
- /price: Live crypto prices
- /predict: Price prediction
- /sentiment: Fetches real Reddit headlines for BTC and ETH (for sentiment analysis)
- /auth/register: User registration
- /auth/login: User login
- /auth/profile: Get user profile (protected)

Reddit Integration:
- Uses PRAW (Python Reddit API Wrapper) to fetch headlines from r/Bitcoin and r/Ethereum.
- Credentials are loaded securely from a .env file (never hardcoded).
- Headlines are fetched live every time /sentiment is called.

How to use:
- Set up a Reddit app (type: script) and store credentials in backend/.env
- Install dependencies: pip install flask flask-cors praw python-dotenv requests scikit-learn numpy pyjwt werkzeug
- Run: python app.py

See code comments for detailed explanations.
"""
from flask import Flask, jsonify, request  # importing Flask and jsonify from the flask module
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
import logging
from typing import Dict, List, Optional, Any, Tuple
import random
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)  # creates flask app named app
CORS(app)  # enables CORS for the Flask app

# JWT Configuration
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ALGORITHM'] = 'HS256'

# Load environment variables from .env file
# Why: Keeps your secrets (API keys, passwords) out of your codebase
load_dotenv()

# In-memory user storage (replace with database in production)
users_db = {}

class APICache:
    """
    Centralized caching system with intelligent cache duration strategy.
    Prevents memory leaks and provides automatic expiration.
    """
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._cache_durations = {
            'price': 60,           # 1 minute - frequent updates needed
            'predict': 300,        # 5 minutes - computationally expensive
            'recommendation': 120, # 2 minutes - business logic
            'historical': 3600,    # 1 hour - rarely changes
            'reddit_headlines': 300,  # 5 minutes - social media
            'rss_feeds': 600,      # 10 minutes - news updates
        }
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached value if not expired."""
        if key not in self._cache:
            return None
        
        cache_entry = self._cache[key]
        if time.time() - cache_entry['timestamp'] > cache_entry['duration']:
            # Remove expired entry
            del self._cache[key]
            return None
        
        return cache_entry['value']
    
    def set(self, key: str, value: Any, cache_type: str = 'default') -> None:
        """Set cached value with appropriate duration."""
        duration = self._cache_durations.get(cache_type, 60)
        self._cache[key] = {
            'value': value,
            'timestamp': time.time(),
            'duration': duration
        }
        logger.info(f"Cache set: {key} (type: {cache_type}, duration: {duration}s)")
    
    def clear_expired(self) -> None:
        """Remove all expired cache entries."""
        current_time = time.time()
        expired_keys = [
            key for key, entry in self._cache.items()
            if current_time - entry['timestamp'] > entry['duration']
        ]
        for key in expired_keys:
            del self._cache[key]
        if expired_keys:
            logger.info(f"Cleared {len(expired_keys)} expired cache entries")

class APIRequestHandler:
    """
    Handles API requests with exponential backoff and retry logic.
    Provides graceful degradation and proper error handling.
    """
    def __init__(self, max_retries: int = 3, timeout: int = 10):
        self.max_retries = max_retries
        self.timeout = timeout
    
    def make_request(self, url: str, params: Optional[Dict] = None, headers: Optional[Dict] = None, timeout: Optional[int] = None) -> Tuple[Optional[Dict], Optional[str]]:
        """
        Make HTTP request with exponential backoff and retry logic.
        Returns (response_data, error_message)
        """
        request_timeout = timeout if timeout is not None else self.timeout
        
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Making request to {url} (attempt {attempt + 1}/{self.max_retries})")
                response = requests.get(
                    url, 
                    params=params, 
                    headers=headers, 
                    timeout=request_timeout
                )
                
                logger.info(f"Response status: {response.status_code}")
                
                if response.status_code == 429:  # Too Many Requests
                    wait_time = (2 ** attempt) + random.uniform(0, 1)
                    logger.warning(f"Rate limited (attempt {attempt + 1}/{self.max_retries}). Waiting {wait_time:.1f}s")
                    time.sleep(wait_time)
                    continue
                
                response.raise_for_status()
                return response.json(), None
                
            except requests.exceptions.Timeout:
                logger.warning(f"Request timeout (attempt {attempt + 1}/{self.max_retries})")
                if attempt == self.max_retries - 1:
                    return None, "Request timeout"
                time.sleep(2 ** attempt)
                
            except requests.exceptions.RequestException as e:
                logger.error(f"Request failed (attempt {attempt + 1}/{self.max_retries}): {e}")
                if attempt == self.max_retries - 1:
                    return None, f"Request failed: {str(e)}"
                time.sleep(2 ** attempt)
        
        return None, "Max retries exceeded"

# Initialize global instances
api_cache = APICache()
request_handler = APIRequestHandler()

# Set up Reddit API client using credentials from .env
# Why: Authenticates your app with Reddit so you can fetch posts programmatically
try:
    reddit = praw.Reddit(
        client_id=os.getenv('REDDIT_CLIENT_ID'),
        client_secret=os.getenv('REDDIT_CLIENT_SECRET'),
        user_agent=os.getenv('REDDIT_USER_AGENT'),
        username=os.getenv('REDDIT_USERNAME'),
        password=os.getenv('REDDIT_PASSWORD')
    )
    logger.info("Reddit API client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Reddit client: {e}")
    reddit = None

# JWT Authentication Functions
def generate_token(user_id: str) -> str:
    """Generate JWT token for user."""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=7),  # Token expires in 7 days
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm=app.config['JWT_ALGORITHM'])

def verify_token(token: str) -> Optional[Dict]:
    """Verify JWT token and return payload if valid."""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[app.config['JWT_ALGORITHM']])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        return None
    except jwt.InvalidTokenError:
        logger.warning("Invalid token")
        return None

def require_auth(f):
    """Decorator to require authentication for protected endpoints."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'Authorization header missing'}), 401
        
        try:
            # Extract token from "Bearer <token>"
            token = auth_header.split(' ')[1]
        except IndexError:
            return jsonify({'error': 'Invalid authorization header format'}), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add user info to request context
        request.user_id = payload['user_id']
        return f(*args, **kwargs)
    
    return decorated_function

# Authentication Endpoints
@app.route('/auth/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    email = data.get('email')
    password = data.get('password')
    username = data.get('username')
    
    # Validate input
    if not email or not password or not username:
        return jsonify({'error': 'Email, password, and username are required'}), 400
    
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Check if user already exists
    if email in users_db:
        return jsonify({'error': 'User already exists'}), 409
    
    # Create new user
    user_id = str(len(users_db) + 1)
    hashed_password = generate_password_hash(password)
    
    users_db[email] = {
        'id': user_id,
        'email': email,
        'username': username,
        'password': hashed_password,
        'created_at': datetime.utcnow().isoformat()
    }
    
    # Generate token nn
    token = generate_token(user_id)
    
    logger.info(f"New user registered: {email}")
    
    return jsonify({
        'message': 'User registered successfully',
        'token': token,
        'user': {
            'id': user_id,
            'email': email,
            'username': username
        }
    }), 201

@app.route('/auth/login', methods=['POST'])
def login():
    """Login user and return JWT token."""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    # Check if user exists
    if email not in users_db:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    user = users_db[email]
    
    # Verify password
    if not check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Generate token
    token = generate_token(user['id'])
    
    logger.info(f"User logged in: {email}")
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {
            'id': user['id'],
            'email': user['email'],
            'username': user['username']
        }
    })

@app.route('/auth/profile', methods=['GET'])
@require_auth
def get_profile():
    """Get user profile (protected endpoint)."""
    user_id = request.user_id
    
    # Find user by ID
    user = None
    for email, user_data in users_db.items():
        if user_data['id'] == user_id:
            user = user_data
            break
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user['id'],
        'email': user['email'],
        'username': user['username'],
        'created_at': user['created_at']
    })

# Helper function to fetch headlines from a subreddit
# Why: Lets you easily fetch top post titles for any subreddit (e.g., r/Bitcoin, r/Ethereum)
def get_reddit_headlines(subreddit_name: str, limit: int = 10) -> List[str]:
    """
    Fetches the most recent (non-stickied) post titles from a given subreddit.
    Args:
        subreddit_name (str): The name of the subreddit (e.g., 'Bitcoin')
        limit (int): Number of headlines to fetch
    Returns:
        list of str: List of post titles (headlines)
    """
    cache_key = f"reddit_headlines_{subreddit_name}_{limit}"
    cached_result = api_cache.get(cache_key)
    if cached_result:
        logger.info(f"Serving cached Reddit headlines for r/{subreddit_name}")
        return cached_result
    
    headlines = []
    try:
        if reddit is None:
            logger.error("Reddit client not initialized")
            return headlines
            
        subreddit = reddit.subreddit(subreddit_name)
        for submission in subreddit.hot(limit=limit):
            # Only include non-stickied posts
            if not submission.stickied:
                headlines.append(submission.title)
        
        api_cache.set(cache_key, headlines, 'reddit_headlines')
        logger.info(f"Fetched {len(headlines)} headlines from r/{subreddit_name}")
        
    except Exception as e:
        logger.error(f"Error fetching from r/{subreddit_name}: {e}")
    
    return headlines

# Helper function to fetch headlines from an RSS feed
# Why: Lets you easily get the latest news headlines from crypto news sites like CoinDesk and CoinTelegraph
# Uses the feedparser library to parse RSS feeds
def get_rss_headlines(feed_url: str, limit: int = 10) -> List[str]:
    """
    Fetches the latest headlines from an RSS feed.
    Args:
        feed_url (str): The RSS feed URL.
        limit (int): Number of headlines to fetch.
    Returns:
        list of str: List of news headlines.
    """
    cache_key = f"rss_headlines_{feed_url}_{limit}"
    cached_result = api_cache.get(cache_key)
    if cached_result:
        logger.info(f"Serving cached RSS headlines from {feed_url}")
        return cached_result
    
    headlines = []
    try:
        feed = feedparser.parse(feed_url)
        for entry in feed.entries[:limit]:
            headlines.append(entry.title)
        
        api_cache.set(cache_key, headlines, 'rss_feeds')
        logger.info(f"Fetched {len(headlines)} headlines from {feed_url}")
        
    except Exception as e:
        logger.error(f"Error fetching RSS feed {feed_url}: {e}")
    
    return headlines

# Helper function to compute sentiment polarity for a single text
# Why: TextBlob returns a polarity score between -1 (negative) and +1 (positive)
def get_sentiment_score(text: str) -> float:
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
def analyze_headlines_sentiment(headlines: List[str]) -> Dict[str, Any]:
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
    # This function returns live BTC/ETH prices from CoinGecko with intelligent caching
    cache_key = "current_prices"
    cached_result = api_cache.get(cache_key)
    
    if cached_result:
        logger.info("Serving cached price data")
        return jsonify(cached_result)
    
    logger.info("Fetching fresh price from CoinGecko...")
    url = 'https://api.coingecko.com/api/v3/simple/price'
    params = {'ids': 'bitcoin,ethereum', 'vs_currencies': 'usd'}
    
    response_data, error = request_handler.make_request(url, params=params)
    
    if error:
        logger.error(f"CoinGecko error: {error}")
        return jsonify({"error": "Failed to fetch price"}), 503
    
    api_cache.set(cache_key, response_data, 'price')
    return jsonify(response_data)

@app.route('/predict')
@require_auth
def predict():
    cache_key = "prediction_data"
    cached_result = api_cache.get(cache_key)
    
    if cached_result:
        logger.info("Serving cached prediction data")
        return jsonify(cached_result)
    
    logger.info("Generating fresh predictions...")
    results = {}
    
    for symbol, coingecko_id in [('BTC', 'bitcoin'), ('ETH', 'ethereum')]:
        logger.info(f"Fetching data for {symbol} ({coingecko_id})...")
        url = f'https://api.coingecko.com/api/v3/coins/{coingecko_id}/market_chart'
        params = {
            'vs_currency': 'usd',
            'days': 30,
            'interval': 'daily'
        }
        
        response_data, error = request_handler.make_request(url, params=params)
        
        if error:
            logger.error(f'Prediction error for {symbol}: {error}')
            results[symbol] = {'error': 'Prediction failed'}
            continue
        
        logger.info(f"Successfully fetched data for {symbol}")
        
        prices = response_data.get('prices', [])
        logger.info(f"{symbol} data points: {len(prices)}")
        
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
    
    api_cache.set(cache_key, results, 'predict')
    return jsonify(results)

@app.route('/sentiment')
@require_auth
def sentiment():
    """
    Fetches real Reddit headlines for BTC and ETH, and crypto news headlines from CoinDesk and CoinTelegraph.
    Applies TextBlob sentiment analysis to each group of headlines and returns the average sentiment.
    - Calls get_reddit_headlines for r/Bitcoin and r/Ethereum
    - Calls get_rss_headlines for CoinDesk and CoinTelegraph
    - Analyzes sentiment for each group
    - Returns all headlines and sentiment scores in the API response
    """
    cache_key = "sentiment_data"
    cached_result = api_cache.get(cache_key)
    
    if cached_result:
        logger.info("Serving cached sentiment data")
        return cached_result
    
    logger.info("Fetching fresh sentiment data...")
    
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
    result = {
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
    
    api_cache.set(cache_key, result, 'recommendation')
    return result

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

def get_price_24h_ago_cached(coin_id: str) -> Optional[float]:
    """Get price from 24 hours ago with caching."""
    cache_key = f"historical_price_{coin_id}"
    cached_result = api_cache.get(cache_key)
    
    if cached_result is not None:
        return cached_result
    
    # Otherwise, fetch and cache
    day_ago = int(time.time()) - 24*60*60
    url = f'https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart/range'
    params = {
        'vs_currency': 'usd',
        'from': day_ago,
        'to': int(time.time())
    }
    
    response_data, error = request_handler.make_request(url, params=params)
    
    if error:
        logger.error(f"Error fetching historical price for {coin_id}: {error}")
        return None
    
    prices = response_data.get('prices', [])
    if not prices:
        logger.warning(f"No historical prices returned for {coin_id}")
        return None
    
    closest = min(prices, key=lambda x: abs(x[0]/1000 - day_ago))
    historical_price = closest[1]
    
    api_cache.set(cache_key, historical_price, 'historical')
    return historical_price

@app.route('/recommendation')
@require_auth
def recommendation():
    cache_key = "recommendation_data"
    cached_result = api_cache.get(cache_key)
    
    if cached_result:
        logger.info("Serving cached recommendation data")
        return jsonify(cached_result)
    
    logger.info("Generating fresh recommendations...")
    
    # Get current prices
    price_cache_key = "current_prices"
    cached_prices = api_cache.get(price_cache_key)
    
    if not cached_prices:
        url = 'https://api.coingecko.com/api/v3/simple/price'
        params = {'ids': 'bitcoin,ethereum', 'vs_currencies': 'usd'}
        
        response_data, error = request_handler.make_request(url, params=params)
        
        if error:
            logger.error(f"CoinGecko error: {error}")
            return jsonify({"error": "Failed to fetch price"}), 503
        
        api_cache.set(price_cache_key, response_data, 'price')
        cached_prices = response_data
    
    btc_price = cached_prices['bitcoin']['usd']
    eth_price = cached_prices['ethereum']['usd']
    
    # Get price 24h ago for both BTC and ETH
    btc_prev = get_price_24h_ago_cached('bitcoin')
    eth_prev = get_price_24h_ago_cached('ethereum')
    
    logger.info(f"BTC current: {btc_price}, BTC prev: {btc_prev}")
    logger.info(f"ETH current: {eth_price}, ETH prev: {eth_prev}")
    
    btc_delta = (btc_price - btc_prev) / btc_prev if btc_prev else None
    eth_delta = (eth_price - eth_prev) / eth_prev if eth_prev else None
    
    # If historical price is missing, set delta to None and log a warning
    if btc_prev is None:
        logger.warning("Warning: BTC historical price missing, delta set to None")
    if eth_prev is None:
        logger.warning("Warning: ETH historical price missing, delta set to None")
    
    # Get sentiment for both BTC and ETH
    btc_headlines = get_reddit_headlines('Bitcoin', limit=10)
    eth_headlines = get_reddit_headlines('Ethereum', limit=10)
    coindesk_headlines = get_rss_headlines('https://feeds.feedburner.com/CoinDesk', limit=10)
    cointelegraph_headlines = get_rss_headlines('https://cointelegraph.com/rss', limit=10)
    
    btc_sentiment = analyze_headlines_sentiment(btc_headlines + coindesk_headlines + cointelegraph_headlines)['average']
    eth_sentiment = analyze_headlines_sentiment(eth_headlines + coindesk_headlines + cointelegraph_headlines)['average']
    
    def get_recommendation(sentiment: float, delta: Optional[float]) -> str:
        if delta is None:
            return "Hold"
        if sentiment > 0.5 and delta > 0:
            return "Buy"
        elif sentiment < -0.5 and delta < 0:
            return "Sell"
        else:
            return "Hold"
    
    btc_recommendation = get_recommendation(btc_sentiment, btc_delta)
    eth_recommendation = get_recommendation(eth_sentiment, eth_delta)
    
    result = {
        "BTC": {
            "recommendation": btc_recommendation,
            "sentiment": btc_sentiment,
            "price_delta": btc_delta,
            "current_price": btc_price,
            "previous_price": btc_prev
        },
        "ETH": {
            "recommendation": eth_recommendation,
            "sentiment": eth_sentiment,
            "price_delta": eth_delta,
            "current_price": eth_price,
            "previous_price": eth_prev
        }
    }
    
    api_cache.set(cache_key, result, 'recommendation')
    return jsonify(result)

@app.route('/historical')
@require_auth
def historical():
    """Fetch price history for BTC and ETH with configurable timeframe."""
    timeframe = request.args.get('timeframe', '7d')
    
    # Map timeframe to days
    timeframe_map = {
        '7d': 7,
        '30d': 30,
        '6m': 180,
        '1y': 365
    }
    
    days = timeframe_map.get(timeframe, 7)
    cache_key = f"historical_data_{timeframe}"
    cached_result = api_cache.get(cache_key)
    
    if cached_result:
        logger.info(f"Serving cached historical data for {timeframe}")
        return jsonify(cached_result)
    
    logger.info(f"Fetching fresh historical data for {timeframe}...")
    results = {}
    
    for symbol, coingecko_id in [('BTC', 'bitcoin'), ('ETH', 'ethereum')]:
        logger.info(f"Fetching {timeframe} data for {symbol} ({coingecko_id})...")
        
        # For 1-year data, use a different approach to avoid rate limits
        if timeframe == '1y':
            # Try to get 1-year data with longer timeout
            url = f'https://api.coingecko.com/api/v3/coins/{coingecko_id}/market_chart'
            params = {
                'vs_currency': 'usd',
                'days': days,
                'interval': 'daily'
            }
            
            # Use a longer timeout for 1-year data
            response_data, error = request_handler.make_request(url, params=params, timeout=30)
        else:
            url = f'https://api.coingecko.com/api/v3/coins/{coingecko_id}/market_chart'
            params = {
                'vs_currency': 'usd',
                'days': days,
                'interval': 'daily'
            }
            
            response_data, error = request_handler.make_request(url, params=params)
        
        if error:
            logger.error(f'Historical data error for {symbol}: {error}')
            
            # For 1-year data, try a fallback approach with shorter timeframe
            if timeframe == '1y':
                logger.info(f"Trying fallback approach for {symbol} 1-year data...")
                # Try with 6 months first, then we can extend if needed
                fallback_params = {
                    'vs_currency': 'usd',
                    'days': 180,  # 6 months
                    'interval': 'daily'
                }
                
                fallback_response, fallback_error = request_handler.make_request(url, params=fallback_params, timeout=20)
                
                if fallback_error:
                    results[symbol] = {'error': f'Failed to fetch 1-year data: {error}. Fallback also failed: {fallback_error}'}
                else:
                    # Use the 6-month data as fallback
                    prices = fallback_response.get('prices', [])
                    if len(prices) >= 2:
                        dates = []
                        price_history = []
                        
                        for price in prices:
                            date_str = datetime.utcfromtimestamp(price[0] / 1000).strftime('%Y-%m-%d')
                            dates.append(date_str)
                            price_history.append(price[1])
                        
                        results[symbol] = {
                            'symbol': symbol,
                            'dates': dates,
                            'prices': price_history,
                            'current_price': price_history[-1] if price_history else None,
                            'price_change': price_history[-1] - price_history[0] if len(price_history) >= 2 else None,
                            'price_change_percent': ((price_history[-1] - price_history[0]) / price_history[0] * 100) if len(price_history) >= 2 else None,
                            'timeframe': '6m',  # Note: this is fallback data
                            'note': 'Showing 6-month data due to 1-year API limit'
                        }
                        continue
                    else:
                        results[symbol] = {'error': f'Failed to fetch 1-year data: {error}. Fallback data insufficient.'}
            else:
                results[symbol] = {'error': f'Failed to fetch historical data: {error}'}
            continue
        
        prices = response_data.get('prices', [])
        logger.info(f"{symbol} historical data points: {len(prices)}")
        
        if len(prices) < 2:
            results[symbol] = {'error': 'Not enough historical data'}
            continue
        
        # Process historical data
        dates = []
        price_history = []
        
        for price in prices:
            date_str = datetime.utcfromtimestamp(price[0] / 1000).strftime('%Y-%m-%d')
            dates.append(date_str)
            price_history.append(price[1])
        
        results[symbol] = {
            'symbol': symbol,
            'dates': dates,
            'prices': price_history,
            'current_price': price_history[-1] if price_history else None,
            'price_change': price_history[-1] - price_history[0] if len(price_history) >= 2 else None,
            'price_change_percent': ((price_history[-1] - price_history[0]) / price_history[0] * 100) if len(price_history) >= 2 else None,
            'timeframe': timeframe
        }
    
    api_cache.set(cache_key, results, 'historical')
    return jsonify(results)

@app.route('/cache/status')
def cache_status():
    """Endpoint to monitor cache usage and health."""
    api_cache.clear_expired()
    cache_info = {
        'total_entries': len(api_cache._cache),
        'cache_types': list(api_cache._cache_durations.keys()),
        'memory_usage': 'monitored'  # Could add actual memory usage calculation
    }
    return jsonify(cache_info)

if __name__ == '__main__':  # this line checks if the script is being run directly
    # If so, it starts the Flask application.
    logger.info("Starting AI-Powered Crypto Trading Assistant Backend...")
    app.run(debug=True)

# This is a simple Flask application that responds to a ping request.
# It defines routes like `/ping`, `/price`, `/predict`, and `/sentiment`.
# To run this application, save it as `app.py` and execute it with Python.
# Make sure to install Flask and requests using `pip install Flask requests`.

# To run the application, use the command: python app.py
# Ensure you have Flask installed in your Python environment.
# You can test the endpoints by navigating to http://localhost:5000/price, etc.
