const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const authenticateToken = require('../middleware/auth');
const { requireDentist } = require('../middleware/roleAuth');

const router = express.Router();

// Initialize database connection
const dbPath = path.join(__dirname, '../database/database.db');
const db = new Database(dbPath);

// GET / - Retrieve all scan records (Dentist only)
router.get('/', authenticateToken, requireDentist, (req, res) => {
  try {
    // Query to get all scans with uploader information
    const getAllScansQuery = db.prepare(`
      SELECT 
        s.id,
        s.patientName,
        s.patientId,
        s.scanType,
        s.region,
        s.imageUrl,
        s.uploadDate,
        u.email as uploadedByEmail,
        u.role as uploaderRole
      FROM scans s
      LEFT JOIN users u ON s.uploadedBy = u.id
      ORDER BY s.uploadDate DESC
    `);

    const scans = getAllScansQuery.all();

    // Format the response data
    const formattedScans = scans.map(scan => ({
      id: scan.id,
      patientName: scan.patientName,
      patientId: scan.patientId,
      scanType: scan.scanType,
      region: scan.region,
      imageUrl: scan.imageUrl,
      uploadDate: scan.uploadDate,
      uploader: {
        email: scan.uploadedByEmail,
        role: scan.uploaderRole
      }
    }));

    console.log(`📊 Dentist ${req.user.email} retrieved ${scans.length} scans`);

    res.status(200).json({
      message: 'Scans retrieved successfully',
      count: scans.length,
      scans: formattedScans
    });

  } catch (error) {
    console.error('❌ Scans retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve scans',
      message: 'An error occurred while fetching scan records'
    });
  }
});

// GET /stats - Get scan statistics (Dentist only)
router.get('/stats', authenticateToken, requireDentist, (req, res) => {
  try {
    // Total scans count
    const totalScansQuery = db.prepare('SELECT COUNT(*) as total FROM scans');
    const totalScans = totalScansQuery.get().total;

    // Scans by region
    const scansByRegionQuery = db.prepare(`
      SELECT region, COUNT(*) as count 
      FROM scans 
      GROUP BY region 
      ORDER BY count DESC
    `);
    const scansByRegion = scansByRegionQuery.all();

    // Scans by scan type
    const scansByScanTypeQuery = db.prepare(`
      SELECT scanType, COUNT(*) as count 
      FROM scans 
      GROUP BY scanType 
      ORDER BY count DESC
    `);
    const scansByScanType = scansByScanTypeQuery.all();

    // Recent uploads (last 7 days)
    const recentUploadsQuery = db.prepare(`
      SELECT COUNT(*) as count 
      FROM scans 
      WHERE uploadDate >= datetime('now', '-7 days')
    `);
    const recentUploads = recentUploadsQuery.get().count;

    // Unique patients
    const uniquePatientsQuery = db.prepare('SELECT COUNT(DISTINCT patientId) as count FROM scans');
    const uniquePatients = uniquePatientsQuery.get().count;

    // Top uploaders
    const topUploadersQuery = db.prepare(`
      SELECT u.email, COUNT(s.id) as uploadCount
      FROM scans s
      JOIN users u ON s.uploadedBy = u.id
      GROUP BY u.id, u.email
      ORDER BY uploadCount DESC
      LIMIT 5
    `);
    const topUploaders = topUploadersQuery.all();

    console.log(`📈 Dentist ${req.user.email} accessed scan statistics`);

    res.status(200).json({
      message: 'Scan statistics retrieved successfully',
      statistics: {
        totalScans: totalScans,
        uniquePatients: uniquePatients,
        recentUploads: recentUploads,
        scansByRegion: scansByRegion,
        scansByScanType: scansByScanType,
        topUploaders: topUploaders
      }
    });

  } catch (error) {
    console.error('❌ Statistics retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: 'An error occurred while fetching scan statistics'
    });
  }
});

// GET /search - Search scans by patient name or ID (Dentist only)
router.get('/search', authenticateToken, requireDentist, (req, res) => {
  try {
    const { query, region, scanType, limit = 50 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Invalid search query',
        message: 'Search query must be at least 2 characters long'
      });
    }

    let sqlQuery = `
      SELECT 
        s.id,
        s.patientName,
        s.patientId,
        s.scanType,
        s.region,
        s.imageUrl,
        s.uploadDate,
        u.email as uploadedByEmail,
        u.role as uploaderRole
      FROM scans s
      LEFT JOIN users u ON s.uploadedBy = u.id
      WHERE (s.patientName LIKE ? OR s.patientId LIKE ?)
    `;

    const params = [`%${query.trim()}%`, `%${query.trim().toUpperCase()}%`];

    // Add additional filters if provided
    if (region) {
      sqlQuery += ' AND s.region = ?';
      params.push(region);
    }

    if (scanType) {
      sqlQuery += ' AND s.scanType = ?';
      params.push(scanType);
    }

    sqlQuery += ' ORDER BY s.uploadDate DESC LIMIT ?';
    params.push(parseInt(limit));

    const searchQuery = db.prepare(sqlQuery);
    const results = searchQuery.all(...params);

    const formattedResults = results.map(scan => ({
      id: scan.id,
      patientName: scan.patientName,
      patientId: scan.patientId,
      scanType: scan.scanType,
      region: scan.region,
      imageUrl: scan.imageUrl,
      uploadDate: scan.uploadDate,
      uploader: {
        email: scan.uploadedByEmail,
        role: scan.uploaderRole
      }
    }));

    console.log(`🔍 Dentist ${req.user.email} searched for "${query}" - ${results.length} results`);

    res.status(200).json({
      message: 'Search completed successfully',
      query: query.trim(),
      filters: { region: region || null, scanType: scanType || null },
      count: results.length,
      scans: formattedResults
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'An error occurred while searching scans'
    });
  }
});

// GET /patient/:patientId - Get all scans for a specific patient (Dentist only)
router.get('/patient/:patientId', authenticateToken, requireDentist, (req, res) => {
  try {
    const patientId = req.params.patientId.toUpperCase();

    if (!patientId || patientId.length < 3) {
      return res.status(400).json({
        error: 'Invalid patient ID',
        message: 'Patient ID must be at least 3 characters long'
      });
    }

    const getPatientScansQuery = db.prepare(`
      SELECT 
        s.id,
        s.patientName,
        s.patientId,
        s.scanType,
        s.region,
        s.imageUrl,
        s.uploadDate,
        u.email as uploadedByEmail,
        u.role as uploaderRole
      FROM scans s
      LEFT JOIN users u ON s.uploadedBy = u.id
      WHERE s.patientId = ?
      ORDER BY s.uploadDate DESC
    `);

    const scans = getPatientScansQuery.all(patientId);

    const formattedScans = scans.map(scan => ({
      id: scan.id,
      patientName: scan.patientName,
      patientId: scan.patientId,
      scanType: scan.scanType,
      region: scan.region,
      imageUrl: scan.imageUrl,
      uploadDate: scan.uploadDate,
      uploader: {
        email: scan.uploadedByEmail,
        role: scan.uploaderRole
      }
    }));

    console.log(`👤 Dentist ${req.user.email} retrieved ${scans.length} scans for patient ${patientId}`);

    res.status(200).json({
      message: `Scans retrieved successfully for patient ${patientId}`,
      patientId: patientId,
      count: scans.length,
      scans: formattedScans
    });

  } catch (error) {
    console.error('❌ Patient scans retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve patient scans',
      message: 'An error occurred while fetching scans for the specified patient'
    });
  }
});

// GET /:id - Get a specific scan by ID (Dentist only)
router.get('/:id', authenticateToken, requireDentist, (req, res) => {
  try {
    const scanId = parseInt(req.params.id);

    if (isNaN(scanId)) {
      return res.status(400).json({
        error: 'Invalid scan ID',
        message: 'Scan ID must be a valid number'
      });
    }

    const getScanQuery = db.prepare(`
      SELECT 
        s.id,
        s.patientName,
        s.patientId,
        s.scanType,
        s.region,
        s.imageUrl,
        s.uploadDate,
        u.email as uploadedByEmail,
        u.role as uploaderRole
      FROM scans s
      LEFT JOIN users u ON s.uploadedBy = u.id
      WHERE s.id = ?
    `);

    const scan = getScanQuery.get(scanId);

    if (!scan) {
      return res.status(404).json({
        error: 'Scan not found',
        message: `No scan found with ID ${scanId}`
      });
    }

    const formattedScan = {
      id: scan.id,
      patientName: scan.patientName,
      patientId: scan.patientId,
      scanType: scan.scanType,
      region: scan.region,
      imageUrl: scan.imageUrl,
      uploadDate: scan.uploadDate,
      uploader: {
        email: scan.uploadedByEmail,
        role: scan.uploaderRole
      }
    };

    console.log(`🔍 Dentist ${req.user.email} viewed scan ID ${scanId}`);

    res.status(200).json({
      message: 'Scan retrieved successfully',
      scan: formattedScan
    });

  } catch (error) {
    console.error('❌ Single scan retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve scan',
      message: 'An error occurred while fetching the scan record'
    });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

module.exports = router;