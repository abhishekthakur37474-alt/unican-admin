import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Logout.css';

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear auth tokens / user data here
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();

    // Redirect to login
    navigate('/login');
  };

  const handleCancel = () => {
    navigate(-1); // go back
  };

  return (
    <div className="logout-wrapper">
      <div className="logout-card">
        {/* Icon */}
        <div className="logout-icon">
          <i className="bx bx-log-out"></i>
        </div>

        {/* Heading */}
        <h3 className="logout-title">You are about to logout</h3>
        <p className="logout-subtitle">
          Are you sure you want to log out of your account?
        </p>

        {/* User preview */}
        <div className="logout-user">
          <span className="user-avatar">A</span>
          <div className="user-info">
            <span className="user-name">Anna Adame</span>
            <span className="user-role">Founder</span>
          </div>
        </div>

        {/* Actions */}
        <div className="logout-actions">
          <button
            type="button"
            className="btn btn-soft-danger"
            onClick={handleLogout}
          >
            <i className="bx bx-log-out me-1"></i>
            Yes, Logout
          </button>

          <button
            type="button"
            className="btn btn-soft-secondary"
            onClick={handleCancel}
          >
            <i className="bx bx-arrow-back me-1"></i>
            Cancel
          </button>
        </div>

        {/* Footer link */}
        <p className="logout-footer">
          Or go back to{' '}
          <Link to="/dashboard" className="logout-link">
            Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Logout;