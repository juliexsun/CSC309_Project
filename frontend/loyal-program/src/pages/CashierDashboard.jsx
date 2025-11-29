import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { transactionAPI } from '../api';
import './CashierDashboard.css';

const CashierDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayCount: 0,
    todayPoints: 0,
    weekCount: 0,
    weekPoints: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const response = await transactionAPI.getTransactions({ 
        limit: 10,
        sortBy: 'createdAt', // FIX: sort by createdAt, not time
        order: 'desc'
      });
      
      const transactions = response.data?.results || response.data || [];
      setRecentTransactions(transactions);
      
      calculateStats(transactions);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (transactions) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let todayCount = 0;
    let todayPoints = 0;
    let weekCount = 0;
    let weekPoints = 0;

    transactions.forEach(tx => {
      // FIX: Use createdAt instead of time
      const txDate = new Date(tx.createdAt || tx.time);
      // FIX: Use amount instead of points
      const points = Math.abs(tx.amount || 0);

      if (txDate >= weekStart) {
        weekCount++;
        weekPoints += points;
      }

      if (txDate >= todayStart) {
        todayCount++;
        todayPoints += points;
      }
    });

    setStats({ todayCount, todayPoints, weekCount, weekPoints });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Cashier Dashboard</h1>
      
      <div className="welcome-section">
        <h2>Welcome, {user?.name || user?.utorid}</h2>
        <p className="role-badge">Cashier</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Today</h3>
          <div className="stat-value">{stats.todayCount}</div>
          <div className="stat-label">Transactions</div>
          <div className="stat-points">{stats.todayPoints} points awarded</div>
        </div>

        <div className="stat-card">
          <h3>Last 7 Days</h3>
          <div className="stat-value">{stats.weekCount}</div>
          <div className="stat-label">Transactions</div>
          <div className="stat-points">{stats.weekPoints} points awarded</div>
        </div>
      </div>

      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/cashier/create-purchase" className="action-btn">
            Create Purchase
          </Link>
          <Link to="/cashier/create-user" className="action-btn">
            Create User
          </Link>
          {/* <Link to="/cashier/scan" className="action-btn primary">
            Scan QR Code
          </Link> */}
          <Link to="/cashier/process-redemption" className="action-btn">
            Process Redemption
          </Link>
          {/* <Link to="/cashier/manual-award" className="action-btn">
            Manual Award
          </Link> */}
          <Link to="/cashier/transactions" className="action-btn">
            View All Transactions
          </Link>
        </div>
      </div>

      <div className="recent-transactions">
        <h2 className="section-title">Recent Transactions</h2>
        {recentTransactions.length === 0 ? (
          <p className="empty-message">No recent transactions</p>
        ) : (
          <div className="transactions-table-wrapper">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    {/* FIX: Use createdAt */}
                    <td>{formatDate(tx.createdAt || tx.time)}</td>
                    
                    {/* FIX: Use utorid directly */}
                    <td>{tx.utorid || (tx.user && tx.user.utorid) || 'Unknown'}</td>
                    
                    <td>
                      <span className={`type-badge ${tx.type}`}>
                        {tx.type ? tx.type.replace('_', ' ') : 'Unknown'}
                      </span>
                    </td>

                    {/* FIX: Use amount instead of points */}
                    <td className={tx.amount > 0 ? 'positive' : 'negative'}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashierDashboard;