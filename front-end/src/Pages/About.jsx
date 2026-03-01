//src/Pages/About.jsx
import {
  Cpu,
  Users,
  Target,
  Rocket,
  Lock,
  Globe,
  ShieldAlert,
  BarChart3,
  CheckCircle2,
  Server,
} from 'lucide-react';
import './PublicPages.css';

const About = () => {
  return (
    <div className="about-container" dir="rtl">
      {/* --- Hero Section --- */}
      <section className="hero">
        <div className="badge">מהפכת העיצוב התעשייתי</div>
        <h1>
          Designer Market: הופכים{' '}
          <span className="highlight">יצירה לקריירה</span>
        </h1>
        <p className="hero-subtitle">
          הפלטפורמה המקצועית הראשונה בישראל המיועדת לסטודנטים לעיצוב תעשייתי.
          גשר דיגיטלי חדשני בין עולם האקדמיה לשוק המסחרי הגלובלי.
        </p>
      </section>

      {/* --- Section: חזון וייעוד --- */}
      <section className="mission-statement">
        <div className="section-header">
          <h2>החזון והייעוד שלנו</h2>
          <p>
            המערכת פותחה כדי לאפשר לסטודנטים לחשוף את עבודותיהם ולהפיק מהן הכנסה
            בצורה פשוטה ומאובטחת.
          </p>
        </div>
        <div className="grid-3">
          <div className="mission-card">
            <Target className="icon-gold" />
            <h4>במה מקצועית</h4>
            <p>
              אספקת פלטפורמה ייעודית למעצבים בתחילת דרכם לשיווק תיקי עבודות.
            </p>
          </div>
          <div className="mission-card">
            <Cpu className="icon-gold" />
            <h4>משוב מבוסס AI</h4>
            <p>
              שיפור תהליך הלמידה והפידבק באמצעות שילוב מודלי שפה מתקדמים (LLM).
            </p>
          </div>
          <div className="mission-card">
            <Users className="icon-gold" />
            <h4>קהילה יוצרת</h4>
            <p>
              יצירת סביבה בטוחה המכבדת את זכויות היוצרים והכישרונות של הקהל
              היצירתי.
            </p>
          </div>
        </div>
      </section>

      {/* --- Section: הבעיה והפתרון --- */}
      <section className="market-analysis">
        <div className="section-header">
          <h2>למה Designer Market?</h2>
          <div className="underline"></div>
        </div>
        <div className="analysis-grid">
          <div className="analysis-card problem">
            <div className="card-icon">
              <ShieldAlert color="#ef4444" />
            </div>
            <h3>המצב הקיים בשוק</h3>
            <p>
              פלטפורמות מסחריות כלליות אינן מותאמות לצרכים הספציפיים של סטודנטים
              לעיצוב.
            </p>
            <ul className="fail-list">
              <li>❌ חוסר בממשקים ייעודיים להצגת קבצי עיצוב רגישים</li>
              <li>❌ ממשקים מורכבים שאינם אינטואיטיביים למשתמש </li>
              <li>❌ היעדר מנגנוני משוב חכמים מבוססי ניתוח נתונים</li>
            </ul>
          </div>
          <div className="analysis-card solution">
            <div className="card-icon">
              <Rocket color="#10b981" />
            </div>
            <h3>הפתרון הטכנולוגי</h3>
            <p>
              מערכת הוליסטית המשלבת מסחר, ניהול תוכן ובינה מלאכותית תחת קורת גג
              אחת.
            </p>
            <ul className="success-list">
              <li>✅ בינה מלאכותית (AI) להפקת משובים אובייקטיביים ובונים</li>
              <li>✅ מערכת סליקה חיצונית מאובטחת וניהול הרשאות קפדני</li>
              <li>✅ חוויית משתמש (UX/UI) מודרנית, נגישה ורספונסיבית</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="tech-stack-deep-dive">
        <div className="flex-title">
          <h2>ארכיטקטורת המערכת</h2>
        </div>
        <p>
          המערכת בנויה כ-Single Page Application (SPA) עם הפרדה מוחלטת בין
          ה-Client ל-Server, בתקשורת דרך REST API.
        </p>

        <div className="tech-grid">
          <div className="tech-box">
            <h4>MERN Stack</h4>
            <p>
              שימוש ב-MongoDB, Express, React ו-Node.js מבטיח ביצועים מהירים
              ושרידות גבוהה.
            </p>
          </div>
          <div className="tech-box">
            <h4>אבטחת מידע</h4>
            <p>
              הצפנת סיסמאות (Bcrypt), אימות (JWT), שימוש ב-HTTPS והגנה מפני SQL
              Injection.
            </p>
          </div>
          <div className="tech-box">
            <h4>ביצועים ועומסים</h4>
            <p>
              תמיכה בעד 1,000 משתמשים בו-זמנית וזמינות של 24/7 בסביבת שרת
              מאובטחת.
            </p>
          </div>
        </div>
      </section>

      {/* --- Section: אימות ואיכות (QA) --- */}
      <section className="qa-section">
        <div className="section-header">
          <h2>הבטחת איכות וסטנדרטים</h2>
          <p>
            הפלטפורמה עברה סבבי בדיקות מקיפים (STP/STR) להבטחת תקינות מקסימלית.
          </p>
        </div>
        <div className="qa-stats">
          <div className="stat-item">
            <BarChart3 />
            <span>95% כיסוי בדיקות </span>
          </div>
          <div className="stat-item">
            <CheckCircle2 />
            <span>בדיקות פונקציונליות מלאות (End-to-End)</span>
          </div>
          <div className="stat-item">
            <Globe />
            <span>תאימות לדפדפנים נפוצים ומובייל </span>
          </div>
        </div>
      </section>

      {/* --- Footer Section --- */}
      <footer className="main-footer">
        <div className="footer-content">
          <div className="footer-grid">
            <div className="footer-col copyright-info">
              <h4 className="footer-logo">Designer Market</h4>
              <p>
                © {new Date().getFullYear()} פותח על ידי זאב ליידרמן ואיל
                דוקטורי.
              </p>
              <p className="legal-text">
                הקבצים והתוכן מוגנים בזכויות יוצרים. שימוש מסחרי ללא אישור המעצב
                אסור בהחלט.
              </p>
            </div>
            <div className="footer-col security-status">
              <h4>טכנולוגיה וביטחון</h4>
              <div className="security-badges">
                <span className="secure-badge">
                  <Lock size={14} /> SSL Secured
                </span>
                <span className="secure-badge">
                  <Globe size={14} /> WCAG Accessibility
                </span>
                <span className="secure-badge">
                  <Server size={14} /> MongoDB Atlas
                </span>
              </div>
            </div>
          </div>
          <div className="footer-bottom-bar">
            <p>הפרויקט בוצע במסגרת לימודי הנדסאי תוכנה במכללה למנהל</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
