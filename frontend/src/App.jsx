import { useEffect, useState } from 'react'
// useState lets you store values that change
// useEffect lets your run code after the component loads
import './App.css'

//.jsx is javascript file that lets you write HTML-like code in JavaScript
function App() {
  const [message, setMessage] = useState('');
  const [price, setPrice] = useState(null);
  const [predict, setPredict] = useState(null);
  const [sentiment, setSentiment] = useState(null); 


  //this creates a react state variable called message
  //message = the current value (starts as an empty string)
  //setMessage = a function to change the value of message
  //useState('') = the starting value which is an empty string

  useEffect(() => { //the => symbol in javascript is called an arrow function
    //an arrow function is a shorthand way to write a function
    //basically this says "run the code inside this block after the page loads"

    // /ping
    fetch('http://127.0.0.1:5000/ping') // this sends an HTTP request to your Flask server
    //you're asking: "Hey Flask, what's at /ping?"
      .then((res) => res.json()) //when flask replies, this line
      //takes the response
      //parses it as JSON (a format for data)
      //Example: {"message": "pong"} becomes {message: "pong"}
      .then((data) => setMessage(data.message))
      //this updates your message state with the backend result
      //if Flask sends { message: "pong" }
      //then setMessage("pong") runs
      //now message = "pong" and React will update the page
      .catch((err) => {
        console.error("Error fetching:", err);
        //if something goes wrong, this catches the error
        //and logs it to the console so you can see what happened
        setMessage('Error connecting to backend');
      });

    // /price
    fetch('http://127.0.0.1:5000/price')
      .then((res) => res.json())
      .then((data) => setPrice(data))
      .catch((err) => {
        console.error("Error fetching price:", err);
      });
    
    // predict
    fetch('http://127.0.0.1:5000/predict')
      .then((res) => res.json())
      .then((data) => setPredict(data))
      .catch((err) => {
        console.error("Error fetching /predict:", err)
      });

    // /sentiment
    fetch('http://127.0.0.1:5000/sentiment')
      .then((res) => res.json())
      .then((data) => setSentiment(data))
      .catch((err) => {
        console.error("Error fetching /sentiment:", err);
      });

  }, []); //this says "only run the useEffect once when the component loads"
        //the empty array [] means "no dependencies" so it only runs on page load

      return ( //this is what actually shows on the page
        <div style={{ padding: '2rem' }}>
          <h1>React + Flask</h1>
            <p>Backend says: {message}</p>
          
          <h2>/price</h2>
          {price ? (
            <p>{price.symbol}: ${price.price}</p>
          ) : (
            <p>Loading... </p>
          )}

          <h2>/predict</h2>
          {predict ? (
            <p>{predict.symbol}: {predict.prediction}</p>
          ) : (
            <p>Loading...</p>
          )}

          <h2>/sentiment</h2>
          {sentiment ? (
            <p>{sentiment.symbol}: {sentiment.sentiment} (Score: {sentiment.score})</p>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      );
}

export default App;  // this exports the App component so it can be used in other files
