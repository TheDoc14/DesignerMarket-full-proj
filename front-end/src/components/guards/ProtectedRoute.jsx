import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * מגן על נתיבים לפי התחברות ותפקידים
 */
function ProtectedRoute({ user, allowedRoles = [], children }) {
  // לא מחובר בכלל – שלח להתחברות
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // מחובר אבל אין לו הרשאות
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // החזר הודעת שגיאה על חסימה (במקום הפניה שקטה)
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#d32f2f',
        fontWeight: 'bold',
        fontSize: '1.5rem'
      }}>
        אין לך הרשאה לצפות בדף זה.
      </div>
    );
  }

  // יש הרשאה
  return children;
}

export default ProtectedRoute;
