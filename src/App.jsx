import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import CreateStaff from './pages/CreateStaff';
import ManageStaff from './pages/ManageStaff';
import AddAddress from './pages/AddAddress';
import ManageAddress from './pages/ManageAddress';
import AssignAddress from './pages/AssignAddress';
import Login from './pages/Login';
import { ToastProvider } from './components/Toast';
import './App.css';

const DESKTOP_MQ = '(min-width: 992px)';

const isDesktopViewport = () =>
  typeof window !== 'undefined' && window.matchMedia(DESKTOP_MQ).matches;

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(isDesktopViewport);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MQ);
    const onChange = (event) => {
      setSidebarOpen(event.matches);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!isDesktopViewport()) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('sidebar-drawer-open', sidebarOpen && !isDesktopViewport());
    return () => document.body.classList.remove('sidebar-drawer-open');
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div
      className={`layout-wrapper ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}
    >
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main-content">
        <Header toggleSidebar={toggleSidebar} />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/address/add" element={<AddAddress />} />
            <Route path="/address/manage" element={<ManageAddress />} />
            <Route path="/address/assign" element={<AssignAddress />} />
            <Route path="/staff/create" element={<CreateStaff />} />
            <Route path="/staff/manage" element={<ManageStaff />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;