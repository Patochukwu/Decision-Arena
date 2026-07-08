import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { isAdminLoggedIn, setAdminSession } from '../utils/storage';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const loggedIn = isAdminLoggedIn();

  const handleLogout = () => {
    setAdminSession(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar glass">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Zap size={18} fill="currentColor" />
          </div>
          <span className="logo-text">
            Decision<span className="logo-accent">Arena</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}>
            Surveys
          </Link>
          {loggedIn && (
            <Link to="/admin" className={`nav-link ${location.pathname.startsWith('/admin') ? 'nav-link-active' : ''}`}>
              Dashboard
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {loggedIn ? (
            <>
              <Link to="/admin" className="btn btn-secondary btn-sm">
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                <LogOut size={15} />
                Logout
              </button>
            </>
          ) : (
            <Link to="/admin/login" className="btn btn-primary btn-sm">
              Admin Login
            </Link>
          )}
          <button className="btn btn-ghost btn-icon mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Link to="/" className="mobile-link" onClick={() => setMobileOpen(false)}>Surveys</Link>
            {loggedIn && <Link to="/admin" className="mobile-link" onClick={() => setMobileOpen(false)}>Dashboard</Link>}
            {loggedIn
              ? <button className="mobile-link mobile-link-danger" onClick={handleLogout}>Logout</button>
              : <Link to="/admin/login" className="mobile-link" onClick={() => setMobileOpen(false)}>Admin Login</Link>
            }
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
