import { useState } from "react";
import "./CashierCreateUserPage.css"; 
import { userAPI } from "../api";


const CashierCreateUserPage = () => {
  const [utorid, setUtorid] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  // popup state
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState("success"); // "success" | "error"
  const [popupMessage, setPopupMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { utorid, name, email };
      const res = await userAPI.createUser(payload); 

      setPopupType("success");
      setPopupMessage(`User successfully created! User ID = ${res.data.id}`);
      setIsPopupOpen(true);

      setUtorid("");
      setName("");
      setEmail("");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create user.";
      setPopupType("error");
      setPopupMessage(msg);
      setIsPopupOpen(true);
    }

    setLoading(false);
  }

  function closePopup() {
    setIsPopupOpen(false);
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Create New User</h1>

      <form className="create-user-form" onSubmit={handleSubmit}>

        <div className="form-group">
        <label>
          UTORid:
          <input
            value={utorid}
            onChange={(e) => setUtorid(e.target.value)}
            required
          />
        </label>
        </div>

        <div className="form-group">
        <label>
          Full Name:
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        </div>

        <div className="form-group">
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Creating..." : "Create User"}
        </button>
      </form>

      {/* Popup */}
      {isPopupOpen && (
        <div className="popup-backdrop" onClick={closePopup}>
          <div
            className={`popup-box ${
              popupType === "success" ? "popup-success" : "popup-error"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{popupType === "success" ? "Success" : "Error"}</h2>
            <p>{popupMessage}</p>
            <button className="popup-close-btn" onClick={closePopup}>
              OK
            </button>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default CashierCreateUserPage;
