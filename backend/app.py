from flask import Flask #importing Flask from the flask module
# This code sets up a basic Flask application with a single route.
from flask_cors import CORS
#CORS is used to handle Cross-Origin Resource Sharing (CORS) in Flask applications.

app = Flask(__name__) #creates flask app named app
CORS(app)  #enables CORS for the Flask app
@app.route('/ping') #@ is a decorator,
# ping is the endpoint that will respond to HTTP GET requests
#HTTP Get requests is a method used to request data from a specified resource
def ping(): #ping() is a function that will be called when the endpoint is accessed
    # This function returns a simple JSON response.
    #a JSON response is a way to send data in a structured format
    return {"message": "pong"}

@app.route('/price') #another endpoint for price
def price():
    return{"symbol": "BTC", "price": 50000} #returns a JSON response with a symbol and price

@app.route('/predict')
def predict():
    return {"symbol": "BTC", "prediction": "BTC will rise by 5% in the next hour"} 

@app.route('/sentiment')
def sentiment():
    return {"symbol": "BTC", "sentiment": "positive", "score": 0.75}

if __name__ == '__main__': #this line checks if the script is being run directly
    # If so, it starts the Flask application.
    app.run(debug=True)

# This is a simple Flask application that responds to a ping request.
# It defines a single route `/ping` that returns a JSON response with the message "pong".
# To run this application, save it as `app.py` and execute it with Python.
# Make sure to install Flask first using `pip install Flask`.

# To run the application, use the command: python app.py
# Ensure you have Flask installed in your Python environment.
# You can test the endpoint by navigating to http://localhost:5000/ping in your web browser or using a tool like curl or Postman.
# This code is a basic setup for a Flask application.
# It can be extended with more routes and functionality as needed.
