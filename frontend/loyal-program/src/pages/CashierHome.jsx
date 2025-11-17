import { useAuth } from '../hooks/useAuth';

const CashierHome = () => {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <h1 className="page-title">Cashier Home</h1>
      
      <div style={{ marginTop: '20px' }}>
        <p>Hello, <strong>{user?.name}</strong> ({user?.utorid})</p>
        <p>Role: <strong>{user?.role}</strong></p>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h3>Cashier Operations</h3>
        <p>This is a placeholder page. Soon you will be able to:</p>
        <ul>
          <li>Create purchase transactions for customers</li>
          <li>Process point redemptions</li>
          <li>Scan customer QR codes</li>
          <li>Apply promotions to transactions</li>
          <li>Register new users</li>
        </ul>
      </div>
    </div>
  );
};

export default CashierHome;
