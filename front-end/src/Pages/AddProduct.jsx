import React, { useState } from 'react';

const AddProduct = () => {
  const [productData, setProductData] = useState({
    name: '',
    price: '',
    description: '',
    category: 'clothing',
    image: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData({ ...productData, [name]: value });
  };

  const handleImageChange = (e) => {
    // שמירת קובץ התמונה (בהמשך נשלח אותו לשרת)
    setProductData({ ...productData, image: e.target.files[0] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Product to upload:', productData);
    alert('מוצר נשלח (סימולציה)! בדוק את הקונסול.');
    // כאן תהיה הלוגיקה של שליחת הנתונים לשרת
  };

  return (
    <div className="page-container">
      <h2>העלאת מוצר חדש</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
        
        <div>
          <label>שם המוצר:</label>
          <input 
            type="text" 
            name="name" 
            value={productData.name} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div>
          <label>מחיר (בש"ח):</label>
          <input 
            type="number" 
            name="price" 
            value={productData.price} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div>
          <label>קטגוריה:</label>
          <select 
            name="category" 
            value={productData.category} 
            onChange={handleChange}
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
          >
            <option value="clothing">ביגוד</option>
            <option value="footwear">הנעלה</option>
            <option value="accessories">אביזרים</option>
          </select>
        </div>

        <div>
          <label>תיאור המוצר:</label>
          <textarea 
            name="description" 
            rows="4" 
            value={productData.description} 
            onChange={handleChange}
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd', resize: 'vertical' }}
          />
        </div>

        <div>
          <label>תמונת מוצר:</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange} 
          />
        </div>

        <button type="submit">פרסם מוצר</button>
      </form>
    </div>
  );
};

export default AddProduct;