import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Eye, EyeOff, Lock } from 'lucide-react';
import { getAdminPassword, setAdminSession } from '../utils/storage';
import './AdminLogin.css';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (password === getAdminPassword()) {
        setAdminSession(true);
        navigate('/admin');
      } else {
        setError('Incorrect password. Please try again.');
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="login-page">
      <div className="login-bg-orb" />

      <motion.div
        className="login-panel card"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon">
            <Zap size={22} fill="currentColor" />
          </div>
          <span className="logo-text">
            Decision<span className="logo-accent">Arena</span>
          </span>
        </div>

        <div className="login-header">
          <div className="login-lock">
            <Lock size={20} />
          </div>
          <h1 className="login-title">Admin Access</h1>
          <p className="login-sub">Enter your password to manage surveys</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="admin-password">Password</label>
            <div className="input-wrapper">
              <input
                id="admin-password"
                type={showPw ? 'text' : 'password'}
                className="input"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="input-suffix-btn"
                onClick={() => setShowPw(!showPw)}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              className="login-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg login-submit"
            disabled={!password || loading}
          >
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="login-hint">
          Default password: <code>admin123</code>
        </div>

        <Link to="/" className="login-back">← Back to surveys</Link>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
