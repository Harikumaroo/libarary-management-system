import React, { useState, useEffect } from 'react';
import { apiClient, useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import { motion } from 'framer-motion';
import { 
  BookOpen, Search, Bookmark, Clock, CheckCircle, 
  AlertTriangle, DollarSign, User, Shield, UserCheck, RefreshCw, FileText
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('catalog');
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [myTransactions, setMyTransactions] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // Student Lookup State
  const [lookupRegNumber, setLookupRegNumber] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // System Settings for Currency
  const [sysSettings, setSysSettings] = useState(null);
  const currencySymbol = sysSettings?.currency_symbol || (sysSettings?.currency === 'USD' ? '$' : '₹');

  const navTabs = [
    { id: 'catalog', label: 'Book Catalog', icon: BookOpen },
    { id: 'mybooks', label: 'My Borrowed Books', icon: Clock },
    { id: 'lookup', label: 'Register No. Lookup', icon: Search },
    { id: 'reservations', label: 'My Reservations', icon: Bookmark },
    { id: 'profile', label: 'My Profile', icon: User }
  ];

  useEffect(() => {
    fetchStudentData();
  }, [categoryFilter, availableOnly]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [bRes, cRes, tRes, rRes, pRes, sRes] = await Promise.all([
        apiClient.get(`/books/?category=${categoryFilter}&available=${availableOnly}`),
        apiClient.get('/categories/'),
        apiClient.get('/transactions/'),
        apiClient.get('/reservations/'),
        apiClient.get('/users/me/'),
        apiClient.get('/settings/')
      ]);

      setBooks(bRes.data);
      setCategories(cRes.data);
      setMyTransactions(tRes.data);
      setMyReservations(rRes.data);
      setUserProfile(pRes.data);
      if (sRes.data) setSysSettings(sRes.data);
      
      if (pRes.data && pRes.data.register_number) {
        setLookupRegNumber(pRes.data.register_number);
        handleLookup(pRes.data.register_number);
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load student portal data' });
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (queryReg = lookupRegNumber) => {
    if (!queryReg || !queryReg.trim()) return;
    setLookupLoading(true);
    try {
      const res = await apiClient.get(`/users/lookup/?register_number=${encodeURIComponent(queryReg.trim())}`);
      setLookupResult(res.data);
    } catch (err) {
      setLookupResult(null);
      setToast({ type: 'error', message: err.response?.data?.error || 'No student found with that Register / ID Number' });
    } finally {
      setLookupLoading(false);
    }
  };

  const handleReserveBook = async (bookId) => {
    try {
      await apiClient.post('/reservations/', { book: bookId });
      setToast({ type: 'success', message: 'Book reservation request submitted to librarian!' });
      fetchStudentData();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to submit reservation' });
    }
  };

  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.author && b.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (b.isbn && b.isbn.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeLoans = myTransactions.filter(t => t.status !== 'returned');
  const pastLoans = myTransactions.filter(t => t.status === 'returned');

  return (
    <div>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} tabs={navTabs} />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <main className="app-container">
        {/* Tab 1: Book Catalog Search */}
        {activeTab === 'catalog' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">Search Library Catalog</h1>
                <p className="page-subtitle">Browse books by title, author, or category and place instant reservation requests</p>
              </div>
            </div>

            {/* Metrics Header */}
            {userProfile && (
              <div className="grid-stats">
                <StatCard title="Active Borrowed Books" value={`${userProfile.active_loans_count} / ${userProfile.max_books_allowed}`} icon={BookOpen} color="#6366f1" />
                <StatCard title="Pending Fines Due" value={`${currencySymbol}${userProfile.total_fines_due}`} icon={DollarSign} color={userProfile.total_fines_due > 0 ? '#ef4444' : '#10b981'} />
                <StatCard title="Active Reservations" value={myReservations.filter(r => r.status === 'pending').length} icon={Bookmark} color="#8b5cf6" />
              </div>
            )}

            {/* Filter Bar */}
            <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative', minWidth: '240px' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search catalog by title, author, or ISBN..."
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ flex: '1 1 160px', minWidth: '140px' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: '#94a3b8' }}>
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                />
                In Stock Copies Only
              </label>
            </div>

            {/* Books Catalog Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {filteredBooks.length === 0 ? (
                <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No books found matching search query
                </div>
              ) : (
                filteredBooks.map((b) => {
                  const isReserved = myReservations.some(r => r.book === b.id && r.status === 'pending');
                  return (
                    <motion.div
                      key={b.id}
                      whileHover={{ y: -4 }}
                      className="glass-card"
                      style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <span className="badge badge-info">{b.category_name || 'General'}</span>
                          <span className={`badge ${b.available_copies > 0 ? 'badge-success' : 'badge-danger'}`}>
                            {b.available_copies > 0 ? `${b.available_copies} In Stock` : 'Out of Stock'}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '12px 0 4px 0', color: '#f8fafc' }}>
                          {b.title}
                        </h3>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '12px' }}>
                          By {b.author || 'Unknown Author'}
                        </div>

                        <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                          <div>ISBN: {b.isbn || 'N/A'}</div>
                          <div>Rack Placement: {b.rack_location || 'Library Shelf'}</div>
                        </div>
                      </div>

                      <div style={{ marginTop: '20px' }}>
                        {isReserved ? (
                          <button disabled className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                            <CheckCircle size={14} /> Reservation Pending
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReserveBook(b.id)}
                            className="btn btn-primary btn-sm"
                            style={{ width: '100%' }}
                          >
                            <Bookmark size={14} /> Request Reservation
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {/* Tab 2: My Borrowed Books */}
        {activeTab === 'mybooks' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">My Borrowed Books & Loan History</h1>
                <p className="page-subtitle">Track active book loans, upcoming due dates, and past returned books</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Active Loans */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Active Books On Loan</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Book Title</th>
                        <th>Issue Date</th>
                        <th>Due Date</th>
                        <th>Loan Status</th>
                        <th>Accrued Fine</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeLoans.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                            You currently have no active borrowed books
                          </td>
                        </tr>
                      ) : (
                        activeLoans.map((t) => (
                          <tr key={t.id}>
                            <td style={{ fontWeight: 700 }}>{t.book_title}</td>
                            <td>{t.issue_date}</td>
                            <td style={{ fontWeight: 700, color: t.overdue_days > 0 ? '#ef4444' : '#f8fafc' }}>
                              {t.due_date}
                            </td>
                            <td>
                              <span className={`badge ${t.overdue_days > 0 ? 'badge-danger' : 'badge-warning'}`}>
                                {t.overdue_days > 0 ? `Overdue by ${t.overdue_days} days` : 'Issued'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${t.calculated_fine > 0 ? 'badge-danger' : 'badge-success'}`}>
                                {currencySymbol}{t.calculated_fine}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Past Loans History */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Past Returned History</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Book Title</th>
                        <th>Issue Date</th>
                        <th>Returned Date</th>
                        <th>Fine Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastLoans.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                            No past returned books history
                          </td>
                        </tr>
                      ) : (
                        pastLoans.map((t) => (
                          <tr key={t.id}>
                            <td style={{ fontWeight: 600 }}>{t.book_title}</td>
                            <td>{t.issue_date}</td>
                            <td>{t.return_date}</td>
                            <td>
                              <span className="badge badge-success">Returned (Fine: {currencySymbol}{t.fine_amount})</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: Register Number Lookup Search */}
        {activeTab === 'lookup' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">Register Number Data Lookup</h1>
                <p className="page-subtitle">Search any Student Register Number / ID to view complete borrowed books, returned history, and fine status</p>
              </div>
            </div>

            {/* Search Input Box */}
            <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
              <form onSubmit={(e) => { e.preventDefault(); handleLookup(); }} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, position: 'relative', minWidth: '280px' }}>
                  <UserCheck size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    required
                    placeholder="Enter Register Number (e.g. STU-2026-101 or STU-2026-102)..."
                    className="form-input"
                    style={{ paddingLeft: '42px' }}
                    value={lookupRegNumber}
                    onChange={(e) => setLookupRegNumber(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={lookupLoading} className="btn btn-primary">
                  {lookupLoading ? 'Searching...' : 'Search Record'}
                </button>
              </form>

              {/* Quick sample pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', fontSize: '0.8rem', color: '#94a3b8' }}>
                <span>Try Demo IDs:</span>
                {['STU-2026-101', 'STU-2026-102', 'student1', 'student2'].map((id) => (
                  <button
                    key={id}
                    onClick={() => {
                      setLookupRegNumber(id);
                      handleLookup(id);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>

            {/* Lookup Result Display */}
            {lookupResult && lookupResult.student && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Student Overview Header Card */}
                <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--accent-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
                          {lookupResult.student.username}
                        </h2>
                        <span className="badge badge-student">{lookupResult.student.role}</span>
                      </div>
                      <div style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                        Register No: {lookupResult.student.register_number || 'N/A'} | Email: {lookupResult.student.email || 'N/A'} | Phone: {lookupResult.student.phone || 'N/A'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Active Loans</div>
                        <span className="badge badge-info">{lookupResult.active_loans.length} / {lookupResult.student.max_books_allowed} Books</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Fines Due</div>
                        <span className={`badge ${lookupResult.student.total_fines_due > 0 ? 'badge-danger' : 'badge-success'}`}>
                          {currencySymbol}{lookupResult.student.total_fines_due}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Currently Borrowed Books */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen color="#6366f1" size={20} /> Currently Borrowed Books (Active Loans)
                  </h3>

                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Book Title</th>
                          <th>ISBN</th>
                          <th>Issue Date</th>
                          <th>Due Date</th>
                          <th>Overdue Days</th>
                          <th>Calculated Fine</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lookupResult.active_loans.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                              No active borrowed books for this student
                            </td>
                          </tr>
                        ) : (
                          lookupResult.active_loans.map((t) => (
                            <tr key={t.id}>
                              <td style={{ fontWeight: 700 }}>{t.book_title}</td>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{t.book_isbn || 'N/A'}</td>
                              <td>{t.issue_date}</td>
                              <td style={{ fontWeight: 700, color: t.overdue_days > 0 ? '#ef4444' : '#f8fafc' }}>
                                {t.due_date}
                              </td>
                              <td>
                                <span className={`badge ${t.overdue_days > 0 ? 'badge-danger' : 'badge-warning'}`}>
                                  {t.overdue_days > 0 ? `${t.overdue_days} Days Overdue` : 'On Time'}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${t.calculated_fine > 0 ? 'badge-danger' : 'badge-success'}`}>
                                  {currencySymbol}{t.calculated_fine}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Returned Books History */}
                <div className="glass-card" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle color="#10b981" size={20} /> Returned Books History
                  </h3>

                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Book Title</th>
                          <th>Issue Date</th>
                          <th>Return Date</th>
                          <th>Fine Amount</th>
                          <th>Fine Paid Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lookupResult.returned_loans.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                              No returned books record found for this student
                            </td>
                          </tr>
                        ) : (
                          lookupResult.returned_loans.map((t) => (
                            <tr key={t.id}>
                              <td style={{ fontWeight: 600 }}>{t.book_title}</td>
                              <td>{t.issue_date}</td>
                              <td>{t.return_date}</td>
                              <td>{currencySymbol}{t.fine_amount}</td>
                              <td>
                                <span className={`badge ${t.fine_paid ? 'badge-success' : 'badge-danger'}`}>
                                  {t.fine_paid ? 'Paid' : 'Unpaid'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 4: My Reservations */}
        {activeTab === 'reservations' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">My Book Reservations</h1>
                <p className="page-subtitle">Track the status of your reservation requests</p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Book Title</th>
                      <th>Author</th>
                      <th>Request Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myReservations.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                          You have submitted no book reservation requests yet
                        </td>
                      </tr>
                    ) : (
                      myReservations.map((r) => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 700 }}>{r.book_title}</td>
                          <td>{r.book_author || 'Unknown'}</td>
                          <td>{new Date(r.request_date).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge badge-${r.status === 'approved' ? 'success' : r.status === 'pending' ? 'warning' : 'info'}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 5: Student Profile */}
        {activeTab === 'profile' && userProfile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">Student Profile</h1>
                <p className="page-subtitle">Personal information and library status</p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '32px', maxWidth: '600px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.6rem', fontWeight: 800 }}>
                  {userProfile.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{userProfile.username}</h2>
                  <span className="badge badge-student">{userProfile.role}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Register / Student ID:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{userProfile.register_number || 'N/A'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Email:</span>
                  <span style={{ fontWeight: 600 }}>{userProfile.email || 'N/A'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Phone Contact:</span>
                  <span style={{ fontWeight: 600 }}>{userProfile.phone || 'N/A'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Max Books Allowed Limit:</span>
                  <span className="badge badge-info">{userProfile.max_books_allowed} Books</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Total Outstanding Fine:</span>
                  <span className={`badge ${userProfile.total_fines_due > 0 ? 'badge-danger' : 'badge-success'}`}>
                    {currencySymbol}{userProfile.total_fines_due}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
