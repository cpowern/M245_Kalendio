import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import GroupCreateJoin from './pages/GroupCreateJoin'; // new
import MainPage from './pages/MainPage';
import AddTask from './pages/AddTask';


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/groupcreatejoin" element={<GroupCreateJoin />} />  {/* Neue Route */}
        <Route path="/mainpage" element={<MainPage />} />
        <Route path="/addtask" element={<AddTask />} />  
      </Routes>
    </Router>
  );
};

export default App;
