import { useState, useEffect } from 'react';
import { userAPI } from '../api';
import './ManageUsersPage.css';

const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    utorid: '',
    role: '',
    verified: '',
    suspicious: '',
    page: 1,
    limit: 20
  });

  const [totalCount, setTotalCount] = useState(0);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        ...filters,
        offset: (filters.page - 1) * filters.limit
      };
      
      if (!params.utorid) delete params.utorid;
      if (!params.role) delete params.role;
      if (params.verified === '') delete params.verified;
      
      const response = await userAPI.getUsers(params);
      const data = response.data?.results || response.data || [];
      const count = response.data?.count || data.length;
      
      setUsers(data);
      setTotalCount(count);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }));
  };

  const handleEdit = (user) => {
    setEditingUser(user.id);
    setFormData({
      name: user.name,
      points: user.points,
      verified: user.verified,
      role: user.role,
      suspicious: Boolean(user.suspicious),
      email: user.email
    });
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setFormData({});
    setError('');
  };

  const handleSaveEdit = async (userId) => {
    try {
      setError('');
      const allowedFields = ["verified", "suspicious", "role", "email"];
      const payload = {};

      console.log(payload);

      for (const key of allowedFields) {
        if (formData[key] !== undefined) {
          payload[key] = formData[key];
        }
      }

      await userAPI.updateUser(userId, payload);

      setSuccess('User updated successfully');
      setEditingUser(null);
      setFormData({});
      fetchUsers();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const totalPages = Math.ceil(totalCount / filters.limit);

  return (
    <div className="page-container">
      <h1 className="page-title">Manage Users</h1>

      {success && (
        <div className="success-banner">
          {success}
        </div>
      )}

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="utorid-filter">Search UTORid:</label>
          <input
            id="utorid-filter"
            type="text"
            value={filters.name}
            onChange={(e) => handleFilterChange('name', e.target.value)}
            placeholder="Enter UTORid"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="role-filter">Role:</label>
          <select
            id="role-filter"
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="regular">Regular</option>
            <option value="cashier">Cashier</option>
            <option value="manager">Manager</option>
            <option value="superuser">Superuser</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="verified-filter">Verified:</label>
          <select
            id="verified-filter"
            value={filters.verified}
            onChange={(e) => handleFilterChange('verified', e.target.value === '' ? '' : e.target.value === 'true')}
          >
            <option value="">All</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Suspicious:</label>
          <select
            value={filters.suspicious}
            onChange={(e) =>
              handleFilterChange(
                "suspicious",
                e.target.value === "" ? "" : e.target.value === "true"
              )
            }
          >
            <option value="">All</option>
            <option value="true">Suspicious</option>
            <option value="false">Not Suspicious</option>
          </select>
        </div>
      </div>

      

      {loading ? (
        <div className="loading-container">
          <p>Loading users...</p>
        </div>
      ) : (
        <>
          <div className="results-info">
            <p>Showing {users.length} of {totalCount} users</p>
          </div>

          {/* Desktop Table View */}
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>UTORid</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Points</th>
                  <th>Verified</th>
                  <th>Suspicious</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.utorid}</td>
                    <td>
                      <input 
                        type="text"
                        value={user.name}
                        disabled
                        className="edit-input disabled"
                      />
                    </td>
                    <td>
                      {editingUser === user.id ? (
                        <input
                          type="text"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="edit-input"
                        />
                      ) : (
                        user.email
                      )}
                    </td>
                    <td>
                      {editingUser === user.id ? (
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value})}
                          className="edit-select"
                        >
                          <option value="regular">Regular</option>
                          <option value="cashier">Cashier</option>
                          <option value="manager">Manager</option>
                          <option value="superuser">Superuser</option>
                        </select>
                      ) : (
                        <span className={`role-badge ${user.role}`}>{user.role}</span>
                      )}
                    </td>
                    <td>
                      {(
                        user.points
                      )}
                    </td>
                    <td>
                      {editingUser === user.id ? (
                        <input
                          type="checkbox"
                          checked={formData.verified}
                          onChange={(e) => setFormData({...formData, verified: e.target.checked})}
                        />
                      ) : (
                        <span className={user.verified ? 'verified' : 'unverified'}>
                          {user.verified ? 'Yes' : 'No'}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingUser === user.id ? (
                        <input
                          type="checkbox"
                          checked={formData.suspicious}
                          onChange={(e) =>
                            setFormData({ ...formData, suspicious: e.target.checked })
                          }
                        />
                      ) : (
                        <span className={user.suspicious ? 'suspicious' : 'not-suspicious'}>
                          {user.suspicious ? 'Yes' : 'No'}
                        </span>
                      )}
                    </td>
                    <td>
                      {editingUser === user.id ? (
                        <div className="action-buttons">
                          <button
                            onClick={() => handleSaveEdit(user.id)}
                            className="save-btn"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="cancel-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(user)}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="users-cards">
            {users.map((user) => (
              <div key={user.id} className="user-card">
                <div className="user-card-header">
                  <div>
                    <div className="user-card-name">
                      {editingUser === user.id ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="edit-input"
                        />
                      ) : (
                        user.name
                      )}
                    </div>
                    <div style={{fontSize: '0.85rem', color: '#666', marginTop: '0.25rem'}}>
                      {user.utorid}
                    </div>
                  </div>
                  <span className={`role-badge ${user.role}`}>{user.role}</span>
                </div>
                <div className="user-card-body">
                  <div className="user-card-row">
                    <span className="user-card-label">ID:</span>
                    <span className="user-card-value">{user.id}</span>
                  </div>
                  {editingUser === user.id ? (
                    <>
                      <div className="user-card-row">
                        <span className="user-card-label">Role:</span>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value})}
                          className="edit-select"
                        >
                          <option value="regular">Regular</option>
                          <option value="cashier">Cashier</option>
                          <option value="manager">Manager</option>
                          <option value="superuser">Superuser</option>
                        </select>
                      </div>
                      <div className="user-card-row">
                        <span className="user-card-label">Points:</span>
                        <input
                          type="number"
                          value={formData.points}
                          onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                          className="edit-input small"
                        />
                      </div>
                      <div className="user-card-row">
                        <span className="user-card-label">Verified:</span>
                        <input
                          type="checkbox"
                          checked={formData.verified}
                          onChange={(e) => setFormData({...formData, verified: e.target.checked})}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="user-card-row">
                        <span className="user-card-label">Points:</span>
                        <span className="user-card-value">{user.points}</span>
                      </div>
                      <div className="user-card-row">
                        <span className="user-card-label">Verified:</span>
                        <span className={`user-card-value ${user.verified ? 'verified' : 'unverified'}`}>
                          {user.verified ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className="user-card-footer">
                  {editingUser === user.id ? (
                    <div className="action-buttons">
                      <button
                        onClick={() => handleSaveEdit(user.id)}
                        className="save-btn"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(user)}
                      className="edit-btn"
                      style={{width: '100%'}}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handleFilterChange('page', filters.page - 1)}
                disabled={filters.page === 1}
                className="page-btn"
              >
                Previous
              </button>
              
              <span className="page-info">
                Page {filters.page} of {totalPages}
              </span>
              
              <button
                onClick={() => handleFilterChange('page', filters.page + 1)}
                disabled={filters.page >= totalPages}
                className="page-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManageUsersPage;
