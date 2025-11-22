import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI } from '../api';
import { useAuth } from '../hooks/useAuth';
import './EventDetailPage.css';

const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [isRsvped, setIsRsvped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError('');
        
        const eventResponse = await eventAPI.getEventById(eventId);
        setEvent(eventResponse.data);

        // Try to fetch guests to check if current user is RSVP'd
        try {
          const guestsResponse = await eventAPI.getEventGuests(eventId);
          const guestsList = guestsResponse.data || [];
          setGuests(guestsList);
          
          // Check if current user is in the guests list
          const userIsGuest = guestsList.some(guest => guest.utorid === user?.utorid);

          setIsRsvped(userIsGuest);
        } catch (guestsErr) {
          // User might not have permission to view guests, that's ok
          console.log('Could not fetch guests list');
        }

      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId, user]);

  const handleRSVP = async () => {
  setActionLoading(true);
  setError('');
  setSuccessMessage('');

  try {
    // try RSVP
    await eventAPI.rsvpEvent(eventId);

    // if successful, update state
    setIsRsvped(true);
    setSuccessMessage("Successfully RSVP'd to this event!");

  } catch (err) {
    console.error("Error RSVP'ing to event:", err);

    const rawMsg = err.response?.data?.error;
    const serverMsg = rawMsg?.toLowerCase() || "";

    // fallback: if server says already on guest list, treat as RSVP success
    if (serverMsg.includes("already") && serverMsg.includes("guest")) {
      setIsRsvped(true);
      setSuccessMessage("You have already RSVP'd to this event.");
      setError('');
    } else {
      setError(rawMsg || "Failed to RSVP. Please try again.");
    }

  } finally {
    setActionLoading(false);

    // Regardless of success/failure, try to refresh event details
    try {
      const eventResponse = await eventAPI.getEventById(eventId);
      setEvent(eventResponse.data);
    } catch {
      console.warn("Could not refresh event details");
    }
  }
};


  const handleCancelRSVP = async () => {
    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');
      
      await eventAPI.cancelRsvp(eventId);
      setIsRsvped(false);
      setSuccessMessage('RSVP cancelled successfully.');
      
      // Refresh event details
      const eventResponse = await eventAPI.getEventById(eventId);
      setEvent(eventResponse.data);
      
    } catch (err) {
      console.error('Error cancelling RSVP:', err);
      const errorMsg = err.response?.data?.error || 'Failed to cancel RSVP. Please try again.';
      setError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const getEventStatus = (startTime, endTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) return "upcoming";
    if (now > end) return "past";
    return "ongoing";
};

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page-container">
        <div className="error-banner">
          Event not found.
        </div>
        <button onClick={() => navigate('/events')} className="back-btn">
          ← Back to Events
        </button>
      </div>
    );
  }

  const status = getEventStatus(event.startTime, event.endTime);

  const canRSVP = status === "upcoming" || status === "ongoing";


  return (
    <div className="page-container">
      <button onClick={() => navigate('/events')} className="back-btn">
        ← Back to Events
      </button>

      <div className="event-detail-card">
        <div className="event-detail-header">
          <h1 className="event-detail-title">{event.name}</h1>
          <span className={`event-status-badge ${status}`}>
            {status === "upcoming" && "Upcoming"}
            {status === "ongoing" && "Ongoing"}
            {status === "past" && "Past Event"}
          </span>

        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="success-banner">
            {successMessage}
          </div>
        )}

        <div className="event-detail-content">
          <div className="detail-section">
            <h3>Description</h3>
            <p>{event.description}</p>
          </div>

          <div className="detail-section">
            <h3>Event Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-content">
                  <span className="info-label">Location</span>
                  <span className="info-value">{event.location}</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-content">
                  <span className="info-label">Start Time</span>
                  <span className="info-value">{formatDateTime(event.startTime)}</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-content">
                  <span className="info-label">End Time</span>
                  <span className="info-value">{formatDateTime(event.endTime)}</span>
                </div>
              </div>

              {event.capacity && (
                <div className="info-item">
                  <div className="info-content">
                    <span className="info-label">Capacity</span>
                    <span className="info-value">{event.capacity} people</span>
                  </div>
                </div>
              )}

              {event.pointsRemain !== undefined && event.pointsRemain > 0 && (
                <div className="info-item">
                  <div className="info-content">
                    <span className="info-label">Points Available</span>
                    <span className="info-value points">{event.pointsRemain} points</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RSVP Section */}
          {canRSVP && (
            <div className="rsvp-section">
              {isRsvped ? (
                <div className="rsvp-confirmed">
                  <span className="rsvp-status">You have RSVP'd to this event</span>
                  <button 
                    onClick={handleCancelRSVP} 
                    disabled={actionLoading}
                    className="cancel-rsvp-btn"
                  >
                    {actionLoading ? 'Cancelling...' : 'Cancel RSVP'}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleRSVP} 
                  disabled={actionLoading}
                  className="rsvp-btn"
                >
                  {actionLoading ? 'Processing...' : 'RSVP to this Event'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
