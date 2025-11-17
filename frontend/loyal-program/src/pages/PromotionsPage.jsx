import { useState, useEffect } from 'react';
import { promotionAPI } from '../api';
import './PromotionsPage.css';

const PromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await promotionAPI.getPromotions();
        // Backend returns { count, results }, we need the results array
        const promotionsData = response.data?.results || response.data || [];
        setPromotions(promotionsData);
      } catch (err) {
        console.error('Error fetching promotions:', err);
        setError('Failed to load promotions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isPromotionActive = (startTime, endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    // If startTime is not provided (regular users don't see it), assume it's active if endTime is in future
    if (!startTime) {
      return now <= end;
    }
    const start = new Date(startTime);
    return now >= start && now <= end;
  };

  const getPromotionTypeLabel = (type) => {
    return type === 'automatic' ? 'Automatic' : 'One-Time';
  };

  const getPromotionDetails = (promotion) => {
    const details = [];
    
    if (promotion.minSpending) {
      details.push(`Min Spend: $${promotion.minSpending}`);
    }
    if (promotion.rate) {
      details.push(`Rate: ${(promotion.rate * 100).toFixed(1)}%`);
    }
    if (promotion.points) {
      details.push(`Bonus: ${promotion.points} points`);
    }
    
    return details.join(' • ');
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <p>Loading promotions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Promotions</h1>
      
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {promotions.length === 0 ? (
        <div className="empty-state">
          <p>No promotions available at the moment.</p>
          <p>Check back later for exciting offers!</p>
        </div>
      ) : (
        <div className="promotions-grid">
          {promotions.map((promotion) => {
            const isActive = isPromotionActive(promotion.startTime, promotion.endTime);
            
            return (
              <div 
                key={promotion.id} 
                className={`promotion-card ${isActive ? 'active' : 'inactive'}`}
              >
                <div className="promotion-header">
                  <h3 className="promotion-title">{promotion.name}</h3>
                  <span className={`promotion-status ${isActive ? 'status-active' : 'status-expired'}`}>
                    {isActive ? 'Active' : 'Expired'}
                  </span>
                </div>

                <p className="promotion-description">{promotion.description}</p>

                <div className="promotion-details">
                  <span className="promotion-type">
                    {getPromotionTypeLabel(promotion.type)}
                  </span>
                  {getPromotionDetails(promotion) && (
                    <span className="promotion-info">
                      {getPromotionDetails(promotion)}
                    </span>
                  )}
                </div>

                <div className="promotion-dates">
                  {promotion.startTime && (
                    <div className="date-item">
                      <span className="date-label">Start:</span>
                      <span className="date-value">{formatDate(promotion.startTime)}</span>
                    </div>
                  )}
                  <div className="date-item">
                    <span className="date-label">End:</span>
                    <span className="date-value">{formatDate(promotion.endTime)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PromotionsPage;
