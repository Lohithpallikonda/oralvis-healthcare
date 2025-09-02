const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const scanRoutes = require('./routes/scans');

// Initialize Express app
const app = express();

// Configuration
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

console.log('🚀 Starting OralVis Healthcare Backend Server...');

// CORS configuration
const corsOptions = {
  origin: [
    CORS_ORIGIN,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-requested-with',
    'Accept',
    'Origin',
    'X-Requested-With'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  
  if (req.headers.authorization) {
    console.log(`  └─ Auth: Bearer token present`);
  }
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'OralVis Healthcare API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
console.log('📡 Setting up API routes...');
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/scans', scanRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to OralVis Healthcare API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      authentication: '/api/auth',
      upload: '/api/upload',
      scans: '/api/scans'
    },
    status: 'operational'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'OralVis Healthcare API v1.0.0',
    endpoints: {
      authentication: {
        login: 'POST /api/auth/login',
        verifyToken: 'POST /api/auth/verify-token',
        testUsers: 'GET /api/auth/test-users'
      },
      upload: {
        uploadScan: 'POST /api/upload/ (Technician only)',
        uploadHistory: 'GET /api/upload/history (Technician only)'
      },
      scans: {
        getAllScans: 'GET /api/scans/ (Dentist only)',
        getScanById: 'GET /api/scans/:id (Dentist only)',
        getPatientScans: 'GET /api/scans/patient/:patientId (Dentist only)',
        getStats: 'GET /api/scans/stats (Dentist only)',
        searchScans: 'GET /api/scans/search (Dentist only)'
      }
    },
    authentication: 'Bearer token required for protected routes',
    roles: ['Technician', 'Dentist']
  });
});

// Handle 404 - Route not found (catch-all after other routes)
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.method} ${req.originalUrl} does not exist`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /api',
      'POST /api/auth/login',
      'POST /api/upload/',
      'GET /api/scans/'
    ]
  });
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Global error handler:', error);

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload too large',
      message: 'Request size exceeds the maximum allowed limit'
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: error.message
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    requestId: Date.now().toString()
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('❌ Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};

// Start server
const server = app.listen(PORT, () => {
  console.log('✅ Server configuration completed');
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`📱 CORS enabled for: ${corsOptions.origin.join(', ')}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api`);
  console.log('\n🎯 Available Test Credentials:');
  console.log('   Technician: technician@oralvis.com / technician123');
  console.log('   Dentist: dentist@oralvis.com / dentist123');
  console.log('\n🔒 Protected Endpoints:');
  console.log('   Upload: POST /api/upload/ (Technician only)');
  console.log('   Scans: GET /api/scans/ (Dentist only)');
  console.log('\n⚡ Server ready for requests!');
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

module.exports = app;
