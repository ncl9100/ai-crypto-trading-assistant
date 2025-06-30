from flask import Flask, jsonify  # importing Flask and jsonify from the flask module
# This code sets up a basic Flask application with a single route.
from flask_cors import CORS
# CORS is used to handle Cross-Origin Resource Sharing (CORS) in Flask applications.
import requests
# requests is a Python library for making HTTP requests.
import time
# time is used for caching the API response

app = Flask(__name__)  # creates flask app named app
CORS(app)  # enables CORS for the Flask app

# Cache variables to avoid CoinGecko rate limits
cached_price = None
last_fetched = 0
CACHE_DURATION = 15  # duration (in seconds) to cache the API response

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
    # Added Ethereum prediction alongside BTC
    return {
        "BTC": {
            "symbol": "BTC",
            "prediction": "Bitcoin will rise by 5% in the next hour"
        },
        "ETH": {
            "symbol": "ETH",
            "prediction": "Ethereum will rise by 3% in the next hour"
        }
    }

@app.route('/sentiment')
def sentiment():
    # Added Ethereum sentiment alongside BTC
    return {
        "BTC": {
            "symbol": "BTC",
            "sentiment": "positive",
            "score": 0.75
        },
        "ETH": {
            "symbol": "ETH",
            "sentiment": "neutral",
            "score": 0.52
        }
    }

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
