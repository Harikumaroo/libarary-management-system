import React, { useState, useEffect } from 'react';
import { apiClient } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import ExportButton from '../components/ExportButton';
import { motion } from 'framer-motion';
import { FileText, Printer, Download, RefreshCw, BarChart2, BookOpen, Users, DollarSign } from 'lucide-react';

const ReportsDashboard = () => {
  const [reportsData, setReportsData] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [rRes, tRes] = await Promise.all([
        apiClient.get('/reports/'),
        apiClient.get('/transactions/')
      ]);
      setReportsData(rRes.data);
      setAllTransactions(tRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <Navbar activeTab="reports" />
      <main className="app-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Circulation & System Reports</h1>
            <p className="page-subtitle">Detailed circulation logs, financial stats, and export tools</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handlePrint} className="btn btn-secondary">
              <Printer size={16} /> Print Report
            </button>
            <ExportButton data={allTransactions} filename="full_circulation_report.csv" label="Export Transactions CSV" />
          </div>
        </div>

        {reportsData && (() => {
          const currencySymbol = reportsData.currency_symbol || (reportsData.currency === 'USD' ? '$' : '₹');
          return (
            <div className="grid-stats">
              <StatCard title="Total Books Count" value={reportsData.total_books} icon={BookOpen} color="#6366f1" />
              <StatCard title="Active Loans" value={reportsData.active_loans} icon={BookOpen} color="#3b82f6" />
              <StatCard title="Overdue Books" value={reportsData.overdue_loans} icon={BookOpen} color="#ef4444" />
              <StatCard title="Fines Collected" value={`${currencySymbol}${reportsData.total_fines_collected}`} icon={DollarSign} color="#10b981" />
              <StatCard title="Pending Fines" value={`${currencySymbol}${reportsData.total_fines_pending}`} icon={DollarSign} color="#f59e0b" />
            </div>
          );
        })()}

        {/* Transactions Table */}
        <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Complete Book Circulation History Log</h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Txn ID</th>
                  <th>Book Title</th>
                  <th>Student Name</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                  <th>Fine Amount</th>
                </tr>
              </thead>
              <tbody>
                {allTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>No transactions recorded</td>
                  </tr>
                ) : (
                  allTransactions.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>#TXN-{t.id}</td>
                      <td style={{ fontWeight: 700 }}>{t.book_title}</td>
                      <td>{t.user_name} ({t.user_register_number || 'N/A'})</td>
                      <td>{t.issue_date}</td>
                      <td>{t.due_date}</td>
                      <td>{t.return_date || 'Active Loan'}</td>
                      <td>
                        <span className={`badge badge-${t.status === 'returned' ? 'success' : t.status === 'overdue' ? 'danger' : 'warning'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>{(reportsData?.currency_symbol || '₹')}{t.calculated_fine}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportsDashboard;
