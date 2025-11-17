import PropTypes from 'prop-types';
import Navbar from './Navbar';
import { useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();
  
  // Don't show navbar on login page
  const showNavbar = location.pathname !== '/login';

  return (
    <div className="layout">
      {showNavbar && <Navbar />}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired
};

export default Layout;
