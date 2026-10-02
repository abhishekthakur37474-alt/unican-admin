// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';
import './Dashboard.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

const Dashboard = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    const staffRef = ref(database, 'staff');
    const unsubscribe = onValue(staffRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const formatted = Object.keys(data).map((key) => ({
          uid: key,
          ...data[key],
        }));
        setStaffList(formatted);
      } else {
        setStaffList([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.status !== 'Inactive').length;

  return (
    <motion.div
      className="dashboard-wrapper"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Title & Greeting */}
      <motion.div className="row" variants={itemVariants}>
        <div className="col-12">
          <div className="dash-title-box">
            <div>
              <h4 className="dash-main-title">{getGreeting()}, Admin!</h4>
              <p className="dash-sub-title">
                Here is your staff overview and operational roster.
              </p>
            </div>
            <ol className="dash-breadcrumb">
              <li><Link to="/dashboard">UNICAN</Link></li>
              <li>Dashboard</li>
              <li className="active">Staff Overview</li>
            </ol>
          </div>
        </div>
      </motion.div>

      {/* Staff KPI Summary Cards */}
      <div className="row">
        <div className="col-12 col-sm-6 col-md-4">
          <motion.div className="dash-card dash-kpi-card" variants={itemVariants}>
            <div className="dash-card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="dash-kpi-title">Total Staff Members</span>
                <span className="dash-badge dash-badge-primary">Registered</span>
              </div>
              <div className="d-flex align-items-end justify-content-between mt-2">
                <div>
                  <h3 className="dash-kpi-value">{loading ? '...' : totalStaff}</h3>
                  <p className="dash-kpi-desc">Total registered personnel</p>
                </div>
                <div className="dash-kpi-avatar bg-primary-subtle text-primary">
                  <i className="mdi mdi-account-group"></i>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="col-12 col-sm-6 col-md-4">
          <motion.div className="dash-card dash-kpi-card" variants={itemVariants}>
            <div className="dash-card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="dash-kpi-title">Active Field Officers</span>
                <span className="dash-badge dash-badge-success">Operational</span>
              </div>
              <div className="d-flex align-items-end justify-content-between mt-2">
                <div>
                  <h3 className="dash-kpi-value">{loading ? '...' : activeStaff}</h3>
                  <p className="dash-kpi-desc">Available for assignments</p>
                </div>
                <div className="dash-kpi-avatar bg-success-subtle text-success">
                  <i className="mdi mdi-account-check"></i>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="col-12 col-md-4">
          <motion.div className="dash-card dash-kpi-card" variants={itemVariants}>
            <div className="dash-card-body p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="dash-kpi-title">Quick Action</span>
                <span className="dash-badge dash-badge-info">Manage</span>
              </div>
              <div className="d-flex align-items-center justify-content-between mt-3">
                <Link to="/staff/create" className="dash-btn-mini-primary">
                  <i className="mdi mdi-plus me-1"></i> Add New Staff
                </Link>
                <Link to="/staff/manage" className="dash-link-action">
                  Full Roster & Edit →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Staff Workload and Directory Table */}
      <div className="row mt-2">
        <div className="col-12">
          <motion.div className="dash-card" variants={itemVariants}>
            <div className="dash-card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="dash-card-heading">Staff Workload & Overview</h5>
                <span className="dash-card-subheading">
                  All active staff members, device IDs, roles, and real-time credentials
                </span>
              </div>
              <Link to="/staff/manage" className="dash-table-btn">
                Manage All
              </Link>
            </div>

            <div className="dash-card-body p-0">
              <div className="dash-table-responsive">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Officer Name</th>
                      <th>Email ID</th>
                      <th>Device ID</th>
                      <th>Assigned Role</th>
                      <th>Account Created</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          Loading staff data...
                        </td>
                      </tr>
                    ) : staffList.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted">
                          No staff found. Click "Add New Staff" to create one.
                        </td>
                      </tr>
                    ) : (
                      staffList.map((st) => (
                        <tr key={st.uid}>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="dash-avatar-badge me-2">
                                {st.name ? st.name.charAt(0).toUpperCase() : 'S'}
                              </span>
                              <span className="fw-semibold text-dark">{st.name}</span>
                            </div>
                          </td>
                          <td className="text-muted">{st.email}</td>
                          <td>
                            {st.deviceId && st.deviceId.trim() !== '' ? (
                              <code
                                style={{
                                  background: '#eef0f7',
                                  color: '#4b38b3',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                }}
                              >
                                {st.deviceId}
                              </code>
                            ) : (
                              <span
                                style={{
                                  background: '#f3f3f6',
                                  color: '#878a99',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                }}
                              >
                                Not Assigned
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="dash-badge dash-badge-info">
                              {st.role || 'Staff'}
                            </span>
                          </td>
                          <td className="text-muted">
                            {st.createdAt
                              ? new Date(st.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </td>
                          <td>
                            <span className="dash-badge dash-badge-success">
                              Active
                            </span>
                          </td>
                          <td className="text-end">
                            <Link
                              to="/staff/manage"
                              className="dash-table-btn"
                            >
                              Edit / Delete
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;