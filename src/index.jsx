import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Configure application mounting with React 18 createRoot API
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the application with StrictMode for development
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);