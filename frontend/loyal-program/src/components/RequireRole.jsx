import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RequireRole = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    // Redirect to role-appropriate dashboard
    const defaultPages = {
      regular: '/dashboard',
      cashier: '/cashier',
      manager: '/manager',
      superuser: '/manager'
    };
    return <Navigate to={defaultPages[user?.role] || '/login'} replace />;
  }

  return <Outlet />;
};

export default RequireRole;
