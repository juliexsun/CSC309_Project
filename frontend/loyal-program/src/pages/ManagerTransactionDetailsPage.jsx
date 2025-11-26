import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api"; // your api index
import "./ManagerTransactionsPage.css"; 

const ManagerTransactionDetailsPage = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();

  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Adjustment form
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustRemark, setAdjustRemark] = useState("");

  const fetchTx = async () => {
    try {
      setLoading(true);
      const res = await api.transaction.getTransactionById(transactionId);
      setTx(res.data);
    } catch (err) {
      setError("Failed to load transaction.");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTx();
  }, [transactionId]);

  const handleMarkSuspicious = async () => {
    try {
      await api.transaction.updateSuspicious(transactionId, {
        suspicious: !tx.suspicious,
      });
      fetchTx(); // refresh
    } catch (err) {
      console.log(err);
      alert("Failed to update suspicious status.");
    }
  };

  const handleAdjustment = async () => {
    if (!adjustAmount) return alert("Enter adjustment amount.");

    try {
      await api.transaction.createAdjustment({
        utorid: tx.utorid,
        amount: Number(adjustAmount),
        remark: adjustRemark,
        relatedId: tx.id,
        type: "adjustment",
      });

      alert("Adjustment created!");
      setAdjustAmount("");
      setAdjustRemark("");
      fetchTx();
    } catch (err) {
      console.log(err);
      alert("Failed to create adjustment.");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        Loading transaction...
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">

      <button
        className="page-btn"
        style={{ marginBottom: "1.5rem" }}
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <h1 className="page-title">Transaction #{tx.id}</h1>

      {/* Transaction Details Card */}
      <div className="transactions-cards" style={{ display: "block" }}>
        <div className="transaction-card">
          <div className="transaction-card-header">
            <div className="transaction-card-id">
              Type: <span className={`type-badge ${tx.type}`}>{tx.type}</span>
            </div>

            <div
              className={
                tx.amount >= 0 ? "positive transaction-card-points" : "negative transaction-card-points"
              }
            >
              {tx.amount} pts
            </div>
          </div>

          <div className="transaction-card-body">
            <div className="transaction-card-row">
              <span className="transaction-card-label">User:</span>
              <span className="transaction-card-value">{tx.utorid}</span>
            </div>

            <div className="transaction-card-row">
              <span className="transaction-card-label">Created By:</span>
              <span className="transaction-card-value">{tx.createdBy}</span>
            </div>

            <div className="transaction-card-row">
              <span className="transaction-card-label">Related Tx:</span>
              <span className="transaction-card-value">
                {tx.relatedId || "None"}
              </span>
            </div>

            <div className="transaction-card-row">
              <span className="transaction-card-label">Remark:</span>
              <span className="transaction-card-value">{tx.remark || "—"}</span>
            </div>

            <div className="transaction-card-row">
              <span className="transaction-card-label">Suspicious:</span>
              <span className="transaction-card-value">
                {tx.suspicious ? "Yes 🚨" : "No"}
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* Suspicious Toggle */}
      <div style={{ marginTop: "1.5rem" }}>
        <button
          className="page-btn"
          style={{ background: tx.suspicious ? "#dc3545" : "#ffca28" }}
          onClick={handleMarkSuspicious}
        >
          {tx.suspicious ? "Unmark Suspicious" : "Mark Suspicious"}
        </button>
      </div>


      {/* Adjustment Form */}
      <div
        style={{
          marginTop: "2rem",
          background: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          padding: "1.5rem",
        }}
      >
        <h2 style={{ marginBottom: "1rem", color: "#333" }}>
          Create Adjustment
        </h2>

        <div className="filter-group">
          <label>Amount:</label>
          <input
            type="number"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "6px",
              border: "1px solid #ddd",
            }}
          />
        </div>

        <div className="filter-group" style={{ marginTop: "1rem" }}>
          <label>Remark:</label>
          <input
            type="text"
            value={adjustRemark}
            onChange={(e) => setAdjustRemark(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "6px",
              border: "1px solid #ddd",
              width: "100%",
            }}
          />
        </div>

        <button
          className="page-btn"
          style={{ marginTop: "1.5rem" }}
          onClick={handleAdjustment}
        >
          Submit Adjustment
        </button>
      </div>
    </div>
  );
};

export default ManagerTransactionDetailsPage;
