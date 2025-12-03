import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from "../context/SocketContext";
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { socket } = useSocket();
  const [toast, setToast] = useState(null);

  // Initialize based on URL, but persist it even if we go to neutral pages
  const [currentViewMode, setCurrentViewMode] = useState(() => {
    if (location.pathname.startsWith('/manager')) return 'Manager';
    if (location.pathname.startsWith('/cashier')) return 'Cashier';
    return 'Regular';
  });

  // Update view mode only when explicitly navigating to role-specific pages.
  // no update state for neutral pages like /profile or /notifications.
  useEffect(() => {
    if (location.pathname.startsWith('/manager')) {
      setCurrentViewMode('Manager');
    } else if (location.pathname.startsWith('/cashier')) {
      setCurrentViewMode('Cashier');
    } else if (location.pathname.startsWith('/dashboard') || location.pathname === '/') {
      setCurrentViewMode('Regular');
    }
  }, [location.pathname]);

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

  if (!user) return null;

  const getAvailableViews = () => {
    const views = ['Regular']; 
    if (user.role === 'cashier') views.push('Cashier');
    if (user.role === 'manager') views.push('Cashier', 'Manager');
    if (user.role === 'superuser') views.push('Cashier', 'Manager');
    return views.reverse();
  };

  const handleViewSwitch = (e) => {
    const selectedView = e.target.value;
    setCurrentViewMode(selectedView);
    
    if (selectedView === 'Regular') navigate('/dashboard');
    else if (selectedView === 'Cashier') navigate('/cashier');
    else if (selectedView === 'Manager') navigate('/manager');
    
    closeMobileMenu();
  };

  // render menu based on persisted state
  const renderMenuItems = () => {
    if (currentViewMode === 'Manager' && (user.role === 'manager' || user.role === 'superuser')) {
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

    if (currentViewMode === 'Cashier' && (user.role === 'cashier' || user.role === 'manager' || user.role === 'superuser')) {
      return (
        <>
          <Link to="/cashier" className="nav-link" onClick={closeMobileMenu}>Dashboard</Link>
          <Link to="/cashier/create-purchase" className="nav-link" onClick={closeMobileMenu}>Create Purchase</Link>
          <Link to="/cashier/create-user" className="nav-link" onClick={closeMobileMenu}>Create User</Link>
          <Link to="/cashier/process-redemption" className="nav-link" onClick={closeMobileMenu}>Process Redemption</Link>
          {/* <Link to="/cashier/scan" className="nav-link" onClick={closeMobileMenu}>Scan QR</Link>
          <Link to="/cashier/manual-award" className="nav-link" onClick={closeMobileMenu}>Manual Award</Link> */}
          {/* <Link to="/cashier/transactions" className="nav-link" onClick={closeMobileMenu}>Transactions</Link> */}
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
  };

  const availableViews = getAvailableViews();

  return (
    <>
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">CSSU Loyalty</Link>
        </div>

        <button 
          className="mobile-menu-toggle" 
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
            <span></span><span></span><span></span>
          </span>
        </button>

        <div className={`navbar-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {renderMenuItems()}
        </div>

        <div className={`navbar-user ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          
          <Link to="/profile" className="profile-link" onClick={closeMobileMenu}>
            {user.name}
          </Link>

          {/* UI RESTORED: Using original <select> dropdown */}
          {availableViews.length > 1 ? (
            <div className="role-selector-wrapper">
              <select 
                value={currentViewMode} 
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