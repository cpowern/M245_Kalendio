import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Google OAuth Client ID hier einsetzen
const clientId = 'DEINE_GOOGLE_CLIENT_ID';

function App(){
    return(
        <GoogleOAuthProvider clientId={clientId}>
            <div className="App">
                <LandingPage/> {/* Hier wird Landing Page oder Login Seite eingebunden*/}
            </div>
        </GoogleOAuthProvider>
    );
}

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
            </Routes>
        </Router>
    );
};

export default App;
