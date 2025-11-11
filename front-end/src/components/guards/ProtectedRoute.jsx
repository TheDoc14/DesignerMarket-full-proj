import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * מגן על נתיבים לפי התחברות ותפקידים
 */
function ProtectedRoute({ user, allowedRoles = [], children }) {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    } else if (
      allowedRoles.length > 0 &&
      !allowedRoles.includes(user.role)
    ) {
      setHasAccess(false);
    } else {
      setHasAccess(true);
    }
  }, [user, allowedRoles, navigate]);

  if (!user) return null;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#d32f2f",
          fontWeight: "bold",
          fontSize: "1.5rem",
        }}
      >
        אין לך הרשאה לצפות בדף זה.
      </div>
    );
  }

  return hasAccess ? children : null;
}

export default ProtectedRoute;
