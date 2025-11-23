import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventAPI } from '../api';
import './EventsListPage.css';

// ========== Helper functions ==========

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getEventStatus = (startTime, endTime) => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) return 'upcoming';
  if (now > end) return 'past';
  return 'ongoing';
};

const truncateDescription = (text, maxLength = 150) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// ========== Presentational components ==========

const EventCard = ({ event }) => {
  const status = getEventStatus(event.startTime, event.endTime);

  return (
    <Link
      to={`/events/${event.id}`}
      className="event-card-link"
    >
      <div className={`event-card ${status}`}>
        <div className="event-header">
          <h3 className="event-title">{event.name}</h3>
          <span className={`event-status status-${status}`}>
            {status === 'upcoming' && 'Upcoming'}
            {status === 'ongoing' && 'Ongoing'}
            {status === 'past' && 'Past'}
          </span>
        </div>

        <p className="event-description">
          {truncateDescription(event.description)}
        </p>

        <div className="event-details">
          <div className="detail-item">
            <span className="detail-text">{event.location}</span>
          </div>

          <div className="detail-item">
            <span className="detail-text">
              {formatDate(event.startTime)} - {formatDate(event.endTime)}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-text">
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </span>
          </div>

          {event.capacity && (
            <div className="detail-item">
              <span className="detail-text">
                Capacity: {event.capacity}
              </span>
            </div>
          )}

          {event.pointsRemain !== undefined && event.pointsRemain > 0 && (
            <div className="detail-item points-item">
              <span className="detail-text points-text">
                {event.pointsRemain} points available
              </span>
            </div>
          )}
        </div>

        <div className="event-footer">
          <span className="view-details-link">View Details →</span>
        </div>
      </div>
    </Link>
  );
};

// ========== Main page component ==========

const EventsListPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await eventAPI.getEvents({ published: true });
        // Backend returns { count, results }, we need the results array
        const eventsData = response.data?.results || response.data || [];
        setEvents(eventsData);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Events</h1>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <div className="empty-state">
          <p>No events available at the moment.</p>
          <p>Check back soon for exciting events!</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* TODO: hook this up to真正的“我负责的 event 列表” */}
      <h2 className="page-title">My Organized Events</h2>
    </div>
  );
};

export default EventsListPage;
