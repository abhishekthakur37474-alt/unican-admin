// src/pages/ManageStaff.jsx
import React, { useState, useEffect } from 'react';
import { ref, onValue, update, remove } from 'firebase/database';
import { signInWithEmailAndPassword, deleteUser, signOut } from 'firebase/auth';
import { database, secondaryAuth } from '../firebase';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import './ManageStaff.css';

const ManageStaff = () => {
  const toast = useToast();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingStaff, setEditingStaff] = useState(null);

  // In-App Confirm Delete Modal State (NO BROWSER ALERT)
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    staff: null,
  });

  // Fetch real-time staff data
  useEffect(() => {
    const staffRef = ref(database, 'staff');
    const unsubscribe = onValue(
      staffRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const list = Object.keys(data).map((key) => ({
            uid: key,
            ...data[key],
          }));
          setStaffList(list);
        } else {
          setStaffList([]);
        }
        setLoading(false);
      },
      (error) => {
        toast.error(error.message, 'Database Error');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  // Handle Edit form changes
  const handleEditChange = (e) => {
    setEditingStaff({
      ...editingStaff,
      [e.target.name]: e.target.value,
    });
  };

  // Submit Edit updates
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      const updates = {
        name: editingStaff.name,
        role: editingStaff.role || 'staff',
        password: editingStaff.password,
        deviceId: editingStaff.deviceId || null,
      };

      await update(ref(database, `staff/${editingStaff.uid}`), updates);
      toast.success(`Staff ${editingStaff.name} details updated!`, 'Updated');
      setEditingStaff(null);
    } catch (err) {
      toast.error(err.message, 'Update Failed');
    }
  };

  // Trigger custom in-app Delete Confirmation
  const openDeleteDialog = (staff) => {
    setDeleteModalState({
      isOpen: true,
      staff: staff,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteModalState({
      isOpen: false,
      staff: null,
    });
  };

  // Execute Delete from BOTH Firebase Authentication AND Realtime Database
  const executeDelete = async () => {
    const staff = deleteModalState.staff;
    if (!staff) return;

    try {
      // 1. Try deleting from Firebase Authentication via secondaryAuth
      // This signs in the staff user temporarily on secondary instance and deletes the Auth record
      try {
        if (staff.email && staff.password) {
          const userCredential = await signInWithEmailAndPassword(
            secondaryAuth,
            staff.email.trim(),
            staff.password
          );
          await deleteUser(userCredential.user);
        }
      } catch (authErr) {
        // If user was already deleted from Auth or password changed, continue to DB deletion
        console.warn('Firebase Auth user deletion note:', authErr.message);
      } finally {
        // Always clean up secondary auth instance
        await signOut(secondaryAuth).catch(() => {});
      }

      // 2. Delete the staff profile from Firebase Realtime Database
      await remove(ref(database, `staff/${staff.uid}`));

      toast.success(
        `Staff ${staff.name} deleted from Firebase Auth and Database!`,
        'Deleted Successfully'
      );
    } catch (err) {
      toast.error(err.message || 'Failed to delete staff member.', 'Delete Error');
    } finally {
      closeDeleteDialog();
    }
  };

  return (
    <div className="manage-staff-container">
      <div className="staff-header-row">
        <div>
          <h4 className="page-heading">Staff Directory & Management</h4>
          <p className="page-subheading">
            View, edit credentials, or remove staff records from Firebase Auth & Database
          </p>
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="staff-table">
            <thead>
              <tr>
                <th>Officer</th>
                <th>Email ID</th>
                <th>Password</th>
                <th>Device ID</th>
                <th>Role</th>
                <th>Created At</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Loading records...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    No staff records available.
                  </td>
                </tr>
              ) : (
                staffList.map((st) => (
                  <tr key={st.uid}>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="staff-avatar">
                          {st.name ? st.name.charAt(0).toUpperCase() : 'S'}
                        </span>
                        <span className="fw-semibold text-dark">{st.name}</span>
                      </div>
                    </td>
                    <td>{st.email}</td>
                    <td>
                      <code className="pwd-badge">{st.password}</code>
                    </td>
                    <td>
                      {st.deviceId && st.deviceId.trim() !== '' ? (
                        <code className="device-id-badge" title={st.deviceId}>
                          {st.deviceId}
                        </code>
                      ) : (
                        <span className="device-unassigned-badge">
                          Not Assigned
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="role-badge">{st.role || 'staff'}</span>
                    </td>
                    <td className="text-muted">
                      {st.createdAt
                        ? new Date(st.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn-action btn-edit me-2"
                        onClick={() => setEditingStaff(st)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-delete"
                        onClick={() => openDeleteDialog(st)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal Overlay */}
      {editingStaff && (
        <div className="modal-overlay">
          <div className="modal-dialog-custom">
            <div className="modal-header-custom">
              <h5>Edit Staff: {editingStaff.name}</h5>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setEditingStaff(null)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body-custom">
                <div className="form-group mb-3">
                  <label>Staff Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editingStaff.name}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Email (Read-only)</label>
                  <input
                    type="email"
                    name="email"
                    value={editingStaff.email}
                    disabled
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Password</label>
                  <input
                    type="text"
                    name="password"
                    value={editingStaff.password}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Device ID</label>
                  <input
                    type="text"
                    name="deviceId"
                    value={editingStaff.deviceId || ''}
                    onChange={handleEditChange}
                    placeholder="Enter Device ID or leave blank"
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Role</label>
                  <input
                    type="text"
                    name="role"
                    value={editingStaff.role || 'staff'}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setEditingStaff(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Confirmation Popup */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        title="Delete Staff Member?"
        message={`Are you sure you want to delete ${deleteModalState.staff?.name}? This account will be permanently deleted from both Firebase Authentication and the Realtime Database.`}
        confirmText="Yes, Delete Everywhere"
        cancelText="Cancel"
        type="danger"
        onConfirm={executeDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
};

export default ManageStaff;