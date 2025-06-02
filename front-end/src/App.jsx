
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import EmailVerificationNotice from './pages/EmailVerificationNotice';
import VerifyEmailPage from './pages/VerifyEmailPage';
import GlobalStyles from './styles/GlobalStyles';
import PublicRoute from './components/guards/PublicRoute';


function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser =
      JSON.parse(localStorage.getItem('user')) ||
      JSON.parse(sessionStorage.getItem('user'));

    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  return (
    <Router>
      <GlobalStyles />
      <Navbar user={user} setUser={setUser} />
      <main>
        <Routes> 
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<PublicRoute user= {user}><LoginPage setUser={setUser}/></PublicRoute>} />
          <Route path="/register" element={<PublicRoute user= {user}><RegisterPage/></PublicRoute>} />
          <Route path="/email-verification-notice" element={<EmailVerificationNotice />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/profile" element={<ProfilePage user={user} />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
