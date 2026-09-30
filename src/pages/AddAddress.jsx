// src/pages/AddAddress.jsx
import React, { useState } from 'react';
import { ref, push, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { database } from '../firebase';
import { useToast } from '../components/Toast';
import './VerificationAddress.css';

const AddAddress = () => {
  const toast = useToast();
  const navigate = useNavigate();

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
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
      toast.success(`Verification Address added with Case ID: ${caseId}!`, 'Address Saved');
      setFormData(initialForm);
      navigate('/address/manage');
    } catch (err) {
      toast.error(err.message, 'Failed to Add Address');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="va-container">
      <div className="va-header-box">
        <div>
          <h4 className="va-main-title">Add Verification Address</h4>
          <p className="va-sub-title">
            Register a new address case for bank or corporate verification
          </p>
        </div>
      </div>

      <div className="va-card">
        <div className="va-card-body">
          <form onSubmit={handleSubmit}>
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
    </div>
  );
};

export default AddAddress;