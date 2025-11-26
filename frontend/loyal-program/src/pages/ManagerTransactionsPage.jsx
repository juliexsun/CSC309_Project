import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { transactionAPI } from "../api";
import "./ManagerTransactionsPage.css";

const ManagerTransactionsPage = () => {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    type: "",
    sortBy: "amount",
    order: "desc",
    page: 1,
    limit: 20,
  });

  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  // Fetch ALL transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        offset: (filters.page - 1) * filters.limit,
      };

      if (!params.type) delete params.type;

      const response = await transactionAPI.getTransactions(params);

      const raw = response.data?.results || [];
      const count = response.data?.count || raw.length;

      // Convert backend schema → frontend UI schema
      const results = raw.map((t) => ({
        id: t.id,
        utorid: t.utorid,
        amount: t.amount,
        spent: t.spent,
        type: t.type,
        redeemed: t.type === "redemption" ? t.amount : undefined,
        suspicious: t.suspicious,
        remark: t.remark || "",
        promotionIds: t.promotions?.map((p) => p.id) || [],
        relatedId: t.relatedId,
        createdBy: t.createdBy?.utorid,
      }));

      setTransactions(results);
      setTotalCount(count);
    } catch (err) {
      console.error(err);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === "page" ? value : 1,
    }));
  };

  const formatDate = (ts) => {
    return new Date(ts).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const totalPages = Math.ceil(totalCount / filters.limit);

  return (
    <div className="page-container">
      <h1 className="page-title">All Transactions</h1>

      {/* --- FILTER BAR --- */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Type:</label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
          >
            <option value="">All Types</option>
            <option value="purchase">Purchase</option>
            <option value="redemption">Redemption</option>
            <option value="adjustment">Adjustment</option>
            <option value="event">Event</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort by:</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          >
            <option value="amount">Amount</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Order:</label>
          <select
            value={filters.order}
            onChange={(e) => handleFilterChange("order", e.target.value)}
          >
            <option value="desc">Highest</option>
            <option value="asc">Lowest</option>
          </select>
        </div>
      </div>

      {/* ERROR */}
      {error && <div className="error-banner">{error}</div>}

      {/* LOADING */}
      {loading ? (
        <div className="loading-container">
          <p>Loading transactions...</p>
        </div>
      ) : (
        <>
          <div className="results-info">
            Showing {transactions.length} of {totalCount}
          </div>

          {/* EMPTY STATE */}
          {transactions.length === 0 ? (
            <div className="empty-state">No transactions found</div>
          ) : (
            <>
              {/* TABLE */}
              <div className="transactions-table-wrapper">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Type</th>
                      <th>Points</th>
                      <th>Suspicious</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        onClick={() => navigate(`/manager/transactions/${tx.id}`)}
                        className="clickable-row"
                      >
                        <td>#{tx.id}</td>
                        <td>{tx.utorid}</td>
                        <td>
                          <span className={`type-badge ${tx.type}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={tx.amount >= 0 ? "positive" : "negative"}>
                          {tx.amount >= 0 ? "+" : ""}
                          {tx.amount}
                        </td>
                        <td>{tx.suspicious ? "⚠️ Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    disabled={filters.page === 1}
                    onClick={() => handleFilterChange("page", filters.page - 1)}
                  >
                    Previous
                  </button>

                  <span>
                    Page {filters.page} of {totalPages}
                  </span>

                  <button
                    disabled={filters.page >= totalPages}
                    onClick={() => handleFilterChange("page", filters.page + 1)}
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

export default ManagerTransactionsPage;
