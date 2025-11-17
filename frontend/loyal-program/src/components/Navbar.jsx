import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/events" className="nav-link">Events</Link>
          <Link to="/promotions" className="nav-link">Promotions</Link>
          <Link to="/transactions" className="nav-link">Transactions</Link>
          <Link to="/transfer" className="nav-link">Transfer</Link>
          <Link to="/my-qr" className="nav-link">My QR</Link>
        </>
      );
    }

    if (role === 'cashier') {
      return (
        <>
          <Link to="/cashier" className="nav-link">Home</Link>
          <Link to="/cashier/transaction" className="nav-link">Create Transaction</Link>
          <Link to="/cashier/redemption" className="nav-link">Process Redemption</Link>
        </>
      );
    }

    if (role === 'manager' || role === 'superuser') {
      return (
        <>
          <Link to="/manager" className="nav-link">Home</Link>
          <Link to="/manager/users" className="nav-link">Users</Link>
          <Link to="/manager/transactions" className="nav-link">Transactions</Link>
          <Link to="/manager/events" className="nav-link">Events</Link>
          <Link to="/manager/promotions" className="nav-link">Promotions</Link>
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

        <div className="navbar-menu">
          {renderMenuItems()}
        </div>

        <div className="navbar-user">
          <span className="user-info">
            {user.name} ({user.role})
          </span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
