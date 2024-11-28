import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import { GoogleOAuthProvider } from '@react-oauth/google';
 
// Google OAuth Client ID hier einsetzen
const clientId = 'DEINE_GOOGLE_CLIENT_ID';
 
const App = () => {
  return (
<GoogleOAuthProvider clientId={clientId}>
<Router>
<Routes>
<Route path="/" element={<LandingPage />} />
<Route path="/login" element={<Login />} />
</Routes>
</Router>
</GoogleOAuthProvider>
  );
};
 
export default App;