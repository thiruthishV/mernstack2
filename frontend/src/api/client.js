import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('library_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if on login or register
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        localStorage.removeItem('library_token');
        localStorage.removeItem('library_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  sendRegistrationOtp: (data) => api.post('/auth/send-registration-otp', data),
  resendRegistrationOtp: (data) => api.post('/auth/resend-registration-otp', data),
  getMe: () => api.get('/auth/me'),
  getAllUsers: (params) => api.get('/auth/users', { params }),
  getUserById: (id) => api.get(`/auth/users/${id}`),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  toggleUserStatus: (id) => api.patch(`/auth/users/${id}/status`),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  getUserHistory: (id) => api.get(`/auth/users/${id}/history`),
};

export const bookAPI = {
  getBooks: (params) => api.get('/books', { params }),
  getBookById: (id) => api.get(`/books/${id}`),
  getCategories: () => api.get('/books/categories'),
  createBook: (data) => api.post('/books', data),
  updateBook: (id, data) => api.put(`/books/${id}`, data),
  deleteBook: (id) => api.delete(`/books/${id}`),
};

export const borrowAPI = {
  issueBook: (data) => api.post('/borrows/issue', data),
  returnBook: (id) => api.post(`/borrows/return/${id}`),
  getMyBorrows: () => api.get('/borrows/my'),
  getAllBorrows: (status) => api.get('/borrows', { params: { status } }),
  payFine: (id, data) => api.put(`/borrows/${id}/pay-fine`, data),
  getAdminStats: () => api.get('/borrows/stats'),
};

export const reservationAPI = {
  reserveBook: (bookId) => api.post(`/reservations/reserve/${bookId}`),
  getMyReservations: () => api.get('/reservations/my'),
  getAllReservations: (status) => api.get('/reservations', { params: { status } }),
  cancelReservation: (id) => api.delete(`/reservations/${id}`),
};

export const notificationAPI = {
  getMyNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
