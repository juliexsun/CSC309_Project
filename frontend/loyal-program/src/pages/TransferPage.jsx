import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transactionAPI } from '../api';
import { useAuth } from '../hooks/useAuth';
import './TransferPage.css';

const TransferPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    const transferAmount = parseInt(amount);
    const recipientUserId = parseInt(recipientId);

    if (!recipientId || isNaN(recipientUserId)) {
      setError('Please enter a valid recipient User ID.');
      return;
    }

    if (!amount || isNaN(transferAmount) || transferAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (transferAmount > (user?.points || 0)) {
      setError('Insufficient points. You only have ' + (user?.points || 0) + ' points.');
      return;
    }

    if (recipientUserId === user?.id) {
      setError('You cannot transfer points to yourself.');
      return;
    }

    try {
      setLoading(true);
      
      // Call transfer API
      await transactionAPI.createTransfer(recipientUserId, transferAmount);
      
      // Update user points locally
      const newPoints = (user?.points || 0) - transferAmount;
      updateUser({ points: newPoints });
      
      setSuccess(true);
      setRecipientId('');
      setAmount('');
      setRemark('');
      
      // Show success message for 2 seconds then redirect
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Error transferring points:', err);
      const errorMsg = err.response?.data?.error || 'Transfer failed. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Transfer Points</h1>

      <div className="transfer-content">
        <div className="transfer-card">
          <div className="current-balance">
            <h3>Your Current Balance</h3>
            <div className="balance-amount">{user?.points || 0} points</div>
          </div>

          {success ? (
            <div className="success-message">
              <div className="success-icon">Success</div>
              <h2>Transfer Successful!</h2>
              <p>Points have been transferred successfully.</p>
              <p className="redirect-notice">Redirecting to dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="transfer-form">
              <div className="form-group">
                <label htmlFor="recipientId">
                  Recipient User ID
                  <span className="required">*</span>
                </label>
                <input
                  id="recipientId"
                  type="number"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  placeholder="Enter recipient's User ID"
                  disabled={loading}
                  required
                />
                <span className="input-hint">
                  Enter the numeric User ID of the recipient
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="amount">
                  Amount
                  <span className="required">*</span>
                </label>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter points to transfer"
                  min="1"
                  max={user?.points || 0}
                  disabled={loading}
                  required
                />
                <span className="input-hint">
                  Maximum: {user?.points || 0} points
                </span>
              </div>

              <div className='form-group'>  
                <label htmlFor="remark">Remark</label>
                <input
                  id="remark"
                  type="text"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Enter a remark (optional)"
                  disabled={loading}
                />
                <span className="input-hint">
                  Add a note for this transfer (optional)
                </span>
              </div>

              {error && (
                <div className="error-banner">
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Transfer Points'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="transfer-info">
          <h3>📝 Important Information</h3>
          
          <div className="info-section">
            <h4>How to Transfer Points:</h4>
            <ol>
              <li>Ask the recipient for their User ID</li>
              <li>Enter the User ID in the form</li>
              <li>Specify the amount of points to transfer</li>
              <li>Confirm the transfer</li>
            </ol>
          </div>

          <div className="info-section">
            <h4>Things to Know:</h4>
            <ul>
              <li>Transfers are immediate and cannot be reversed</li>
              <li>You can only transfer points you currently have</li>
              <li>Minimum transfer amount is 1 point</li>
              <li>Both sender and recipient will see the transaction in their history</li>
            </ul>
          </div>

          <div className="info-section warning">
            <h4>⚠️ Warning:</h4>
            <p>
              Please double-check the recipient User ID before confirming. 
              Transfers cannot be undone once completed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferPage;
