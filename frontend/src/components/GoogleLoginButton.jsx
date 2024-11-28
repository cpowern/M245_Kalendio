import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
 
const GoogleLoginButton = ({ onLoginSuccess }) => {
  const login = useGoogleLogin({
    onSuccess: (response) => {
      onLoginSuccess(response.access_token);  // Übergibt das Access Token an die übergeordnete Komponente
    },
    onError: (error) => {
      console.error('Fehler beim Login:', error);
    },
  });
 
  return <button onClick={login}>Mit Google anmelden</button>;
};
 
export default GoogleLoginButton;
