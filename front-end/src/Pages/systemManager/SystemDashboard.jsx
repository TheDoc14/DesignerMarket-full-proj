import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  FileSpreadsheet,
  FileText,
  Lightbulb,
  Target,
  Award,
  History,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../../Context/AuthContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import '../PublicPages.css';

const SystemDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [finance, setFinance] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const dashboardRef = useRef(null);

  const COLORS = ['#0984e3', '#00b894', '#fdcb6e', '#e17055', '#6c5ce7'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [statsRes, financeRes, adminStatsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/system/stats', { headers }),
          axios.get('http://localhost:5000/api/system/finance', { headers }),
          axios.get('http://localhost:5000/api/admin/stats', { headers }),
        ]);
        setStats(statsRes.data.stats);
        setFinance(financeRes.data.finance);
        setAdminStats(adminStatsRes.data.stats);
      } catch (err) {
        console.error('Managerial data load failed', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  if (authLoading) return <div className="loader">מאמת הרשאות ניהול...</div>;
  if (!user) return null;

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
      XLSX.utils.json_to_sheet(finance.recent),
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
    <div className="admin-container" dir="rtl">
      <header
        className="dashboard-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '30px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>
            לוח בקרה אסטרטגי
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#636e72' }}>
            ניתוח נתונים להגדלת הפעילות העסקית ב-Designer Market
          </p>
        </div>
        <div className="export-btns" style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleExcelExport} className="btn-export excel">
            <FileSpreadsheet size={18} /> אקסל ניהולי
          </button>
          <button onClick={handlePDFExport} className="btn-export pdf">
            <FileText size={18} /> הפק דוח PDF
          </button>
        </div>
      </header>

      <div
        ref={dashboardRef}
        style={{
          backgroundColor: '#fff',
          padding: '25px',
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        }}
      >
        {/* שלושת הרובריקות אחת ליד השנייה */}
        <div
          className="manager-kpi-row"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '25px',
            marginBottom: '40px',
          }}
        >
          <div
            className="stat-card manager-style"
            style={{
              background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
              color: 'white',
            }}
          >
            <div className="manager-icon">
              <DollarSign size={28} />
            </div>
            <div className="stat-info">
              <span>מחזור מכירות כולל</span>
              <strong>₪{grossTotal.toLocaleString()}</strong>
            </div>
          </div>
          <div
            className="stat-card manager-style"
            style={{ border: '2px solid #fdcb6e' }}
          >
            <div className="manager-icon" style={{ color: '#fdcb6e' }}>
              <Target size={28} />
            </div>
            <div className="stat-info">
              <span>ערך הזמנה (AOV)</span>
              <strong style={{ color: '#2d3436' }}>₪{aov}</strong>
            </div>
          </div>
          <div
            className="stat-card manager-style"
            style={{ border: '2px solid #00b894' }}
          >
            <div className="manager-icon" style={{ color: '#00b894' }}>
              <TrendingUp size={28} />
            </div>
            <div className="stat-info">
              <span>רווחיות פלטפורמה</span>
              <strong style={{ color: '#2d3436' }}>{profitMargin}%</strong>
            </div>
          </div>
        </div>

        <div
          className="charts-main-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            gap: '25px',
          }}
        >
          {/* גרף מגמת הכנסות */}
          <div className="chart-container" style={{ padding: '20px' }}>
            <h3
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
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
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: 'none',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="val"
                  stroke="#6c5ce7"
                  strokeWidth={4}
                  dot={{
                    r: 6,
                    fill: '#6c5ce7',
                    strokeWidth: 2,
                    stroke: '#fff',
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* גרף ביקוש לפי קטגוריות - מתוקן עם ערכים בצירים */}
          <div className="chart-container" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '20px' }}>📊 ביקוש לפי קטגוריות</h3>
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
                  style={{ fontSize: '0.8rem', fontWeight: 'bold' }}
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

      <div
        className="business-intelligence-panel"
        style={{
          marginTop: '30px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '25px',
        }}
      >
        <div className="bi-card">
          <div className="bi-header">
            <Award size={22} color="#fdcb6e" /> <h3>הנכסים המובילים שלך</h3>
          </div>
          <div className="bi-content">
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
            <p style={{ fontWeight: 'bold', marginTop: '10px' }}>
              פעולה נדרשת: פתח קמפיין שיווקי ממוקד למעצבים בתחום זה כדי להעלות
              את ה-AOV מעבר ל-₪{Number(aov) + 50}.
            </p>
          </div>
        </div>
      </div>

      <footer
        className="dashboard-footer-credits"
        style={{
          marginTop: '40px',
          textAlign: 'center',
          color: '#b2bec3',
          fontSize: '0.9rem',
          borderTop: '1px solid #eee',
          padding: '20px',
        }}
      >
        דוח זה הופק עבור Designer Market ע"י זאב ליידרמן ואיל דוקטורי.
      </footer>
    </div>
  );
};

export default SystemDashboard;
