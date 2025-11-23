import apiClient from './apiClient';

// ===== Auth APIs =====
export const authAPI = {
  login: (utorid, password) => 
    apiClient.post('/auth/tokens', { utorid, password }),
  
  requestReset: (utorid) => 
    apiClient.post('/auth/resets', { utorid }),
  
  performReset: (resetToken, utorid, password) => 
    apiClient.post(`/auth/resets/${resetToken}`, { utorid, password }),
};

// ===== User APIs =====
export const userAPI = {
  // Get current user info
  getMe: () => 
    apiClient.get('/users/me'),
  
  // Update current user
  updateMe: (data) => 
    apiClient.patch('/users/me', data),
  
  // Update password
  updatePassword: (oldPassword, newPassword) => 
    apiClient.patch('/users/me/password', { oldPassword, newPassword }),
  
  // Get all users (manager/superuser only)
  getUsers: (params) => 
    apiClient.get('/users', { params }),
  
  // Get specific user by ID
  getUserById: (userId) => 
    apiClient.get(`/users/${userId}`),
  
  // Get user by UTORid (for cashier lookup)
  getUserByUtorid: (utorid) => 
    apiClient.get(`/users`, { params: { utorid, limit: 1 } })
      .then(res => {
        const users = res.data?.results || res.data || [];
        if (users.length === 0) {
          throw new Error('User not found');
        }
        return { data: users[0] };
      }),
  
  // Create new user (cashier/manager/superuser only)
  createUser: (userData) => 
    apiClient.post('/users', userData),
  
  // Update user by ID (manager/superuser only)
  updateUser: (userId, userData) => 
    apiClient.patch(`/users/${userId}`, userData),
};

// ===== Transaction APIs =====
export const transactionAPI = {
  // Get my transactions
  getMyTransactions: (params) => 
    apiClient.get('/users/me/transactions', { params }),
  
  // Get all transactions (manager/superuser only)
  getTransactions: (params) => 
    apiClient.get('/transactions', { params }),
  
  // Create purchase transaction (cashier/manager/superuser)
  createPurchase: (data) => 
    apiClient.post('/transactions', data),
  
  // Create redemption transaction
  createRedemption: (amount, remark) => 
    apiClient.post('/users/me/transactions', { type: "redemption", amount, remark }),
  
  // Process redemption transaction (cashier/manager/superuser)
  processRedemption: (transactionId, payload) => 
    apiClient.patch(`/transactions/${transactionId}/processed`, payload),
  
  // Get redemption by ID
  getRedemptionById: (transactionId) => 
    apiClient.get(`/transactions/${transactionId}`),
  
  // Create transfer transaction
  createTransfer: (toUserId, amount, remark) => 
    apiClient.post(`/users/${toUserId}/transactions`, {
      type: "transfer",
      amount: Number(amount),
      remark: remark
    }),
  
  // Award points (cashier/manager/superuser only)
  awardPoints: (data) => 
    apiClient.post('/transactions', {
      ...data,
      type: 'award'
    }),
  
  // Update transaction (manager/superuser only)
  updateTransaction: (transactionId, data) => 
    apiClient.patch(`/transactions/${transactionId}`, data),
};

// ===== Event APIs =====
export const eventAPI = {
  // Get all events
  getEvents: (params) => 
    apiClient.get('/events', { params }),
  
  // Get events where I am an organizer
  getMyOrganizedEvents: (myId) =>
    apiClient.get('/events')
      .then((res) => {
        // All events
        const events = res.data?.results || res.data || [];

        // Filter events where organizers include the current user
        const myEvents = events.filter(event =>
          event.organizers?.some(org => org.userId === myId)
        );

        // Keep the response structure the same, just replace results with the filtered ones
        return {
          ...res,
          data: {
            ...res.data,
            count: myEvents.length,   // Optional: update count
            results: myEvents,
          },
        };
      }),
  
  // Get event by ID
  getEventById: (eventId) => 
    apiClient.get(`/events/${eventId}`),
  
  // Create event (manager/superuser only)
  createEvent: (eventData) => 
    apiClient.post('/events', eventData),
  
  // Update event (organizer/manager/superuser)
  updateEvent: (eventId, eventData) => 
    apiClient.patch(`/events/${eventId}`, eventData),
  
  // Delete event (organizer/manager/superuser)
  deleteEvent: (eventId) => 
    apiClient.delete(`/events/${eventId}`),
  
  // RSVP to event
  rsvpEvent: (eventId) => 
    apiClient.post(`/events/${eventId}/guests/me`),
  
  // Cancel RSVP
  cancelRsvp: (eventId) => 
    apiClient.delete(`/events/${eventId}/guests/me`),
  
  // Get event guests (organizer/manager/superuser)
  getEventGuests: (eventId, params) => 
    apiClient.get(`/events/${eventId}/guests`, { params }),
  
  // Add guest to event (organizer/manager/superuser)
  addEventGuest: (eventId, userId) => 
    apiClient.post(`/events/${eventId}/guests`, { userId }),
  
  // Remove guest from event (organizer/manager/superuser)
  removeEventGuest: (eventId, userId) => 
    apiClient.delete(`/events/${eventId}/guests/${userId}`),
  
  // Award points to event attendees (organizer/manager/superuser)
  awardEventPoints: (eventId, data) => 
    apiClient.post(`/events/${eventId}/transactions`, data),
};

// ===== Promotion APIs =====
export const promotionAPI = {
  // Get all promotions
  getPromotions: (params) => 
    apiClient.get('/promotions', { params }),
  
  // Get promotion by ID
  getPromotionById: (promotionId) => 
    apiClient.get(`/promotions/${promotionId}`),
  
  // Create promotion (manager/superuser only)
  createPromotion: (promotionData) => 
    apiClient.post('/promotions', promotionData),
  
  // Update promotion (manager/superuser only)
  updatePromotion: (promotionId, promotionData) => 
    apiClient.patch(`/promotions/${promotionId}`, promotionData),
  
  // Delete promotion (manager/superuser only)
  deletePromotion: (promotionId) => 
    apiClient.delete(`/promotions/${promotionId}`),
};

export default {
  auth: authAPI,
  user: userAPI,
  transaction: transactionAPI,
  event: eventAPI,
  promotion: promotionAPI,
};
