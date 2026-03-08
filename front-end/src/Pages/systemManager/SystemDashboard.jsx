//src/Pages/systemManager/SystemDashboard.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../api/axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Lightbulb,
  Target,
  Award,
  History,
} from 'lucide-react';
import { usePermission } from '../../Hooks/usePermission.jsx'; // שינוי 1: ייבוא usePermission
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import '../PublicPages.css';

const SystemDashboard = () => {
  const {
    hasPermission,
    user: currentUser,
    loading: permissionLoading,
  } = usePermission();
  const [stats, setStats] = useState(null);
  const [finance, setFinance] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const dashboardRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!hasPermission('stats.read')) return;
    try {
      setLoading(true);
      const requests = [
        api.get('/api/business/stats'),
        api.get('/api/business/finance'),
      ];

      if (hasPermission('admin.panel.access')) {
        requests.push(api.get('/api/admin/stats'));
      }

      const responses = await Promise.all(requests);

      setStats(responses[0].data?.stats || responses[0].data?.data?.stats);
      setFinance(
        responses[1].data?.finance || responses[1].data?.data?.finance
      );

      if (responses[2]) {
        setAdminStats(
          responses[2].data?.stats || responses[2].data?.data?.stats
        );
      }
    } catch (err) {
      console.error('Managerial data load failed', err);
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    // נריץ את fetchData רק כשטעינת ההרשאות הסתיימה ויש משתמש תקין
    if (!permissionLoading && currentUser?.id && hasPermission('stats.read')) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, permissionLoading]);
  // הוצאנו את fetchData ו-hasPermission מהמערך כדי למנוע לולאה

  if (permissionLoading)
    return <div className="loader">מאמת הרשאות ניהול...</div>;
  if (!hasPermission('stats.read')) {
    return (
      <div className="admin-container">
        אין לך הרשאה לצפות בנתונים אסטרטגיים.
      </div>
    );
  }

  // חישובי בינה עסקית (BI)
  const grossTotal = finance?.totals?.grossRevenue || 0;
  const aov =
    finance?.totals?.ordersCount > 0
      ? (grossTotal / finance.totals.ordersCount).toFixed(0)
      : 0;
  const profitMargin =
    grossTotal > 0
      ? ((finance.totals.platformFees / grossTotal) * 100).toFixed(1)
      : 0;
  const bestCategory =
    stats?.breakdowns?.projectsByCategory[0]?.category || 'כללי';

  const revenueTrend = finance?.recent
    ?.map((o) => ({
      time: new Date(o.createdAt).toLocaleDateString('he-IL', {
        day: '2-digit',
        month: '2-digit',
      }),
      val: o.amountTotal,
    }))
    .reverse();

  // --- ייצוא אקסל ניהולי ---
  const handleExcelExport = () => {
    const wb = XLSX.utils.book_new();
    const summary = [
      { 'פרמטר עסקי': 'מחזור מכירות ברוטו', ערך: `₪${grossTotal}` },
      { 'פרמטר עסקי': 'ערך הזמנה ממוצע', ערך: `₪${aov}` },
      { 'פרמטר עסקי': 'אחוז רווחיות פלטפורמה', ערך: `${profitMargin}%` },
      { 'פרמטר עסקי': 'קטגוריה מובילה', ערך: bestCategory },
    ];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(summary),
      'Executive Summary'
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(finance?.recent || []),
      'Transactions Detail'
    );
    XLSX.writeFile(
      wb,
      `DesignerMarket_Business_Report_${new Date().toLocaleDateString()}.xlsx`
    );
  };

  // --- ייצוא PDF מקצועי ---
  const handlePDFExport = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(22);
    doc.text('Designer Market - Executive Performance Report', 105, 15, {
      align: 'center',
    });

    if (dashboardRef.current) {
      const canvas = await html2canvas(dashboardRef.current, { scale: 2 });
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 30, 190, 105);
    }

    autoTable(doc, {
      head: [['Performance Metric', 'Current Value', 'Strategic Insight']],
      body: [
        ['Total Sales', `${grossTotal} ILS`, 'Healthy revenue stream'],
        [
          'Average Order (AOV)',
          `${aov} ILS`,
          `Target: > ${Number(aov) + 50} ILS`,
        ],
        [
          'Platform Profit',
          `${finance.totals.platformFees} ILS`,
          `${profitMargin}% retention rate`,
        ],
      ],
      startY: 140,
      theme: 'striped',
      headStyles: { fillColor: [45, 52, 54] },
    });

    doc.save('DesignerMarket_Executive_Insights.pdf');
  };

  if (loading) return <div className="loader">מנתח ביצועים עסקיים...</div>;

  return (
    <div className="admin-container dashboard-strategic-root" dir="rtl">
      <header className="dashboard-header strategic-header">
        <div>
          <h1>לוח בקרה אסטרטגי</h1>
          <p>ניתוח נתונים להגדלת הפעילות העסקית ב-Designer Market</p>
        </div>
        <div className="export-btns">
          <button onClick={handleExcelExport} className="btn-export excel">
            <FileSpreadsheet size={18} /> אקסל ניהולי
          </button>
          <button onClick={handlePDFExport} className="btn-export pdf">
            <FileText size={18} /> הפק דוח PDF
          </button>
        </div>
      </header>

      <div ref={dashboardRef} className="dashboard-content-wrapper">
        {/* שלושת הרובריקות אחת ליד השנייה */}
        <div className="manager-kpi-grid">
          <div className="stat-card manager-style primary-gradient">
            <div className="manager-icon">
              <DollarSign size={28} />
            </div>
            <div className="stat-info">
              <span>מחזור מכירות כולל : </span>
              <strong>₪{grossTotal.toLocaleString()}</strong>
            </div>
          </div>
          <div className="stat-card manager-style border-yellow">
            <div className="manager-icon">
              <Target size={28} />
            </div>
            <div className="stat-info">
              <span>ערך הזמנה (AOV) : </span>
              <strong>₪{aov}</strong>
            </div>
          </div>
          <div className="stat-card manager-style border-green">
            <div className="manager-icon">
              <TrendingUp size={28} />
            </div>
            <div className="stat-info">
              <span>רווחיות פלטפורמה : </span>
              <strong>{profitMargin}%</strong>
            </div>
          </div>
        </div>

        <div className="charts-main-layout">
          {/* גרף מגמת הכנסות */}
          <div className="chart-container-card">
            <h3>
              <History size={20} /> מגמת הכנסות אחרונה
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f2f6"
                />
                <XAxis dataKey="time" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="val"
                  stroke="#6c5ce7"
                  strokeWidth={4}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* גרף ביקוש לפי קטגוריות - מתוקן עם ערכים בצירים */}
          <div className="chart-container-card">
            <h3>📊 ביקוש לפי קטגוריות</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats?.breakdowns?.projectsByCategory}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f2f6"
                />
                <XAxis
                  dataKey="category"
                  axisLine={false}
                  tickLine={false}
                  className="XAxis"
                />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar
                  dataKey="count"
                  fill="#0984e3"
                  radius={[10, 10, 0, 0]}
                  barSize={35}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bi-strategic-grid">
        <div className="bi-card">
          <div className="bi-header">
            <Award size={22} color="#fdcb6e" /> <h3>הנכסים המובילים שלך</h3>
          </div>
          <div className="bi-card">
            <p>
              הפרויקט המדורג ביותר:{' '}
              <strong>{adminStats?.topRated[0]?.title}</strong>
            </p>
            <p>
              הפרויקט הכי מעורב:{' '}
              <strong>{adminStats?.mostReviewed[0]?.title}</strong>
            </p>
            <div className="bi-badge">
              מומלץ: קדם פרויקטים אלו בעמוד הבית להגדלת המרה.
            </div>
          </div>
        </div>

        <div className="bi-card advice-highlight">
          <div className="bi-header">
            <Lightbulb size={22} color="#6c5ce7" /> <h3>המלצה אסטרטגית</h3>
          </div>
          <div className="bi-content">
            <p>
              זיהינו כי הקטגוריה <strong>{bestCategory}</strong> מובילה
              בביקושים.
            </p>
            <p className="consult">
              פעולה נדרשת: פתח קמפיין שיווקי ממוקד למעצבים בתחום זה כדי להעלות
              את ה-AOV מעבר ל-₪{Number(aov) + 50}.
            </p>
          </div>
        </div>
      </div>

      <footer className="dashboard-footer-credits">
        דוח זה הופק עבור Designer Market ע"י זאב ליידרמן ואיל דוקטורי.
      </footer>
    </div>
  );
};

export default SystemDashboard;
