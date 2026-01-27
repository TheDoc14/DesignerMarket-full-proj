import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Checkout = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        // שליפת הפרויקט לפי ID כפי שמופיע בתיעוד 4.3
        const response = await axios.get(
          `http://localhost:5000/api/projects/${projectId}`
        );
        setProject(response.data.project);
      } catch (err) {
        console.error('שגיאה בטעינת פרויקט לתשלום', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // סימולציית תשלום (כאן בד"כ מחברים Stripe/PayPal)
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        // שליחת בקשה לשרת לעדכון רכישה או שליחת מייל
        // במידה ואין ראוט ייעודי, ניתן להשתמש במידע מה-Profile
        alert(`התשלום על סך ₪${project.price} הושלם! הקבצים נשלחו למייל שלך.`);
        navigate('/projects');
      } catch (err) {
        alert('שגיאה בתהליך הרכישה');
      } finally {
        setIsProcessing(false);
      }
    }, 2000);
  };

  if (loading) return <div style={styles.center}>מכין את דף התשלום...</div>;
  if (!project) return <div style={styles.center}>פרויקט לא נמצא</div>;

  return (
    <div style={styles.container}>
      <div style={styles.checkoutCard}>
        <h2 style={styles.title}>סיכום הזמנה</h2>
        <div style={styles.projectSummary}>
          <p>
            <strong>פרויקט:</strong> {project.title}
          </p>
          <p>
            <strong>יוצר:</strong>{' '}
            {project.createdBy?.username || 'מעצב במערכת'}
          </p>
          <p style={styles.price}>
            <strong>לתשלום:</strong> ₪{project.price}
          </p>
        </div>

        <form onSubmit={handlePayment} style={styles.form}>
          <h3 style={styles.subTitle}>פרטי אשראי (סימולציה)</h3>
          <input
            type="text"
            placeholder="מספר כרטיס"
            style={styles.input}
            required
          />
          <div style={styles.row}>
            <input
              type="text"
              placeholder="תוקף"
              style={styles.inputSmall}
              required
            />
            <input
              type="text"
              placeholder="CVV"
              style={styles.inputSmall}
              required
            />
          </div>
          <button type="submit" disabled={isProcessing} style={styles.payBtn}>
            {isProcessing ? 'מעבד תשלום...' : `שלם עכשיו ₪${project.price}`}
          </button>
        </form>
        <p style={styles.note}>* הקבצים יישלחו לכתובת המייל הרשומה בחשבונך.</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    direction: 'rtl',
    padding: '50px 20px',
    backgroundColor: '#f4f7f6',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
  },
  checkoutCard: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '500px',
  },
  title: { textAlign: 'center', color: '#2c3e50', marginBottom: '20px' },
  projectSummary: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '12px',
    marginBottom: '25px',
    border: '1px solid #eee',
  },
  price: { fontSize: '20px', color: '#27ae60', fontWeight: 'bold' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  subTitle: { fontSize: '16px', color: '#34495e' },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    outline: 'none',
  },
  inputSmall: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    outline: 'none',
    flex: 1,
  },
  row: { display: 'flex', gap: '10px' },
  payBtn: {
    padding: '15px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#2ecc71',
    color: '#fff',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: '0.3s',
  },
  note: {
    fontSize: '12px',
    color: '#888',
    textAlign: 'center',
    marginTop: '15px',
  },
  center: { textAlign: 'center', marginTop: '100px', fontSize: '20px' },
};

export default Checkout;
