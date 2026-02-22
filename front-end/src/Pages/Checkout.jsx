import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { usePermission } from '../Hooks/usePermission.jsx'; // שימוש ב-Hook ההרשאות המרכזי

const Checkout = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const { hasPermission, user, loading: permissionLoading } = usePermission();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // מפת תרגומים מלאה לפי ה-Middleware של DesignerMarket
  const errorTranslations = {
    'You cannot purchase your own project.': 'לא ניתן לרכוש פרויקט שאתה יצרת.',
    'Order already processed.': 'כבר רכשת את הפרויקט הזה בעבר.',
    'You already have a pending order for this project.':
      'קיימת הזמנה פתוחה עבור פרויקט זה.',
    'Order already pending for this project':
      'קיימת הזמנה ממתינה במערכת לפרויקט זה.',
    'Seller PayPal email is missing.':
      'פרטי המוכר (PayPal) חסרים, לא ניתן להשלים את הרכישה.',
    'Project not found.': 'הפרויקט כבר לא זמין לרכישה.',
    'Duplicate key: record already exists.': 'שגיאה: קיימת רשומה כפולה במערכת.',
    'Internal Server Error': 'אירעה שגיאה פנימית במערכת.',
    'Payment service misconfigured.': 'תקלה בשירות התשלומים, אנא פנה לתמיכה.',
    'Payment provider error (capture failed).':
      'העסקה נדחתה על ידי ספק התשלום.',
  };

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/projects/${projectId}`);
      setProject(
        response.data?.project ||
          response.data?.data?.project ||
          response.data?.data
      );
    } catch (err) {
      setError('שגיאה בטעינת פרטי הפרויקט.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!permissionLoading && user && projectId) {
      fetchProject();
    }
  }, [projectId, user, permissionLoading, fetchProject]);

  const handlePayment = async (e) => {
    if (e) e.preventDefault();

    // 3. הגנה נוספת ברמת הפונקציה: בדיקת הרשאת יצירת הזמנה
    if (!hasPermission('orders.create')) {
      setError('אין לך הרשאה לבצע רכישות במערכת.');
      return;
    }
    setIsProcessing(true);
    setError(null);

    const storageKey = `pending_paypal_${projectId}`;

    try {
      // ניסיון 1: יצירת הזמנה חדשה (עם נטרול מסך אדום)
      const response = await api.post(
        '/api/orders/paypal/create',
        { projectId },
        { validateStatus: (status) => status < 500 }
      );

      // --- טיפול יצירתי ב-409 (Conflict) ---
      if (response.status === 409) {
        const serverMsg = response.data?.message;
        setError('מזהה הזמנה קיימת. מנסה להשלים את הרכישה עבורך...');

        // חיפוש מזהה תשלום ב-Storage או ב-AuthContext
        let paypalId = localStorage.getItem(storageKey);
        if (!paypalId && user?.orders) {
          const existingOrder = user.orders.find(
            (o) =>
              o.projectId === projectId &&
              ['CREATED', 'APPROVED'].includes(o.status)
          );
          paypalId = existingOrder?.paypalOrderId;
        }

        if (paypalId) {
          const captureRes = await api.post(
            '/api/orders/paypal/capture',
            { paypalOrderId: paypalId },
            { validateStatus: (status) => status < 500 }
          );

          if (captureRes.status === 200) {
            alert('הצלחנו לשחזר ולהשלים את ההזמנה הקיימת שלך!');
            localStorage.removeItem(storageKey);
            navigate('/dashboard');
            return;
          }
        }

        // אם הניסיון האוטומטי נכשל, נציג את השגיאה המתורגמת מהשרת
        setError(
          errorTranslations[serverMsg] ||
            'קיימת הזמנה פתוחה. אנא פנה לאזור האישי.'
        );
      } else if (response.status >= 400) {
        // טיפול בשאר שגיאות ה-4xx (כמו 403 - קנייה של פרויקט עצמי)
        const serverMsg = response.data?.message;
        setError(errorTranslations[serverMsg] || 'חלה שגיאה בתהליך התשלום.');
      } else if (response.status === 200) {
        const { paypalOrderId, approveLink } = response.data.order;
        localStorage.setItem(storageKey, paypalOrderId);
        if (approveLink) {
          window.location.href = approveLink;
          return;
        }
      }
    } catch (err) {
      setError('חלה שגיאה בתקשורת עם השרת. וודא שאתה מחובר.');
    } finally {
      setIsProcessing(false);
    }
  };
  if (permissionLoading)
    return <div className="loader">בודק הרשאות רכישה...</div>;

  if (loading) return <div>מכין את דף התשלום...</div>;

  if (!user) {
    return (
      <div className="admin-container">
        <h2>עליך להתחבר</h2>
        <p>כדי לרכוש פרויקטים, עליך להיות מחובר למערכת.</p>
        <button onClick={() => navigate('/login')}>מעבר להתחברות</button>
      </div>
    );
  }

  // בדיקה אם למשתמש יש הרשאה לבצע הזמנות
  if (!hasPermission('orders.create')) {
    return (
      <div className="admin-container">
        <h2>גישה חסומה</h2>
        <p>חשבונך אינו מורשה לבצע רכישות. אנא פנה לתמיכה במידה ומדובר בטעות.</p>
      </div>
    );
  }

  return (
    <div>
      <div>
        <h2>סיכום הזמנה</h2>

        {error && <div>⚠️ {error}</div>}

        <div>
          <p>
            <strong>פרויקט:</strong> {project?.title}
          </p>
          <p>
            <strong>יוצר:</strong>{' '}
            {project?.createdBy?.username || 'מעצב במערכת'}
          </p>
          <p>
            <strong>לתשלום:</strong> ₪{project?.price}
          </p>
        </div>

        <form onSubmit={handlePayment}>
          <h3>פרטי אשראי (סימולציה)</h3>
          <input type="text" placeholder="מספר כרטיס" required />
          <div>
            <input type="text" placeholder="תוקף" required />
            <input type="text" placeholder="CVV" required />
          </div>

          <button type="submit" disabled={isProcessing}>
            {isProcessing ? 'מעבד תשלום...' : `שלם עכשיו ₪${project?.price}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
