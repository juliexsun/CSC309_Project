import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventAPI } from '../api';
import './ManageEventsPage.css';

const ManageEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    capacity: '',
    points: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await eventAPI.getEvents({ limit: 100 });
      const data = response.data?.results || response.data || [];
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      await eventAPI.createEvent({
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        points: parseInt(formData.points)
      });
      
      setSuccess('Event created successfully');
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        location: '',
        startTime: '',
        endTime: '',
        capacity: '',
        points: ''
      });
      fetchEvents();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err.response?.data?.error || 'Failed to create event');
    }
  };

  const handlePublishEvent = async (eventId) => {
    try {
      setError('');
      await eventAPI.updateEvent(eventId, { published: true });
      setSuccess('Event published successfully');
      fetchEvents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error publishing event:', err);
      setError(err.response?.data?.error || 'Failed to publish event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
    
    try {
      setError('');
      await eventAPI.deleteEvent(eventId);
      setSuccess('Event deleted successfully');
      fetchEvents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err.response?.data?.error || 'Failed to delete event');
    }
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

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Manage Events</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="create-btn"
        >
          {showCreateForm ? 'Cancel' : 'Create New Event'}
        </button>
      </div>

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

      {showCreateForm && (
        <div className="create-form-section">
          <h2>Create New Event</h2>
          <form onSubmit={handleCreateEvent} className="event-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Event Name *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Location *</label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">Start Time *</label>
                <input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endTime">End Time *</label>
                <input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="capacity">Capacity (optional)</label>
                <input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div className="form-group">
                <label htmlFor="points">Points to Allocate *</label>
                <input
                  id="points"
                  type="number"
                  min="0"
                  value={formData.points}
                  onChange={(e) => setFormData({...formData, points: e.target.value})}
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-btn">
              Create Event
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <p>Loading events...</p>
        </div>
      ) : (
        <div className="events-list">
          {events.length === 0 ? (
            <p className="empty-message">No events found</p>
          ) : (
            events.map((event) => (
              <Link to={`/manager/events/${event.id}`} key={event.id} className="event-item-link">
                <div className="event-item">
                <div className="event-main">
                  <h3>{event.name}</h3>
                  <p className="event-location">{event.location}</p>
                  <p className="event-time">
                    {formatDateTime(event.startTime)} - {formatDateTime(event.endTime)}
                  </p>
                  <div className="event-stats">
                    <span>Guests: {event.numGuests}/{event.capacity || 'Unlimited'}</span>
                    <span>Points: {event.pointsRemain || 0} remaining</span>
                    <span className={`status ${event.published ? 'published' : 'draft'}`}>
                      {event.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                <div className="event-actions">
                  {!event.published && (
                    <button
                      onClick={() => handlePublishEvent(event.id)}
                      className="publish-btn"
                    >
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ManageEventsPage;
