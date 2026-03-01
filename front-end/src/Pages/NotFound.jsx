//src/Pages/NotFound.jsx
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div>
      <h1>404</h1>
      <p>אופס! העמוד שחיפשת לא נמצא.</p>
      <Link to="/">חזור לדף הבית</Link>
    </div>
  );
};

export default NotFound;
