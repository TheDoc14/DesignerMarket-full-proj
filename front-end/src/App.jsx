// /src/app.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { AuthProvider } from './Context/AuthContext';
import Navbar from './Components/Navbar';
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

function App() {
  const initialOptions = {
    'client-id': process.env.REACT_APP_PAYPAL_CLIENT_ID,
    currency: 'ILS',
    intent: 'capture',
  };

  const reCaptchaKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

  if (!process.env.REACT_APP_PAYPAL_CLIENT_ID) {
    console.warn('Missing REACT_APP_PAYPAL_CLIENT_ID');
  }
  if (!reCaptchaKey) {
    console.warn('Missing REACT_APP_RECAPTCHA_SITE_KEY');
  }
  console.log('DEBUG: Key is:', process.env.REACT_APP_RECAPTCHA_SITE_KEY);
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
