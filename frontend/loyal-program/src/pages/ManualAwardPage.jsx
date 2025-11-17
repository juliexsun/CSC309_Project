import { useState } from 'react';
import { transactionAPI, userAPI } from '../api';
import './ManualAwardPage.css';

const ManualAwardPage = () => {
  const [utorid, setUtorid] = useState('');
  const [points, setPoints] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [searching, setSearching] = useState(false);

  const handleSearchUser = async () => {
    if (!utorid.trim()) {
      setError('Please enter a UTORid');
      return;
    }

    try {
      setSearching(true);
      setError('');
      setUserInfo(null);
      
      const response = await userAPI.getUserByUtorid(utorid);
      setUserInfo(response.data);
    } catch (err) {
      console.error('Error searching user:', err);
      setError(err.response?.data?.error || 'User not found');
      setUserInfo(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!userInfo) {
      setError('Please search for a valid user first');
      return;
    }

    if (!points || parseFloat(points) <= 0) {
      setError('Please enter a valid point amount');
      return;
    }

    try {
      setLoading(true);

      await transactionAPI.awardPoints({
        userId: userInfo.id,
        points: parseFloat(points),
        note: note.trim() || 'Manual points award'
      });

      setSuccess(true);
      setUtorid('');
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
      <h1 className="page-title">Manual Point Award</h1>

      <div className="manual-award-container">
        <div className="manual-award-card">
          <div className="card-header">
            <h2>Award Points by UTORid</h2>
            <p>Search for a user and manually award points</p>
          </div>

          {success && (
            <div className="success-banner">
              Points awarded successfully to {userInfo?.name || userInfo?.utorid}!
            </div>
          )}

          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          <div className="search-section">
            <div className="search-group">
              <label htmlFor="utorid">Search User by UTORid</label>
              <div className="search-input-wrapper">
                <input
                  id="utorid"
                  type="text"
                  value={utorid}
                  onChange={(e) => {
                    setUtorid(e.target.value);
                    setError('');
                    setUserInfo(null);
                  }}
                  placeholder="Enter UTORid (e.g., user1)"
                  disabled={loading || searching}
                />
                <button
                  type="button"
                  onClick={handleSearchUser}
                  disabled={loading || searching || !utorid.trim()}
                  className="search-btn"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {userInfo && (
              <div className="user-info-card">
                <h3>User Found</h3>
                <div className="user-details">
                  <p><strong>Name:</strong> {userInfo.name}</p>
                  <p><strong>UTORid:</strong> {userInfo.utorid}</p>
                  <p><strong>Current Points:</strong> {userInfo.points}</p>
                  <p><strong>Status:</strong> 
                    <span className={userInfo.verified ? 'verified' : 'unverified'}>
                      {userInfo.verified ? ' Verified' : ' Unverified'}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {userInfo && (
            <form onSubmit={handleSubmit} className="award-form">
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
                disabled={loading}
              >
                {loading ? 'Awarding Points...' : 'Award Points'}
              </button>
            </form>
          )}

          <div className="help-section">
            <h3>Instructions:</h3>
            <ol>
              <li>Enter the user's UTORid in the search box</li>
              <li>Click "Search" to find the user</li>
              <li>Review the user information displayed</li>
              <li>Enter the number of points to award</li>
              <li>Optionally add a note describing the reason</li>
              <li>Click "Award Points" to complete the transaction</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualAwardPage;
