import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from "../context/SocketContext";
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Gets current URL path
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { socket } = useSocket();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handler = (data) => {
      console.log("📩 Notification received:", data);
      setToast({
        message: data.message,
        type: data.type ?? "info",
      });
      setTimeout(() => setToast(null), 4000);
    };

    socket.on("notification", handler);
    return () => socket.off("notification", handler);
  }, [socket]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  if (!user) {
    return null; 
  }

  // --- LOGIC: Determine Active View based on URL ---
  const isManagerView = location.pathname.startsWith('/manager');
  const isCashierView = location.pathname.startsWith('/cashier');
  
  // Helper: Get the current "Active View" name for the dropdown
  const getCurrentViewName = () => {
    if (isManagerView) return 'Manager';
    if (isCashierView) return 'Cashier';
    return 'Regular';
  };

  // Helper: Get available roles for the dropdown based on user permission
  const getAvailableViews = () => {
    const views = ['Regular']; // Everyone can see Regular view
    if (user.role === 'cashier') views.push('Cashier');
    if (user.role === 'manager') views.push('Cashier', 'Manager');
    if (user.role === 'superuser') views.push('Cashier', 'Manager');
    return views.reverse(); // Highest priv first
  };

  // Handler for switching views via dropdown
  const handleViewSwitch = (e) => {
    const selectedView = e.target.value;
    
    if (selectedView === 'Regular') navigate('/dashboard');
    else if (selectedView === 'Cashier') navigate('/cashier');
    else if (selectedView === 'Manager') navigate('/manager');
    
    closeMobileMenu();
  };

  // --- RENDER MENU ITEMS BASED ON CURRENT URL VIEW ---
  const renderMenuItems = () => {
    if (isManagerView && (user.role === 'manager' || user.role === 'superuser')) {
      return (
        <>
          <Link to="/manager" className="nav-link" onClick={closeMobileMenu}>Dashboard</Link>
          <Link to="/manager/users" className="nav-link" onClick={closeMobileMenu}>Users</Link>
          <Link to="/manager/events" className="nav-link" onClick={closeMobileMenu}>Events</Link>
          <Link to="/manager/promotions" className="nav-link" onClick={closeMobileMenu}>Promotions</Link>
          <Link to="/manager/transactions" className="nav-link" onClick={closeMobileMenu}>Transactions</Link>
        </>
      );
    }

    if (isCashierView && (user.role === 'cashier' || user.role === 'manager' || user.role === 'superuser')) {
      return (
        <>
          <Link to="/cashier" className="nav-link" onClick={closeMobileMenu}>Dashboard</Link>
          <Link to="/cashier/create-purchase" className="nav-link" onClick={closeMobileMenu}>Create Purchase</Link>
          <Link to="/cashier/create-user" className="nav-link" onClick={closeMobileMenu}>Create User</Link>
          <Link to="/cashier/process-redemption" className="nav-link" onClick={closeMobileMenu}>Process Redemption</Link>
          {/* <Link to="/cashier/scan" className="nav-link" onClick={closeMobileMenu}>Scan QR</Link>
          <Link to="/cashier/manual-award" className="nav-link" onClick={closeMobileMenu}>Manual Award</Link> */}
          <Link to="/cashier/transactions" className="nav-link" onClick={closeMobileMenu}>Transactions</Link>
        </>
      );
    }

    // Default: Regular User View
    return (
        <>
          <Link to="/dashboard" className="nav-link" onClick={closeMobileMenu}>Dashboard</Link>
          <Link to="/events" className="nav-link" onClick={closeMobileMenu}>Events</Link>
          <Link to="/promotions" className="nav-link" onClick={closeMobileMenu}>Promotions</Link>
          <Link to="/transactions" className="nav-link" onClick={closeMobileMenu}>Transactions</Link>
          <Link to="/redemptions" className="nav-link" onClick={closeMobileMenu}>Redemptions</Link>
          <Link to="/transfer" className="nav-link" onClick={closeMobileMenu}>Transfer</Link>
          <Link to="/my-qr" className="nav-link" onClick={closeMobileMenu}>My QR</Link>
        </>
      );
    }

  const availableViews = getAvailableViews();

  return (
    <>
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            CSSU Loyalty
          </Link>
        </div>

        <button 
          className="mobile-menu-toggle" 
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {renderMenuItems()}
        </div>

        <div className={`navbar-user ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          
          <Link to="/profile" className="profile-link" onClick={closeMobileMenu}>
            {user.name}
          </Link>

          {/* INTERFACE SWITCHER: Replaces (role) text with a dropdown if multiple views available */}
          {availableViews.length > 1 ? (
            <div className="role-selector-wrapper">
              <select 
                value={getCurrentViewName()} 
                onChange={handleViewSwitch}
                className="role-select-minimal"
                title="Switch Interface View"
              >
                {availableViews.map(view => (
                  <option key={view} value={view}>
                    ({view.toLowerCase()})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className="user-role">({user.role})</span>
          )}

          <button 
            className="notification-bell"
            onClick={() => navigate("/notifications")}
            aria-label="Notifications"
          >
            <span className="bell-icon">🔔</span>
          </button>

          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>

      {toast && (
        <div className="notification-toast">
          <strong>{toast.type}</strong>
          <div>{toast.message}</div>
        </div>
      )}
    </>
  );
};

export default Navbar;