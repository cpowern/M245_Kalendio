import React from 'react';
import './index.css'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Groupselection from './pages/Groupselection';
import MainPage from './pages/MainPage';
import CreateGroup from './pages/CreateGroup';
import GoogleCalendarPage from './pages/GoogleCalendarPage'; 
import YourGoogleCalendar from './pages/YourGoogleCalendar';
import ShowTask from './pages/ShowTask';
import TestTaskCreation from './pages/TestTaskCreation'; // Adjust path as needed
import DayView from './pages/DayViewWithHours';


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/groupselection" element={<Groupselection />} />
        <Route path="/mainpage" element={<MainPage />} />
        <Route path="/creategroup" element={<CreateGroup />} />
        <Route path="/google-calendar" element={<GoogleCalendarPage />} />
        <Route path="/your-google-calendar" element={<YourGoogleCalendar />} />
        <Route path="/show-task" element={<ShowTask />} /> {/* Fixed route */}
        <Route path="/test-task" element={<TestTaskCreation />} />
        <Route path="/day-view" element={<DayView/>} />
      </Routes>
    </Router>
  );
};

export default App;
