import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Header.css';

const dropdownMotion = {
  hidden: { opacity: 0, y: 6, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: 4,
    scale: 0.97,
    transition: { duration: 0.1, ease: 'easeIn' },
  },
};

const Header = ({ toggleSidebar }) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const notifRef = useRef(null);
  const userRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setFullscreen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    sessionStorage.clear();
    setUserOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <header id="page-topbar">
      <div className="navbar-header">
        {/* LEFT: Hamburger & App Search */}
        <div className="topbar-left">
          <button
            type="button"
            className="btn-topbar-circle me-2"
            onClick={toggleSidebar}
            aria-label="Toggle Navigation"
          >
            <i className="bx bx-menu"></i>
          </button>

          <form
            className="app-search d-none d-md-block"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="position-relative">
              <span className="mdi mdi-magnify search-widget-icon"></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                autoComplete="off"
              />
            </div>
          </form>
        </div>

        {/* RIGHT: Actions & User Menu */}
        <div className="topbar-right">
          {/* Fullscreen Button */}
          <div className="header-item d-none d-sm-flex">
            <button
              type="button"
              className="btn-topbar-circle"
              onClick={toggleFullscreen}
              aria-label="Toggle Fullscreen"
            >
              <i
                className={`bx ${
                  fullscreen ? 'bx-exit-fullscreen' : 'bx-fullscreen'
                }`}
              ></i>
            </button>
          </div>

          {/* Notifications Dropdown */}
          <div className="dropdown topbar-head-dropdown header-item" ref={notifRef}>
            <button
              type="button"
              className={`btn-topbar-circle position-relative ${
                notifOpen ? 'active' : ''
              }`}
              onClick={() => setNotifOpen(!notifOpen)}
              aria-label="Notifications"
            >
              <i className="bx bx-bell"></i>
              <span className="topbar-badge badge-danger">3</span>
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  className="dropdown-menu dropdown-menu-lg dropdown-menu-end p-0 notif-dropdown-menu show"
                  variants={dropdownMotion}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="notif-header">
                    <h6 className="notif-title">Notifications</h6>
                    <span className="notif-badge">4 New</span>
                  </div>

                  <div className="notification-scroll">
                    <div className="notification-item">
                      <div className="avatar-xs">
                        <span className="avatar-title bg-info-subtle text-info">
                          <i className="bx bx-badge-check"></i>
                        </span>
                      </div>
                      <div className="notification-content">
                        <p className="notification-text">
                          Your <b>Elite</b> author Graphic Optimization{' '}
                          <span className="text-primary-sub">reward</span> is ready!
                        </p>
                        <p className="notification-time">
                          <i className="mdi mdi-clock-outline"></i>
                          <span>JUST 30 SEC AGO</span>
                        </p>
                      </div>
                    </div>

                    <div className="notification-item">
                      <div className="avatar-xs">
                        <span className="avatar-title bg-danger-subtle text-danger">
                          <i className="bx bx-message-square-dots"></i>
                        </span>
                      </div>
                      <div className="notification-content">
                        <p className="notification-text">
                          You have received <b className="text-success">20</b> new messages
                        </p>
                        <p className="notification-time">
                          <i className="mdi mdi-clock-outline"></i>
                          <span>2 HRS AGO</span>
                        </p>
                      </div>
                    </div>

                    <div className="notification-item">
                      <div className="avatar-xs">
                        <span className="avatar-title bg-warning-subtle text-warning">
                          <i className="bx bx-error"></i>
                        </span>
                      </div>
                      <div className="notification-content">
                        <p className="notification-text">Storage is almost full</p>
                        <p className="notification-time">
                          <i className="mdi mdi-clock-outline"></i>
                          <span>5 HRS AGO</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="notif-footer">
                    <button type="button" className="btn-view-all">
                      <span>View All Notifications</span>
                      <i className="ri-arrow-right-line"></i>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Dropdown */}
          <div className="dropdown topbar-user header-item" ref={userRef}>
            <button
              type="button"
              className={`user-btn ${userOpen ? 'active' : ''}`}
              onClick={() => setUserOpen(!userOpen)}
              aria-label="User Profile"
            >
              <div className="d-flex align-items-center">
                <span className="user-avatar">A</span>
                <span className="text-start ms-2 d-none d-xl-block">
                  <span className="d-block fw-semibold user-name-text">
                    Anna Adame
                  </span>
                  <span className="d-block user-name-sub-text">Founder</span>
                </span>
              </div>
            </button>

            <AnimatePresence>
              {userOpen && (
                <motion.div
                  className="dropdown-menu dropdown-menu-end show"
                  variants={dropdownMotion}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h6 className="dropdown-header">Welcome Anna!</h6>
                  <a className="dropdown-item" href="#!">
                    <i className="mdi mdi-account-circle text-muted fs-16 me-2"></i>
                    <span>Profile</span>
                  </a>
                  <a className="dropdown-item" href="#!">
                    <i className="mdi mdi-lifebuoy text-muted fs-16 me-2"></i>
                    <span>Help</span>
                  </a>
                  <div className="dropdown-divider"></div>
                  <a className="dropdown-item" href="#!">
                    <i className="mdi mdi-cog-outline text-muted fs-16 me-2"></i>
                    <span>Settings</span>
                  </a>

                  <button
                    type="button"
                    className="dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    <i className="mdi mdi-logout fs-16 me-2"></i>
                    <span>Logout</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;