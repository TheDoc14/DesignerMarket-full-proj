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
import ResendVerificationPage from './pages/ResendVerificationPage';
import PublicRoute from './components/guards/PublicRoute';
import ProtectedRoute from './components/guards/ProtectedRoute';
import AdminApprovalPage from './pages/AdminApprovalPage';
import CreateProjectPage from './pages/CreateProjectPage.jsx';
import EditProfilePage from './pages/EditProfilePage';
import './App.css';
import ProjectsListPage from "./pages/ProjectsListPage.jsx";




function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser =
      JSON.parse(localStorage.getItem('user')) ||
      JSON.parse(sessionStorage.getItem('user'));
    if (savedUser) setUser(savedUser);

    // ✅ מאפשר לקומפוננטות אחרות לעדכן את המשתמש
    window.setUserGlobal = setUser;
  }, []);

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <main>
        <Routes> 
          <Route path="/" element={<HomePage />} />

          <Route
            path="/login"
            element={
              <PublicRoute user={user}>
                <LoginPage setUser={setUser} />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute user={user}>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route path="/email-verification-notice" element={<EmailVerificationNotice />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/resend-verification" element={<ResendVerificationPage />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute user={user}>
                <ProfilePage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute user={user}>
                <EditProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-project"
            element={
              <ProtectedRoute user={user} allowedRoles={['student', 'designer']}>
                <CreateProjectPage />
              </ProtectedRoute>
            }
          />
          <Route path="/projects" element={<ProjectsListPage />} />

          <Route
            path="/admin/approve-users"
            element={
              <ProtectedRoute user={user} allowedRoles={['admin']}>
                <AdminApprovalPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
