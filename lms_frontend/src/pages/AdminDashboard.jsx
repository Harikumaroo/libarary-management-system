import React, { useState, useEffect } from 'react';
import { apiClient } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import ExportButton from '../components/ExportButton';
import { motion } from 'framer-motion';
import { 
  Users, UserPlus, Shield, Settings, BookOpen, 
  DollarSign, Search, Edit2, Trash2, CheckCircle, RefreshCw, BarChart2
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Settings State
  const [sysSettings, setSysSettings] = useState({
    fine_rate_per_day: '5.00',
    default_loan_period_days: 14,
    max_books_per_student: 3
  });

  // User Modal State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    email: '',
    role: 'student',
    register_number: '',
    phone: '',
    max_books_allowed: 3
  });

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'users', label: 'Manage Users', icon: Users },
    { id: 'settings', label: 'System Config', icon: Settings },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, [roleFilter]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Reports Summary
      const reportsRes = await apiClient.get('/reports/');
      setStats(reportsRes.data);

      // 2. Fetch Users
      const usersRes = await apiClient.get(`/users/${roleFilter ? `?role=${roleFilter}` : ''}`);
      setUsers(usersRes.data);

      // 3. Fetch Settings
      const settingsRes = await apiClient.get('/settings/');
      if (settingsRes.data) {
        setSysSettings(settingsRes.data);
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load admin dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await apiClient.put(`/users/${editingUser.id}/`, userForm);
        setToast({ type: 'success', message: 'User updated successfully' });
      } else {
        await apiClient.post('/users/', userForm);
        setToast({ type: 'success', message: 'New user created successfully' });
      }
      setUserModalOpen(false);
      resetUserForm();
      fetchDashboardData();
    } catch (err) {
      const errMsg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save user';
      setToast({ type: 'error', message: errMsg });
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await apiClient.delete(`/users/${id}/`);
      setToast({ type: 'success', message: 'User removed successfully' });
      fetchDashboardData();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to delete user' });
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put('/settings/1/', sysSettings);
      setToast({ type: 'success', message: 'System settings saved successfully' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to update system settings' });
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    resetUserForm();
    setUserModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      password: '',
      email: user.email || '',
      role: user.role,
      register_number: user.register_number || '',
      phone: user.phone || '',
      max_books_allowed: user.max_books_allowed || 3
    });
    setUserModalOpen(true);
  };

  const resetUserForm = () => {
    setUserForm({
      username: '',
      password: '',
      email: '',
      role: 'student',
      register_number: '',
      phone: '',
      max_books_allowed: 3
    });
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.register_number && u.register_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} tabs={navTabs} />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <main className="app-container">
        {/* Tab 1: System Overview */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">Admin Dashboard</h1>
                <p className="page-subtitle">Overall system health, user circulation metrics, and financial summaries</p>
              </div>
              <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm">
                <RefreshCw size={16} /> Refresh Data
              </button>
            </div>

            {stats && (
              <div className="grid-stats">
                <StatCard title="Total Books in Library" value={stats.total_books} icon={BookOpen} color="#6366f1" trend={`${stats.available_copies} available`} />
                <StatCard title="Registered Students" value={stats.total_students} icon={Users} color="#10b981" />
                <StatCard title="Librarians Staff" value={stats.total_librarians} icon={Shield} color="#8b5cf6" />
                <StatCard title="Active Book Loans" value={stats.active_loans} icon={BookOpen} color="#3b82f6" trend={`${stats.overdue_loans} overdue`} />
                <StatCard title="Collected Fines" value={`$${stats.total_fines_collected}`} icon={DollarSign} color="#10b981" />
                <StatCard title="Pending Fines" value={`$${stats.total_fines_pending}`} icon={DollarSign} color="#ef4444" />
              </div>
            )}

            {/* Visual Summaries */}
            <div className="grid-content grid-two-col" style={{ marginTop: '24px' }}>
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Category Breakdown</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Category Name</th>
                        <th>Book Titles Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.category_distribution?.map((cat, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{cat.name}</td>
                          <td><span className="badge badge-info">{cat.count} Books</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Quick System Controls</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button onClick={() => setActiveTab('users')} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                    <UserPlus size={18} /> Manage Librarians & Students
                  </button>
                  <button onClick={() => setActiveTab('settings')} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                    <Settings size={18} /> Configure Fine Rates & Loan Limits
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: User Management */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">User Management</h1>
                <p className="page-subtitle">Add, edit, or remove system accounts (Librarians & Students)</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <ExportButton data={filteredUsers} filename="lms_users_list.csv" />
                <button onClick={openCreateModal} className="btn btn-primary">
                  <UserPlus size={18} /> Add New User
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, position: 'relative', minWidth: '240px' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search by username, reg number, or email..."
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: '180px' }}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin Only</option>
                <option value="librarian">Librarians Only</option>
                <option value="student">Students Only</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="table-container glass-card">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Register / ID No.</th>
                    <th>Contact</th>
                    <th>Active Loans</th>
                    <th>Total Fines</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No users found matching criteria
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{u.username}</div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{u.email || 'No email provided'}</div>
                        </td>
                        <td>
                          <span className={`badge badge-${u.role}`}>{u.role}</span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                          {u.register_number || 'N/A'}
                        </td>
                        <td>{u.phone || 'N/A'}</td>
                        <td>
                          <span className="badge badge-info">{u.active_loans_count} / {u.max_books_allowed}</span>
                        </td>
                        <td>
                          <span className={`badge ${u.total_fines_due > 0 ? 'badge-danger' : 'badge-success'}`}>
                            ${u.total_fines_due}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => openEditModal(u)} className="btn btn-secondary btn-sm" title="Edit User">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteUser(u.id)} className="btn btn-danger btn-sm" title="Delete User">
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

        {/* Tab 3: System Settings */}
        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="page-header">
              <div>
                <h1 className="page-title">System Settings & Rules</h1>
                <p className="page-subtitle">Configure automated fine calculation rules and loan limits</p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '32px', maxWidth: '600px' }}>
              <form onSubmit={handleSaveSettings}>
                <div className="form-group">
                  <label className="form-label">Overdue Fine Rate ($ per day)</label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    className="form-input"
                    value={sysSettings.fine_rate_per_day}
                    onChange={(e) => setSysSettings({ ...sysSettings, fine_rate_per_day: e.target.value })}
                  />
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Amount charged per overdue day after due date</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Default Loan Period (Days)</label>
                  <input
                    type="number"
                    required
                    className="form-input"
                    value={sysSettings.default_loan_period_days}
                    onChange={(e) => setSysSettings({ ...sysSettings, default_loan_period_days: e.target.value })}
                  />
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Number of days assigned automatically when a book is issued</span>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Max Books Limit per Student</label>
                  <input
                    type="number"
                    required
                    className="form-input"
                    value={sysSettings.max_books_per_student}
                    onChange={(e) => setSysSettings({ ...sysSettings, max_books_per_student: e.target.value })}
                  />
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Maximum simultaneous active loans allowed for a student</span>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <CheckCircle size={18} /> Save Settings Configuration
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Modal: Create / Edit User */}
        <Modal
          isOpen={userModalOpen}
          onClose={() => setUserModalOpen(false)}
          title={editingUser ? `Edit User: ${editingUser.username}` : 'Add New System Account'}
        >
          <form onSubmit={handleCreateOrUpdateUser}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                required
                className="form-input"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password {editingUser && '(Leave blank to keep unchanged)'}</label>
              <input
                type="password"
                required={!editingUser}
                className="form-input"
                placeholder={editingUser ? '••••••••' : 'Enter password'}
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="librarian">Librarian</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Register / ID Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. STU-2026-105 or LIB-002"
                value={userForm.register_number}
                onChange={(e) => setUserForm({ ...userForm, register_number: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Max Allowed Borrowed Books</label>
              <input
                type="number"
                className="form-input"
                value={userForm.max_books_allowed}
                onChange={(e) => setUserForm({ ...userForm, max_books_allowed: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              {editingUser ? 'Update Account' : 'Create Account'}
            </button>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default AdminDashboard;
