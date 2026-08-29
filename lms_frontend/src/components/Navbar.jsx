import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogOut, Shield, User, BookCheck, Sparkles } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab, tabs = [] }) => {
  const { user, logout, login } = useAuth();

  const handleQuickSwitch = async (roleName, username, password) => {
    await login(username, password);
  };

  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="brand-logo">
          <div className="brand-icon">
            <BookOpen size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>LMS Portal</span>
              <Sparkles size={14} color="#8b5cf6" />
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Library Management System</div>
          </div>
        </div>

        {user && tabs.length > 0 && (
          <nav className="nav-tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                >
                  {Icon && <Icon size={16} />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {user && (
          <div className="user-profile-badge">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                {user.username}
              </div>
              <span className={`badge badge-${user.role}`}>
                {user.role}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Module Switcher: Restrict to Admin Only */}
              {user.role === 'admin' && (
                <div style={{ position: 'relative' }}>
                  <select
                    className="form-select"
                    style={{ padding: '6px 10px', fontSize: '0.78rem', background: 'rgba(30, 41, 59, 0.9)' }}
                    value={window.location.pathname.startsWith('/librarian') ? 'librarian' : window.location.pathname.startsWith('/student') ? 'student' : window.location.pathname.startsWith('/reports') ? 'reports' : 'admin'}
                    onChange={(e) => {
                      const target = e.target.value;
                      if (target === 'admin') window.location.href = '/admin';
                      if (target === 'librarian') window.location.href = '/librarian';
                      if (target === 'student') window.location.href = '/student';
                      if (target === 'reports') window.location.href = '/reports';
                    }}
                  >
                    <option value="admin">Module: Admin Portal</option>
                    <option value="librarian">Module: Librarian Portal</option>
                    <option value="student">Module: Student Portal</option>
                    <option value="reports">Module: Circulation Reports</option>
                  </select>
                </div>
              )}

              <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>

          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
