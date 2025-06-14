import { useEffect, useState } from 'react'
// useState lets you store values that change
// useEffect lets your run code after the component loads
import './App.css'

//.jsx is javascript file that lets you write HTML-like code in JavaScript
function App() {
  const [message, setMessage] = useState('');
  //this creates a react state variable called message
  //message = the current value (starts as an empty string)
  //setMessage = a function to change the value of message
  //useState('') = the starting value which is an empty string

  useEffect(() => { //the => symbol in javascript is called an arrow function
    //an arrow function is a shorthand way to write a function
    //basically this says "run the code inside this block after the page loads"
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
        }, []); //this says "only run the useEffect once when the component loads"
        //the empty array [] means "no dependencies" so it only runs on page load

      return ( //this is what actually shows on the page
        <div>
          <h1>React + Flask</h1>
            <p>Backend says: {message}</p>
        </div>
      );
}

export default App;
