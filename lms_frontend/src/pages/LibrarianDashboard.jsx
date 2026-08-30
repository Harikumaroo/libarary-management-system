import React, { useState, useEffect } from 'react';
import { apiClient } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import ExportButton from '../components/ExportButton';
import { motion } from 'framer-motion';
import { 
  BookOpen, Plus, Search, Edit2, Trash2, ArrowUpRight, ArrowDownLeft,
  Clock, AlertTriangle, CheckCircle, Bookmark, RefreshCw, DollarSign, Filter
} from 'lucide-react';

const LibrarianDashboard = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [students, setStudents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [overdueList, setOverdueList] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // Book Modal State
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    publisher: '',
    category: '',
    isbn: '',
    publication_year: '',
    total_copies: 1,
    available_copies: 1,
    rack_location: ''
  });

  // Issue Book State
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({
    user_id: '',
    book_id: ''
  });

  // Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  // System Settings State for Currency
  const [sysSettings, setSysSettings] = useState(null);
  const currencySymbol = sysSettings?.currency_symbol || (sysSettings?.currency === 'USD' ? '$' : '₹');

  const navTabs = [
    { id: 'inventory', label: 'Book Inventory', icon: BookOpen },
    { id: 'circulation', label: 'Issue / Return', icon: ArrowUpRight },
    { id: 'overdue', label: 'Overdue & Fines', icon: AlertTriangle },
    { id: 'reservations', label: 'Reservations', icon: Bookmark }
  ];

  useEffect(() => {
    fetchData();
  }, [categoryFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, cRes, sRes, tRes, oRes, rRes, stRes] = await Promise.all([
        apiClient.get(`/books/${categoryFilter ? `?category=${categoryFilter}` : ''}`),
        apiClient.get('/categories/'),
        apiClient.get('/users/?role=student'),
        apiClient.get('/transactions/'),
        apiClient.get('/transactions/overdue/'),
        apiClient.get('/reservations/'),
        apiClient.get('/settings/')
      ]);

      setBooks(bRes.data);
      setCategories(cRes.data);
      setStudents(sRes.data);
      setTransactions(tRes.data);
      setOverdueList(oRes.data);
      setReservations(rRes.data);
      if (stRes.data) setSysSettings(stRes.data);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to fetch librarian dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  // Book CRUD
  const handleSaveBook = async (e) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await apiClient.put(`/books/${editingBook.id}/`, bookForm);
        setToast({ type: 'success', message: 'Book updated successfully' });
      } else {
        await apiClient.post('/books/', bookForm);
        setToast({ type: 'success', message: 'New book added to inventory' });
      }
      setBookModalOpen(false);
      resetBookForm();
      fetchData();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save book';
      setToast({ type: 'error', message: msg });
    }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Delete this book from catalog?')) return;
    try {
      await apiClient.delete(`/books/${id}/`);
      setToast({ type: 'success', message: 'Book deleted successfully' });
      fetchData();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to delete book' });
    }
  };

  // Category Add
  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/categories/', categoryForm);
      setToast({ type: 'success', message: 'Category created' });
      setCategoryModalOpen(false);
      setCategoryForm({ name: '', description: '' });
      fetchData();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to create category' });
    }
  };

  // Issue Book Workflow
  const handleIssueBookSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/transactions/issue_book/', issueForm);
      setToast({ type: 'success', message: 'Book issued successfully to student' });
      setIssueModalOpen(false);
      setIssueForm({ user_id: '', book_id: '' });
      fetchData();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to issue book' });
    }
  };

  // Return Book Workflow
  const handleReturnBook = async (transactionId) => {
    try {
      const res = await apiClient.post('/transactions/return_book/', { transaction_id: transactionId });
      const fine = res.data.fine_amount;
      if (fine > 0) {
        setToast({ type: 'warning', message: `Book returned! Overdue fine of ${currencySymbol}${fine} generated.` });
      } else {
        setToast({ type: 'success', message: 'Book returned in good time with no fines!' });
      }
      fetchData();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to return book' });
    }
  };

  // Pay Fine
  const handlePayFine = async (transactionId) => {
    try {
      await apiClient.post(`/transactions/${transactionId}/pay_fine/`);
      setToast({ type: 'success', message: 'Fine payment recorded successfully' });
      fetchData();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to settle fine' });
    }
  };

  // Reservation Status Change
  const handleUpdateReservation = async (resId, newStatus) => {
    try {
      await apiClient.patch(`/reservations/${resId}/`, { status: newStatus });
      setToast({ type: 'success', message: `Reservation ${newStatus}` });
      fetchData();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to update reservation' });
    }
  };

  const openCreateBookModal = () => {
    setEditingBook(null);
    resetBookForm();
    setBookModalOpen(true);
  };

  const openEditBookModal = (b) => {
    setEditingBook(b);
    setBookForm({
      title: b.title,
      author: b.author || '',
      publisher: b.publisher || '',
      category: b.category || '',
      isbn: b.isbn || '',
      publication_year: b.publication_year || '',
      total_copies: b.total_copies,
      available_copies: b.available_copies,
      rack_location: b.rack_location || ''
    });
    setBookModalOpen(true);
  };

  const resetBookForm = () => {
    setBookForm({
      title: '',
      author: '',
      publisher: '',
      category: '',
      isbn: '',
      publication_year: '',
      total_copies: 1,
      available_copies: 1,
      rack_location: ''
    });
  };

  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.author && b.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (b.isbn && b.isbn.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} tabs={navTabs} />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <main className="app-container">
        {/* Tab 1: Book Inventory */}
        {activeTab === 'inventory' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">Book Inventory Catalog</h1>
                <p className="page-subtitle">Manage library stock, add new titles, update copy availability and rack locations</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <ExportButton data={filteredBooks} filename="library_books_inventory.csv" />
                <button onClick={() => setCategoryModalOpen(true)} className="btn btn-secondary">
                  <Plus size={16} /> New Category
                </button>
                <button onClick={openCreateBookModal} className="btn btn-primary">
                  <Plus size={16} /> Add Book Title
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
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
            </div>

            {/* Books Table */}
            <div className="table-container glass-card">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Book Details</th>
                    <th>Category</th>
                    <th>ISBN / Year</th>
                    <th>Copies Stock</th>
                    <th>Rack Placement</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No books found in inventory catalog
                      </td>
                    </tr>
                  ) : (
                    filteredBooks.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>{b.title}</div>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>By {b.author || 'Unknown Author'}</div>
                        </td>
                        <td>
                          <span className="badge badge-info">{b.category_name || 'Unassigned'}</span>
                        </td>
                        <td>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{b.isbn || 'N/A'}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Year: {b.publication_year || 'N/A'}</div>
                        </td>
                        <td>
                          <span className={`badge ${b.available_copies > 0 ? 'badge-success' : 'badge-danger'}`}>
                            {b.available_copies} / {b.total_copies} Available
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-warning">{b.rack_location || 'Unassigned'}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setIssueForm({ ...issueForm, book_id: b.id });
                                setIssueModalOpen(true);
                              }}
                              disabled={b.available_copies <= 0}
                              className="btn btn-primary btn-sm"
                              title="Issue Book to Student"
                            >
                              <ArrowUpRight size={14} /> Issue
                            </button>
                            <button onClick={() => openEditBookModal(b)} className="btn btn-secondary btn-sm" title="Edit Book">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteBook(b.id)} className="btn btn-danger btn-sm" title="Delete Book">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Circulation Hub */}
        {activeTab === 'circulation' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">Book Circulation Terminal</h1>
                <p className="page-subtitle">Issue books to eligible students and process book returns</p>
              </div>
              <button onClick={() => setIssueModalOpen(true)} className="btn btn-primary">
                <ArrowUpRight size={18} /> Issue Book Terminal
              </button>
            </div>

            {/* Active Issued Books List */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Active Issued Loans</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Book Title</th>
                      <th>Student Name</th>
                      <th>Issue Date</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Overdue Fine</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.filter(t => t.status !== 'returned').length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                          No active issued loans
                        </td>
                      </tr>
                    ) : (
                      transactions.filter(t => t.status !== 'returned').map((t) => (
                        <tr key={t.id}>
                          <td style={{ fontWeight: 700 }}>{t.book_title}</td>
                          <td>
                            <div>{t.user_name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{t.user_register_number}</div>
                          </td>
                          <td>{t.issue_date}</td>
                          <td style={{ fontWeight: 600, color: t.overdue_days > 0 ? '#ef4444' : '#f8fafc' }}>
                            {t.due_date}
                          </td>
                          <td>
                            <span className={`badge ${t.overdue_days > 0 ? 'badge-danger' : 'badge-warning'}`}>
                              {t.overdue_days > 0 ? `Overdue (${t.overdue_days} days)` : 'Issued'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${t.calculated_fine > 0 ? 'badge-danger' : 'badge-success'}`}>
                              {currencySymbol}{t.calculated_fine}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => handleReturnBook(t.id)} className="btn btn-success btn-sm">
                              <ArrowDownLeft size={14} /> Process Return
                            </button>
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

        {/* Tab 3: Overdue Tracker & Fines */}
        {activeTab === 'overdue' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">Overdue Tracker & Fine Settlement</h1>
                <p className="page-subtitle">Track books past due dates and collect fine payments</p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle color="#ef4444" size={20} /> Active Overdue Loans & Fine Records
              </h3>

              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Book</th>
                      <th>Student</th>
                      <th>Due Date</th>
                      <th>Days Overdue</th>
                      <th>Calculated Fine</th>
                      <th>Payment Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.filter(t => t.calculated_fine > 0 || t.status === 'overdue').length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                          🎉 No overdue books or unpaid fines!
                        </td>
                      </tr>
                    ) : (
                      transactions.filter(t => t.calculated_fine > 0 || t.status === 'overdue').map((t) => (
                        <tr key={t.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>#TXN-{t.id}</td>
                          <td style={{ fontWeight: 700 }}>{t.book_title}</td>
                          <td>
                            <div>{t.user_name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{t.user_register_number}</div>
                          </td>
                          <td style={{ color: '#ef4444', fontWeight: 600 }}>{t.due_date}</td>
                          <td>
                            <span className="badge badge-danger">{t.overdue_days} Days</span>
                          </td>
                          <td style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444' }}>
                            {currencySymbol}{t.calculated_fine}
                          </td>
                          <td>
                            <span className={`badge ${t.fine_paid ? 'badge-success' : 'badge-danger'}`}>
                              {t.fine_paid ? 'Paid' : 'Unpaid'}
                            </span>
                          </td>
                          <td>
                            {!t.fine_paid && (
                              <button onClick={() => handlePayFine(t.id)} className="btn btn-success btn-sm">
                                <DollarSign size={14} /> Collect & Mark Paid
                              </button>
                            )}
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

        {/* Tab 4: Reservations */}
        {activeTab === 'reservations' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">Student Book Reservations</h1>
                <p className="page-subtitle">Manage reservation requests submitted by students</p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Requested Book</th>
                      <th>Student</th>
                      <th>Request Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                          No book reservation requests found
                        </td>
                      </tr>
                    ) : (
                      reservations.map((r) => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 700 }}>{r.book_title}</td>
                          <td>
                            <div>{r.user_name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{r.user_register_number}</div>
                          </td>
                          <td>{new Date(r.request_date).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge badge-${r.status === 'approved' ? 'success' : r.status === 'pending' ? 'warning' : 'info'}`}>
                              {r.status}
                            </span>
                          </td>
                          <td>
                            {r.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleUpdateReservation(r.id, 'approved')} className="btn btn-success btn-sm">
                                  Approve
                                </button>
                                <button onClick={() => handleUpdateReservation(r.id, 'cancelled')} className="btn btn-danger btn-sm">
                                  Reject
                                </button>
                              </div>
                            )}
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

        {/* Modal: Add/Edit Book */}
        <Modal
          isOpen={bookModalOpen}
          onClose={() => setBookModalOpen(false)}
          title={editingBook ? `Edit Book: ${editingBook.title}` : 'Add New Book to Inventory'}
        >
          <form onSubmit={handleSaveBook}>
            <div className="form-group">
              <label className="form-label">Book Title</label>
              <input
                type="text"
                required
                className="form-input"
                value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Author Name</label>
              <input
                type="text"
                className="form-input"
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={bookForm.category}
                onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">ISBN Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Publication Year</label>
                <input
                  type="number"
                  className="form-input"
                  value={bookForm.publication_year}
                  onChange={(e) => setBookForm({ ...bookForm, publication_year: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Total Copies</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="form-input"
                  value={bookForm.total_copies}
                  onChange={(e) => setBookForm({ ...bookForm, total_copies: e.target.value, available_copies: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rack Location</label>
                <input
                  type="text"
                  placeholder="e.g. Rack A-12"
                  className="form-input"
                  value={bookForm.rack_location}
                  onChange={(e) => setBookForm({ ...bookForm, rack_location: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
              {editingBook ? 'Update Inventory' : 'Save Book to Catalog'}
            </button>
          </form>
        </Modal>

        {/* Modal: Issue Book Terminal */}
        <Modal
          isOpen={issueModalOpen}
          onClose={() => setIssueModalOpen(false)}
          title="Issue Book Terminal"
        >
          <form onSubmit={handleIssueBookSubmit}>
            <div className="form-group">
              <label className="form-label">Select Student</label>
              <select
                required
                className="form-select"
                value={issueForm.user_id}
                onChange={(e) => setIssueForm({ ...issueForm, user_id: e.target.value })}
              >
                <option value="">-- Select Student Account --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.username} ({s.register_number || 'No Reg'}) - Active Loans: {s.active_loans_count}/{s.max_books_allowed}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Select Book</label>
              <select
                required
                className="form-select"
                value={issueForm.book_id}
                onChange={(e) => setIssueForm({ ...issueForm, book_id: e.target.value })}
              >
                <option value="">-- Select Available Book --</option>
                {books.filter(b => b.available_copies > 0).map(b => (
                  <option key={b.id} value={b.id}>
                    {b.title} (Available: {b.available_copies}/{b.total_copies})
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <ArrowUpRight size={18} /> Complete Book Issue
            </button>
          </form>
        </Modal>

        {/* Modal: Add Category */}
        <Modal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          title="Add Book Category"
        >
          <form onSubmit={handleAddCategory}>
            <div className="form-group">
              <label className="form-label">Category Name</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Artificial Intelligence"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="Brief summary"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Create Category
            </button>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default LibrarianDashboard;
