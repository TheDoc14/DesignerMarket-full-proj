import React from 'react';
import { Link } from 'react-router-dom';

const ProductLibrary = () => {
  // נתונים זמניים להדגמה
  const products = [
    { id: 1, name: 'חולצה מעוצבת', price: 120, image: 'https://via.placeholder.com/150' },
    { id: 2, name: 'ג\'ינס וינטג\'', price: 250, image: 'https://via.placeholder.com/150' },
    { id: 3, name: 'נעלי ספורט', price: 400, image: 'https://via.placeholder.com/150' },
    { id: 4, name: 'תיק צד', price: 180, image: 'https://via.placeholder.com/150' },
  ];

  return (
    <div className="page-container">
      <h2>קטלוג מוצרים</h2>
      
      {/* רשת מוצרים - Grid */}
      <div style={styles.grid}>
        {products.map((product) => (
          <div key={product.id} style={styles.card}>
            <img src={product.image} alt={product.name} style={styles.image} />
            <h3>{product.name}</h3>
            <p>מחיר: ₪{product.price}</p>
            {/* כפתור למעבר לעמוד המוצר */}
            <Link to={`/product/${product.id}`}>
              <button style={styles.button}>צפה במוצר</button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

// עיצוב פנימי מהיר (אפשר להעביר ל-App.css בהמשך)
const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
  },
  card: {
    border: '1px solid #ddd',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    borderRadius: '4px',
    marginBottom: '10px',
  },
  button: {
    width: '100%',
    marginTop: '10px',
  }
};

export default ProductLibrary;