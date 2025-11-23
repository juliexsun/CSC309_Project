import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    return null; // Don't show navbar if not logged in
  }

  // Render menu items based on user role
  const renderMenuItems = () => {
    const { role } = user;

    if (role === 'regular') {
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

    if (role === 'cashier') {
      return (
        <>
          <Link to="/cashier" className="nav-link" onClick={closeMobileMenu}>Dashboard</Link>
          <Link to="/cashier/create-purchase" className="nav-link" onClick={closeMobileMenu}>Create Purchase</Link>
          <Link to="/cashier/create-user" className="nav-link" onClick={closeMobileMenu}>Create User</Link>
          <Link to="/cashier/process-redemption" className="nav-link" onClick={closeMobileMenu}>Process Redemption</Link>
          <Link to="/cashier/scan" className="nav-link" onClick={closeMobileMenu}>Scan QR</Link>
          <Link to="/cashier/manual-award" className="nav-link" onClick={closeMobileMenu}>Manual Award</Link>
          <Link to="/cashier/transactions" className="nav-link" onClick={closeMobileMenu}>Transactions</Link>
        </>
      );
    }

    if (role === 'manager' || role === 'superuser') {
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

    return null;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            CSSU Loyalty Program
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
          <span className="user-role">({user.role})</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
