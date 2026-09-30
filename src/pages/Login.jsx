// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import profileImg from '../assets/profile-img.png';

// ✅ Demo credentials (case-insensitive email, exact password)
const DEMO_EMAIL = 'DEMOUNICAN@GMAIL.COM';
const DEMO_PASSWORD = 'demo@123';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Field-level validation
  const validateField = (name, value) => {
    let error = '';

    if (name === 'email') {
      if (!value.trim()) {
        error = 'Please Enter Your Email';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = 'Please Enter a Valid Email';
      }
    }

    if (name === 'password') {
      if (!value) {
        error = 'Please Enter Your Password';
      } else if (value.length < 6) {
        error = 'Password must be at least 6 characters';
      }
    }

    setErrors((prev) => ({ ...prev, [name]: error || null }));
    return !error;
  };

  // Validate all fields
  const validateAll = () => {
    const emailValid = validateField('email', email);
    const passwordValid = validateField('password', password);
    return emailValid && passwordValid;
  };

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();

    if (!validateAll()) return;

    // ✅ Check against demo credentials
    const inputEmail = email.trim().toUpperCase();
    const inputPassword = password;

    if (inputEmail === DEMO_EMAIL && inputPassword === DEMO_PASSWORD) {
      // Success → redirect to dashboard
      console.log('✅ Login successful');
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/dashboard');
    } else {
      // Failure → show error
      setErrors((prev) => ({
        ...prev,
        email: ' ',
        password: 'Invalid email or password. Please try again.',
      }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="account-pages my-5 pt-sm-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6 col-xl-5">
            <div className="card overflow-hidden">
              <div className="bg-primary-subtle">
                <div className="row">
                  <div className="col-7">
                    <div className="text-primary p-4">
                      <h5 className="text-primary">Welcome Back !</h5>
                      <p>Sign in to continue to Unican.</p>
                    </div>
                  </div>
                  <div className="col-5 align-self-end">
                    <img src={profileImg} alt="" className="img-fluid" />
                  </div>
                </div>
              </div>

              <div className="card-body pt-0">
                <div className="p-2">
                  {/* Demo credentials hint */}


                  <form className="form-horizontal" onSubmit={handleLogin} noValidate>
                    {/* Email */}
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        placeholder="Enter email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors((p) => ({ ...p, email: null }));
                        }}
                        onBlur={(e) => validateField('email', e.target.value)}
                      />
                      {errors.email && errors.email.trim() && (
                        <div className="invalid-feedback">{errors.email}</div>
                      )}
                    </div>

                    {/* Password */}
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">
                        Password
                      </label>
                      <div className="input-group auth-pass-inputgroup">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                          placeholder="Enter Password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (errors.password)
                              setErrors((p) => ({ ...p, password: null }));
                          }}
                          onBlur={(e) => validateField('password', e.target.value)}
                        />
                        <button
                          className="btn btn-light"
                          type="button"
                          onClick={togglePasswordVisibility}
                          tabIndex={-1}
                        >
                          <i
                            className={`mdi ${
                              showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
                            }`}
                          ></i>
                        </button>
                      </div>
                      {errors.password && (
                        <div className="invalid-feedback d-block">{errors.password}</div>
                      )}
                    </div>

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="remember-check"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="remember-check">
                        Remember me
                      </label>
                    </div>

                    <div className="mt-3 d-grid">
                      <button
                        className="btn btn-primary waves-effect waves-light"
                        type="submit"
                      >
                        Log In
                      </button>
                    </div>

                    <div className="mt-4 text-center">
                      <a href="#!" className="text-muted">
                        <i className="mdi mdi-lock me-1"></i> Forgot your password?
                      </a>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;