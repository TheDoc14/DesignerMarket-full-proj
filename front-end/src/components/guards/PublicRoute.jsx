import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function PublicRoute({ user, children }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/profile", { replace: true });
    }
  }, [user, navigate]);

  // אם המשתמש קיים, תחזור null עד שהניווט יקרה
  if (user) return null;

  return children;
}

export default PublicRoute;
