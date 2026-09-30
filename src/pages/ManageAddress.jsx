// src/pages/ManageAddress.jsx
import React, { useState, useEffect } from 'react';
import { ref, onValue, update, remove } from 'firebase/database';
import { database } from '../firebase';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import './VerificationAddress.css';

const ManageAddress = () => {
  const toast = useToast();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, item: null });

  useEffect(() => {
    const addrRef = ref(database, 'verification_addresses');
    const unsub = onValue(addrRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
        setAddresses(list.reverse());
      } else {
        setAddresses([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editItem) return;

    try {
      await update(ref(database, `verification_addresses/${editItem.id}`), {
        applicantName: editItem.applicantName,
        phone: editItem.phone,
        clientName: editItem.clientName,
        verificationType: editItem.verificationType,
        priority: editItem.priority,
        addressLine: editItem.addressLine,
        landmark: editItem.landmark || '',
        city: editItem.city,
        state: editItem.state,
        pincode: editItem.pincode,
        updatedAt: new Date().toISOString(),
      });

      toast.success('Address details updated successfully!', 'Saved');
      setEditItem(null);
    } catch (err) {
      toast.error(err.message, 'Update Failed');
    }
  };

  const executeDelete = async () => {
    const item = deleteDialog.item;
    if (!item) return;

    try {
      await remove(ref(database, `verification_addresses/${item.id}`));
      toast.success(`Case ${item.caseId || item.applicantName} deleted!`, 'Deleted');
    } catch (err) {
      toast.error(err.message, 'Delete Failed');
    } finally {
      setDeleteDialog({ isOpen: false, item: null });
    }
  };

  return (
    <div className="va-container">
      <div className="va-header-box">
        <div>
          <h4 className="va-main-title">Manage Addresses</h4>
          <p className="va-sub-title">
            View full details, edit information, or remove records from database
          </p>
        </div>
      </div>

      <div className="va-card">
        <div className="va-table-responsive">
          <table className="va-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Applicant</th>
                <th>Client</th>
                <th>City / Pincode</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Officer</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    Loading verification addresses...
                  </td>
                </tr>
              ) : addresses.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    No addresses found.
                  </td>
                </tr>
              ) : (
                addresses.map((a) => (
                  <tr key={a.id}>
                    <td className="fw-semibold text-primary">{a.caseId || a.id.slice(0, 8)}</td>
                    <td>
                      <div className="fw-semibold text-dark">{a.applicantName}</div>
                      <small className="text-muted">{a.phone}</small>
                    </td>
                    <td>{a.clientName}</td>
                    <td>
                      <div>{a.city}</div>
                      <small className="text-muted">{a.pincode}</small>
                    </td>
                    <td>
                      <span className="text-muted">{a.verificationType}</span>
                    </td>
                    <td>
                      <span
                        className={`va-badge ${
                          a.priority === 'Urgent'
                            ? 'va-badge-urgent'
                            : a.priority === 'High'
                            ? 'va-badge-high'
                            : 'va-badge-normal'
                        }`}
                      >
                        {a.priority}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`va-badge ${
                          a.status === 'Assigned'
                            ? 'va-badge-assigned'
                            : 'va-badge-unassigned'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td>
                      {a.assignedToStaffName ? (
                        <div className="fw-semibold text-dark">{a.assignedToStaffName}</div>
                      ) : (
                        <span className="text-muted fst-italic">Unassigned</span>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="va-action-btn va-btn-view me-1"
                        onClick={() => setViewItem(a)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="va-action-btn va-btn-edit me-1"
                        onClick={() => setEditItem(a)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="va-action-btn va-btn-del"
                        onClick={() => setDeleteDialog({ isOpen: true, item: a })}
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

      {/* VIEW MODAL */}
      {viewItem && (
        <div className="va-modal-backdrop" onClick={() => setViewItem(null)}>
          <div className="va-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="va-modal-header">
              <h5>Case Details: {viewItem.caseId}</h5>
              <button
                type="button"
                className="va-modal-close"
                onClick={() => setViewItem(null)}
              >
                ✕
              </button>
            </div>
            <div className="va-modal-body">
              <div className="va-detail-row">
                <span className="va-detail-label">Applicant Name:</span>
                <span className="va-detail-val">{viewItem.applicantName}</span>
              </div>
              <div className="va-detail-row">
                <span className="va-detail-label">Contact Phone:</span>
                <span className="va-detail-val">{viewItem.phone}</span>
              </div>
              <div className="va-detail-row">
                <span className="va-detail-label">Client / Bank:</span>
                <span className="va-detail-val">{viewItem.clientName}</span>
              </div>
              <div className="va-detail-row">
                <span className="va-detail-label">Verification Type:</span>
                <span className="va-detail-val">{viewItem.verificationType}</span>
              </div>
              <div className="va-detail-row">
                <span className="va-detail-label">Priority:</span>
                <span className="va-detail-val">{viewItem.priority}</span>
              </div>
              <div className="va-detail-row">
                <span className="va-detail-label">Full Address:</span>
                <span className="va-detail-val">{viewItem.addressLine}</span>
              </div>
              <div className="va-detail-row">
                <span className="va-detail-label">Landmark:</span>
                <span className="va-detail-val">{viewItem.landmark || 'None'}</span>
              </div>
              <div className="va-detail-row">
                <span className="va-detail-label">City, State, Zip:</span>
                <span className="va-detail-val">
                  {viewItem.city}, {viewItem.state} - {viewItem.pincode}
                </span>
              </div>
              <div className="va-detail-row">
                <span className="va-detail-label">Status:</span>
                <span className="va-detail-val">{viewItem.status}</span>
              </div>
              <div className="va-detail-row">
                <span className="va-detail-label">Assigned Officer:</span>
                <span className="va-detail-val">
                  {viewItem.assignedToStaffName || 'Not Assigned Yet'}
                </span>
              </div>
            </div>
            <div className="va-modal-footer">
              <button
                type="button"
                className="va-action-btn va-btn-primary"
                onClick={() => setViewItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editItem && (
        <div className="va-modal-backdrop" onClick={() => setEditItem(null)}>
          <div className="va-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="va-modal-header">
              <h5>Edit Case #{editItem.caseId}</h5>
              <button
                type="button"
                className="va-modal-close"
                onClick={() => setEditItem(null)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="va-modal-body">
                <div className="va-form-group mb-2">
                  <label>Applicant Full Name</label>
                  <input
                    type="text"
                    value={editItem.applicantName}
                    onChange={(e) =>
                      setEditItem({ ...editItem, applicantName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="va-form-group mb-2">
                  <label>Contact Phone</label>
                  <input
                    type="text"
                    value={editItem.phone}
                    onChange={(e) =>
                      setEditItem({ ...editItem, phone: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="va-form-group mb-2">
                  <label>Street Address</label>
                  <textarea
                    rows="2"
                    value={editItem.addressLine}
                    onChange={(e) =>
                      setEditItem({ ...editItem, addressLine: e.target.value })
                    }
                    required
                  ></textarea>
                </div>
                <div className="va-grid-2">
                  <div className="va-form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={editItem.city}
                      onChange={(e) =>
                        setEditItem({ ...editItem, city: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="va-form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      value={editItem.pincode}
                      onChange={(e) =>
                        setEditItem({ ...editItem, pincode: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="va-modal-footer">
                <button
                  type="button"
                  className="va-action-btn"
                  style={{ background: '#eef0f5' }}
                  onClick={() => setEditItem(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="va-action-btn va-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={deleteDialog.isOpen}
        title="Delete Verification Address?"
        message={`Are you sure you want to permanently delete Case #${deleteDialog.item?.caseId} for ${deleteDialog.item?.applicantName}?`}
        confirmText="Yes, Delete Record"
        cancelText="Cancel"
        type="danger"
        onConfirm={executeDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, item: null })}
      />
    </div>
  );
};

export default ManageAddress;