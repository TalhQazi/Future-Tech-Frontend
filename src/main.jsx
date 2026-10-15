import React from 'react';
import ReactDOM from 'react-dom/client';
// Global tokens and base styles load before any component stylesheet
import './index.css';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
