import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>404</h1>
      <p>אופס! העמוד שחיפשת לא נמצא.</p>
      <Link to="/">חזור לדף הבית</Link>
    </div>
  );
};

export default NotFound;