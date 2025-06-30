import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client' // createRoot is used to render the React application
import { BrowserRouter } from 'react-router-dom'  
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render( // createRoot renders the React application into the root element
  <BrowserRouter> {/* BrowserRouter enables routing in the application */ }
    <StrictMode> {/* StrictMode helps identify potential problems in an application */ }
      <App /> {/* The actual application component that contains all routes and logic */ }
    </StrictMode>,
  </BrowserRouter>
)

//this file is the main entry point for the React application.
//It sets up the React application with a strict mode and a browser router.
