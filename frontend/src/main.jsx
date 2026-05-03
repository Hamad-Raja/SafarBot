import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';


axios.defaults.baseURL = import.meta.env.VITE_API_ORIGIN;
axios.defaults.withCredentials = true;


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="center-top"  reverseOrder={false}/>
      </AuthProvider>
    </BrowserRouter>
    
  </React.StrictMode>,
);
