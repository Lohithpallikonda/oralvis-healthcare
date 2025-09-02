import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getCurrentUser, hasRole } from '../utils/auth';
import LoadingSpinner from './LoadingSpinner';
import { useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true,
  fallbackPath = '/',
  showUnauthorizedMessage = true 
}) => {
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const location = useLocation();

  useEffect(() => {
    validateAuthentication();
  }, [location.pathname]);

  const validateAuthentication = async () => {
    if (!requireAuth) {
      setIsValidating(false);
      setTokenValid(true);
      return;
    }

    try {
      // First check local authentication
      const localAuth = isAuthenticated();
      
      if (!localAuth) {
        setTokenValid(false);
        setIsValidating(false);
        return;
      }

      // Verify token with backend for extra security
      try {
        await authAPI.verifyToken();
        setTokenValid(true);
        console.log('✅ Token verification successful');
      } catch (error) {
        console.log('❌ Token verification failed, logging out');
        // Token is invalid, clear auth data
        const { logout } = await import('../utils/auth');
        logout();
        setTokenValid(false);
      }

    } catch (error) {
      console.error('❌ Authentication validation error:', error);
      setTokenValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  // Show loading spinner during validation
  if (isValidating) {
    return (
      <LoadingSpinner message="Verifying authentication..." />
    );
  }

  // Check authentication requirement
  if (requireAuth && !tokenValid) {
    console.log('🔒 Authentication required, redirecting to login');
    return <Navigate 
      to={fallbackPath} 
      state={{ from: location.pathname }}
      replace 
    />;
  }

  // Check role authorization
  if (allowedRoles.length > 0 && tokenValid) {
    const user = getCurrentUser();
    const userHasRequiredRole = hasRole(allowedRoles);

    if (!userHasRequiredRole) {
      console.log(`🚫 Access denied. Required: ${allowedRoles.join(', ')}, User: ${user?.role}`);
      
      if (showUnauthorizedMessage) {
        return (
          <div className="container" style={{ marginTop: '80px' }}>
            <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
                <h2 style={{ 
                  color: '#ef4444', 
                  marginBottom: '16px',
                  fontSize: '24px'
                }}>
                  Access Denied
                </h2>
                <p style={{ 
                  color: '#6b7280', 
                  marginBottom: '24px',
                  lineHeight: '1.6'
                }}>
                  You don't have permission to access this page.
                </p>
                
                <div className="alert alert-error" style={{ textAlign: 'left' }}>
                  <strong>Authorization Details:</strong>
                  <div style={{ marginTop: '8px', fontSize: '14px' }}>
                    <div>👤 Your Role: <strong>{user?.role || 'Unknown'}</strong></div>
                    <div>🔑 Required Role(s): <strong>{allowedRoles.join(', ')}</strong></div>
                    <div>📧 Logged in as: <strong>{user?.email || 'Unknown'}</strong></div>
                  </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button 
                    onClick={() => window.history.back()}
                    className="btn btn-secondary"
                  >
                    ← Go Back
                  </button>
                  <button 
                    onClick={() => {
                      const { logout } = require('../utils/auth');
                      logout();
                      window.location.href = '/';
                    }}
                    className="btn btn-primary"
                  >
                    🔄 Switch Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Silent redirect to fallback path
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // All checks passed, render the protected content
  return children;
};

// Higher-order component for role-specific routes
export const withRoleProtection = (allowedRoles) => (Component) => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// Convenience components for specific roles
export const TechnicianRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['Technician']}>
    {children}
  </ProtectedRoute>
);

export const DentistRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['Dentist']}>
    {children}
  </ProtectedRoute>
);

export const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['Admin']}>
    {children}
  </ProtectedRoute>
);

// Multi-role route (user must have ANY of the specified roles)
export const MultiRoleRoute = ({ children, roles = [] }) => (
  <ProtectedRoute allowedRoles={roles}>
    {children}
  </ProtectedRoute>
);

// Public route that redirects authenticated users
export const PublicRoute = ({ children, redirectPath = null }) => {
  const user = getCurrentUser();
  
  if (isAuthenticated() && redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  if (isAuthenticated() && !redirectPath) {
    // Auto-redirect based on role
    if (user?.role === 'Technician') {
      return <Navigate to="/technician" replace />;
    } else if (user?.role === 'Dentist') {
      return <Navigate to="/dentist" replace />;
    }
  }

  return (
    <ProtectedRoute requireAuth={false}>
      {children}
    </ProtectedRoute>
  );
};

export default ProtectedRoute;