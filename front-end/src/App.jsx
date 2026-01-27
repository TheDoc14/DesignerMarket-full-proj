import React from 'react';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import './App.css';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { AuthProvider, useAuth } from './Context/AuthContext';
import Navbar from './Components/Navbar';

// ייבוא עמודי המערכת
import Login from './Pages/Login';
import Register from './Pages/Register';
import Dashboard from './Pages/Dashboard';
import ProjectLibrary from './Pages/ProjectLibrary';
import AddProject from './Pages/AddProject';
import VerifyEmail from './Pages/VerifyEmail';
import NotFound from './Pages/NotFound';
import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './Pages/ResetPassword';
import EditProject from './Pages/EditProject';
import PublicProfile from './Pages/PublicProfile';
import About from './Pages/About';

// עמודי אדמין
import AdminDashboard from './Pages/Admin/AdminDashboard';
import ManageUsers from './Pages/Admin/ManageUsers';
import ManageProjects from './Pages/Admin/ManageProjects';
import UserApproval from './Pages/Admin/UserApproval';
import CreateAdmin from './Pages/Admin/CreateAdmin';
import ManageReviews from './Pages/Admin/ManageReviews';

function App() {
  const initialOptions = {
    'client-id':
      'AcmJ_D9sdEPr-xljTP6benC3y5quxmpENgJ-HxyQcC-WtKTXZqyv3pVmlJ99YUfxPccaAyb32G88V1W6', // כאן שמים את ה-Client ID מה-Dashboard של PayPal
    currency: 'ILS', // וודא שזה תואם למה שהגדרת בבקאנד (PAYPAL_CURRENCY)
    intent: 'capture',
  };
  const reCaptchaKey = '6Ld-xFcsAAAAAKhfZ3l73xY2xO5Po11EDognFI-G'; // וודא שזה בתוך מרכאות

  return (
    <PayPalScriptProvider options={initialOptions}>
      <GoogleReCaptchaProvider
        reCaptchaKey={reCaptchaKey}
        language="iw"
        useRecaptchaNet={false}
      >
        <Router>
          <AuthProvider>
            <Navbar />
            <Routes>
              {/* --- נתיבים ציבוריים --- */}
              <Route path="/" element={<ProjectLibrary />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/projects" element={<ProjectLibrary />} />
              <Route path="/add-project" element={<AddProject />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/edit-project/:id" element={<EditProject />} />
              <Route path="/profile/:userId" element={<PublicProfile />} />
              <Route path="/about" element={<About />} />

              {/* --- נתיבי ניהול (אדמין בלבד) --- */}
              <Route path="/admin">
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="manage-users" element={<ManageUsers />} />
                <Route path="manage-projects" element={<ManageProjects />} />
                <Route path="user-approval" element={<UserApproval />} />
                <Route path="create-admin" element={<CreateAdmin />} />
                <Route path="manage-reviews" element={<ManageReviews />} />
              </Route>

              {/* דף 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </Router>
      </GoogleReCaptchaProvider>
    </PayPalScriptProvider>
  );
}

export default App;
