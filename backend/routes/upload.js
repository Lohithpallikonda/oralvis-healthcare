const express = require('express');
const multer = require('multer');
const Database = require('better-sqlite3');
const path = require('path');
const { uploadImage } = require('../config/cloudinary');
const authenticateToken = require('../middleware/auth');
const { requireTechnician } = require('../middleware/roleAuth');

const router = express.Router();

// Initialize database connection
const dbPath = path.join(__dirname, '../database/database.db');
const db = new Database(dbPath);

// Configure multer for memory storage (we'll upload to Cloudinary, not local disk)
const storage = multer.memoryStorage();

// File filter for image uploads
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    // Accept only JPG, JPEG, PNG files
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, and PNG files are allowed'), false);
    }
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  },
  fileFilter: fileFilter
});

// POST / - Upload scan with patient data (Technician only)
router.post('/', authenticateToken, requireTechnician, upload.single('scanImage'), async (req, res) => {
  try {
    const { patientName, patientId, scanType, region } = req.body;
    const scanImage = req.file;

    // Validate required fields
    if (!patientName || !patientId || !scanType || !region || !scanImage) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Patient name, patient ID, scan type, region, and scan image are all required',
        required: ['patientName', 'patientId', 'scanType', 'region', 'scanImage']
      });
    }

    // Validate field values
    const validScanTypes = ['RGB'];
    const validRegions = ['Frontal', 'Upper Arch', 'Lower Arch'];

    if (!validScanTypes.includes(scanType)) {
      return res.status(400).json({
        error: 'Invalid scan type',
        message: `Scan type must be one of: ${validScanTypes.join(', ')}`
      });
    }

    if (!validRegions.includes(region)) {
      return res.status(400).json({
        error: 'Invalid region',
        message: `Region must be one of: ${validRegions.join(', ')}`
      });
    }

    // Validate patient ID format (alphanumeric, 3-20 characters)
    const patientIdRegex = /^[a-zA-Z0-9]{3,20}$/;
    if (!patientIdRegex.test(patientId)) {
      return res.status(400).json({
        error: 'Invalid patient ID format',
        message: 'Patient ID must be 3-20 alphanumeric characters'
      });
    }

    // Validate patient name (letters, spaces, hyphens, 2-50 characters)
    const patientNameRegex = /^[a-zA-Z\s\-]{2,50}$/;
    if (!patientNameRegex.test(patientName.trim())) {
      return res.status(400).json({
        error: 'Invalid patient name format',
        message: 'Patient name must be 2-50 characters (letters, spaces, hyphens only)'
      });
    }

    console.log(`📤 Starting upload process for patient: ${patientName} (ID: ${patientId})`);

    // Upload image to Cloudinary
    const uploadResult = await uploadImage(scanImage.buffer, scanImage.originalname);

    // Insert scan record into database
    const insertScanQuery = db.prepare(`
      INSERT INTO scans (patientName, patientId, scanType, region, imageUrl, uploadedBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const scanRecord = insertScanQuery.run(
      patientName.trim(),
      patientId.toUpperCase(),
      scanType,
      region,
      uploadResult.secure_url,
      req.user.id
    );

    console.log(`✅ Scan uploaded successfully: ID ${scanRecord.lastInsertRowid}`);

    // Return success response
    res.status(201).json({
      message: 'Scan uploaded successfully',
      scan: {
        id: scanRecord.lastInsertRowid,
        patientName: patientName.trim(),
        patientId: patientId.toUpperCase(),
        scanType: scanType,
        region: region,
        imageUrl: uploadResult.secure_url,
        uploadDate: new Date().toISOString(),
        uploadedBy: req.user.email
      },
      cloudinary: {
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);

    // Handle different types of errors
    if (error.message.includes('Cloudinary')) {
      return res.status(500).json({
        error: 'Image upload failed',
        message: 'Failed to upload image to cloud storage'
      });
    } else if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        error: 'Duplicate scan',
        message: 'A scan with this patient ID and details already exists'
      });
    } else {
      return res.status(500).json({
        error: 'Upload failed',
        message: 'An error occurred while processing the upload'
      });
    }
  }
});

// GET /history - Get upload history for current technician
router.get('/history', authenticateToken, requireTechnician, (req, res) => {
  try {
    const historyQuery = db.prepare(`
      SELECT id, patientName, patientId, scanType, region, imageUrl, uploadDate
      FROM scans 
      WHERE uploadedBy = ?
      ORDER BY uploadDate DESC
      LIMIT 50
    `);

    const uploadHistory = historyQuery.all(req.user.id);

    res.status(200).json({
      message: 'Upload history retrieved successfully',
      count: uploadHistory.length,
      uploads: uploadHistory
    });

  } catch (error) {
    console.error('❌ History retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve history',
      message: 'An error occurred while fetching upload history'
    });
  }
});

// Handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'Image file must be smaller than 10MB'
      });
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Only one image file is allowed'
      });
    } else {
      return res.status(400).json({
        error: 'File upload error',
        message: error.message
      });
    }
  } else if (error.message.includes('Only')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: error.message
    });
  }
  next(error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

module.exports = router;