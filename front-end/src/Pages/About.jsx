import React from 'react';
import {
  Cpu,
  Palette,
  ShieldCheck,
  Users,
  Target,
  Rocket,
  Lock,
  Globe,
  Zap,
  Search,
  ShieldAlert,
  Code2,
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
          אנחנו כאן כדי לגשר על הפער בין שולחן השרטוט באקדמיה לבין השוק הגלובלי.
        </p>
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
              רוב הפלטפורמות כיום הן כלליות ואינן מתאימות לסטודנטים. חסרים כלים
              להצגת קבצי תלת-ממד, הגנה על זכויות יוצרים ומשוב מקצועי.
            </p>
            <ul className="fail-list">
              <li>❌ חוסר בפידבק חכם מבוסס נתונים</li>
              <li>❌ ממשקי משתמש מורכבים ובלתי אינטואיטיביים</li>
              <li>❌ אבטחת מידע חלקית לקבצים רגישים</li>
            </ul>
          </div>
          <div className="analysis-card solution">
            <div className="card-icon">
              <Rocket color="#10b981" />
            </div>
            <h3>הפתרון שלנו</h3>
            <p>
              יצרנו בית ייעודי שבו השפה היא שפת העיצוב. מקום שבו הקבצים שלכם
              מקבלים את הכבוד הראוי והביקורת המקצועית ביותר.
            </p>
            <ul className="success-list">
              <li>✅ בינה מלאכותית (AI) להפקת משובים</li>
              <li>✅ מערכת סליקה מאובטחת ופשוטה</li>
              <li>✅ ניהול תוכן קפדני וסינון ביקורות</li>
            </ul>
          </div>
        </div>
      </section>

      {/* --- Section: יכולות ליבה --- */}
      <section className="features-highlight">
        <div className="grid-3">
          <div className="feature-item">
            <Zap className="icon-blue" />
            <h4>משוב AI חכם</h4>
            <p>
              אלגוריתם ה-AI שלנו מנתח פרויקטים ומספק תובנות עיצוביות והצעות
              לשיפור בזמן אמת.
            </p>
          </div>
          <div className="feature-item">
            <ShieldCheck className="icon-blue" />
            <h4>בקרת איכות (Admin)</h4>
            <p>
              מנהלי המערכת מפקחים על התוכן, מאשרים מוצרים וחוסמים תוכן לא הולם
              להגנה על הקהילה.
            </p>
          </div>
          <div className="feature-item">
            <Search className="icon-blue" />
            <h4>חיפוש וסיווג חכם</h4>
            <p>
              איתור פרויקטים לפי קטגוריה, מחיר או פופולריות – חוויית רכישה
              ממוקדת למעצבים.
            </p>
          </div>
        </div>
      </section>

      {/* --- Section: טכנולוגיה (MERN Stack) --- */}
      <section className="tech-stack-section">
        <div className="tech-content">
          <div className="tech-text">
            <div className="flex-title">
              <Code2 className="title-icon" />
              <h2>טכנולוגיה בסטנדרט הגבוה ביותר</h2>
            </div>
            <p>
              המערכת מבוססת על <strong>MERN Stack</strong>, המאפשרת זמינות של
              24/7, ביצועים מהירים תחת עומס של עד 1,000 משתמשים בו-זמנית ושרידות
              גבוהה.
            </p>
          </div>
          <div className="tech-pills">
            <span className="pill">MongoDB</span>
            <span className="pill">Express.js</span>
            <span className="pill">React.js</span>
            <span className="pill">Node.js</span>
            <span className="pill">AI Engine</span>
            <span className="pill">HTTPS / SSL</span>
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
                © {new Date().getFullYear()} כל הזכויות שמורות ל-Designer
                Market.
              </p>
              <p className="legal-text">
                התוכן והקבצים באתר מוגנים בזכויות יוצרים. כל שימוש מסחרי ללא
                אישור המעצב אסור בהחלט.
              </p>
            </div>

            <div className="footer-col security-status">
              <h4>אבטחה וסטנדרטים</h4>
              <div className="security-badges">
                <span className="secure-badge">
                  <Lock size={14} /> HTTPS Secured
                </span>
                <span className="secure-badge">
                  <Globe size={14} /> נגישות מלאה
                </span>
              </div>
              <p className="server-status">
                המערכת פועלת בסביבת Web מאובטחת ומותאמת למובייל.
              </p>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <p>פותח עבור קהילת הסטודנטים והמעצבים התעשייתיים בישראל</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
