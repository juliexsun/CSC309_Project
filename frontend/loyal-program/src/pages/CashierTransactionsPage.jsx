import { useState, useEffect } from 'react';
import { transactionAPI } from '../api';
import './CashierTransactionsPage.css';

const CashierTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    sortBy: 'time',
    order: 'desc',
    page: 1,
    limit: 20
  });
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        ...filters,
        offset: (filters.page - 1) * filters.limit
      };
      
      if (!params.type) {
        delete params.type;
      }
      
      const response = await transactionAPI.getTransactions(params);
      const data = response.data?.results || response.data || [];
      const count = response.data?.count || data.length;
      
      setTransactions(data);
      setTotalCount(count);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(totalCount / filters.limit);

  return (
    <div className="page-container">
      <h1 className="page-title">Transaction History</h1>

      <div className="filters-bar">
        <div className="filter-group">
          <label htmlFor="type-filter">Type:</label>
          <select
            id="type-filter"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="award">Award</option>
            <option value="purchase">Purchase</option>
            <option value="transfer_in">Transfer In</option>
            <option value="transfer_out">Transfer Out</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sort-filter">Sort by:</label>
          <select
            id="sort-filter"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="time">Date</option>
            <option value="points">Points</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="order-filter">Order:</label>
          <select
            id="order-filter"
            value={filters.order}
            onChange={(e) => handleFilterChange('order', e.target.value)}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <p>Loading transactions...</p>
        </div>
      ) : (
        <>
          <div className="results-info">
            <p>Showing {transactions.length} of {totalCount} transactions</p>
          </div>

          {transactions.length === 0 ? (
            <div className="empty-state">
              <p>No transactions found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="transactions-table-wrapper">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Date & Time</th>
                      <th>User</th>
                      <th>Type</th>
                      <th>Points</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>#{tx.id}</td>
                        <td>{formatDate(tx.createdAt || tx.time)}</td>
                        
                        <td>{tx.utorid || (tx.user && tx.user.utorid) || `User #${tx.userId}`}</td>
                        
                        <td>
                          <span className={`type-badge ${tx.type}`}>
                            {tx.type ? tx.type.replace('_', ' ') : 'Unknown'}
                          </span>
                        </td>
                        
                        <td className={tx.amount > 0 ? 'positive' : 'negative'}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </td>
                        
                        <td className="note-cell">{tx.remark || tx.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="transactions-cards">
                {transactions.map((tx) => (
                  <div key={tx.id} className="transaction-card">
                    <div className="transaction-card-header">
                      <span className="transaction-card-id">#{tx.id}</span>
                      <span className={`transaction-card-points ${tx.amount > 0 ? 'positive' : 'negative'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                    </div>
                    <div className="transaction-card-body">
                      <div className="transaction-card-row">
                        <span className="transaction-card-label">Type:</span>
                        <span className={`type-badge ${tx.type}`}>
                          {tx.type ? tx.type.replace('_', ' ') : 'Unknown'}
                        </span>
                      </div>
                      <div className="transaction-card-row">
                        <span className="transaction-card-label">User:</span>
                        <span className="transaction-card-value">
                          {tx.utorid || (tx.user && tx.user.utorid) || `User #${tx.userId}`}
                        </span>
                      </div>
                      <div className="transaction-card-row">
                        <span className="transaction-card-label">Date:</span>
                        <span className="transaction-card-value">{formatDate(tx.createdAt || tx.time)}</span>
                      </div>
                      {(tx.remark || tx.note) && (
                        <div className="transaction-card-row">
                          <span className="transaction-card-label">Note:</span>
                          <span className="transaction-card-value">{tx.remark || tx.note}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handleFilterChange('page', filters.page - 1)}
                    disabled={filters.page === 1}
                    className="page-btn"
                  >
                    Previous
                  </button>
                  
                  <span className="page-info">
                    Page {filters.page} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => handleFilterChange('page', filters.page + 1)}
                    disabled={filters.page >= totalPages}
                    className="page-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CashierTransactionsPage;