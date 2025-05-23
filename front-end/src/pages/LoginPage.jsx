// src/pages/LoginPage.jsx
import React from 'react';
import LoginForm from '../components/LoginForm';

function LoginPage({ setUser }) {
  return <LoginForm setUser={setUser} />;
}

export default LoginPage;
