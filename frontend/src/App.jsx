// src/App.jsx
import React from 'react';
import './index.css'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importiere Seiten
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Groupselection from './pages/Groupselection';
import MainPage from './pages/MainPage';
import AddTask from './pages/AddTask';
import CreateGroup from './pages/CreateGroup';
import GoogleCalendarPage from './pages/GoogleCalendarPage'; 
import YourGoogleCalendar from './pages/YourGoogleCalendar';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/groupselection" element={<Groupselection />} />
        <Route path="/mainpage" element={<MainPage />} />
        <Route path="/addtask" element={<AddTask />} />
        <Route path="/creategroup" element={<CreateGroup />} />
        <Route path="/google-calendar" element={<GoogleCalendarPage />} />
        <Route path="/your-google-calendar" element={<YourGoogleCalendar />} />
      </Routes>
    </Router>
  );
};

export default App;
