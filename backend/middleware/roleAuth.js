// Middleware to check user roles
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user object exists (should be set by authenticateToken middleware)
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'User not authenticated' 
      });
    }

    // Convert single role to array for consistency
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access forbidden', 
        message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}` 
      });
    }

    next();
  };
};

// Convenience functions for specific roles
const requireTechnician = requireRole('Technician');
const requireDentist = requireRole('Dentist');
const requireAnyRole = requireRole(['Technician', 'Dentist']);

module.exports = {
  requireRole,
  requireTechnician,
  requireDentist,
  requireAnyRole
};