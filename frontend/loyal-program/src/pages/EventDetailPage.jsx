import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI } from '../api';
import { useAuth } from '../hooks/useAuth';
import './EventDetailPage.css';


/**
 * Format a datetime string into a readable label
 * for display on the page.
 */
function formatDateTime(dateString) {
  const date = new Date(dateString);

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',  // e.g., "November"
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTimeLocal(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  const pad = (n) => String(n).padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}


/**
 * Decide whether an event is upcoming, ongoing, or past,
 * based on its start and end times.
 */
function getEventStatus(startTime, endTime) {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) return 'upcoming';
  if (now > end) return 'past';
  return 'ongoing';
}

/**
 * Render the RSVP section with correct buttons and messaging.
 *
 * @param {boolean} canRSVP - Whether the event is upcoming or ongoing.
 * @param {boolean} isRsvped - Whether the current user already RSVP'd.
 * @param {boolean} actionLoading - Whether an action is currently in progress.
 * @param {function} handleRSVP - Callback for RSVP.
 * @param {function} handleCancelRSVP - Callback for cancelling RSVP.
 */
function renderRSVPSection(canRSVP, isRsvped, actionLoading, handleRSVP, handleCancelRSVP) {
  if (!canRSVP) return null;

  return (
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
  );
}

/** Organizer Edit Event Section
 *
 * Renders the edit button and form for organizers to edit event details.
 */
function OrganizerEditEventSection({
  userIsOrganizer,
  showEditForm,
  toggleEditForm,
  editFormData,
  setEditFormData,
  actionLoading,
  handleUpdateEvent,
}) {
  if (!userIsOrganizer) return null;

  return (
    <div className="event-edit-section">
      <button
        className="edit-btn"
        onClick={toggleEditForm}
        disabled={actionLoading}
      >
        {showEditForm ? 'Cancel Edit' : 'Edit Event Details'}
      </button>

      {showEditForm && (
        <div className="edit-form-section">
          <h3>Edit Event Details</h3>

          <form onSubmit={handleUpdateEvent} className="event-form">
            {/* === Name + Location === */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-name">Event Name</label>
                <input
                  id="edit-name"
                  type="text"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-location">Location</label>
                <input
                  id="edit-location"
                  type="text"
                  value={editFormData.location}
                  onChange={(e) =>
                    setEditFormData(prev => ({ ...prev, location: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            {/* === Description === */}
            <div className="form-group">
              <label htmlFor="edit-description">Description</label>
              <textarea
                id="edit-description"
                rows={3}
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData(prev => ({ ...prev, description: e.target.value }))
                }
                required
              />
            </div>

            {/* === Start & End Time === */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-startTime">Start Time</label>
                <input
                  id="edit-startTime"
                  type="datetime-local"
                  value={editFormData.startTime}
                  onChange={(e) =>
                    setEditFormData(prev => ({ ...prev, startTime: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-endTime">End Time</label>
                <input
                  id="edit-endTime"
                  type="datetime-local"
                  value={editFormData.endTime}
                  onChange={(e) =>
                    setEditFormData(prev => ({ ...prev, endTime: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            {/* === Capacity === */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-capacity">Capacity (optional)</label>
                <input
                  id="edit-capacity"
                  type="number"
                  min="1"
                  value={editFormData.capacity}
                  onChange={(e) =>
                    setEditFormData(prev => ({ ...prev, capacity: e.target.value }))
                  }
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}



/** 
 * Event Detail Page
 */
const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  
  
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [userIsOrganizer, setUserIsOrganizer] = useState(false);

  const [isRsvped, setIsRsvped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Organizer edit form state
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    capacity: ''
  });

  const fetchEventDetails = async ({ showPageLoader = true } = {}) => {
  try {
    if (showPageLoader) {
      setLoading(true);
    }
    setError('');

    // Fetch event details
    const eventResponse = await eventAPI.getEventById(eventId);
    const eventData = eventResponse.data;
    console.log('Event data:', eventData);

    setEvent(eventData);

    // ===== Extract organizers from eventData.organizers =====
    const organizersList = eventData.organizers || [];
    setOrganizers(organizersList);

    const isOrganizer = organizersList.some(
      (org) => org.utorid === user?.utorid
    );
    setUserIsOrganizer(isOrganizer);

    
    // ===== Determine RSVP status from eventData.guests =====
    // Problem: if user is not an organizer, eventData does not include guests
    const guestsList = eventData.guests || [];
    setGuests(guestsList);

    const userIsGuest = guestsList.some(
      (guest) => guest.utorid === user?.utorid
    );
    setIsRsvped(userIsGuest);

    // If edit form is open, keep the form in sync with latest event data
    if (showEditForm) {
      setEditFormData({
        name: eventData.name || '',
        description: eventData.description || '',
        location: eventData.location || '',
        startTime: formatDateTimeLocal(eventData.startTime),
        endTime: formatDateTimeLocal(eventData.endTime),
        capacity: eventData.capacity ?? ''
      });
    }

  } catch (err) {
    console.error('Error fetching event details:', err);
    setError('Failed to load event details. Please try again later.');
  } finally {
    if (showPageLoader) {
      setLoading(false);
    }
  }
};


  // Initial fetch when component mounts or when eventId / user changes
  useEffect(() => {
    fetchEventDetails({ showPageLoader: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, user]);

  /**
   * Handle RSVP action for the current user.
   * Shows button-level loading and updates the RSVP state.
   */
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

  /**
   * Handle cancelling RSVP for the current user.
   */
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

   /**
   * Toggle organizer edit form visibility.
   * When opening, prefill form with current event data.
   */
  const handleToggleEditForm = () => {
    if (!event) return;

    const nextShow = !showEditForm;
    setShowEditForm(nextShow);

    if (nextShow) {
      // Prefill form when edit is opened
      setEditFormData({
        name: event.name || '',
        description: event.description || '',
        location: event.location || '',
        startTime: formatDateTimeLocal(event.startTime),
        endTime: formatDateTimeLocal(event.endTime),
        capacity: event.capacity ?? ''
      });
    }
  };


  /**
   * Handle organizer updating event details.
   * This uses PATCH /events/:eventId.
   */
  const handleUpdateEvent = async (e) => {
    e.preventDefault();

    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');

      // Build payload for PATCH /events/:eventId
      const payload = {
        name: editFormData.name,
        description: editFormData.description,
        location: editFormData.location,
        // Convert datetime-local back to ISO string if provided
        startTime: editFormData.startTime
          ? new Date(editFormData.startTime).toISOString()
          : undefined,
        endTime: editFormData.endTime
          ? new Date(editFormData.endTime).toISOString()
          : undefined,
        capacity:
          editFormData.capacity === '' || editFormData.capacity === null
            ? null
            : parseInt(editFormData.capacity, 10)
      };

      // Send update request
      await eventAPI.updateEvent(eventId, payload);

      setSuccessMessage('Event updated successfully.');

      // Refresh event details so the top section updates
      await fetchEventDetails({ showPageLoader: false });

      // Optional: close the edit form after successful update
      setShowEditForm(false);
    } catch (err) {
      console.error('Error updating event:', err);
      const errorMsg =
        err.response?.data?.error || 'Failed to update event. Please try again.';
      setError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };



  // Show full-page loading state
  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  // If we failed to load an event (e.g., 404)
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
  const canRSVP = !userIsOrganizer && (status === 'upcoming' || status === 'ongoing');


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

              <div className="info-item">
                <div className="info-content">
                  <span className="info-label">Guests Registered</span>
                  <span className="info-value">{event.numGuests || 0} people</span>
                </div>
              </div>


              {event.pointsRemain !== undefined && event.pointsRemain >= 0 && (
                <div className="info-item">
                  <div className="info-content">
                    <span className="info-label">Points Available</span>
                    <span className="info-value points">{event.pointsRemain} points</span>
                  </div>
                </div>
              )}

              {event.pointsAwarded !== undefined && event.pointsAwarded >= 0 && (
                <div className="info-item">
                  <div className="info-content">
                    <span className="info-label">Points Awarded</span>
                    <span className="info-value points">{event.pointsAwarded} points</span>
                  </div>
                </div>
              )}


            </div>
          </div>
          
          { userIsOrganizer && (
          <div className="detail-section">
            <h3>Guests Information</h3>
            <div className="guests-list">
              {guests.length === 0 ? (
                <p>No guests have RSVP'd yet.</p>
              ) : (
                guests.map((guest) => (
                  <div key={guest.utorid} className="guest-item">
                    <span className="guest-name">{guest.name} ({guest.utorid})</span>
                  </div>
                ))
              )}
            </div>
          </div>
          )}
            

          {/* RSVP Section */}
          {renderRSVPSection(canRSVP, isRsvped, actionLoading, handleRSVP, handleCancelRSVP)}

          {/* Organizers Edit Event Section */}
          <OrganizerEditEventSection
            userIsOrganizer={userIsOrganizer}
            showEditForm={showEditForm}
            toggleEditForm={handleToggleEditForm}
            editFormData={editFormData}
            setEditFormData={setEditFormData}
            actionLoading={actionLoading}
            handleUpdateEvent={handleUpdateEvent}
          />



        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
