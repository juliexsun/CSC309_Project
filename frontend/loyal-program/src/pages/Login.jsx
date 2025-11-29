import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { authAPI, userAPI } from "../api";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [utorid, setUtorid] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1: Login to get token
      const loginResponse = await authAPI.login(utorid, password);
      const { token } = loginResponse.data;

      // Step 2: Use token to get user info
      // Temporarily set token in localStorage so apiClient can use it
      localStorage.setItem('auth', JSON.stringify({ token, user: null }));
      
      const userResponse = await userAPI.getMe();
      const userData = userResponse.data;

      // Step 3: Save complete auth data using AuthContext
      login(userData, token);

      // Step 4: Navigate based on user role
      switch (userData.role) {
        case 'regular':
          navigate('/dashboard');
          break;
        case 'cashier':
          navigate('/cashier');
          break;
        case 'manager':
        case 'superuser':
          navigate('/manager');
          break;
        default:
          navigate('/dashboard');
      }

    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(errorMsg);
      localStorage.removeItem('auth');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">CSSU Loyalty Program</h1>
        <h2 className="login-subtitle">Login</h2>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="utorid">UTORid</label>
            <input
              id="utorid"
              type="text"
              value={utorid}
              onChange={(e) => setUtorid(e.target.value)}
              placeholder="Enter your UTORid"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              required
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-links">
          
          <button 
            type="button" 
            className="link-button" 
            onClick={() => navigate('/reset-password')}
          >
            Reset Password
          </button>
        </div>

        <div className="login-help">
          <p className="help-text">
            <strong>Test Accounts:</strong>
          </p>
          <p className="help-text">Regular: user1 / Password123!</p>
          <p className="help-text">Cashier: cashier1 / Password123!</p>
          <p className="help-text">Manager: manager1 / Password123!</p>
          <p className="help-text">Superuser: superuser1 / Password123!</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
