import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { transactionAPI } from '../api';
import './CashierCreatePurchasePage.css';

const CashierCreatePurchase = () => {
  const { user } = useAuth();

  const [qrInput, setQrInput] = useState('');
  const [spent, setSpent] = useState('');
  const [promotionIdsText, setPromotionIdsText] = useState('');
  const [remark, setRemark] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdTx, setCreatedTx] = useState(null);

  const handleQrInput = (e) => {
    const value = e.target.value;
    setQrInput(value);
    setError('');
    setSuccess(false);
    setCreatedTx(null);

    try {
      const data = JSON.parse(value);
      if (data.type === 'user' && data.userId && data.utorid) {
        setUserInfo(data);
      } else {
        setUserInfo(null);
      }
    } catch {
      setUserInfo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setCreatedTx(null);

    if (!qrInput.trim()) {
      setError('Please scan or enter user QR code data.');
      return;
    }
    if (!userInfo || userInfo.type !== 'user') {
      setError('Invalid user QR code format.');
      return;
    }
    if (!spent || Number.isNaN(parseFloat(spent)) || parseFloat(spent) <= 0) {
      setError('Please enter a valid amount spent (must be > 0).');
      return;
    }

    let promotionIds = [];
    if (promotionIdsText.trim()) {
      try {
        promotionIds = promotionIdsText
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p !== '')
          .map((p) => {
            const n = Number(p);
            if (Number.isNaN(n) || n <= 0) {
              throw new Error('invalid promotion id');
            }
            return n;
          });
      } catch {
        setError('Promotion IDs must be positive numbers separated by commas.');
        return;
      }
    }

    try {
      setLoading(true);

      const qrData = JSON.parse(qrInput);
      if (qrData.type !== 'user' || !qrData.utorid) {
        setError('Invalid user QR code format.');
        return;
      }

      const payload = {
        utorid: qrData.utorid,
        type: 'purchase',
        spent: parseFloat(spent),
        remark: remark.trim(),
      };

      if (promotionIds.length > 0) {
        payload.promotionIds = promotionIds;
      }

      const res = await transactionAPI.createPurchase(payload);
      console.log("res:", res);

      setSuccess(true);
      setCreatedTx(res);
      setSpent('');
      setPromotionIdsText('');
      setRemark('');
      setQrInput('');
      setUserInfo(null);   

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Error creating purchase:', err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to create purchase. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Create Purchase</h1>

      <div className="scan-container">
        <div className="scan-card">
          <div className="scan-header">
            <h2>Scan User & Create Purchase</h2>
            <p>
              Scan the user QR to identify the customer, then enter the purchase
              amount and optional promotions.
            </p>
            <p className="logged-in-text">
              Logged in as: <strong>{user?.name}</strong> (cashier)
            </p>
          </div>

          {success && (
            <div className="success-banner">
              Purchase created successfully!
              {createdTx && (
                <span className="transaction-summary">
                  {' '}
                  (Transaction id #{createdTx.data.id}, earned {createdTx.data.earned} points)
                </span>
              )}
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="scan-form">
            {/* QR code input */}
            <div className="form-group">
              <label htmlFor="qrInput">User QR Code Data</label>
              <textarea
                id="qrInput"
                value={qrInput}
                onChange={handleQrInput}
                placeholder='Paste user QR code data here (e.g., {"type":"user","userId":1,"utorid":"user1"})'
                rows={4}
                disabled={loading}
                required
              />
              <p className="field-hint">
                In a real app, this would use camera scanning. For now, copy
                the QR JSON from the user side and paste it here.
              </p>
            </div>

            {/* Display parsed user information */}
            {userInfo && (
              <div className="user-info-card">
                <h3>Customer Information</h3>
                <p>
                  <strong>UTORid:</strong> {userInfo.utorid}
                </p>
                <p>
                  <strong>User ID:</strong> {userInfo.userId}
                </p>
              </div>
            )}

            {/* Amount Spent */}
            <div className="form-group">
              <label htmlFor="spent">Amount Spent ($)</label>
              <input
                id="spent"
                type="number"
                min="0.01"
                step="0.01"
                value={spent}
                onChange={(e) => setSpent(e.target.value)}
                placeholder="Enter amount spent"
                disabled={loading}
                required
              />
              <p className="field-hint">
                Points are awarded by backend (default 1 point per $0.25, plus
                any promotions).
              </p>
            </div>

            {/* Promotion IDs */}
            <div className="form-group">
              <label htmlFor="promotions">Promotion IDs (optional)</label>
              <input
                id="promotions"
                type="text"
                value={promotionIdsText}
                onChange={(e) => setPromotionIdsText(e.target.value)}
                placeholder="e.g., 3, 5, 42"
                disabled={loading}
              />
              <p className="field-hint">
                Comma-separated promotion IDs to apply. Leave blank if no
                promotions.
              </p>
            </div>

            {/* Remark */}
            <div className="form-group">
              <label htmlFor="remark">Remark (optional)</label>
              <input
                id="remark"
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Add a note for this purchase"
                disabled={loading}
                maxLength={200}
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !userInfo}
            >
              {loading ? 'Processing...' : 'Create Purchase'}
            </button>
          </form>

          <div className="help-section">
            <h3>How to use</h3>
            <ol>
              <li>Ask the user to open their “My QR Code” page.</li>
              <li>Copy the QR JSON and paste it into the box above.</li>
              <li>Enter the amount spent and any promotion IDs.</li>
              <li>Optionally enter a remark (e.g., “Bought 3 drinks”).</li>
              <li>Click “Create Purchase” to send a POST /transactions request.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierCreatePurchase;
