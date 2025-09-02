const authenticateToken = require('./auth');
const { requireRole, requireTechnician, requireDentist, requireAnyRole } = require('./roleAuth');

// Export all middleware for easy importing
module.exports = {
  authenticateToken,
  requireRole,
  requireTechnician,
  requireDentist,
  requireAnyRole
};