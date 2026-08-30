import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogOut, Shield, User, BookCheck, Sparkles, Menu, X } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab, tabs = [] }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
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

        {/* Desktop Navigation Tabs */}
        {user && tabs.length > 0 && (
          <nav className="nav-tabs nav-desktop-tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                >
                  {Icon && <Icon size={16} />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Desktop User Profile Badge */}
        {user && (
          <div className="user-profile-badge user-profile-badge-desktop">
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

        {/* Mobile Hamburger Menu Button */}
        {user && (
          <button
            className="nav-toggle-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}
      </div>

      {/* Mobile Navigation Drawer */}
      {user && isMobileMenuOpen && (
        <div className="nav-mobile-menu">
          {tabs.length > 0 && (
            <div className="nav-mobile-tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                  >
                    {Icon && <Icon size={18} />}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="nav-mobile-user">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                  {user.username}
                </div>
                <span className={`badge badge-${user.role}`}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="btn btn-danger btn-sm"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>

            {user.role === 'admin' && (
              <div style={{ marginTop: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>
                  Switch Module
                </label>
                <select
                  className="form-select"
                  style={{ fontSize: '0.85rem' }}
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
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

