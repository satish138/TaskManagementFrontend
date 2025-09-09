import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      toast.error('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(credentials.username, credentials.password);

    if (result.success) {
      navigate('/');
      // Note: Success toast is already handled in AuthContext
    } else {
      setError(result.message);
      toast.error(result.message);
    }

    setLoading(false);
  };

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  return (
    <div className="login-container">
      <div className="login-card card">
        <div className="text-center mb-4">
          <h1 className="login-title">Task Management System</h1>
          <h2 className="login-subtitle">Welcome Back</h2>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleLogin} className="fade-in">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="btn btn-primary w-100"
            disabled={loading || !credentials.username || !credentials.password}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer text-center mt-4">
          <p className="mb-2">
            Contact an administrator to create an account for you.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
