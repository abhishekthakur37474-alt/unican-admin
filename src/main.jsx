import React from 'react';
import ReactDOM from 'react-dom/client';

// ============================================================
// CSS Import Order — DO NOT REORDER
// ============================================================
import 'bootstrap/dist/css/bootstrap.min.css';
import 'boxicons/css/boxicons.min.css';                // bx-* icons
import 'remixicon/fonts/remixicon.css';                // ri-* icons
import '@mdi/font/css/materialdesignicons.min.css';    // mdi-* icons
import './index.css';                                   // global overrides LAST

import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);