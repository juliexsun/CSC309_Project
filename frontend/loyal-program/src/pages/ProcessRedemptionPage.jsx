// frontend/src/pages/ProcessRedemption.jsx
import { useState } from 'react';
import { transactionAPI } from '../api';
import './ScanQRPage.css';

const ProcessRedemption = () => {
  const [qrInput, setQrInput] = useState('');
  const [redemptionInfo, setRedemptionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleQrInput = (e) => {
    const value = e.target.value;
    setQrInput(value);
    setError('');
    setSuccess(false);

    try {
      const data = JSON.parse(value);

      // only accept redemption QR code format
      if (data.type === 'redemption' && data.requestId && data.amount) {
        setRedemptionInfo({
          requestId: data.requestId,
          amount: data.amount,
        });
      } else {
        setRedemptionInfo(null);
      }
    } catch (err) {
      // Clear info if JSON is invalid
      setRedemptionInfo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!qrInput.trim()) {
      setError('Please scan or enter redemption QR code data');
      return;
    }

    let qrData;
    try {
      qrData = JSON.parse(qrInput);
    } catch (err) {
      setError('Invalid QR code format (must be valid JSON)');
      return;
    }

    if (qrData.type !== 'redemption' || !qrData.requestId) {
      setError('Invalid redemption QR code');
      return;
    }

    try {
      setLoading(true);

      // Call backend to process redemption (PATCH /transactions/:id/processed)
      await transactionAPI.processRedemption(qrData.requestId,{ processed: true });

      setSuccess(true);
      setQrInput('');
      setRedemptionInfo(null);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error processing redemption:', err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to process redemption. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Process Redemption</h1>

      <div className="scan-container">
        <div className="scan-card">
          <div className="scan-header">
            <h2>Scan Redemption QR Code</h2>
            <p>
              Scan a redemption request QR code to process a pending redemption.
            </p>
          </div>

          {success && (
            <div className="success-banner">
              Redemption processed successfully!
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="scan-form">
            <div className="form-group">
              <label htmlFor="qrInput">QR Code Data</label>
              <textarea
                id="qrInput"
                value={qrInput}
                onChange={handleQrInput}
                placeholder='Paste redemption QR data here (e.g., {"type":"redemption","requestId":48,"amount":100})'
                rows={4}
                disabled={loading}
                required
              />
              <p className="field-hint">
                In a real app, this would use camera scanning. For now, paste the
                redemption QR code JSON data.
              </p>
            </div>

            {redemptionInfo && (
              <div className="user-info-card redemption-info">
                <h3>Redemption Request</h3>
                <p>
                  <strong>Request ID:</strong> {redemptionInfo.requestId}
                </p>
                <p>
                  <strong>Points to Redeem:</strong> {redemptionInfo.amount}
                </p>
                <p className="warning-text">
                  Click &quot;Process Redemption&quot; to complete this request.
                </p>
              </div>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !redemptionInfo}
            >
              {loading ? 'Processing...' : 'Process Redemption'}
            </button>
          </form>

          <div className="help-section">
            <h3>How to use:</h3>
            <ol>
              <li>
                Ask the user to show their <strong>redemption request QR code</strong>{' '}
                from their account.
              </li>
              <li>
                Scan it with a camera, or for testing, copy and paste the QR data
                into the text area.
              </li>
              <li>Verify the request details (request ID and points).</li>
              <li>Click &quot;Process Redemption&quot; to complete.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessRedemption;
