import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/signup';
import GroupSelection from './pages/Groupselection';
import MainPage from './pages/mainpage';

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
<Route path="/signup" element={<Signup />} />
                <Route path="/groupselection" element={<GroupSelection />} />
                <Route path="/mainpage" element={<MainPage />} />
</Routes>
</Router>
</GoogleOAuthProvider>
  );
};
 
export default App;