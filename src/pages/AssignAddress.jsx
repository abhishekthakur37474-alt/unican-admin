// src/pages/AssignAddress.jsx
import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../firebase';
import { useToast } from '../components/Toast';
import { notifyStaffOnAssignment, getStaffPlayerId } from '../utils/notifyStaff';
import './VerificationAddress.css';

const AssignAddress = () => {
  const toast = useToast();
  const [addresses, setAddresses] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [assignDialog, setAssignDialog] = useState({
    isOpen: false,
    addressItem: null,
    selectedStaffUid: '',
  });

  useEffect(() => {
    // 1. Fetch unassigned addresses
    const addrRef = ref(database, 'verification_addresses');
    const unsubAddr = onValue(addrRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
        setAddresses(list.reverse());
      } else {
        setAddresses([]);
      }
      setLoading(false);
    });

    // 2. Fetch staff list
    const staffRef = ref(database, 'staff');
    const unsubStaff = onValue(staffRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.keys(data).map((k) => ({ uid: k, ...data[k] }));
        setStaffList(list);
      } else {
        setStaffList([]);
      }
    });

    return () => {
      unsubAddr();
      unsubStaff();
    };
  }, []);

  const handleAssignSubmit = async () => {
    const { addressItem, selectedStaffUid } = assignDialog;
    if (!addressItem || !selectedStaffUid) {
      toast.warning('Please select a staff member to assign.', 'Selection Required');
      return;
    }

    const assignedStaff = staffList.find((s) => s.uid === selectedStaffUid);
    if (!assignedStaff) return;

    try {
      const assignedAt = new Date().toISOString();

      await update(ref(database, `verification_addresses/${addressItem.id}`), {
        status: 'Assigned',
        assignedToStaffId: assignedStaff.uid,
        assignedToStaffName: assignedStaff.name,
        assignedToStaffEmail: assignedStaff.email,
        assignedAt: assignedAt,
      });

      const { deviceSent, reason } = await notifyStaffOnAssignment({
        staff: assignedStaff,
        addressItem,
        assignedAt,
      });

      toast.success(
        deviceSent
          ? `Case ${addressItem.caseId} assigned to ${assignedStaff.name}. In-app + device push sent.`
          : reason === 'no_subscribed_device'
            ? `Case ${addressItem.caseId} assigned to ${assignedStaff.name}. In-app sent. Device push skipped (staff not subscribed on OneSignal).`
            : `Case ${addressItem.caseId} assigned to ${assignedStaff.name}. In-app sent. Device push failed: ${reason}`,
        'Assigned Successfully'
      );

      setAssignDialog({ isOpen: false, addressItem: null, selectedStaffUid: '' });
    } catch (err) {
      toast.error(err.message, 'Assignment Failed');
    }
  };

  const unassignedCases = addresses.filter((a) => a.status === 'Unassigned');

  return (
    <div className="va-container">
      <div className="va-header-box">
        <div>
          <h4 className="va-main-title">Assign Address to Staff</h4>
          <p className="va-sub-title">
            Allocate unassigned cases to field officers and dispatch task notifications
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
                <th>Address & City</th>
                <th>Priority</th>
                <th>Status</th>
                <th className="text-end">Assign Officer</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Loading cases...
                  </td>
                </tr>
              ) : unassignedCases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-success fw-semibold">
                    All cases are assigned! No pending allocations.
                  </td>
                </tr>
              ) : (
                unassignedCases.map((a) => (
                  <tr key={a.id}>
                    <td className="fw-semibold text-primary">{a.caseId}</td>
                    <td>
                      <div className="fw-semibold">{a.applicantName}</div>
                      <small className="text-muted">{a.phone}</small>
                    </td>
                    <td>{a.clientName}</td>
                    <td>
                      <div style={{ maxWidth: '280px' }}>
                        {a.addressLine}, {a.city} - {a.pincode}
                      </div>
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
                      <span className="va-badge va-badge-unassigned">Unassigned</span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="va-action-btn va-btn-assign"
                        onClick={() =>
                          setAssignDialog({
                            isOpen: true,
                            addressItem: a,
                            selectedStaffUid: '',
                          })
                        }
                      >
                        <i className="mdi mdi-account-plus me-1"></i> Assign Staff
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ASSIGN MODAL */}
      {assignDialog.isOpen && (
        <div
          className="va-modal-backdrop"
          onClick={() =>
            setAssignDialog({ isOpen: false, addressItem: null, selectedStaffUid: '' })
          }
        >
          <div className="va-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="va-modal-header">
              <h5>Assign Officer to Case #{assignDialog.addressItem?.caseId}</h5>
              <button
                type="button"
                className="va-modal-close"
                onClick={() =>
                  setAssignDialog({ isOpen: false, addressItem: null, selectedStaffUid: '' })
                }
              >
                ✕
              </button>
            </div>
            <div className="va-modal-body">
              <p className="text-muted" style={{ fontSize: '13px' }}>
                Select a field officer. In-app notification is sent immediately. Device
                push goes via OneSignal using staff uid as external_id.
              </p>
              <div className="va-form-group mb-3">
                <label>Select Staff Member</label>
                <select
                  value={assignDialog.selectedStaffUid}
                  onChange={(e) =>
                    setAssignDialog({
                      ...assignDialog,
                      selectedStaffUid: e.target.value,
                    })
                  }
                >
                  <option value="">-- Choose Field Officer --</option>
                  {staffList.map((st) => (
                    <option key={st.uid} value={st.uid}>
                      {st.name} ({st.email})
                      {getStaffPlayerId(st) ? ' • OneSignal player' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="va-modal-footer">
              <button
                type="button"
                className="va-action-btn"
                style={{ background: '#eef0f5' }}
                onClick={() =>
                  setAssignDialog({ isOpen: false, addressItem: null, selectedStaffUid: '' })
                }
              >
                Cancel
              </button>
              <button
                type="button"
                className="va-action-btn va-btn-primary"
                onClick={handleAssignSubmit}
              >
                Confirm Assignment & Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignAddress;