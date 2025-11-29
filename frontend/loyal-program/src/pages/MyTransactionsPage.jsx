import { useState, useEffect } from 'react';
import { transactionAPI } from '../api';
import './MyTransactionsPage.css';

const MyTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 15;
  
  // Filter state
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('createdAt_desc'); // Default sort
  const [remarkSearch, setRemarkSearch] = useState(''); // Search state

  // Debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 500); // 500ms delay for typing

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterType, sortOrder, remarkSearch]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sort: sortOrder
      };
      
      if (filterType !== 'all') {
        params.type = filterType;
      }
      
      // Add search param if it exists
      if (remarkSearch.trim()) {
        params.remark = remarkSearch;
      }

      const response = await transactionAPI.getMyTransactions(params);
      setTransactions(response.data.results || []);
      
      // Calculate total pages
      const total = response.data.count || 0;
      setTotalPages(Math.ceil(total / itemsPerPage) || 1);
      
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again later.');
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
    return amount > 0 ? 'amount-positive' : 'amount-negative';
  };

  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
    setCurrentPage(1); // Reset to first page when sort changes
  };
  
  const handleSearchChange = (e) => {
    setRemarkSearch(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
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
      <h1 className="page-title">My Transactions</h1>

      {/* Filters */}
      <div className="filters-bar">
        {/* Search Input */}
        <div className="filter-group">
          <label htmlFor="remarkSearch">Search:</label>
          <input
            id="remarkSearch"
            type="text"
            value={remarkSearch}
            onChange={handleSearchChange}
            placeholder="Search by remark..."
            className="filter-input" // You might need to add this class to CSS or reuse existing input styles
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '0.95rem' }}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="typeFilter">Type:</label>
          <select 
            id="typeFilter"
            value={filterType} 
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="purchase">Purchase</option>
            <option value="redemption">Redemption</option>
            <option value="transfer">Transfer</option>
            <option value="adjustment">Adjustment</option>
            <option value="event">Event</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sortOrder">Sort:</label>
          <select 
            id="sortOrder"
            value={sortOrder} 
            onChange={handleSortChange}
            className="filter-select"
          >
            <option value="createdAt_desc">Date (Newest)</option>
            <option value="createdAt_asc">Date (Oldest)</option>
            <option value="amount_desc">Amount (High-Low)</option>
            <option value="amount_asc">Amount (Low-High)</option>
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
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions found.</p>
          {(filterType !== 'all' || remarkSearch) && (
            <p>Try changing the filters or search to see more results.</p>
          )}
        </div>
      ) : (
        <>
          {/* Transactions Table (Desktop) */}
          <div className="transactions-table-container">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Spent</th>
                  <th>Remark</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="date-cell">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td>
                      <span className={`type-badge type-${transaction.type}`}>
                        {getTransactionTypeLabel(transaction.type)}
                      </span>
                    </td>
                    <td className={getTransactionClass(transaction.amount)}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                    </td>
                    <td className="spent-cell">
                      {transaction.spent ? `$${transaction.spent.toFixed(2)}` : '-'}
                    </td>
                    <td className="remark-cell">
                      {transaction.remark || '-'}
                    </td>
                    <td>
                      <div className="status-indicators">
                        {transaction.processed && (
                          <span className="status-badge processed">Processed</span>
                        )}
                        {transaction.suspicious && (
                          <span className="status-badge suspicious">Suspicious</span>
                        )}
                        {!transaction.processed && !transaction.suspicious && (
                          <span className="status-badge normal">Normal</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Transactions Cards (Mobile) */}
          <div className="transactions-cards">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="transaction-card">
                <div className="transaction-card-header">
                  <span className={`type-badge type-${transaction.type}`}>
                    {getTransactionTypeLabel(transaction.type)}
                  </span>
                  <span className={`transaction-card-amount ${getTransactionClass(transaction.amount)}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                  </span>
                </div>
                <div className="transaction-card-body">
                  <div className="transaction-card-row">
                    <span className="transaction-card-label">Date:</span>
                    <span className="transaction-card-value">{formatDate(transaction.createdAt)}</span>
                  </div>
                  {transaction.spent && (
                    <div className="transaction-card-row">
                      <span className="transaction-card-label">Spent:</span>
                      <span className="transaction-card-value">${transaction.spent.toFixed(2)}</span>
                    </div>
                  )}
                  {transaction.remark && (
                    <div className="transaction-card-row">
                      <span className="transaction-card-label">Remark:</span>
                      <span className="transaction-card-value">{transaction.remark}</span>
                    </div>
                  )}
                  <div className="transaction-card-row">
                    <span className="transaction-card-label">Status:</span>
                    <div className="status-indicators">
                      {transaction.processed && (
                        <span className="status-badge processed">Processed</span>
                      )}
                      {transaction.suspicious && (
                        <span className="status-badge suspicious">Suspicious</span>
                      )}
                      {!transaction.processed && !transaction.suspicious && (
                        <span className="status-badge normal">Normal</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
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
        </>
      )}
    </div>
  );
};

export default MyTransactionsPage;