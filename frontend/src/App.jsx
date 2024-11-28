import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/signup';
import GroupSelection from './pages/Groupselection';
import MainPage from './pages/mainpage';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/groupselection" element={<GroupSelection />} />
                <Route path="/mainpage" element={<MainPage />} />
            </Routes>
        </Router>
    );
};

export default App;
