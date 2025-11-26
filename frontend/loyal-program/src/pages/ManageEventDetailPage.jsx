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


/**
 * Organizer Add Guest Section
 *
 * Renders a small form for organizers to add a guest by utorid.
 */
function OrganizerAddGuestSection({
  canAddGuest,
  addGuestUtorid,
  setAddGuestUtorid,
  actionLoading,
  handleAddGuest,
}) {
  if (!canAddGuest) return null;

  return (
    <div className="event-add-guest-section">
      <h3>Add a Guest</h3>

      <form onSubmit={handleAddGuest} className="event-form add-guest-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="add-guest-utorid">Guest UTORid</label>
            <input
              id="add-guest-utorid"
              type="text"
              value={addGuestUtorid}
              onChange={(e) => setAddGuestUtorid(e.target.value)}
              placeholder="e.g., jdoe123"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={actionLoading}
        >
          {actionLoading ? 'Adding...' : 'Add Guest'}
        </button>
      </form>
    </div>
  );
}



/**
 * Organizer Award Points Section
 *
 * Allows organizers to award points to a single guest (by UTORid)
 * or to all guests who have RSVPed to this event.
 * This corresponds to POST /events/:eventId/transactions with type "event".
 */
function OrganizerAwardPointsSection({
  canAwardPoints,
  awardMode,
  setAwardMode,
  awardUtorid,
  setAwardUtorid,
  awardAmount,
  setAwardAmount,
  pointsRemain,
  actionLoading,
  handleAwardPoints,
}) {
  if (!canAwardPoints) return null;

  const remainingLabel =
    pointsRemain !== undefined && pointsRemain >= 0
      ? `Points remaining for this event: ${pointsRemain}`
      : null;

  return (
    <div className="event-award-points-section">
      <h3>Award Points to Guests</h3>

      {remainingLabel && (
        <p className="helper-text">
          {remainingLabel}
        </p>
      )}

      <form onSubmit={handleAwardPoints} className="event-form award-points-form">
        {/* Choose award mode: single guest vs all guests */}
        <div className="form-row">
          <div className="form-group">
            <label>Award Mode</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="award-mode"
                  value="single"
                  checked={awardMode === 'single'}
                  onChange={() => setAwardMode('single')}
                />
                Single guest (by UTORid)
              </label>
              <label>
                <input
                  type="radio"
                  name="award-mode"
                  value="all"
                  checked={awardMode === 'all'}
                  onChange={() => setAwardMode('all')}
                />
                All guests who have RSVP&apos;d
              </label>
            </div>
          </div>
        </div>

        {/* Only show UTORid input when awarding to a single guest */}
        {awardMode === 'single' && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="award-guest-utorid">Guest UTORid</label>
              <input
                id="award-guest-utorid"
                type="text"
                value={awardUtorid}
                onChange={(e) => setAwardUtorid(e.target.value)}
                placeholder="e.g., jdoe123"
                required
              />
            </div>
          </div>
        )}

        {/* Amount is always required */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="award-amount">Points to Award</label>
            <input
              id="award-amount"
              type="number"
              min="1"
              value={awardAmount}
              onChange={(e) => setAwardAmount(e.target.value)}
              placeholder="Positive integer, e.g., 50"
              required
            />
            <p className="helper-text">
              For &quot;All guests&quot;, this amount is per guest.
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={actionLoading}
        >
          {actionLoading ? 'Awarding...' : 'Award Points'}
        </button>
      </form>
    </div>
  );
}



/** Organizer Edit Event Section
 *
 * Renders the edit button and form for organizers to edit event details.
 */
function OrganizerEditEventSection({
  canEditEvent,
  showEditForm,
  toggleEditForm,
  editFormData,
  setEditFormData,
  actionLoading,
  handleUpdateEvent,
}) {
  if (!canEditEvent) return null;

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
const ManageEventDetailPage = () => {
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

  // Add Guest state
  const [addGuestUtorid, setAddGuestUtorid] = useState('');


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

   // Award Points state
  const [awardMode, setAwardMode] = useState('single'); // 'single' | 'all'
  const [awardUtorid, setAwardUtorid] = useState('');
  const [awardAmount, setAwardAmount] = useState('');

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
   * Handle organizer adding a guest by utorid.
   * Uses POST /events/:eventId/guests.
   */
  const handleAddGuest = async (e) => {
    e.preventDefault();

    const trimmed = addGuestUtorid.trim();
    if (!trimmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');

      await eventAPI.addEventGuest(eventId, trimmed);

      setSuccessMessage('Guest added successfully.');
      setAddGuestUtorid('');

      // Refresh event details so guests list & counts update
      await fetchEventDetails({ showPageLoader: false });
    } catch (err) {
      console.error('Error adding guest:', err);
      const errorMsg =
        err.response?.data?.error || 'Failed to add guest. Please try again.';
      setError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };


    /**
   * Handle organizer awarding points to guests.
   * Uses POST /events/:eventId/transactions with type "event".
   * If awardMode === 'single', we send utorid to award points to one guest.
   * If awardMode === 'all', we omit utorid to award the same amount to all guests.
   */
  const handleAwardPoints = async (e) => {
    e.preventDefault();

    const trimmedUtorid = awardUtorid.trim();
    const amountNum = parseInt(awardAmount, 10);

    if (!amountNum || amountNum <= 0) {
      setError('Please enter a positive points amount.');
      return;
    }

    if (awardMode === 'single' && !trimmedUtorid) {
      setError('Please enter a guest UTORid.');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setSuccessMessage('');

      const payload = {
        type: 'event',
        amount: amountNum,
      };

      if (awardMode === 'single') {
        payload.utorid = trimmedUtorid;
      }
      
      await eventAPI.awardEventPoints(eventId, payload);

      setSuccessMessage(
        awardMode === 'single'
          ? 'Points awarded to the guest successfully.'
          : 'Points awarded to all guests successfully.'
      );

      // Reset the form
      setAwardUtorid('');
      setAwardAmount('');

      // Refresh event details so that pointsRemain/pointsAwarded update
      await fetchEventDetails({ showPageLoader: false });
    } catch (err) {
      console.error('Error awarding points:', err);
      const errorMsg =
        err.response?.data?.error ||
        'Failed to award points. Please try again.';
      setError(errorMsg);
    } finally {
      setActionLoading(false);
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
        <button onClick={() => navigate('/manager/events')} className="back-btn">
          ← Back to Events
        </button>
      </div>
    );
  }


  const status = getEventStatus(event.startTime, event.endTime);
  const canRSVP = !userIsOrganizer && (status === 'upcoming' || status === 'ongoing');
  const canAddGuest = userIsOrganizer && (status === 'upcoming' || status === 'ongoing');
  const canEditEvent = userIsOrganizer && (status === 'upcoming' || status === 'ongoing');
  const canAwardPoints = userIsOrganizer && event.pointsRemain !== undefined;



  return (
    <div className="page-container">
      <button onClick={() => navigate('/manager/events')} className="back-btn">
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
            

          {/* User RSVP Section */}
          {renderRSVPSection(canRSVP, isRsvped, actionLoading, handleRSVP, handleCancelRSVP)}


          {/* Organizer Add Guest Section */}
          <OrganizerAddGuestSection
            canAddGuest={canAddGuest}
            addGuestUtorid={addGuestUtorid}
            setAddGuestUtorid={setAddGuestUtorid}
            actionLoading={actionLoading}
            handleAddGuest={handleAddGuest}
          />

          {/* Organizer Award Points Section */}
          <OrganizerAwardPointsSection
            canAwardPoints={canAwardPoints}
            awardMode={awardMode}
            setAwardMode={setAwardMode}
            awardUtorid={awardUtorid}
            setAwardUtorid={setAwardUtorid}
            awardAmount={awardAmount}
            setAwardAmount={setAwardAmount}
            pointsRemain={event.pointsRemain}
            actionLoading={actionLoading}
            handleAwardPoints={handleAwardPoints}
          />



          {/* Organizers Edit Event Section */}
          <OrganizerEditEventSection
            canEditEvent={canEditEvent}
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

export default ManageEventDetailPage;
