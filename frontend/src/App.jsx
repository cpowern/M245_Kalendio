// src/App.jsx
import React from 'react';
import './index.css'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importiere Seiten
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/signup';
import Groupselection from './pages/Groupselection';
import MainPage from './pages/MainPage';
import AddTask from './pages/AddTask';
import CreateGroup from './pages/CreateGroup'; // Hinzugefügt für Gruppen erstellen

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/groupselection" element={<Groupselection />} />
        <Route path="/mainpage" element={<MainPage />} />
        <Route path="/addtask" element={<AddTask />} />
        <Route path="/creategroup" element={<CreateGroup />} /> {/* Route für Gruppen erstellen */}
      </Routes>
    </Router>
  );
};

export default App;
