// Configuration utilities for OralVis Healthcare

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 30000, // 30 seconds
  UPLOAD_TIMEOUT: 60000, // 60 seconds for file uploads
};

// Application Configuration  
export const APP_CONFIG = {
  NAME: 'OralVis Healthcare',
  VERSION: '1.0.0',
  DESCRIPTION: 'Dental Scan Management System'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'oralvis_token',
  USER: 'oralvis_user',
  PREFERENCES: 'oralvis_preferences'
};

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png']
};

// Validation Rules
export const VALIDATION = {
  PATIENT_ID: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9]+$/
  },
  PATIENT_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z\s\-]+$/
  }
};

// Theme Configuration
export const THEME = {
  PRIMARY_COLOR: '#3b82f6',
  SUCCESS_COLOR: '#10b981',
  ERROR_COLOR: '#ef4444',
  WARNING_COLOR: '#f59e0b',
  INFO_COLOR: '#6366f1'
};

export default {
  API_CONFIG,
  APP_CONFIG,
  STORAGE_KEYS,
  UPLOAD_CONFIG,
  VALIDATION,
  THEME
};