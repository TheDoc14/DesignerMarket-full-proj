import React from 'react';
import { useParams, Link } from 'react-router-dom';

const ProductDetails = () => {
  const { id } = useParams(); // שליפת ה-ID מהכתובת

  // בדרך כלל כאן תהיה קריאה לשרת להביא את פרטי המוצר לפי ה-ID
  // כרגע נציג מידע פיקטיבי
  const product = {
    id: id,
    name: 'חולצה מעוצבת לדוגמה',
    price: 120,
    description: 'זוהי חולצה איכותית מבד כותנה מלא, מתאימה לקיץ ולחורף.',
    image: 'https://via.placeholder.com/300'
  };

  return (
    <div className="page-container">
      <Link to="/products" style={{ textDecoration: 'none', color: '#666' }}>
         ← חזרה לקטלוג
      </Link>
      
      <div style={styles.container}>
        <div style={styles.imageContainer}>
          <img src={product.image} alt={product.name} style={styles.image} />
        </div>
        
        <div style={styles.details}>
          <h1>{product.name} (מוצר #{id})</h1>
          <h2 style={{ color: '#2ecc71' }}>₪{product.price}</h2>
          <p>{product.description}</p>
          <button style={{ marginTop: '20px', width: '200px' }}>הוסף לסל</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    gap: '40px',
    marginTop: '20px',
    flexWrap: 'wrap',
  },
  imageContainer: {
    flex: '1',
    maxWidth: '400px',
  },
  image: {
    width: '100%',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  details: {
    flex: '2',
    textAlign: 'right',
  }
};

export default ProductDetails;