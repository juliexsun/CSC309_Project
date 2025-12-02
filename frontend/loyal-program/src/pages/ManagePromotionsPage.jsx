import { useState, useEffect } from 'react';
import { promotionAPI } from '../api';
import './ManagePromotionsPage.css';

const ManagePromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'automatic',
    startTime: new Date().toISOString().slice(0,16),
    endTime: '',
    minSpending: 0,
    rate: 0,
    points: 0
  });

  // Filters, sorting, and pagination
  const [filters, setFilters] = useState({ type: '', active: '', name: '' });
  const [sortBy, setSortBy] = useState('endTime'); // default sort
  const [sortOrder, setSortOrder] = useState('asc'); // or 'desc'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [originalPromotion, setOriginalPromotion] = useState(null);


  useEffect(() => {
    // Debounce search slightly
    const timer = setTimeout(() => {
        fetchPromotions();
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, sortBy, sortOrder, page, limit]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        limit,
        page,
        type: filters.type || undefined,
        active: filters.active || undefined,
        name: filters.name || undefined,
        orderBy: sortBy,
        order: sortOrder
      };

      const response = await promotionAPI.getPromotions(params);
      const data = response.data?.results || response.data || [];
      setPromotions(data);
      setTotalCount(response.data?.count || data.length);
    } catch (err) {
      console.error('Error fetching promotions:', err);
      setError('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromotion = async (e) => {
    e.preventDefault();
    try {
      setError('');

      const payload = {
        ...formData,
        minSpending: formData.minSpending || undefined,
        rate: formData.rate || undefined,
        points: formData.points || undefined,
      };
      await promotionAPI.createPromotion(payload);
      
      setSuccess('Promotion created successfully');
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        type: 'automatic',
        startTime: new Date().toISOString().slice(0,16),
        endTime: '',
        minSpending: 0,
        rate: 0,
        points: 0
      });
      fetchPromotions();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error creating promotion:', err);
      setError(err.response?.data?.error || 'Failed to create promotion');
    }
  };

  const handleDeletePromotion = async (promotionId) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) {
      return;
    }
    
    try {
      setError('');
      await promotionAPI.deletePromotion(promotionId);
      setSuccess('Promotion deleted successfully');
      fetchPromotions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting promotion:', err);
      setError(err.response?.data?.error || 'Failed to delete promotion');
    }
  };

  // Open a promotion for editing
  const handleSelectPromotion = (promotion) => {
    const formatted = {
      ...promotion,
      startTime: promotion.startTime?.slice(0, 16),
      endTime: promotion.endTime?.slice(0, 16),
    };
    setSelectedPromotion(formatted);
    setOriginalPromotion(formatted); // save original for comparison
    setShowCreateForm(true);
  };

  // Save changes to promotion
  const handleUpdatePromotion = async (e) => {
    e.preventDefault();
    try {
      setError('');

      if (!selectedPromotion || !originalPromotion) return;

      // Only include fields that changed
      const payload = {};
      Object.keys(selectedPromotion).forEach((key) => {
        if (key !== 'id' && selectedPromotion[key] !== originalPromotion[key]) {
          payload[key] = selectedPromotion[key];
        }
      });

      // Also remove empty or zero fields if needed
      if (payload.minSpending === 0) delete payload.minSpending;
      if (payload.rate === 0) delete payload.rate;
      if (payload.points === 0) delete payload.points;

      if (Object.keys(payload).length === 0) {
        setError('No changes to update.');
        return;
      }

      await promotionAPI.updatePromotion(selectedPromotion.id, payload);

      setSuccess('Promotion updated successfully');
      setShowCreateForm(false);
      setSelectedPromotion(null);
      setOriginalPromotion(null);
      fetchPromotions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating promotion:', err);
      setError(err.response?.data?.error || 'Failed to update promotion');
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1); // reset page
  };

  const handleSortChange = (e) => {
    const [field, order] = e.target.value.split('-');
    setSortBy(field);
    setSortOrder(order);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isActive = (endTime) => new Date(endTime) > new Date();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Manage Promotions</h1>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setSelectedPromotion(null);
          }}
          className="create-btn"
        >
          {showCreateForm ? 'Cancel' : 'Create New Promotion'}
        </button>
      </div>

      {/* Filters & Sorting */}
      <div className="filters-bar">
        <div className="filter-group">
          <label htmlFor="nameFilter">Search:</label>
          <input 
            type="text" 
            name="name" 
            id="nameFilter"
            value={filters.name} 
            onChange={handleFilterChange} 
            placeholder="Search by Name..."
            style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="typeFilter">Type:</label>
          <select name="type" value={filters.type} onChange={handleFilterChange} id="typeFilter">
            <option value="">All</option>
            <option value="automatic">Automatic</option>
            <option value="one-time">One-time</option>
          </select>
        </div>


        <div className="filter-group">
          <label htmlFor="sort">Sort By:</label>
          <select id="sort" value={`${sortBy}-${sortOrder}`} onChange={handleSortChange}>
            <option value="endTime-asc">End Time ↑</option>
            <option value="endTime-desc">End Time ↓</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="limit">Items per page:</label>
          <select id="limit" value={limit} onChange={handleLimitChange}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      {success && <div className="success-banner">{success}</div>}
      {error && <div className="error-banner">{error}</div>}


      {/* Create Form */}
      {showCreateForm && (
        <div className="create-form-section">
          <form 
            onSubmit={selectedPromotion ? handleUpdatePromotion : handleCreatePromotion}
            className="promotion-form">

            <div className="form-group">
              <label htmlFor="name">Promotion Name *</label>
              <input
                id="name"
                type="text"
                value={selectedPromotion?.name || formData.name}
                onChange={(e) =>
                  selectedPromotion
                    ? setSelectedPromotion({ ...selectedPromotion, name: e.target.value })
                    : setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                value={selectedPromotion?.description || formData.description}
                onChange={(e) =>
                  selectedPromotion
                    ? setSelectedPromotion({ ...selectedPromotion, description: e.target.value })
                    : setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Type *</label>
              <select
                id="type"
                value={selectedPromotion?.type || formData.type}
                onChange={(e) =>
                  selectedPromotion
                    ? setSelectedPromotion({ ...selectedPromotion, type: e.target.value })
                    : setFormData({ ...formData, type: e.target.value })
                }
                required
              >
                <option value="automatic">Automatic</option>
                <option value="one-time">One-time</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="startTime">Start Time *</label>
              <input
                id="startTime"
                type="datetime-local"
                value={selectedPromotion?.startTime || formData.startTime}
                onChange={(e) =>
                  selectedPromotion
                    ? setSelectedPromotion({ ...selectedPromotion, startTime: e.target.value })
                    : setFormData({ ...formData, startTime: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End Time *</label>
              <input
                id="endTime"
                type="datetime-local"
                value={selectedPromotion?.endTime || formData.endTime}
                onChange={(e) =>
                  selectedPromotion
                    ? setSelectedPromotion({ ...selectedPromotion, endTime: e.target.value })
                    : setFormData({ ...formData, endTime: e.target.value })
                }
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="minSpending">Min Spending</label>
              <input
                id="minSpending"
                type="number"
                value={selectedPromotion?.minSpending || formData.minSpending}
                onChange={(e) =>
                  selectedPromotion
                    ? setSelectedPromotion({ ...selectedPromotion, minSpending: e.target.value })
                    : setFormData({ ...formData, minSpending: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="rate">Rate</label>
              <input
                id="rate"
                type="number"
                value={selectedPromotion?.rate || formData.rate}
                onChange={(e) =>
                  selectedPromotion
                    ? setSelectedPromotion({ ...selectedPromotion, rate: e.target.value })
                    : setFormData({ ...formData, rate: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="points">Points</label>
              <input
                id="points"
                type="number"
                value={selectedPromotion?.points || formData.points}
                onChange={(e) =>
                  selectedPromotion
                    ? setSelectedPromotion({ ...selectedPromotion, points: e.target.value })
                    : setFormData({ ...formData, points: e.target.value })
                }
              />
            </div>

            <button type="submit" className="submit-btn">
              {selectedPromotion ? 'Update Promotion' : 'Create Promotion'}
            </button>
          </form>
        </div>
      )}

      {/* Promotions List */}
      {loading ? (
        <div className="loading-container">
          <p>Loading promotions...</p>
        </div>
      ) : (
        <>
          <div className="promotions-list">
            {promotions.length === 0 ? (
              <p className="empty-message">No promotions found</p>
            ) : (
              promotions.map((promotion) => (
                <div key={promotion.id} className="promotion-item">
                  <div className="promotion-main">
                    <div className="promotion-header-row">
                      <h3>{promotion.name}</h3>
                      <span className={`status ${isActive(promotion.endTime) ? 'active' : 'expired'}`}>
                        {isActive(promotion.endTime) ? 'Active' : 'Expired'}
                      </span>
                    </div>
                    <p className="promotion-description">{promotion.description}</p>
                    <p className="promotion-time">
                      Type: <strong>{promotion.type}</strong> | Ends: {formatDateTime(promotion.endTime)}
                    </p>
                  </div>
                  <div className="promotion-actions">
                    <button
                      onClick={() => handleSelectPromotion(promotion)}
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePromotion(promotion.id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button
              className="page-btn"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </button>
            <span className="page-info">Page {page} of {Math.ceil(totalCount / limit) || 1}</span>
            <button
              className="page-btn"
              disabled={page >= Math.ceil(totalCount / limit)}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ManagePromotionsPage;