import React, { useState } from 'react';

const Accessibility = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleHighContrast = () => {
    document.body.classList.toggle('high-contrast');
  };

  const changeFontSize = (delta) => {
    const currentSize = parseFloat(
      window.getComputedStyle(document.body).fontSize
    );
    document.body.style.fontSize = `${currentSize + delta}px`;
  };

  return (
    <div
      style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 10001 }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ♿
      </button>

      {/* תפריט אפשרויות */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            left: '0',
            width: '220px',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '15px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* תיקון צבע הטקסט שיהיה שחור וקריא */}
          <button onClick={() => changeFontSize(2)} style={btnStyle}>
            ➕ הגדל טקסט
          </button>
          <button onClick={() => changeFontSize(-2)} style={btnStyle}>
            ➖ הקטן טקסט
          </button>
          <button onClick={toggleHighContrast} style={btnStyle}>
            🌓 ניגודיות גבוהה
          </button>
          <button
            onClick={() => setIsOpen(false)}
            style={{ ...btnStyle, backgroundColor: '#f0f0f0', color: '#333' }}
          >
            סגור
          </button>
        </div>
      )}
    </div>
  );
};

// ועדכן את ה-btnStyle שיהיה קריא:
const btnStyle = {
  padding: '10px',
  cursor: 'pointer',
  border: '1px solid #ddd',
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  color: '#000000', // טקסט שחור
  textAlign: 'right',
  fontWeight: 'bold',
  fontSize: '14px',
};
export default Accessibility;
