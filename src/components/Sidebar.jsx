import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  // Initialized to false so dropdowns DO NOT open automatically on page load/refresh
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 992 && onClose) {
      onClose();
    }
  };

  return (
    <>
      <div
        className={`app-menu navbar-menu ${isOpen ? 'show' : 'hidden'}`}
        id="app-menu"
      >
        {/* Brand / Logo */}
        <div className="navbar-brand-box">
          <Link to="/dashboard" className="logo logo-light">
            <span className="logo-text">UNICAN</span>
          </Link>

          <button
            type="button"
            className="btn-vertical-sm-hover"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div id="scrollbar">
          <div className="container-fluid">
            <ul className="navbar-nav">
              <li className="menu-title">
                <span>MENU</span>
              </li>

              {/* 1. Dashboard Tab */}
              <li className="nav-item">
                <Link
                  to="/dashboard"
                  onClick={handleNavClick}
                  className={`nav-link menu-link ${
                    location.pathname === '/dashboard' || location.pathname === '/'
                      ? 'active'
                      : ''
                  }`}
                >
                  <i className="mdi mdi-speedometer"></i>
                  <span className="menu-name">Dashboard</span>
                </Link>
              </li>

              {/* 2. Verification Address Dropdown */}
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link menu-link w-100 ${
                    location.pathname.startsWith('/address') ? 'active' : ''
                  }`}
                  onClick={() => setIsAddressDropdownOpen((prev) => !prev)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <i className="mdi mdi-map-marker-radius-outline"></i>
                  <span className="menu-name">Verification Address</span>
                  <i
                    className={`bx ${
                      isAddressDropdownOpen ? 'bx-chevron-down' : 'bx-chevron-right'
                    } nav-arrow ms-auto`}
                  ></i>
                </button>

                {isAddressDropdownOpen && (
                  <div className="menu-dropdown" style={{ width: '100%' }}>
                    <ul
                      className="nav flex-column"
                      style={{ listStyle: 'none', padding: 0, margin: 0, width: '100%' }}
                    >
                      <li className="nav-item" style={{ width: '100%' }}>
                        <Link
                          to="/address/add"
                          onClick={handleNavClick}
                          className={`nav-link ${
                            location.pathname === '/address/add' ? 'active' : ''
                          }`}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: '3rem',
                            paddingRight: '1.5rem',
                            fontSize: '0.85rem',
                          }}
                        >
                          <i className="mdi mdi-plus-circle-outline me-2"></i>
                          <span className="menu-name">Add Address</span>
                        </Link>
                      </li>

                      <li className="nav-item" style={{ width: '100%' }}>
                        <Link
                          to="/address/manage"
                          onClick={handleNavClick}
                          className={`nav-link ${
                            location.pathname === '/address/manage' ? 'active' : ''
                          }`}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: '3rem',
                            paddingRight: '1.5rem',
                            fontSize: '0.85rem',
                          }}
                        >
                          <i className="mdi mdi-format-list-bulleted me-2"></i>
                          <span className="menu-name">Manage Address</span>
                        </Link>
                      </li>

                      <li className="nav-item" style={{ width: '100%' }}>
                        <Link
                          to="/address/assign"
                          onClick={handleNavClick}
                          className={`nav-link ${
                            location.pathname === '/address/assign' ? 'active' : ''
                          }`}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: '3rem',
                            paddingRight: '1.5rem',
                            fontSize: '0.85rem',
                          }}
                        >
                          <i className="mdi mdi-account-arrow-right-outline me-2"></i>
                          <span className="menu-name">Assign Address</span>
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}
              </li>

              {/* 3. Manage Staff Dropdown */}
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link menu-link w-100 ${
                    location.pathname.startsWith('/staff') ? 'active' : ''
                  }`}
                  onClick={() => setIsStaffDropdownOpen((prev) => !prev)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <i className="mdi mdi-account-group-outline"></i>
                  <span className="menu-name">Manage Staff</span>
                  <i
                    className={`bx ${
                      isStaffDropdownOpen ? 'bx-chevron-down' : 'bx-chevron-right'
                    } nav-arrow ms-auto`}
                  ></i>
                </button>

                {isStaffDropdownOpen && (
                  <div className="menu-dropdown" style={{ width: '100%' }}>
                    <ul
                      className="nav flex-column"
                      style={{ listStyle: 'none', padding: 0, margin: 0, width: '100%' }}
                    >
                      <li className="nav-item" style={{ width: '100%' }}>
                        <Link
                          to="/staff/create"
                          onClick={handleNavClick}
                          className={`nav-link ${
                            location.pathname === '/staff/create' ? 'active' : ''
                          }`}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: '3rem',
                            paddingRight: '1.5rem',
                            fontSize: '0.85rem',
                          }}
                        >
                          <i className="mdi mdi-account-plus-outline me-2"></i>
                          <span className="menu-name">Add Staff</span>
                        </Link>
                      </li>

                      <li className="nav-item" style={{ width: '100%' }}>
                        <Link
                          to="/staff/manage"
                          onClick={handleNavClick}
                          className={`nav-link ${
                            location.pathname === '/staff/manage' ? 'active' : ''
                          }`}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: '3rem',
                            paddingRight: '1.5rem',
                            fontSize: '0.85rem',
                          }}
                        >
                          <i className="mdi mdi-account-cog-outline me-2"></i>
                          <span className="menu-name">Staff Lists</span>
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}
              </li>

              {/* ============================================================
                  SAMPLE TAB (COMMENTED OUT AS REQUESTED)
              ============================================================
              <li className="nav-item">
                <Link
                  to="/sample"
                  className={`nav-link menu-link ${
                    location.pathname === '/sample' ? 'active' : ''
                  }`}
                >
                  <i className="bx bx-layer"></i>
                  <span className="menu-name">Sample Tab</span>
                </Link>
              </li>
              ============================================================ */}
            </ul>
          </div>
        </div>
      </div>

      {/* Mobile backdrop */}
      {isOpen && <div className="vertical-overlay" onClick={onClose}></div>}
    </>
  );
};

export default Sidebar;