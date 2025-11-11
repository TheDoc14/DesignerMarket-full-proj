import React from 'react';
import { Navigate } from 'react-router-dom';

function PublicRoute({ user, children }) {
  return user ? <Navigate to="/profile" replace /> : children;
}

export default PublicRoute;
