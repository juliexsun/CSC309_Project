import { useState } from 'react';
import { transactionAPI } from '../api';
import './ScanQRPage.css';

const ScanQRPage = () => {
  const [qrInput, setQrInput] = useState('');
  const [points, setPoints] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const handleQrInput = (e) => {
    setQrInput(e.target.value);
    setError('');
    setSuccess(false);
    
    try {
      const data = JSON.parse(e.target.value);
      if (data.type === 'user' && data.userId) {
        setUserInfo(data);
      }
    } catch (err) {
      setUserInfo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!qrInput.trim()) {
      setError('Please scan or enter QR code data');
      return;
    }

    if (!points || parseFloat(points) <= 0) {
      setError('Please enter a valid point amount');
      return;
    }

    try {
      setLoading(true);
      
      const qrData = JSON.parse(qrInput);
      
      if (qrData.type !== 'user' || !qrData.userId) {
        setError('Invalid QR code format');
        return;
      }

      await transactionAPI.awardPoints({
        userId: qrData.userId,
        points: parseFloat(points),
        note: note.trim() || 'Points awarded via QR scan'
      });

      setSuccess(true);
      setQrInput('');
      setPoints('');
      setNote('');
      setUserInfo(null);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('Error awarding points:', err);
      setError(err.response?.data?.error || 'Failed to award points. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Scan QR Code</h1>

      <div className="scan-container">
        <div className="scan-card">
          <div className="scan-header">
            <h2>Award Points via QR Code</h2>
            <p>Scan the user's QR code to award points</p>
          </div>

          {success && (
            <div className="success-banner">
              Points awarded successfully!
            </div>
          )}

          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="scan-form">
            <div className="form-group">
              <label htmlFor="qrInput">QR Code Data</label>
              <textarea
                id="qrInput"
                value={qrInput}
                onChange={handleQrInput}
                placeholder='Paste QR code data here (e.g., {"type":"user","userId":1,"utorid":"user1"})'
                rows={4}
                disabled={loading}
                required
              />
              <p className="field-hint">
                In a real app, this would use camera scanning. For now, paste the QR code JSON data.
              </p>
            </div>

            {userInfo && (
              <div className="user-info-card">
                <h3>User Information</h3>
                <p><strong>UTORid:</strong> {userInfo.utorid}</p>
                <p><strong>User ID:</strong> {userInfo.userId}</p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="points">Points to Award</label>
              <input
                id="points"
                type="number"
                min="1"
                step="1"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="Enter points amount"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="note">Note (Optional)</label>
              <input
                id="note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for this transaction"
                disabled={loading}
                maxLength={200}
              />
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading || !userInfo}
            >
              {loading ? 'Awarding Points...' : 'Award Points'}
            </button>
          </form>

          <div className="help-section">
            <h3>How to use:</h3>
            <ol>
              <li>Ask the user to show their QR code from "My QR Code" page</li>
              <li>In a real app, scan it with camera. For testing, copy and paste the QR data</li>
              <li>Enter the number of points to award</li>
              <li>Optionally add a note</li>
              <li>Click "Award Points" to complete the transaction</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanQRPage;
