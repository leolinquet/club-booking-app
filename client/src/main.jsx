import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './mobile.css';
import './styles/theme.css';
import './styles/ui.css';
import "./a2hs.js";

const el = document.getElementById("root");
createRoot(el).render(<App />);
