import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Importiere Seiten
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/signup';
import GroupSelection from './pages/Groupselection';
import MainPage from './pages/MainPage';
import AddTask from './pages/AddTask';

// Google OAuth Client ID hier einsetzen
const clientId = 'DEINE_GOOGLE_CLIENT_ID';

const App = () => {
  return (
    // <GoogleOAuthProvider clientId={477667469500-pspcp25dpu232e221ng8ebj3gf2og3ue.apps.googleusercontent.com}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/groupselection" element={<GroupSelection />} />
          <Route path="/mainpage" element={<MainPage />} />
          <Route path="/addtask" element={<AddTask />} />  
        </Routes>
      </Router>
    // </GoogleOAuthProvider>
  );
};

export default App;
