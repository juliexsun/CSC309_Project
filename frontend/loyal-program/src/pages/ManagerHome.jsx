import { useAuth } from '../hooks/useAuth';

const ManagerHome = () => {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <h1 className="page-title">Manager Home</h1>
      
      <div style={{ marginTop: '20px' }}>
        <p>Hello, <strong>{user?.name}</strong> ({user?.utorid})</p>
        <p>Role: <strong>{user?.role}</strong></p>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h3>Manager Operations</h3>
        <p>This is a placeholder page. Soon you will be able to:</p>
        <ul>
          <li>Manage all users in the system</li>
          <li>View and filter all transactions</li>
          <li>Create and manage events</li>
          <li>Create and manage promotions</li>
          <li>Make point adjustments</li>
          <li>Mark suspicious users/transactions</li>
        </ul>
      </div>
    </div>
  );
};

export default ManagerHome;
