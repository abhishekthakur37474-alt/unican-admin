import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { secondaryAuth, database } from '../firebase';
import { useToast } from '../components/Toast';
import './CreateStaff.css';

const CreateStaff = () => {
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.', 'Validation Error');
      return;
    }

    if (formData.password.length < 6) {
      toast.warning('Password must be at least 6 characters long.', 'Weak Password');
      return;
    }

    setLoading(true);

    try {
      // 1. Create in Firebase Authentication via secondaryAuth
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email.trim(),
        formData.password
      );

      const user = userCredential.user;

      // 2. Save directly under `staff/{uid}`
      await set(ref(database, `staff/${user.uid}`), {
        uid: user.uid,
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: 'staff',
        createdAt: new Date().toISOString(),
      });

      // 3. Clear secondary auth session to keep admin session active
      await signOut(secondaryAuth);

      toast.success(`Staff account created for ${formData.email}`, 'Account Created');

      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered in Firebase.', 'Email Conflict');
      } else if (err.code === 'auth/invalid-email') {
        toast.error('The email address format is invalid.', 'Invalid Email');
      } else {
        toast.error(err.message || 'Failed to create staff account.', 'Error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-page-container">
      <div className="staff-card">
        <div className="staff-card-header">
          <h4 className="card-title">Create New Staff</h4>
          <p className="card-subtitle">
            Create credentials for Firebase Auth and Realtime Database
          </p>
        </div>

        <form onSubmit={handleSubmit} className="staff-form">
          <div className="form-group">
            <label htmlFor="name">Staff Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="staff@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              required
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Staff'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateStaff;