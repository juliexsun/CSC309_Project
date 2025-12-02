// DonateFloatingButton.jsx
import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import "./DonateFloatingButton.css";

const stripePromise = loadStripe("pk_test_51SXZA1AGBUTh8H95J53pxwo3UqpclY2um3gHPwMzX1p2htlITcDAKqWMZ8InLMeoF8mbN4CxAiVBA5r3YOpLOo7O00euXeTIaP");
// NOTE: publishable key is safe to be in the frontend

export default function DonateFloatingButton() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(1000); // cents, default $10
  const [custom, setCustom] = useState(""); // dollars string
  const [loading, setLoading] = useState(false);
  const preset = [500, 1000, 2500, 5000]; // cents

  const openModal = () => setOpen(true);
  const closeModal = () => {
    setOpen(false);
    setCustom("");
  };

  const setPreset = (cents) => {
    setAmount(cents);
    setCustom("");
  };

  const handleCustomChange = (e) => {
    const v = e.target.value;
    // allow only digits and optional decimal
    if (/^\d*\.?\d{0,2}$/.test(v) || v === "") {
      setCustom(v);
    }
  };

  const createCheckout = async () => {
    setLoading(true);
    try {
      const finalAmountCents = custom ? Math.round(parseFloat(custom) * 100) : amount;
      if (!finalAmountCents || finalAmountCents <= 0) {
        alert("Enter a valid donation amount");
        setLoading(false);
        return;
      }

      // Call your backend to create a Checkout Session
      // endpoint: POST /api/stripe/create-checkout-session
      // send amount in cents and optionally metadata
      const resp = await axios.post("https://csc309-project-cdda.onrender.com/stripe/create-checkout-session", {
        amount: finalAmountCents,
        currency: "cad", // or "usd" etc - keep consistent with server
        redirect_url: window.location.href,
        // metadata: { purpose: "donation", ... }
      });

      const { sessionId } = resp.data;
      const stripe = await stripePromise;
      window.location.href = resp.data.url;

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="donate-fab"
        onClick={openModal}
        aria-label="Donate"
        title="Donate"
      >
        ❤️ Donate
      </button>

      {open && (
        <div className="donate-modal-overlay" role="dialog" aria-modal="true" aria-label="Donate">
          <div className="donate-modal">
            <header className="donate-modal-header">
              <h2>Support Us</h2>
              <button className="close-btn" onClick={closeModal} aria-label="Close">✕</button>
            </header>

            <div className="donate-body">
              <div className="presets">
                {preset.map(p => (
                  <button
                    key={p}
                    className={`preset-btn ${amount === p && !custom ? 'active' : ''}`}
                    onClick={() => setPreset(p)}
                    type="button"
                  >
                    ${(p/100).toFixed(0)}
                  </button>
                ))}
              </div>

              <div className="custom-amount">
                <label htmlFor="customDonation">Custom amount (CAD)</label>
                <input
                  id="customDonation"
                  type="text"
                  inputMode="decimal"
                  value={custom}
                  onChange={handleCustomChange}
                  placeholder="e.g. 12.50"
                />
              </div>

              <div className="donate-actions">
                <button
                  className="checkout-btn"
                  onClick={createCheckout}
                  disabled={loading}
                >
                  {loading ? "Redirecting…" : `Donate $${(custom ? parseFloat(custom) : amount/100).toFixed(2)}`}
                </button>
              </div>

              <p className="small-note">You will be redirected to Stripe to complete payment.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
