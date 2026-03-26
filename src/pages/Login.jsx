import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../components/Auth.css';

const Login = () => {
  const [userType, setUserType] = useState(null); // 'employee' or 'customer'
  const [employeeId, setEmployeeId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const navigate = useNavigate();

  const departments = ['Mail Sorting', 'Customer Service', 'Delivery', 'Management', 'Finance', 'IT Support'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = userType === 'employee' 
        ? 'http://localhost:5000/api/auth/login'
        : 'http://localhost:5000/api/auth/customer-login';

      const payload = userType === 'employee'
        ? { employeeId, password, department }
        : { customerId, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed');
        return;
      }

      // Store token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userType', userType);

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem(userType === 'employee' ? 'employeeId' : 'customerId', 
          userType === 'employee' ? employeeId : customerId);
      }

      navigate(userType === 'employee' ? '/profile' : '/customer-dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        setResetMessage(data.message || 'Failed to send reset email');
        return;
      }

      setResetMessage('Password reset email sent! Check your inbox.');
      setResetEmail('');
      setTimeout(() => setShowForgotPassword(false), 2000);
    } catch (err) {
      setResetMessage('An error occurred. Please try again.');
      console.error('Forgot password error:', err);
    }
  };

  const resetForm = () => {
    setUserType(null);
    setEmployeeId('');
    setCustomerId('');
    setPassword('');
    setDepartment('');
    setError('');
    setShowForgotPassword(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>📬 Post Office Database</h2>
        <p className="subtitle">Login Portal</p>

        {!userType ? (
          // User Type Selection
          <div className="user-type-selection">
            <p className="user-type-prompt">Are you an Employee or Customer?</p>
            <div className="button-group">
              <button
                type="button"
                className="user-type-btn employee-btn"
                onClick={() => setUserType('employee')}
              >
                👔 Employee
              </button>
              <button
                type="button"
                className="user-type-btn customer-btn"
                onClick={() => setUserType('customer')}
              >
                👤 Customer
              </button>
            </div>
          </div>
        ) : !showForgotPassword ? (
          // Login Form
          <>
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}

              <button
                type="button"
                className="back-button-top"
                onClick={resetForm}
              >
                ← Back
              </button>

              <h3>{userType === 'employee' ? 'Employee Login' : 'Customer Login'}</h3>

              {userType === 'employee' ? (
                <>
                  <div className="form-group">
                    <label htmlFor="employeeId">Employee ID</label>
                    <input
                      type="text"
                      id="employeeId"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      required
                      placeholder="Enter your employee ID"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="department">Department</label>
                    <select
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                      className="form-select"
                    >
                      <option value="">Select your department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label htmlFor="customerId">Customer ID</label>
                  <input
                    type="text"
                    id="customerId"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                    placeholder="Enter your customer ID"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="rememberMe">Remember me</label>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="login-footer">
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot Password?
              </button>
              {userType === 'customer' && (
                <p className="signup-link">
                  Don't have an account? <Link to="/register">Sign up</Link>
                </p>
              )}
            </div>
          </>
        ) : (
          // Forgot Password Form
          <>
            <form onSubmit={handleForgotPassword}>
              <button
                type="button"
                className="back-button-top"
                onClick={() => setShowForgotPassword(false)}
              >
                ← Back
              </button>
              <h3>Reset Password</h3>
              {resetMessage && (
                <div className={resetMessage.includes('sent') ? 'success-message' : 'error-message'}>
                  {resetMessage}
                </div>
              )}
              <div className="form-group">
                <label htmlFor="resetEmail">Enter your email</label>
                <input
                  type="email"
                  id="resetEmail"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <button type="submit">Send Reset Email</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
