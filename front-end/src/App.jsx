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
import axios from 'axios';
import { getFriendlyError } from './Constants/errorMessages';
import Accessibility from './Components/Accessibility';

// ייבוא עמודי המערכת
import Login from './Pages/Login';
import Register from './Pages/Register';
import PersonalDashboard from './Pages/PersonalDashboard';
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
import ManageReviews from './Pages/Admin/ManageReviews';
import ManageRoles from './Pages/Admin/ManageRoles';
import SystemDashboard from './Pages/systemManager/SystemDashboard';
import ManageCategories from './Pages/Admin/ManageCategories.jsx';

// --- 🛡️ הוספת המתרגם האוטומטי (Axios Interceptor) ---
// אנחנו שמים את זה כאן כדי שזה יפעל על כל קריאת axios בפרויקט
axios.interceptors.response.use(
  (response) => response, // אם הכל תקין, פשוט תמשיך
  (error) => {
    // שליפת ההודעה מהשרת
    const serverMsg = error.response?.data?.message;

    // תרגום ההודעה לעברית באמצעות המילון שיצרנו ב-constants
    const friendlyMessage = getFriendlyError(serverMsg);

    // הצמדת ההודעה המתורגמת לאובייקט השגיאה
    // כך שבכל עמוד נוכל להשתמש ב: err.friendlyMessage
    error.friendlyMessage = friendlyMessage;

    return Promise.reject(error);
  }
);
function App() {
  const initialOptions = {
    'client-id':
      'AcmJ_D9sdEPr-xljTP6benC3y5quxmpENgJ-HxyQcC-WtKTXZqyv3pVmlJ99YUfxPccaAyb32G88V1W6', // כאן שמים את ה-Client ID מה-Dashboard של PayPal
    currency: 'ILS', // וודא שזה תואם למה שהגדרת בבקאנד (PAYPAL_CURRENCY)
    intent: 'capture',
  };
  const reCaptchaKey = '6Ld-xFcsAAAAAKhfZ3l73xY2xO5Po11EDognFI-G'; // וודא שזה בתוך מרכאות

  return (
    <div className="App">
      <Accessibility />
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
                <Route
                  path="/PersonalDashboard"
                  element={<PersonalDashboard />}
                />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/edit-project/:id" element={<EditProject />} />
                <Route path="/profile/:userId" element={<PublicProfile />} />
                <Route path="/about" element={<About />} />

                {/* --- נתיבי ניהול (אדמין בלבד) --- */}
                <Route path="/admin">
                  <Route path="system-stats" element={<SystemDashboard />} />

                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="manage-users" element={<ManageUsers />} />
                  <Route path="manage-projects" element={<ManageProjects />} />
                  <Route path="user-approval" element={<UserApproval />} />
                  <Route path="manage-reviews" element={<ManageReviews />} />
                  <Route path="manage-roles" element={<ManageRoles />} />
                  <Route
                    path="manage-categories"
                    element={<ManageCategories />}
                  />
                </Route>

                {/* דף 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </Router>
        </GoogleReCaptchaProvider>
      </PayPalScriptProvider>
    </div>
  );
}

export default App;
