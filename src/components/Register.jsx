import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, setAuthSession } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    
    if (formData.username.trim().length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  // Health check function
  const checkServerHealth = async () => {
    try {
      console.log('Testing server connection...');
      const response = await api.get('/auth/users');
      console.log('Server health check successful');
      return true;
    } catch (error) {
      console.log('Server health check failed:', error.message);
      return false;
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  setLoading(true);
  setError('');

  try {
    const response = await api.post('/auth/register', {
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password
    });

    console.log('Registration response:', response.data);

    if (response.data.success || response.status === 201) {
      // Use register response token and user for immediate session
      const { token, user: userData } = response.data;
      if (token && userData) {
        setAuthSession(token, userData);
        navigate('/');
        return;
      }
      // Fallback: attempt login
      const loginResult = await login(formData.username, formData.password);
      if (loginResult.success) navigate('/'); else {
        setError('Registration successful! Please login.');
        navigate('/login');
      }
    } else {
      setError(response.data.message || 'Registration failed.');
    }
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);

    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      setError(error.response.data.errors.map(err => err.message).join(', '));
    } else if (error.response?.data?.message) {
      setError(error.response.data.message);
    } else {
      setError('Registration failed. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="register-container">
      <div className="register-card card">
        <div className="text-center mb-4">
          <h1 className="register-title">Task Management System</h1>
          <h2 className="register-subtitle">Create Your Account</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="fade-in">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="form-control"
              placeholder="Enter username"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              placeholder="Enter email address"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-control"
              placeholder="Enter password (min 6 characters)"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-control"
              placeholder="Confirm your password"
              required
              autoComplete="new-password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="register-footer text-center mt-4">
          <p className="mb-2">Already have an account? <Link to="/login" className="link-primary">Login here</Link></p>
        </div>

        <div className="register-info mt-4">
          <h4 className="mb-2">Account Information</h4>
          <div className="info-list">
            <div className="info-item">
              <span className="info-icon">✓</span>
              <span className="info-text">Username must be at least 3 characters long</span>
            </div>
            <div className="info-item">
              <span className="info-icon">✓</span>
              <span className="info-text">Email must be valid and unique</span>
            </div>
            <div className="info-item">
              <span className="info-icon">✓</span>
              <span className="info-text">Password must be at least 6 characters</span>
            </div>
            <div className="info-item">
              <span className="info-icon">✓</span>
              <span className="info-text">New users get 'user' role by default</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
