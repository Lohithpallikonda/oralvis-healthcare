// API utility functions for OralVis Healthcare
import axios from 'axios';
import { getToken, logout } from './auth';

// Base API URL - will be configured via environment variables
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔗 API Base URL:', BASE_URL);

// Create axios instance with default configuration
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request for debugging (only in development)
    if (import.meta.env.DEV) {
      console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log successful response (only in development)
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`, response.data);
    }
    
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error);

    // Handle different types of errors
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle authentication errors
      if (status === 401) {
        console.log('🔐 Authentication failed, logging out user');
        logout();
        window.location.href = '/';
        return Promise.reject(new Error('Authentication required. Please log in again.'));
      }
      
      // Handle authorization errors
      if (status === 403) {
        return Promise.reject(new Error(data.message || 'Access denied. Insufficient permissions.'));
      }
      
      // Handle validation errors
      if (status === 400) {
        return Promise.reject(new Error(data.message || 'Invalid request data.'));
      }
      
      // Handle not found errors
      if (status === 404) {
        return Promise.reject(new Error(data.message || 'Resource not found.'));
      }
      
      // Handle server errors
      if (status >= 500) {
        return Promise.reject(new Error(data.message || 'Server error. Please try again later.'));
      }
      
      // Generic error message
      return Promise.reject(new Error(data.message || `Request failed with status ${status}`));
    }
    
    // Handle network errors
    if (error.request) {
      return Promise.reject(new Error('Network error. Please check your connection and try again.'));
    }
    
    // Handle other errors
    return Promise.reject(new Error(error.message || 'An unexpected error occurred.'));
  }
);

// Authentication API calls
export const authAPI = {
  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify token
  verifyToken: async () => {
    try {
      const response = await api.post('/auth/verify-token');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get test users (development only)
  getTestUsers: async () => {
    try {
      const response = await api.get('/auth/test-users');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Upload API calls (Technician only)
export const uploadAPI = {
  // Upload scan with form data
  uploadScan: async (formData) => {
    try {
      const response = await api.post('/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // Longer timeout for file uploads
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get upload history
  getHistory: async () => {
    try {
      const response = await api.get('/upload/history');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Scans API calls (Dentist only)
export const scansAPI = {
  // Get all scans
  getAllScans: async () => {
    try {
      const response = await api.get('/scans/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get specific scan by ID
  getScanById: async (scanId) => {
    try {
      const response = await api.get(`/scans/${scanId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get scans for specific patient
  getPatientScans: async (patientId) => {
    try {
      const response = await api.get(`/scans/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get scan statistics
  getStats: async () => {
    try {
      const response = await api.get('/scans/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Search scans
  searchScans: async (query, filters = {}) => {
    try {
      const params = new URLSearchParams({ query, ...filters });
      const response = await api.get(`/scans/search?${params}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Generic API utility functions
export const apiUtils = {
  // Health check
  healthCheck: async () => {
    try {
      const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get API documentation
  getApiDocs: async () => {
    try {
      const response = await api.get('/');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Helper function to handle API errors consistently
export const handleApiError = (error, customMessage = null) => {
  console.error('API Error:', error);
  
  const errorMessage = customMessage || error.message || 'An unexpected error occurred';
  
  // You can enhance this to show toast notifications, etc.
  return {
    success: false,
    message: errorMessage,
    error: error
  };
};

// Helper function to format successful API responses
export const handleApiSuccess = (data, customMessage = null) => {
  const successMessage = customMessage || data.message || 'Operation completed successfully';
  
  return {
    success: true,
    message: successMessage,
    data: data
  };
};

// Export the configured axios instance for custom requests
export default api;