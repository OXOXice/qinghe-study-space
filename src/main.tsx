import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CampusApp from './app/campus-app';
import EnglishApp from './app/english/english-app';
import './globals.css';
const isEnglish=window.location.pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '').endsWith('/english');
const App=isEnglish?EnglishApp:CampusApp;
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
