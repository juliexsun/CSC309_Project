import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api";
import "./ResetPasswordPage.css";

const ResetPasswordPage = () => {
  const navigate = useNavigate();

  const [utorid, setUtorid] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    
    try {
      // TODO: Integrate with backend API to send verification code
      console.log("in frontend", email);
      await authAPI.requestReset(utorid, email);
      
      setCodeSent(true);
      setSuccess("Verification code sent to your email!");
    } catch (err) {
      console.error('Send code error:', err);
      setError(err.response?.data?.error || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!utorid || !newPassword || !email || !verificationCode) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    if (!codeSent) {
      setError("Please send and verify the email verification code first");
      return;
    }

    setLoading(true);

    try {
      // TODO: Integrate with backend API for password reset
      await authAPI.performReset(
        verificationCode, // resetToken
        utorid,
        newPassword
      );
      
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess("Password reset successful! Redirecting to login...");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.error || 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-box">
        <h1 className="reset-password-title">CSSU Loyalty Program</h1>
        <h2 className="reset-password-subtitle">Reset Password</h2>

        <form onSubmit={handleResetPassword} className="reset-password-form">
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
            <label htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password (min 8 characters)"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="verification-code">Email Verification Code</label>
            <div className="verification-group">
              <input
                id="verification-code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter verification code"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={handleSendCode}
                className="send-code-button"
                disabled={loading || !email}
              >
                {codeSent ? 'Resend Code' : 'Get Code'}
              </button>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <button type="submit" className="reset-password-button" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="back-to-login">
          <button
            type="button"
            className="link-button"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
