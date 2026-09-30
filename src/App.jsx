import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected App Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div
                  className={`layout-wrapper ${
                    !sidebarOpen ? 'sidebar-collapsed' : ''
                  }`}
                >
                  <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                  />
                  <div className="main-content">
                    <Header toggleSidebar={toggleSidebar} />
                    <div className="page-content">
                      <Routes>
                        <Route
                          path="/"
                          element={<Navigate to="/dashboard" replace />}
                        />
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
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;