import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './Context/AuthContext';

// ייבוא העמודים הקודמים
import Home from './Pages/Home';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Dashboard from './Pages/Dashboard';
import NotFound from './Pages/NotFound';
import VerifyEmail from './Pages/VerifyEmail'
// --- ייבוא העמודים החדשים ---
import ProductLibrary from './Pages/ProductLibrary';
import ProductDetails from './Pages/ProductDetails';
import AddProduct from './Pages/AddProduct';
import Navbar from './Components/Navbar';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
       <Route path="/verify-email" element={<VerifyEmail />} />
        
        {/* --- נתיבים חדשים --- */}
        <Route path="/products" element={<ProductLibrary />} />
        <Route path="/product/:id" element={<ProductDetails />} /> {/* נתיב דינמי עם ID */}
        <Route path="/add-product" element={<AddProduct />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
            </AuthProvider>

    </Router>
  );
}

export default App;