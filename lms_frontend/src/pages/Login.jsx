import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { BookOpen, Shield, UserCheck, ArrowRight, Lock, User, Sparkles } from 'lucide-react';
import Toast from '../components/Toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      if (result.role === 'admin') navigate('/admin');
      else if (result.role === 'librarian') navigate('/librarian');
      else navigate('/student');
    } else {
      setToast({ type: 'error', message: result.message });
    }
  };

  const handleQuickDemo = async (demoUser, demoPass) => {
    setLoading(true);
    const result = await login(demoUser, demoPass);
    setLoading(false);

    if (result.success) {
      if (result.role === 'admin') navigate('/admin');
      else if (result.role === 'librarian') navigate('/librarian');
      else navigate('/student');
    } else {
      setToast({ type: 'error', message: result.message });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: '1000px', display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Welcome Info Card */}
          <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '99px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', fontSize: '0.8rem', fontWeight: 700, marginBottom: '24px' }}>
                <Sparkles size={14} /> Modern Library System 2.0
              </div>

              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '16px' }}>
                Digitize & Automate Library Operations
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.98rem', lineHeight: 1.6, marginBottom: '32px' }}>
                A powerful Django REST & React platform for book circulation, user management, real-time catalog search, and automated fine tracking.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                    <Shield size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Role-Based Control</div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Dedicated interfaces for Admin, Librarian & Students</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Instant Issue & Return</div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Auto due dates & overdue fine calculations</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: '32px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.8rem', color: '#64748b' }}>
              Built with Django 6, DRF, React 19 & Framer Motion
            </div>
          </div>

          {/* Login Form Card */}
          <div className="glass-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Account Sign In</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '4px' }}>
                Enter your credentials or choose a quick demo account
              </p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    required
                    className="form-input"
                    style={{ paddingLeft: '42px' }}
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="password"
                    required
                    className="form-input"
                    style={{ paddingLeft: '42px' }}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '0.98rem' }}
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                <ArrowRight size={18} />
              </button>
            </form>

            {/* Quick Demo Switcher */}
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                ⚡ Quick Demo One-Click Login
              </div>
              <div className="demo-accounts-grid">
                <div className="demo-account-card" onClick={() => handleQuickDemo('admin', 'admin123')}>
                  <span className="badge badge-admin" style={{ marginBottom: '6px' }}>Admin</span>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>admin</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Full control</div>
                </div>

                <div className="demo-account-card" onClick={() => handleQuickDemo('librarian', 'lib123')}>
                  <span className="badge badge-librarian" style={{ marginBottom: '6px' }}>Librarian</span>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>librarian</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Issue / Return</div>
                </div>

                <div className="demo-account-card" onClick={() => handleQuickDemo('student1', 'stud123')}>
                  <span className="badge badge-student" style={{ marginBottom: '6px' }}>Student</span>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>student1</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Catalog & Loans</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
