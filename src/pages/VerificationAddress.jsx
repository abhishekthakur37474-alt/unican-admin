// src/pages/VerificationAddress.jsx
import React, { useState, useEffect } from 'react';
import { ref, onValue, push, set, update, remove } from 'firebase/database';
import { database } from '../firebase';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { notifyStaffOnAssignment } from '../utils/notifyStaff';
import './VerificationAddress.css';

const VerificationAddress = () => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('manage'); // 'manage' | 'add' | 'assign'
  const [addresses, setAddresses] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state for Add/Edit
  const initialForm = {
    applicantName: '',
    phone: '',
    clientName: 'HDFC Bank Ltd',
    verificationType: 'Residence Check',
    priority: 'Normal',
    addressLine: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [formLoading, setFormLoading] = useState(false);

  // View / Edit / Delete Modals
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, item: null });

  // Assign Modal
  const [assignDialog, setAssignDialog] = useState({
    isOpen: false,
    addressItem: null,
    selectedStaffUid: '',
  });

  // Fetch Addresses and Staff in real-time
  useEffect(() => {
    // 1. Fetch Verification Addresses
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

    // 2. Fetch Staff Members
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

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 1. Create New Verification Address
  const handleAddAddress = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const newRef = push(ref(database, 'verification_addresses'));
      const caseId = 'VRF-' + Math.floor(10000 + Math.random() * 90000);

      const payload = {
        ...formData,
        caseId: caseId,
        status: 'Unassigned',
        assignedToStaffId: null,
        assignedToStaffName: null,
        assignedAt: null,
        createdAt: new Date().toISOString(),
      };

      await set(newRef, payload);
      toast.success(`Verification Address added with Case ID: ${caseId}!`, 'Added');
      setFormData(initialForm);
      setActiveTab('manage');
    } catch (err) {
      toast.error(err.message, 'Failed to Add Address');
    } finally {
      setFormLoading(false);
    }
  };

  // 2. Update Existing Address
  const handleUpdateAddress = async (e) => {
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
        landmark: editItem.landmark,
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

  // 3. Delete Address from Firebase
  const executeDelete = async () => {
    const item = deleteDialog.item;
    if (!item) return;

    try {
      await remove(ref(database, `verification_addresses/${item.id}`));
      toast.success(`Case ${item.caseId || item.applicantName} deleted from Firebase!`, 'Deleted');
    } catch (err) {
      toast.error(err.message, 'Delete Failed');
    } finally {
      setDeleteDialog({ isOpen: false, item: null });
    }
  };

  // 4. Assign Address to Staff & Send Staff Notification
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

  return (
    <div className="va-container">
      {/* Top Header */}
      <div className="va-header-box">
        <div>
          <h4 className="va-main-title">Verification Address Management</h4>
          <p className="va-sub-title">
            Add new verification cases, allocate field officers, and dispatch real-time tasks.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="va-tabs">
        <button
          type="button"
          className={`va-tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          <i className="mdi mdi-map-marker-multiple-outline"></i> All Addresses ({addresses.length})
        </button>
        <button
          type="button"
          className={`va-tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          <i className="mdi mdi-plus-circle-outline"></i> Add Verification Address
        </button>
        <button
          type="button"
          className={`va-tab-btn ${activeTab === 'assign' ? 'active' : ''}`}
          onClick={() => setActiveTab('assign')}
        >
          <i className="mdi mdi-account-arrow-right-outline"></i> Assign to Staff (
          {addresses.filter((a) => a.status === 'Unassigned').length} Pending)
        </button>
      </div>

      {/* TAB 1: ADD ADDRESS */}
      {activeTab === 'add' && (
        <div className="va-card">
          <div className="va-card-body">
            <h5 className="mb-3" style={{ fontSize: '15px', fontWeight: 700 }}>
              New Address Details
            </h5>
            <form onSubmit={handleAddAddress}>
              <div className="va-grid-2">
                <div className="va-form-group">
                  <label>Applicant Full Name *</label>
                  <input
                    type="text"
                    name="applicantName"
                    value={formData.applicantName}
                    onChange={handleInputChange}
                    placeholder="e.g. Ramesh Kumar Sharma"
                    required
                  />
                </div>
                <div className="va-form-group">
                  <label>Contact Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
              </div>

              <div className="va-grid-3">
                <div className="va-form-group">
                  <label>Client / Bank Name *</label>
                  <select
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                  >
                    <option value="HDFC Bank Ltd">HDFC Bank Ltd</option>
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="ICICI Bank Ltd">ICICI Bank Ltd</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  </select>
                </div>
                <div className="va-form-group">
                  <label>Verification Type *</label>
                  <select
                    name="verificationType"
                    value={formData.verificationType}
                    onChange={handleInputChange}
                  >
                    <option value="Residence Check">Residence Check</option>
                    <option value="Business Check">Business Check</option>
                    <option value="Employment Verification">Employment Verification</option>
                    <option value="Co-Applicant Verification">Co-Applicant Verification</option>
                  </select>
                </div>
                <div className="va-form-group">
                  <label>Priority Level</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="va-form-group mb-3">
                <label>Street Address / House / Building *</label>
                <textarea
                  rows="2"
                  name="addressLine"
                  value={formData.addressLine}
                  onChange={handleInputChange}
                  placeholder="Flat No 402, Sunshine Heights, MG Road..."
                  required
                ></textarea>
              </div>

              <div className="va-grid-2">
                <div className="va-form-group">
                  <label>Prominent Landmark</label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleInputChange}
                    placeholder="Near City Hospital / Metro Pillar 24"
                  />
                </div>
                <div className="va-form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Mumbai"
                    required
                  />
                </div>
              </div>

              <div className="va-grid-2">
                <div className="va-form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="e.g. Maharashtra"
                    required
                  />
                </div>
                <div className="va-form-group">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="400001"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="va-btn-primary mt-2"
                disabled={formLoading}
              >
                {formLoading ? 'Saving to Database...' : 'Save & Register Address'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE ADDRESSES (VIEW / EDIT / DELETE) */}
      {activeTab === 'manage' && (
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
                      No addresses found. Click "Add Verification Address" above.
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
                          <div className="fw-semibold text-dark">
                            {a.assignedToStaffName}
                          </div>
                        ) : (
                          <span className="text-muted fst-italic">Unassigned</span>
                        )}
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="va-action-btn va-btn-view me-1"
                          onClick={() => setViewItem(a)}
                          title="View Full Details"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="va-action-btn va-btn-edit me-1"
                          onClick={() => setEditItem(a)}
                          title="Edit Details"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="va-action-btn va-btn-del"
                          onClick={() => setDeleteDialog({ isOpen: true, item: a })}
                          title="Delete from Firebase"
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
      )}

      {/* TAB 3: ASSIGN ADDRESS TO STAFF */}
      {activeTab === 'assign' && (
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
                  <th>Current Status</th>
                  <th className="text-end">Assign Officer</th>
                </tr>
              </thead>
              <tbody>
                {addresses.filter((a) => a.status === 'Unassigned').length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-success fw-semibold">
                      All cases are currently assigned! Great work.
                    </td>
                  </tr>
                ) : (
                  addresses
                    .filter((a) => a.status === 'Unassigned')
                    .map((a) => (
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
      )}

      {/* 1. VIEW FULL DETAILS MODAL */}
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
                <span className="va-detail-label">Current Status:</span>
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

      {/* 2. EDIT MODAL */}
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
            <form onSubmit={handleUpdateAddress}>
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

      {/* 3. ASSIGN OFFICER MODAL */}
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
                Select a field staff member. They will receive an instant notification
                with all verification address particulars.
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
                      {st.name} ({st.email}) {st.deviceId ? `• [${st.deviceId}]` : ''}
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

      {/* 4. IN-APP CONFIRMATION MODAL FOR DELETE */}
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

export default VerificationAddress;