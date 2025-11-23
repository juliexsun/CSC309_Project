import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { transactionAPI } from '../api';
import './MyRedemptionsPage.css';

const MyRedemptionsPage = () => {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRedemption, setSelectedRedemption] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchRedemptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchRedemptions = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await transactionAPI.getMyTransactions({
        type: 'redemption',
        page: currentPage,
        limit: itemsPerPage,
        sort: 'createdAt_desc'
      });

       
      setRedemptions(response.data.results || []);

      const total = response.data.count || 0;
      setTotalPages(Math.ceil(total / itemsPerPage) || 1);

    } catch (err) {
      console.error('Error fetching redemptions:', err);
      setError('Failed to load redemption requests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleShowQR = (redemption) => {
    setSelectedRedemption(redemption);
  };

  const handleCloseQR = () => {
    setSelectedRedemption(null);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Redemption Requests</h1>
        <Link to="/redemptions/create" className="btn-create">
          + Create New Request
        </Link>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <p>Loading redemption requests...</p>
        </div>
      ) : redemptions.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any redemption requests yet.</p>
          <p>Create a request to exchange your points for rewards!</p>
          <Link to="/redemptions/create" className="btn-primary">
            Create Redemption Request
          </Link>
        </div>
      ) : (
        <>
          <div className="redemptions-grid">
            {redemptions.map((redemption) => (
              <div key={redemption.id} className="redemption-card">
                <div className="redemption-header">
                  <span className="redemption-id">Redemption Request #{redemption.id}</span>
                  <span className={`status-badge ${redemption.processed ? 'processed' : 'pending'}`}>
                    {redemption.processed ? 'Processed' : 'Pending'}
                  </span>
                </div>
                
                <div className="redemption-body">
                  <div className="redemption-info">
                    <div className="info-row">
                      <span className="label">Points:</span>
                      <span className="value points-value">{redemption.amount}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Created:</span>
                      <span className="value">{new Date(redemption.createdAt).toLocaleString()}</span>
                    </div>
                    {redemption.remark && (
                      <div className="info-row">
                        <span className="label">Remark:</span>
                        <span className="value">{redemption.remark}</span>
                      </div>
                    )}
                  </div>

                  {!redemption.processed && (
                    <button
                      onClick={() => handleShowQR(redemption)}
                      className="btn-show-qr"
                    >
                      Show QR Code
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Previous
              </button>
              
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              
              <button 
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* QR Code Modal */}
      {selectedRedemption && (
        <div className="qr-modal-overlay" onClick={handleCloseQR}>
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="qr-modal-close" onClick={handleCloseQR}>×</button>
            
            <h2>Redemption Request QR Code</h2>
            <p className="qr-instructions">
              Show this QR code to a cashier to complete your redemption.
            </p>

            <div className="qr-code-container">
              <QRCodeSVG
                value={JSON.stringify({
                  type: 'redemption',
                  requestId: selectedRedemption.id,
                  amount: selectedRedemption.amount
                })}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="qr-details">
              <p><strong>Request ID:</strong> {selectedRedemption.id}</p>
              <p><strong>Points to Redeem:</strong> {selectedRedemption.amount}</p>
              {selectedRedemption.remark && (
                <p><strong>Remark:</strong> {selectedRedemption.remark}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRedemptionsPage;
