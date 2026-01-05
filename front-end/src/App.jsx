import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './Context/AuthContext';
import Navbar from './Components/Navbar';

// ייבוא עמודי המערכת
import Login from './Pages/Login';
import Register from './Pages/Register';
import Dashboard from './Pages/Dashboard';
import ProjectLibrary from './Pages/ProjectLibrary';
import ProjectDetails from './Pages/ProjectDetails';
import AddProject from './Pages/AddProject';
import VerifyEmail from './Pages/VerifyEmail';
import NotFound from './Pages/NotFound';

// עמודי אדמין
import AdminDashboard from './Pages/Admin/AdminDashboard';
import ManageUsers from './Pages/Admin/ManageUsers';
import ManageProjects from './Pages/Admin/ManageProjects';
import UserApproval from './Pages/Admin/UserApproval';
import CreateAdmin from './Pages/Admin/CreateAdmin';
import ManageReviews from './Pages/Admin/ManageReviews';


function App() {
  return (
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
          <Route path="/project/:id" element={<ProjectDetails />} />
          <Route path="/add-project" element={<AddProject />} />
          <Route path="/dashboard" element={<Dashboard />} />



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
  );
}

export default App;