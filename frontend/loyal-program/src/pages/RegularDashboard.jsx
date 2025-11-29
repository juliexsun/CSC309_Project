import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { userAPI, transactionAPI } from '../api';
import './RegularDashboard.css';

const RegularDashboard = () => {
  const { user, updateUser } = useAuth();
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch updated user info to get latest points
        const userResponse = await userAPI.getMe();
        updateUser(userResponse.data);

        // Fetch recent transactions (limit to 10)
        const transactionsResponse = await transactionAPI.getMyTransactions({
          limit: 10,
          sort: 'createdAt_desc'
        });
        setRecentTransactions(transactionsResponse.data.results || []);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove updateUser from dependencies to prevent infinite loop

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

  const getTransactionTypeLabel = (type) => {
    const labels = {
      purchase: 'Purchase',
      redemption: 'Redemption',
      adjustment: 'Adjustment',
      event: 'Event',
      transfer: 'Transfer'
    };
    return labels[type] || type;
  };

  const getTransactionClass = (amount) => {
    return amount > 0 ? 'transaction-positive' : 'transaction-negative';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">My Dashboard</h1>
      
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* Points Card */}
      <div className="points-card">
        <div className="points-header">
          <h2>Available Points</h2>
          <p className="user-greeting">Hello, <strong>{user?.name}</strong>!</p>
        </div>
        <div className="points-value">
          {user?.points || 0}
        </div>
        <div className="points-footer">
          <span className={user?.verified ? 'verified' : 'unverified'}>
            {user?.verified ? 'Verified Account' : 'Unverified Account'}
          </span>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="recent-transactions">
        <h2 className="section-title">Recent Transactions</h2>
        
        {recentTransactions.length === 0 ? (
          <div className="empty-state">
            <p>You don't have any transactions yet.</p>
            <p>Start earning points by making purchases or participating in events!</p>
          </div>
        ) : (
          <div className="transactions-list">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="transaction-item">
                <div className="transaction-info">
                  <span className="transaction-type">
                    {getTransactionTypeLabel(transaction.type)}
                  </span>
                  <span className="transaction-date">
                    {formatDate(transaction.createdAt)}
                  </span>
                  {transaction.remark && (
                    <span className="transaction-remark">
                      {transaction.remark}
                    </span>
                  )}
                </div>
                <div className={`transaction-amount ${getTransactionClass(transaction.amount)}`}>
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                </div>
              </div>
            ))}
          </div>
        )}

        {recentTransactions.length > 0 && (
          <div className="view-all-link">
            <Link to="/transactions">View All Transactions →</Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/events" className="action-btn">
            Browse Events
          </Link>
          <Link to="/promotions" className="action-btn">
            View Promotions
          </Link>
          <Link to="/redemptions/create" className="action-btn">
            Create Redemption
          </Link>
          <Link to="/transfer" className="action-btn">
            Transfer Points
          </Link>
          <Link to="/my-qr" className="action-btn">
            My QR Code
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegularDashboard;
